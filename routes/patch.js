const fs = require("fs");
const path = require("path");

exports.list = function(req, res){
    
    const JSONPath = path.join(__dirname,'..','public','json','patch.json');
    const JSONData = fs.readFileSync(JSONPath, "utf-8");

    if(req.session.loggedin){
        var username = req.session.username;
        var email = req.session.email;
        var verify = req.session.verify;
        if(verify !== 'VERIFIED'){
            return res.render('verify',{logged: 1,user_name:username, e_mail:email});
        } 
        res.render('patch', {
            logged: 1,
            data: JSON.parse(JSONData),
        })
    }else{
        res.render('patch', {
            logged: 0,
            data: JSON.parse(JSONData),
        })
    }
    
}