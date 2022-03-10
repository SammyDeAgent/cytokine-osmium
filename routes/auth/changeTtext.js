exports.auth = function(req, res){

    var new_TText = req.body.new_TText;
    var team_code = req.body.team_code;

    if(new_TText){
        req.getConnection(function(err, connection){
            if (err) throw err;
            connection.query('SELECT * FROM teams WHERE team_code = ?',[team_code], function(err, data, fields){
                if (err) throw err;
                if(data.length > 0){
                    connection.query('UPDATE teams SET team_desc = ? WHERE team_code = ?',[
                        new_TText,
                        team_code
                    ], function(err, data, fields){
                        if (err) throw err;
                        res.redirect(`/team?code=${team_code}`);
                    });
                }else{
                    res.send('Fatal error encounter! Please contact the site administrator.')
                }
            });
        });
    }else{
        res.send('Please enter a new status!');
		res.end();
    }
    
}