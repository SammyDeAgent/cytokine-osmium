exports.list = function(req, res){
    if(req.session.loggedin){
        var username = req.session.username;
        var email = req.session.email;
        res.render('index',{logged: 1,user_name:username, e_mail:email});
    }else{
        res.render('index',{logged: 0,user_name:null});
    }
};