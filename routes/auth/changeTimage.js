const Jimp = require('jimp');
const fs = require("fs");
const path = require("path");

// Logger Module
const logger = require('../../log')('ChangeTimage');

exports.auth = async function (req, res) {

	logger.info(`${req.ip} is requesting the change team profile image.`);

	const destPath = path.join(__dirname, '..', '..', 'public', 'team_pic/');

	var team_code = req.body.team_code;

	if (!req.files) {
		logger.warn(`${req.ip} is trying to change their profile picture without uploading a file.`);
		res.send("File not found.");
		return;
	}

	// Uploading image
	var pFile = req.files.new_Pimage;

	if (pFile.mimetype == 'image/png') {
		var team_pimage_name = team_code + '.png';
	} else if (pFile.mimetype == 'image/jpg') {
		var team_pimage_name = team_code + '.jpg';
	} else if (pFile.mimetype == 'image/jpeg') {
		var team_pimage_name = team_code + '.jpeg';
	} else {
		pFile.mv(destPath + team_pimage_name);
		var tempFile = destPath + team_pimage_name;
		fs.unlinkSync(tempFile);
		return res.sendFile(path.join(__dirname, "../..", 'www/error/415.html'));
	}

	logger.info('Processing image...');
	await pFile.mv(destPath + team_pimage_name);
	var tempFile = destPath + team_pimage_name;

	// File type consistancy: JPG ONLY
	logger.info('Synchronizing image format...');
	if (pFile.mimetype == 'image/png' || pFile.mimetype == 'image/jpeg') {
		const image = await Jimp.read(destPath + team_pimage_name);
		await image.resize(300, 300); // Change resolution if needed
		team_pimage_name = team_code + '.jpg';
		await image.writeAsync(destPath + team_pimage_name);
		fs.unlinkSync(tempFile);
	}

	// SQL update
	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('UPDATE teams SET team_pimage = ? WHERE team_code = ?', [
			team_pimage_name,
			team_code
		], function (err, data, fields) {
			if (err) logger.error(new Error(err));
			logger.info(`${req.ip} is successfully changed their profile picture.`);
			res.redirect(`/team?code=${team_code}`);
		});
	});

};

exports.reset = async function (req, res) {

	logger.info(`${req.ip} is requesting the reset team profile image.`);

	var destPath = path.join(__dirname, '..', '..', 'public', 'team_pic/');

	var team_code = req.body.team_code;

	// Destory stored profile picture
	logger.info('Destroying stored profile picture...');
	fs.unlinkSync(destPath + team_code + '.jpg');

	var defaultPic = 'default.png';

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('UPDATE teams SET team_pimage = ? WHERE team_code = ?', [
			defaultPic,
			team_code
		], function (err, data, fields) {
			if (err) logger.error(new Error(err));
			logger.info(`${req.ip} is successfully reset the team profile picture.`);
			res.redirect(`/team?code=${team_code}`);
		});
	});
}