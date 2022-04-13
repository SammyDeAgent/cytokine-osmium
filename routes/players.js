const path = require("path");

// Logger Module
const logger = require('../log')('Players');

exports.list = function (req, res) {

	logger.info(`${req.ip} is requesting the players page.`);

	var logged;
	var authname;
	var search = 0;
	var query = null;

	if (req.session.loggedin) {
		logged = 1;
		authname = req.session.username;
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
	} else {
		logged = 0;
		authname = null;
	}

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND account_special.id = accounts.id AND account_verify.id = accounts.id;', function (err, rows) {
			if (err) logger.error(new Error(err));
			res.render('players', {
				logged,
				authname,
				search,
				query,
				data: rows
			});
		});
	});
};

exports.profile = function (req, res) {

	logger.info(`${req.ip} is requesting the players profile page.`);

	var logged;
	var authname;
	var verify = req.session.verify;

	var user_id = req.session.acid;

	var exception = 0;

	if (req.session.loggedin) {
		logged = 1;
		authname = req.session.username;
		if (verify !== 'VERIFIED') {
			return res.render('verify', {
				logged: 1,
				user_name: username,
				e_mail: email
			});
		}
	} else {
		logged = 0;
		authname = null;
	}

	var teams = [];

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query('SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND accounts.id = account_special.id AND account_verify.id = accounts.id AND username = ?', [req.query.username], async function (err, data) {
			if (err) logger.error(new Error(err));
			if (data.length > 0) {

				// Check if the player profile is the current session account profile
				if (data[0].id == req.session.acid) {
					return res.redirect('/profile');
				}

				connection.promise().query("SELECT DATE_FORMAT(register_stamp,'%d/%m/%Y') AS register_stamp FROM accounts WHERE username = ?", [req.query.username],
					function (err, data, fields) {
						if (err) logger.error(new Error(err));
					}
				).then(

					([rows, fields]) => {

						connection.query('SELECT * FROM teams, team_comp, accounts WHERE teams.team_code = team_comp.team_code AND accounts.id = team_comp.team_member AND accounts.username = ?', [req.query.username], function (err, data2, fields) {
							if (err) logger.error(new Error(err));
							if (!data2.length > 0) exception = 1;
							for (var i = 0; i < data2.length; i++) {
								var obj = {};
								obj.team_code = data2[i].team_code;
								obj.team_name = data2[i].team_name;
								obj.team_desc = data2[i].team_desc;
								obj.team_pimage = data2[i].team_pimage;
								teams.push(obj);
							}

							connection.query(
								'SELECT * FROM account_compliments WHERE id = ?',
								[data[0].id], function(err, ratingData, fields){
									if (err) logger.error(new Error(err));

									connection.query('SELECT * FROM account_voted WHERE id = ? AND voted_id = ?',
									[user_id, data[0].id], function(err, votedData, fields){
										if(err) logger.error(new Error(err));
										var voted = {
											exist: 0,
											desc: ''
										}
										if(votedData.length > 0){
											voted.exist = 1;
											voted.desc = votedData[0].vote_desc;
										}
										
										res.render('player', {
											logged,
											authname,
											acid: data[0].id,
											username: data[0].username,
											sitename: data[0].sitename,
											siteP: data[0].site_privilege,
											pimage: data[0].pimage,
											sText: data[0].status_text,
											v_status: data[0].verify_status,
											regstamp: rows[0].register_stamp,
											teams,
											ratingData,
											voted,
											exception
										})
									})
										

								}
							)
						});


					}
				);
			} else {
				logger.error('404: ' + req.url + ' - ' + req.ip);
				return res.sendFile(path.join(__dirname, "..", 'www/error/404.html'));
			}
		});
	});
};

exports.search = function (req, res) {

	logger.info(`${req.ip} is requesting the players search.`);

	var logged;
	var authname;
	var search = 1;
	var query = req.query.search;

	if (query.length <= 0) {
		return res.redirect('/players');
	}

	var querySearch = '%' + query + '%';

	if (req.session.loggedin) {
		logged = 1;
		authname = req.session.username;
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
	} else {
		logged = 0;
		authname = null;
	}

	req.getConnection(function (err, connection) {
		if (err) logger.error(new Error(err));
		connection.query("SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND account_special.id = accounts.id AND accounts.id = account_verify.id AND ( username LIKE ? OR sitename LIKE ? );",
			[
				querySearch,
				querySearch
			],
			function (err, rows) {
				if (err) logger.error(new Error(err));
				res.render('players', {
					logged,
					authname,
					search,
					query,
					data: rows
				});
			});
	});
}