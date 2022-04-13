const bcrypt = require('bcrypt');

//Logger Module
const logger = require('../../log')('Login');

exports.auth = async function(req, res){

	logger.info(`${req.ip} is requesting the login page.`);

  var email = req.body.email;
	var password = req.body.password;
	
	if(email && password){
		req.getConnection(function(err,connection){
            if (err) logger.error(new Error(err));
            connection.query('SELECT * FROM accounts, account_status, account_special, account_verify WHERE accounts.id = account_status.id AND accounts.id = account_special.id AND accounts.id = account_verify.id AND email = ?', [email],
			async function(err, data, fields){
				if (err) logger.error(new Error(err));
				if(data.length > 0){
					const comparison = await bcrypt.compare(password, data[0].password);
					if(comparison){
						// Email verification 
						req.session.verify = data[0].verify_status;

						req.session.loggedin = true;
						req.session.acid = data[0].id;
				    req.session.username = data[0].username;
						req.session.sitename = data[0].sitename;
						req.session.siteP = data[0].site_privilege;
						req.session.pimage = data[0].pimage;
 						req.session.email = data[0].email;
						req.session.sText = data[0].status_text;
						connection.query("SELECT DATE_FORMAT(register_stamp,'%d/%m/%Y') AS register_stamp FROM accounts WHERE email = ?", [email],
						function(err, data, fields){
							if (err) logger.error(new Error(err));
							req.session.regstamp = data[0].register_stamp;
							
							logger.info(`${req.ip} is successfully logged in.`);
							res.redirect('/');
						})
					}else{
						logger.warn(`${req.ip} is failed to login.`);
						res.send('Incorrect Email and/or Password!');
					}
				}else{
					logger.warn(`${req.ip} is failed to login.`);
					res.send('Incorrect Email and/or Password!');
				}
			});
    })
	}else{
		logger.warn(`${req.ip} is trying to login with an invalid email and/or password.`);
		res.send('Please enter Email and Password!');
		res.end();
	}
};