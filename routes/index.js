const fs = require("fs");
const path = require("path");

// Logger Module
const logger = require('../log')('Home');

exports.list = function (req, res) {
	
	logger.info(`${req.ip} is requesting the home page.`);

	const JSONPath = path.join(__dirname, '..', 'public', 'json', 'patch.json');
	const JSONData = fs.readFileSync(JSONPath, "utf-8");
	const recentPatch = (JSON.parse(JSONData)).notes[0];

	if (req.session.loggedin) {
		var username = req.session.username;
		var email = req.session.email;
		var verify = req.session.verify;
		if (verify !== 'VERIFIED') {
			return res.render('verify', {
				logged: 1,
				user_name: username,
				e_mail: email
			});
		}
		res.render('index', {
			logged: 1,
			user_name: username,
			e_mail: email,
			patch: recentPatch
		});
	} else {
		res.render('index', {
			logged: 0,
			user_name: null,
			patch: recentPatch
		});
	}
};