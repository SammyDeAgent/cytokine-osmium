const path = require("path");

// Logger Module
const logger = require('../../log')('ChangeSitename');

exports.auth = function (req, res) {

	logger.info(`${req.ip} is requesting the change sitename.`);

	var new_sitename = req.body.new_sitename;
	var email = req.session.email;

	if (new_sitename) {
		req.getConnection(function (err, connection) {
			if (err) logger.error(new Error(err));
			connection.query('SELECT * FROM accounts WHERE email = ?', [email], function (err, data, fields) {
				if (err) logger.error(new Error(err));
				if (data.length > 0) {
					connection.query('UPDATE accounts SET sitename = ? WHERE email = ?', [
						new_sitename,
						email
					], function (err, data, fields) {
						if (err) tlogger.error(new Error(err));
						req.session.sitename = new_sitename;
						logger.info(`${req.ip} is successfully changed sitename.`);
						res.redirect('/profile');
					});
				} else {
					logger.error(new Error(err));
					return res.sendFile(path.join(__dirname, "..", 'www/error/500.html'));
				}
			});
		});
	} else {
		logger.warn(`${req.ip} is trying to change their sitename without entering a new sitename.`);
		res.send('Please enter a new site name!');
		res.end();
	}

}