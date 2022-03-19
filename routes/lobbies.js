const fs = require("fs");
const path = require("path");

exports.list = function (req, res) {

  if (req.session.loggedin) {
    var username = req.session.username;
    var email = req.session.email;
    var verify = req.session.verify;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
    res.render('lobbies', {
      logged: 1,
    })
  } else {
    res.render('lobbies', {
      logged: 0,
    })
  }

}