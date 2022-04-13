const path = require("path");

// Logger Module
const logger = require('../log')('Players');

exports.upvote = function (req, res) {

  logger.info(`${req.ip} is complimenting a player.`);

  var logged;
  var authname;

  const player_username = req.body.username;
  const acid = req.body.acid;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    var user_id = req.session.acid;
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
  } else {
    logged = 0;
    authname = null;
  }

  req.getConnection(function (err, connection) {
    if(err) logger.error(new Error(err));

    // Check if the user has already voted
    connection.query('SELECT * FROM account_voted WHERE id = ? AND voted_id = ?',
    [user_id, acid],
    function (err, data, fields) {
      if(err) logger.error(new Error(err));
      if (data.length > 0) {
        res.status(403);
        res.sendFile(path.join(__dirname, 'www/error/403.html'));
        logger.error('403: Forbidden ' + req.url + ' - ' + req.ip);
      }
    });

    connection.query('UPDATE account_compliments SET compliment = compliment + 1 WHERE id = ?',
    [acid],
    function(err, data, fields){
      if(err) logger.error(new Error(err));

      // Insert a vote check into account_voted
      connection.query('INSERT INTO account_voted (id, voted_id, vote_desc) VALUES (?, ?, ?)',
      [user_id, acid, 'Compliment'],
      function(err, data, fields){
        if(err) logger.error(new Error(err));
        res.redirect(`/player?username=${player_username}`);
      })
    });
  });
}

exports.downvote = function (req, res) {

  logger.info(`${req.ip} is disapproving a player.`);

  var logged;
  var authname;

  const player_username = req.body.username;
  const acid = req.body.acid;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    var user_id = req.session.acid;
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
  } else {
    logged = 0;
    authname = null;
  }

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));

    // Check if the user has already voted
    connection.query('SELECT * FROM account_voted WHERE id = ? AND voted_id = ?',
      [user_id, acid],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        if (data.length > 0) {
          res.status(403);
          res.sendFile(path.join(__dirname, 'www/error/403.html'));
          logger.error('403: Forbidden ' + req.url + ' - ' + req.ip);
        }
      });
    
    connection.query('UPDATE account_compliments SET disapprove = disapprove + 1 WHERE id = ?',
      [acid],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        
         // Delete the vote check from account_voted
         connection.query('INSERT INTO account_voted (id, voted_id, vote_desc) VALUES (?, ?, ?)',
           [user_id, acid, 'Disapprove'],
           function (err, data, fields) {
             if (err) logger.error(new Error(err));
             res.redirect(`/player?username=${player_username}`);
           })
      });
  });
}

exports.reset = function (req, res) {

  logger.info(`${req.ip} is resetting a player's vote.`);

  var logged;
  var authname;

  const player_username = req.body.username;
  const acid = req.body.acid;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    var user_id = req.session.acid;
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
  } else {
    logged = 0;
    authname = null;
  }

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));

    // Check if the user has vote existing
    connection.query('SELECT * FROM account_voted WHERE id = ? AND voted_id = ?',
      [user_id, acid],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        if (data.length == 0) {
          res.status(403);
          res.sendFile(path.join(__dirname, 'www/error/403.html'));
          logger.error('403: Forbidden ' + req.url + ' - ' + req.ip);
        }
      });

    connection.query('UPDATE account_compliments SET compliment = 0, disapprove = 0 WHERE id = ?',
      [acid],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        
        // Reset all vote checks
        connection.query('DELETE FROM account_voted WHERE id = ? AND voted_id = ?',
          [user_id, acid],
          function (err, data, fields) {
            if (err) logger.error(new Error(err));
            res.redirect(`/player?username=${player_username}`);
          })
      });
  });
}