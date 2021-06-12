exports.list = function(req, res){

    var logged;
    var exception = 0;

    if(req.session.loggedin){
        logged = 1;
    }else{
        logged = 0;
    }   

    req.getConnection(function(err, connection){
        if (err) throw err;
        connection.promise().query("SELECT * FROM teams")
        .then(
            ([rows, fields, err]) => {
                if (err) throw err;
                if(!rows.length > 0) exception = 1;
                res.render('teams',{
                    logged,
                    exception,
                    rows
                });
            }
        )
    })

   
};