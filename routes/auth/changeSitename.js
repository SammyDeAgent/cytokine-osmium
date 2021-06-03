exports.auth = function(req, res){

    var new_sitename = req.body.new_sitename;
    var email = req.session.email;
    
    if(new_sitename){
        req.getConnection(function(err, connection){
            if (err) throw err;
            connection.query('SELECT * FROM accounts WHERE email = ?',[email], function(err, data, fields){
                if (err) throw err;
                if(data.length > 0){
                    connection.query('UPDATE accounts SET sitename = ? WHERE email = ?',[
                        new_sitename,
                        email
                    ], function(err, data, fields){
                        if (err) throw err;
                        req.session.sitename = new_sitename;
                        res.redirect('/profile');
                    });
                }else{
                    res.send('Fatal error encounter! Please contact the site administrator.')
                }
            });
        });
    }else{
        res.send('Please enter Email and Password!');
		res.end();
    }
    
}