const path = require("path");
const connection = require("express-myconnection");

exports.list = function (req, res) {

	var logged;
	var query = null;
	var search = 0;

	if (req.session.loggedin) {
		logged = 1;
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
	}

	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.promise().query("SELECT * FROM teams")
			.then(
				([rows, fields, err]) => {
					if (err) throw err;
					res.render('teams', {
						logged,
						data: rows,
						search,
						query
					});
				}
			)
	})
};

exports.create = function (req, res) {

	var logged;
	var verify = req.session.verify;

	if (req.session.loggedin) {
		logged = 1;
		if (verify !== 'VERIFIED') {
			return res.render('verify', {
				logged: 1,
				user_name: username,
				e_mail: email
			});
		}
	} else {
		logged = 0;
		res.send("Please login to create or join a team!");
	}

	var team_name = req.body.team_name;
	var team_desc = "Osmium team ready to service!"
	var pimage = 'default.png';
	var id = req.session.acid

	let ts = Date.now();
	let date_ob = new Date(ts);
	let date = date_ob.getDate();
	let month = date_ob.getMonth() + 1;
	let year = date_ob.getFullYear();
	let stamp = date + "/" + month + "/" + year;

	req.getConnection(function (err, connection) {
		if (err) throw err;

		// Check if user already created a team
		connection.query("SELECT * FROM team_comp WHERE team_member = ?", [id],
			function (err, data, fields) {
				if (err) throw err;
				if (data.length <= 0) {

					var team_code = codeGen();
					var inv_code = codeGen(6);

					connection.query("INSERT INTO teams (team_code, team_name, team_desc, team_pimage, team_leader, team_cTime, team_invCode) VALUES (?,?,?,?,?,(STR_TO_DATE(?, '%d/%m/%Y')),?)",
						[
							team_code,
							team_name,
							team_desc,
							pimage,
							id,
							stamp,
							inv_code
						],
						function (err, data, fields) {
							if (err) throw err;

							connection.query("INSERT INTO team_comp (team_code, team_member) VALUES (?,?)",
								[
									team_code,
									id
								],
								function (err, data, fields) {
									if (err) throw err;
									res.redirect('/team?code=' + team_code);
								})


						});

				} else {
					res.send("You have already created a Team!");
				}
			})
	})

}

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

exports.profile = function (req, res) {

	var logged;
	var teammates = [];
	var verify = req.session.verify;
	var authname;
	var leader = 0;
	var joined = 0;

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

	req.getConnection(function (err, connection) {
		if (err) throw err;

		// Check if the viewer is Team Leader

		connection.query('SELECT * FROM teams, team_comp, accounts, account_special, account_status WHERE teams.team_code = team_comp.team_code AND accounts.id = team_comp.team_member AND account_status.id = accounts.id AND account_special.id = accounts.id AND teams.team_code = ?', [req.query.code],
			function (err, data, fields) {
				if (err) throw err;
				if (data.length > 0) {
					connection.promise().query("SELECT DATE_FORMAT(team_cTime,'%d/%m/%Y') AS team_cTime FROM teams WHERE team_code = ?", [req.query.code],
						function (err, data, fields) {
							if (err) throw err;
						}
					).then(
						([rows, fields]) => {

							for (var i = 0; i < data.length; i++) {
								var obj = {};
								obj.sitename = data[i].sitename;
								obj.username = data[i].username;
								obj.pimage = data[i].pimage;
								obj.site_privilege = data[i].site_privilege;
								obj.status_text = data[i].status_text;

								// Getting the team leader's name and id
								if (data[i].id == data[i].team_leader) {
									teamLeader = data[i].username;
								}

								teammates.push(obj);
							}

							// Check if the viewer is Team Leader
							if (data[0].team_leader == req.session.acid) {
								leader = 1;
							}

							// Check if viewer is in the Team
							for (var i = 0; i < teammates.length; i++) {
								if (teammates[i].username == req.session.username) {
									joined = 1;
									break;
								}
							}

							res.render("team", {
								logged,
								authname,
								code: data[0].team_code,
								name: data[0].team_name,
								desc: data[0].team_desc,
								invCode: data[0].team_invCode,
								teamLeader,
								pimage: data[0].team_pimage,
								teammates,
								regstamp: rows[0].team_cTime,
								leader,
								joined,
							});

						});
				} else {
					return res.sendFile(path.join(__dirname, "../..", 'www/error/404.html'));
				}
			})
	})
}

exports.joining = function (req, res) {

	var invCode = req.body.invCode;
	var teamCode = req.body.teamCode;

	req.getConnection(function (err, connection) {
		if (err) throw err;

		connection.query('SELECT * FROM teams WHERE team_code = ?',
			[teamCode],
			function (err, data, fields) {
				if (err) throw err;

				// Check if invCode is correct
				if (invCode == data[0].team_invCode) {
					connection.query('INSERT INTO team_comp (team_code, team_member) VALUES (?,?)',
						[
							teamCode,
							req.session.acid,
						],
						function (err, data, fields) {
							if (err) throw err;
							res.redirect('/team?code=' + teamCode);
						})
				} else {
					res.send('Incorrect invitational code, please contact the team leader!');
				}
			})

	});

}

exports.leaving = function (req, res) {

	var teamCode = req.body.teamCode;

	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query('DELETE FROM team_comp WHERE team_code = ? AND team_member = ?',
			[teamCode, req.session.acid],
			function (err, data, fields) {
				if (err) throw err;
				res.redirect('/teams');
			})
	})

}

exports.disbanding = function (req, res) {

	var teamCode = req.body.teamCode;

	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query('DELETE FROM teams WHERE team_code = ?',
			[teamCode],
			function (err, data, fields) {
				if (err) throw err;
				res.redirect('/teams');
			})
	})

}

exports.search = function (req, res){
	var logged;
	var search = 1;
	var query = req.query.search;

	if (query.length <= 0) {
		return res.redirect('/teams');
	}

	var querySearch = '%' + query + '%';

	if(req.session.loggedin){
		logged = 1;
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
	}else{
		logged = 0;
	}

	req.getConnection(function (err, connection) {
		if (err) throw err;

		connection.query('SELECT * FROM teams WHERE team_name LIKE ? OR team_code LIKE ? ;',
			[
				querySearch,
				querySearch
			],
			function (err, data, fields) {
				if (err) throw err;
				if (!data.length > 0) exception = 1;
				res.render("teams", {
					logged,
					search,
					query,
					data
				});
			})
	})
}
