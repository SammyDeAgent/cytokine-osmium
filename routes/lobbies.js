const fs = require("fs");
const path = require("path");

// Logger Module
const logger = require('../log')('Lobbies');

exports.list = function (req, res) {

  logger.info(`${req.ip} is requesting the lobbies page.`);

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