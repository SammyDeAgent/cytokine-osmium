const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.auth = async function(req, res){
    var username = req.body.r_username;
    var email = req.body.r_email;
    var password = req.body.r_password;

    const encryptedPassword = await bcrypt.hash(password, saltRounds);

    if(username && email && password){
        req.getConnection(function(err, connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts;', function(err, data, fields){
                if (err) throw err;
                var queryNo = data.length + 1;
                connection.query('INSERT INTO accounts (id, username, email, password) VALUES (?,?,?,?);',
                [
                    queryNo,
                    username,
                    email,
                    encryptedPassword
                ], function(err, data, fields){
                    if(err) throw err;
                    res.redirect('/');
                });
            });
        });
    }else{
        res.send('Please enter the correct credentials!');
		res.end();
    }
};