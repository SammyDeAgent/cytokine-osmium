//Logger Module
const logger = require('../../log')('ChangeTeamStatusText');

exports.auth = function (req, res) {

	logger.info(`${req.ip} is requesting the change team status text.`);

	var new_TText = req.body.new_TText;
	var team_code = req.body.team_code;

	if (new_TText) {
		req.getConnection(function (err, connection) {
			if (err) logger.error(new Error(err));
			connection.query('SELECT * FROM teams WHERE team_code = ?', [team_code], function (err, data, fields) {
				if (err) logger.error(new Error(err));
				if (data.length > 0) {
					connection.query('UPDATE teams SET team_desc = ? WHERE team_code = ?', [
						new_TText,
						team_code
					], function (err, data, fields) {
						if (err) logger.error(new Error(err));
						logger.info(`${req.ip} is successfully changed team status text.`);
						res.redirect(`/team?code=${team_code}`);
					});
				} else {
					logger.error(new Error(err));
					res.send('Fatal error encounter! Please contact the site administrator.')
				}
			});
		});
	} else {
		logger.warn(`${req.ip} is trying to change their team status text without entering a new team status text.`);
		res.send('Please enter a new status!');
		res.end();
	}

}