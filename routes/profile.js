const path = require("path");

exports.list = function(req, res){

    var verify = req.session.verify;
    
    var exception = 0;
    var teams = [];

    if(req.session.loggedin){
        if(verify !== 'VERIFIED'){
             return res.render('verify',{logged: 1,user_name:username, e_mail:email});
        }
        req.getConnection(function(err, connection){
        if (err) throw err;
        connection.query('SELECT * FROM teams, team_comp, accounts WHERE teams.team_code = team_comp.team_code AND accounts.id = team_comp.team_member AND accounts.username = ?',
        [req.session.username],function(err, data, fields){
            if(err) throw err;
            if(!data.length > 0) exception = 1;
            for(var i = 0; i < data.length; i++){
                var obj = {};
                obj.team_code = data[i].team_code;
                obj.team_name = data[i].team_name;
                obj.team_desc = data[i].team_desc;
                obj.team_pimage = data[i].team_pimage;
                teams.push(obj);
            }

            res.render('profile',{
                logged: 1,
                sitename:   req.session.sitename,
                username:   req.session.username,
                siteP:      req.session.siteP,
                pimage:     req.session.pimage,
                regstamp:   req.session.regstamp,
                sText:      req.session.sText,
                v_status:   req.session.verify,
                teams,
                exception
            }
        );
        });
    });
    }else{
        return res.sendFile(path.join(__dirname,"..",'www/error/401.html'));
    }
};