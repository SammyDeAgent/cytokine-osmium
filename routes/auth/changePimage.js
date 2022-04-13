const Jimp = require('jimp');
const fs = require("fs");
const path = require("path");

// Logger Module
const logger = require('../../log')('ChangePimage');

exports.auth = async function (req, res) {

	logger.info(`${req.ip} is requesting to change their profile picture.`);

	const destPath = path.join(__dirname, '..', '..', 'public', 'user_pic/');

	if (!req.files) {
		logger.warn(`${req.ip} is trying to change their profile picture without uploading a file.`);
		res.send("File not found.");
		return;
	}

	// Uploading image
	var pFile = req.files.new_Pimage;

	if (pFile.mimetype == 'image/png') {
		var user_pimage_name = req.session.username + '.png';
	} else if (pFile.mimetype == 'image/jpg') {
		var user_pimage_name = req.session.username + '.jpg';
	} else if (pFile.mimetype == 'image/jpeg') {
		var user_pimage_name = req.session.username + '.jpeg';
	} else {
		pFile.mv(destPath + user_pimage_name);
		var tempFile = destPath + user_pimage_name;
		fs.unlinkSync(tempFile);
		return res.sendFile(path.join(__dirname, "../..", 'www/error/415.html'));
	}

	logger.info('Processing Image...');
	await pFile.mv(destPath + user_pimage_name);
	var tempFile = destPath + user_pimage_name;

	// File type consistancy: JPG ONLY
	logger.info('Synchronizing image format...');
	if (pFile.mimetype == 'image/png' || pFile.mimetype == 'image/jpeg') {
		const image = await Jimp.read(destPath + user_pimage_name);
		await image.resize(300, 300); // Change resolution if needed
		user_pimage_name = req.session.username + '.jpg';
		await image.writeAsync(destPath + user_pimage_name);
		fs.unlinkSync(tempFile);
	}

	// SQL update
	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('UPDATE accounts SET pimage = ? WHERE email = ?', [
			user_pimage_name,
			req.session.email
		], function (err, data, fields) {
			if (err) logger.error(new Error(err));
			req.session.pimage = user_pimage_name;
			logger.info(`${req.ip} has changed their profile picture.`);
			res.redirect('/profile');
		});
	});

};

exports.reset = async function (req, res) {

	logger.info(`${req.ip} is requesting to reset their profile picture.`);

	var destPath = path.join(__dirname, '..', '..', 'public', 'user_pic/');

	// Destory stored profile picture
	logger.info('Destroying stored profile picture...');
	fs.unlinkSync(destPath + req.session.username + '.jpg');

	var defaultPic = 'default.png';

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('UPDATE accounts SET pimage = ? WHERE email = ?', [
			defaultPic,
			req.session.email
		], function (err, data, fields) {
			if (err) logger.error(new Error(err));
			req.session.pimage = defaultPic;
			logger.info(`${req.ip} has reset their profile picture.`);
			res.redirect('/profile');
		});
	});
}