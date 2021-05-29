exports.list = function(req, res){
    if(req.session.loggedin){
        res.render('index',{logged: 1,user_name:req.session.username});
    }else{
        res.render('index',{logged: 0,user_name:null});
    }
};