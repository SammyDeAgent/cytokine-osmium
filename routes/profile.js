const path = require("path");

exports.list = function(req, res){
    if(req.session.loggedin){
        res.render('profile',{
            logged: 1,
            sitename:   req.session.sitename,
            username:   req.session.username,
            siteP:      req.session.siteP,
            pimage:     req.session.pimage,
            regstamp:   req.session.regstamp,
            sText:      req.session.sText
        });
    }else{
        return res.sendFile(path.join(__dirname,"..",'www/error/401.html'));
    }
};