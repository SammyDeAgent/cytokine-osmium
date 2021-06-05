exports.list = function(req, res){

    var logged;

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('SELECT * FROM accounts, account_status WHERE accounts.id = account_status.id;', function(err, rows){
            if (err) throw err;
            res.render('players',{
                logged,
                data: rows
            });
        });
    });
};

exports.profile = function(req, res){

    var logged;
    var regstamp;

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('SELECT * FROM accounts JOIN account_status ON accounts.id = account_status.id WHERE username = ?',[req.query.username], async function(err, data){
            if(err) throw err;
            if(data.length > 0){
                connection.promise().query("SELECT DATE_FORMAT(register_stamp,'%d/%m/%Y') AS register_stamp FROM accounts WHERE username = ?", [req.query.username],
                    function (err, data, fields) {
                        if (err) throw err;
                    }                  
                ).then( 
                    ([rows,fields]) => {
                        res.render('player', {
                            logged,
                            username:   data[0].username,
                            sitename:   data[0].sitename,
                            pimage:     data[0].pimage,
                            sText:      data[0].status_text,
                            regstamp:   rows[0].register_stamp
                        })
                    }
                );
            }else{
                res.send("No such player exists!");
                res.end();
            }
        });
    });
};