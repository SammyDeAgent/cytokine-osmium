exports.init = function (req, res) {
	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query('SELECT * FROM accounts;', function (err, rows) {
			if (err) throw err;
			res.render('test/ajaxtest', {
				data: rows
			})
		})
	})
};

exports.init2 = function (req, res) {
	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query('SELECT * FROM accounts;', function (err, rows) {
			if (err) throw err;
			res.render('test/ajaxtest2', {
				data: rows
			})
		})
	})
};

exports.search = function (req, res) {
	var query = req.body.search_name;
	if (query.length <= 0) {
		return exports.init2(req, res);
	}
	var search_name = '%' + query + '%';
	req.getConnection(function (err, connection) {
		if (err) throw err;
		connection.query('SELECT * FROM accounts WHERE sitename LIKE ? OR username LIKE ?;', [search_name, search_name], function (err, rows) {
			if (err) throw err;
			res.render('test/ajaxtest2', {
				data: rows
			})
		})
	})
};