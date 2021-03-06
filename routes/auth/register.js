const bcrypt = require('bcrypt');
const saltRounds = 10;
const {
	v4: uuidv4
} = require('uuid');
const nodemailer = require('nodemailer');
const {
	google
} = require("googleapis");
const OAuth2 = google.auth.OAuth2;
require('dotenv').config();

// Logger Module
const logger = require('../../log')('Register');

exports.auth = async function (req, res) {

	logger.info(`${req.ip} is requesting the register page.`);

	// Nodemailer testing
	let testMail = await nodemailer.createTestAccount();

	// SMTP Transport Creating via OAuth2
	const createTransporter = async () => {
		const oauth2Client = new OAuth2(
			process.env.CLIENT_ID,
			process.env.CLIENT_SECRET,
			"https://developers.google.com/oauthplayground"
		);

		oauth2Client.setCredentials({
			refresh_token: process.env.REFRESH_TOKEN
		});

		const accessToken = await new Promise((resolve, reject) => {
			oauth2Client.getAccessToken((err, token) => {
				if (err) {
					reject("Failed to create access token :(");
				}
				resolve(token);
			});
		});

		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			secure: true,
			auth: {
				type: "OAuth2",
				user: process.env.EMAIL_ID,
				accessToken,
				clientId: process.env.CLIENT_ID,
				clientSecret: process.env.CLIENT_SECRET,
				refreshToken: process.env.REFRESH_TOKEN
			},
			tls: {
				rejectUnauthorized: false
			}
		});

		return transporter;
	};

	var accid = uuidv4();
	var username = req.body.r_username;
	var sitename = username;
	var pimage = 'default.png';
	var email = req.body.r_email;
	var password = req.body.r_password;

	var verify_code = codeGen();

	// Insert phase 2 verification here

	var defaultStext = "Hello there Osmium.";
	var defaultSiteP = "USER";

	let ts = Date.now();
	let date_ob = new Date(ts);
	let date = date_ob.getDate();
	let month = date_ob.getMonth() + 1;
	let year = date_ob.getFullYear();
	let stamp = date + "/" + month + "/" + year;

	const encryptedPassword = await bcrypt.hash(password, saltRounds);

	// Setting up mail options parameters
	var mailOptions = {
		from: '"Cytokine Osmium" <cytokine.osmium.mailer@gmail.com>',
		to: email,
		subject: 'Verification Code',
		text: 'Thank you for registrating for Osmium Beta! Your verification code is: ' + verify_code
	};

	const sendEmail = async (params) => {
		let emailTransporter = await createTransporter();
		await emailTransporter.sendMail(params);
	};

	if (username && email && password) {
		req.getConnection(function (err, connection) {
			if (err) logger.error(new Error(err));

			connection.query('SELECT * FROM accounts;', function (err, data, fields) {
				if (err) logger.error(new Error(err));

				// TODO - Check for duplicate username or email

				connection.query("INSERT INTO accounts (id, username, sitename, pimage, email, password, register_stamp) VALUES (?,?,?,?,?,?,(STR_TO_DATE(?, '%d/%m/%Y')));",
					[
						accid,
						username,
						sitename,
						pimage,
						email,
						encryptedPassword,
						stamp
					],
					function (err, data, fields) {
						if (err) logger.error(new Error(err));

						connection.query("INSERT INTO account_status (id, status_text) VALUES (?,?)",
							[
								accid,
								defaultStext
							],
							function (err, data, fields) {
								if (err) logger.error(new Error(err));

								connection.query("INSERT INTO account_special (id, site_privilege) VALUES (?,?)",
									[
										accid,
										defaultSiteP
									],
									function (err, data, fields) {
										if (err) logger.error(new Error(err));

										connection.query("INSERT INTO account_verify (id, verify_status, verify_code) VALUES (?,?,?)",
											[
												accid,
												"PENDING",
												verify_code
											], function (err, data, fields) {
												if (err) logger.error(new Error(err));

												connection.query('INSERT INTO account_compliments (id, compliment, disapprove, lobby_complete, tourn_complete, tourn_finalist, special_rating) VALUES (?,?,?,?,?,?,?);',
												[accid, 0, 0, 0, 0, 0, 0], async function(err, data, fields) {
													if(err) logger.error(new Error(err));

													// Email verifier sender
													logger.info('Sending verification email to ' + email);
													try{
														await sendEmail(mailOptions);
														logger.info('Verification email sent to ' + email);
														// Redirection to login menu or auto-login
														logger.info(`${req.ip} has successfully registered.`);
														return res.redirect("/login");
													}catch(err){
														logger.error(new Error(err));
														// Delete registered info
														connection.query('DELETE FROM accounts WHERE id = ?;', [accid], function(err, data, fields) {
															if(err) logger.error(new Error(err));
															logger.warn(`${req.ip} Registration failed - falling back.`);
															return res.send('Registration failed, please try again later.');
														});
													}
													// await transporter.sendMail(mailOptions, function(err, info) {
													// 	if (err) {
													// 		logger.error(new Error(err));
													// 		// Delete registered info
													// 		connection.query('DELETE FROM accounts WHERE id = ?;', [accid], function(err, data, fields) {
													// 			if(err) logger.error(new Error(err));
													// 			logger.warn(`${req.ip} Registration failed - falling back.`);
													// 			return res.send('Registration failed, please try again later.');
													// 		});
													// 	}	else {
													// 		logger.info('Verification email sent to ' + email);
													// 		// Redirection to login menu or auto-login
													// 		logger.info(`${req.ip} has successfully registered.`);
													// 		return res.redirect("/login");
													// 	}
													// });											
												})
											})
									})
							})
					});
			});
		});
	} else {
		logger.warn(`${req.ip} is trying to register with incomplete information.`);
		res.send('Please enter the correct credentials!');
		res.end();
	}
};

const codeGen = (length = 8) => {
	// Declare all characters
	let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	// Pick characers randomly
	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return str;
};