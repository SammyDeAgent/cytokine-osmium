// Logger Module
const logger = require('../../log')('ChangeStatusText');

exports.auth = function (req, res) {

	logger.info(`${req.ip} is requesting the change status text.`);

	var new_sText = req.body.new_sText;
	var id = req.session.acid;

	if (new_sText) {
		req.getConnection(function (err, connection) {
			if (err) logger.error(new Error(err));
			connection.query('SELECT * FROM account_status WHERE id = ?', [id], function (err, data, fields) {
				if (err) logger.error(new Error(err));
				if (data.length > 0) {
					connection.query('UPDATE account_status SET status_text = ? WHERE id = ?', [
						new_sText,
						id
					], function (err, data, fields) {
						if (err) logger.error(new Error(err));
						req.session.sText = new_sText;
						logger.info(`${req.ip} is successfully changed status text.`);
						res.redirect('/profile');
					});
				} else {
					logger.error(new Error(err));
					res.send('Fatal error encounter! Please contact the site administrator.')
				}
			});
		});
	} else {
		logger.warn(`${req.ip} is trying to change their status text without entering a new status text.`);
		res.send('Please enter a new status!');
		res.end();
	}

}