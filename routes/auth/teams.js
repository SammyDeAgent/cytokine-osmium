const path = require("path");
const connection = require("express-myconnection");

exports.list = function(req, res){

    var logged;
    var exception = 0;
    var verify = req.session.verify

    if(req.session.loggedin){
        logged = 1;
        if(verify !== 'VERIFIED'){
            return res.render('verify',{logged: 1,user_name:username, e_mail:email});
        }
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
                    data: rows
                });
            }
        )
    })
};

exports.create = function(req, res){

    var logged;
    var verify = req.session.verify;

    if(req.session.loggedin){
        logged = 1;
         if(verify !== 'VERIFIED'){
            return res.render('verify',{logged: 1,user_name:username, e_mail:email});
        }
    }else{
        logged = 0;
        res.send("Please login to create or join a team!");
    }

    var team_name = req.body.team_name;
    var team_desc = "Osmium team ready to service!"
    var pimage = 'default.png';
    var id = req.session.acid

    let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let stamp = date+"/"+month+"/"+year;

    req.getConnection(function(err, connection){
        if(err) throw err;
        
        // Check if user already created a team
        connection.query("SELECT * FROM team_comp WHERE team_member = ?",[id],
        function(err, data, fields){
            if(err) throw err;
            if(data.length <= 0){

                var team_code = codeGen();

                connection.query("INSERT INTO teams (team_code, team_name, team_desc, team_pimage, team_leader, team_cTime) VALUES (?,?,?,?,?,(STR_TO_DATE(?, '%d/%m/%Y')))",
                [
                    team_code,
                    team_name,
                    team_desc,
                    pimage,
                    id,
                    stamp
                ],function(err, data, fields){
                    if(err) throw err;

                    connection.query("INSERT INTO team_comp (team_code, team_member) VALUES (?,?)",
                    [
                        team_code,
                        id
                    ], function(err, data, fields){
                        if(err) throw err;
                        res.redirect('/team?code='+team_code);
                    })
                    

                });
                
            }else{
                res.send("You have already created a Team!");
            }
        })
    })

}

const codeGen = (length = 8) => {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
};

exports.profile = function(req, res){

    var logged;
    var teammates = [];
    var verify = req.session.verify;

    if(req.session.loggedin){
        logged = 1;
        authname = req.session.username;
        if(verify !== 'VERIFIED'){
            return res.render('verify',{logged: 1,user_name:username, e_mail:email});
        }
    }else{
        logged = 0;
        authname = null;
    }

    req.getConnection(function(err, connection){
        if(err) throw err;
        connection.query('SELECT * FROM teams, team_comp WHERE teams.team_code = team_comp.team_code AND teams.team_code = ?',[req.query.code],
        function(err, data, fields){
            if(err) throw err;
            if(data.length > 0){
                connection.promise().query("SELECT DATE_FORMAT(team_cTime,'%d/%m/%Y') AS team_cTime FROM teams WHERE team_code = ?", [req.query.code],
                    function (err, data, fields) {
                        if (err) throw err;
                    }                  
                ).then( 
                    ([rows,fields]) => {

                        for(x in data){
                            teammates[x] = data[x].team_member;
                        }

                        res.render('team', {
                            logged,
                            code:   data[0].team_code,
                            name:   data[0].team_name,
                            desc:   data[0].team_desc,
                            leader: data[0].team_leader,
                            pimage:     data[0].team_pimage,
                            teammates: teammates,
                            regstamp:   rows[0].team_cTime
                        })
                    }
                );
            }else{
                return res.sendFile(path.join(__dirname,"../..",'www/error/404.html'));
            }
        })
    })
}