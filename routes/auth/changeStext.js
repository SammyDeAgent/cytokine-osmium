exports.auth = function(req, res){

    var new_sText = req.body.new_sText;
    var id = req.session.acid;

    if(new_sText){
        req.getConnection(function(err, connection){
            if (err) throw err;
            connection.query('SELECT * FROM account_status WHERE id = ?',[id], function(err, data, fields){
                if (err) throw err;
                if(data.length > 0){
                    connection.query('UPDATE account_status SET status_text = ? WHERE id = ?',[
                        new_sText,
                        id
                    ], function(err, data, fields){
                        if (err) throw err;
                        req.session.sText = new_sText;
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