exports.auth = function(req, res){

    var code = req.body.verify_code;
    var id = req.session.acid;

    var verified = "VERIFIED";

    req.getConnection(function(err, connection){
        if(err) throw err;
        connection.query('SELECT * FROM account_verify WHERE account_verify.id = ?', [id],
        function(err, data, fields){
            if(err) throw err;
            if(data.length > 0){
                if(data[0].verify_code == code){
                    connection.query('UPDATE account_verify SET verify_code = NULL, verify_status = ? WHERE id = ?', [
                        verified,
                        id
                    ], function(err, data, fields){
                        if(err) throw err;

                        req.session.verify = "VERIFIED";
                        res.redirect('/');

                    })
                }else{
                    res.send('Incorrect verification code, please try again!');
                }
            }else{
                res.send('500 Server Error!');
            }
        })
    })
}