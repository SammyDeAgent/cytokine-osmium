const bcrypt = require('bcrypt');

exports.auth = async function(req, res){

    var email = req.body.email;
	var password = req.body.password;
	
	if(email && password){
		req.getConnection(function(err,connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts JOIN account_status ON accounts.id = account_status.id WHERE email = ?', [email],
			async function(err, data, fields){
				if (err) throw err;
				if(data.length > 0){
					const comparison = await bcrypt.compare(password, data[0].password);
					if(comparison){
						req.session.loggedin = true;
						req.session.acid = data[0].id;
				        req.session.username = data[0].username;
						req.session.sitename = data[0].sitename;
						req.session.pimage = data[0].pimage;
 						req.session.email = data[0].email;
						req.session.sText = data[0].status_text;
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