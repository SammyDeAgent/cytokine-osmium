exports.list = function(req, res){

    var logged;

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('SELECT * FROM accounts;', function(err, rows){
            if (err) throw err;
            res.render('players',{
                logged,
                data: rows
            });
        });
    });

    

};