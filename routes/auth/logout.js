// Logger Module
const logger = require('../../log')('Logout');

exports.auth = function (req, res) {

	logger.info(`${req.ip} is requesting the logout page.`);

	req.session.destroy();
	res.redirect('/');
};