exports.auth = function(req, res){
    var username = req.body.username;
	var password = req.body.password;
	if(username && password){
		req.getConnection(function(err,connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?',
		        [
			        username,
			        password
		        ], function(err, data, fields){
			        if(data.length > 0){
				        req.session.loggedin = true;
				        req.session.username = username;
				        res.redirect('/');
			        }else{
				        res.send('Incorrect Username and/or Password!');
			        }
			    res.end();
		    });
        })
	}else{
		res.send('Please enter Username and Password!');
		res.end();
	}
};