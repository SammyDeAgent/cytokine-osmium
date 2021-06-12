exports.list = function(req, res){

    var logged;
    var search = 0;
    var query = null;

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('SELECT * FROM accounts, account_status, account_special WHERE accounts.id = account_status.id AND account_special.id = accounts.id;', function(err, rows){
            if (err) throw err;
            res.render('players',{
                logged,
                search,
                query,
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
        connection.query('SELECT * FROM accounts, account_status, account_special WHERE accounts.id = account_status.id AND accounts.id = account_special.id AND username = ?',[req.query.username], async function(err, data){
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
                            siteP:      data[0].site_privilege,
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

exports.search = function(req, res){

    var logged;
    var search = 1;
    var query = req.query.search;

    if(query.length <= 0) {
        return res.redirect('/players');
    }

    var search = '%'+req.query.search+'%';

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query("SELECT * FROM accounts, account_status, account_special WHERE accounts.id = account_status.id AND account_special.id = accounts.id AND ( username LIKE ? OR sitename LIKE ? );",
        [
          search,
          search  
        ],
        function(err, rows){
            if (err) throw err;
            res.render('players',{
                logged,
                search,
                query,
                data: rows
            });
        });
    });
}