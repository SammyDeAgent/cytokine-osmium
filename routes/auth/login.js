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
						req.session.sitename = data[0].sitename;
 						req.session.email = data[0].email;
						connection.query("SELECT DATE_FORMAT(register_stamp,'%d/%m/%Y') AS register_stamp FROM accounts WHERE email = ?", [email],
						function(err, data, fields){
							if (err) throw err;
							req.session.regstamp = data[0].register_stamp;
							
 				        	res.redirect('/');
						})
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