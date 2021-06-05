exports.list = function(req, res){
    if(req.session.loggedin){
        res.render('profile',{
            logged: 1,
            sitename: req.session.sitename,
            username: req.session.username,
            pimage: req.session.pimage,
            regstamp: req.session.regstamp,
            sText: req.session.sText
        });
    }else{
        res.send('Please log in first!');
    }
};