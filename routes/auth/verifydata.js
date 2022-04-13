// Logger Module
const logger = require('../../log')('Verify');

exports.auth = function (req, res) {

	logger.info(`${req.ip} is requesting the verify page.`);

	var code = req.body.verify_code;
	var id = req.session.acid;

	var verified = "VERIFIED";

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));

		connection.query('SELECT * FROM account_verify WHERE account_verify.id = ?', [id],
			function (err, data, fields) {
				if (err) logger.error(new Error(err));

				if (data.length > 0) {
					if (data[0].verify_code == code) {
						connection.query('UPDATE account_verify SET verify_code = NULL, verify_status = ? WHERE id = ?', [
							verified,
							id
						], function (err, data, fields) {
							if (err) logger.error(new Error(err));

							req.session.verify = "VERIFIED";
							logger.info(`${req.ip} has verified their account.`);
							res.redirect('/');

						})
					} else {
						logger.warn(`${req.ip} is trying to verify with an invalid code.`);
						res.send('Incorrect verification code, please try again!');
					}
				} else {
					logger.error(new Error(err));
					res.send('500 Server Error!');
				}
			})
	})
}