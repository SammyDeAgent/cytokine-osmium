const bcrypt = require('bcrypt');

exports.auth = async function(req, res){
    var email = req.body.email;
	var password = req.body.password;
	if(email && password){
		req.getConnection(function(err,connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts WHERE email = ?', [email],
			async function(err, data, fields){
				if (err) throw err;
				if(data.length > 0){
					const comparison = await bcrypt.compare(password, data[0].password);
					if(comparison){
						req.session.loggedin = true;
				        req.session.username = data[0].username;
 						req.session.email = data[0].email;
 				        res.redirect('/');
					}else{
						res.send('Incorrect Email and/or Password!');
					}
				}else{
					res.send('Incorrect Email and/or Password!');
				}
			});
        })
	}else{
		res.send('Please enter Email and Password!');
		res.end();
	}
};