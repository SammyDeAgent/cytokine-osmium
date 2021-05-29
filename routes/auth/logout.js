exports.auth = function(req,res){
    req.session.destroy();
    res.redirect('/');
};