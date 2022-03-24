const path = require("path");

exports.list = function (req, res) {

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
		if (err) throw err;
		connection.query('SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND account_special.id = accounts.id AND account_verify.id = accounts.id;', function (err, rows) {
			if (err) throw err;
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

	var logged;
	var authname;
	var verify = req.session.verify;

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
		if (err) throw err;
		connection.query('SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND accounts.id = account_special.id AND account_verify.id = accounts.id AND username = ?', [req.query.username], async function (err, data) {
			if (err) throw err;
			if (data.length > 0) {

				// Check if the player profile is the current session account profile
				if (data[0].id == req.session.acid) {
					return res.redirect('/profile');
				}

				connection.promise().query("SELECT DATE_FORMAT(register_stamp,'%d/%m/%Y') AS register_stamp FROM accounts WHERE username = ?", [req.query.username],
					function (err, data, fields) {
						if (err) throw err;
					}
				).then(

					([rows, fields]) => {

						connection.query('SELECT * FROM teams, team_comp, accounts WHERE teams.team_code = team_comp.team_code AND accounts.id = team_comp.team_member AND accounts.username = ?', [req.query.username], function (err, data2, fields) {
							if (err) throw err;
							if (!data2.length > 0) exception = 1;
							for (var i = 0; i < data2.length; i++) {
								var obj = {};
								obj.team_code = data2[i].team_code;
								obj.team_name = data2[i].team_name;
								obj.team_desc = data2[i].team_desc;
								obj.team_pimage = data2[i].team_pimage;
								teams.push(obj);
							}

							res.render('player', {
								logged,
								authname,
								username: data[0].username,
								sitename: data[0].sitename,
								siteP: data[0].site_privilege,
								pimage: data[0].pimage,
								sText: data[0].status_text,
								v_status: data[0].verify_status,
								regstamp: rows[0].register_stamp,
								teams,
								exception
							})

						});


					}
				);
			} else {
				return res.sendFile(path.join(__dirname, "..", 'www/error/404.html'));
			}
		});
	});
};

exports.search = function (req, res) {

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
		if (err) throw err;
		connection.query("SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND account_special.id = accounts.id AND accounts.id = account_verify.id AND ( username LIKE ? OR sitename LIKE ? );",
			[
				querySearch,
				querySearch
			],
			function (err, rows) {
				if (err) throw err;
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