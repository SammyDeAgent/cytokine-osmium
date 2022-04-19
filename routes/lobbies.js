const fs = require("fs");
const { request } = require("http");
const path = require("path");
const moment = require('moment');
const { connect } = require("http2");

// Logger Module
const logger = require('../log')('Lobbies');

const codeGen = (length = 8) => {
  // Declare all characters
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Pick characers randomly
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return str;
};

exports.list = function (req, res) {

  logger.info(`${req.ip} is requesting the lobbies page.`);

  var acid = req.session.acid;
  var query = null;
  var search = 0;

  if (req.session.loggedin) {
    logged = 1;
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
  }

  req.getConnection(function (err, connection) {
    if(err) logger.error(new Error(err));

    connection.query('SELECT * FROM lobbies', function (err, data, fields) {
      if (err) logger.error(new Error(err));
      res.render('lobbies', {
        logged,
        data,
        acid,
        search,
        query
      });
    });
  });

}

exports.create = function(req, res){
  logger.info(`${req.ip} is requesting to create a lobby.`);
  
  var logged;
  var verify = req.session.verify;

  if (req.session.loggedin) {
    logged = 1;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  // Variable Processing
  var name = req.body.lobby_name;
  if(name == ''){
    name = "Lobby " + Math.floor(Math.random() * 100);
  };

  var desc = req.body.lobby_desc;
  if(desc == ''){
    desc = "Looking for a quick game!";
  };

  var region = req.body.lobby_region
  var game = req.body.lobby_game;
  var type = req.body.lobby_type;

  var skill = req.body.lobby_skill;
  if(skill == ''){
    skill = "Any Level";
  };

  var leader =req.body.lobby_leader;

  // open = 1 means public, open = 0 means private
  var open = req.body.lobby_open;
  if(open == null) open = 1;
  else open = 0;

  req.getConnection(function(err, connection){
    if(err) logger.error(new Error(err));

    // Check if leader has already created a lobby;
    connection.query("SELECT * FROM lobbies WHERE lobby_leader = ?", [leader], function(err, data, fields){
      if (err) logger.error(new Error(err));
      if (data.length <= 0) {

        var code = codeGen();

        var pass = null;
        if(open == 0) pass = codeGen(6);

        connection.query(
          "INSERT INTO lobbies (lobby_code, lobby_name, lobby_desc, lobby_leader, lobby_cTime, lobby_open, lobby_region, lobby_pass, lobby_status, lobby_game, lobby_type, lobby_skill) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [code, name, desc, leader, new Date(), open, region, pass, 'WAITING', game, type, skill],
          function(err, data, fields){
            if (err) logger.error(new Error(err));

            // Lobby Leader join team 1
            connection.query("INSERT INTO lobbies_team(lobby_code, id, team) VALUES (?, ?, ?)", 
            [code, leader, 1], 
            function(err, data, fields){
              if (err) logger.error(new Error(err));
              res.redirect('/lobby?code=' +  code);
            });
          });
      }else{
        logger.warn(`${req.ip} has already created a lobby.`);
        res.send("You have already created a lobby!");
      }
    });
  });
}

exports.profile = function(req, res){
  logger.info(`${req.ip} is requesting the lobby profile page.`);

  var logged;
  var verify = req.session.verify;
  var authname;
  var leader = 0;
  var joined = 0;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  // Query for that teams' information
  var teamCode = req.query.code;

  req.getConnection(function(err, connection){
    // Obtain team 1 and team 2 data
    var team1 = [];
    var team2 = [];

    connection.query('SELECT * FROM lobbies, lobbies_team, accounts, account_special, account_status WHERE lobbies.lobby_code = lobbies_team.lobby_code AND accounts.id = lobbies_team.id AND account_status.id = accounts.id AND account_special.id = accounts.id AND lobbies.lobby_code = ?',
      [req.query.code],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));

        if(data.length > 0){
        
        for(let i in data){
          var obj = {};
          obj.sitename = data[i].sitename;
          obj.username = data[i].username;
          obj.pimage = data[i].pimage;
          obj.site_privilege = data[i].site_privilege;
          obj.status_text = data[i].status_text;

          // Getting Lobby Leader Information
          if(data[i].id == data[i].lobby_leader){
            var lobbyLeader = data[i].username;
          }

          // Determine if team 1 or team 2
          if(data[i].team == 1){
            team1.push(obj);
          }else{
            team2.push(obj);
          }
        }

        // Check if the viewer is Lobby Leader
        if (data[0].lobby_leader == req.session.acid) {
          leader = 1;
        }

        // Check if viewer is in the Lobby
        for (let i in data) {
          if (data[i].username == req.session.username) {
            joined = 1;
            var viewerTeam = data[i].team;
            break;
          }
        }

        connection.query('SELECT * FROM lobbies WHERE lobby_code = ?',
          [teamCode],
          function (err, data, fields) {
            if (err) logger.error(new Error(err));
            if (data.length > 0) {
              res.render('lobby', {
                logged,
                authname,
                code: data[0].lobby_code,
                desc: data[0].lobby_desc,
                name: data[0].lobby_name,
                leader: data[0].lobby_leader,
                status: data[0].lobby_status,
                open: data[0].lobby_open,
                region: data[0].lobby_region,
                game: data[0].lobby_game,
                type: data[0].lobby_type,
                skill: data[0].lobby_skill,
                team1,
                team2,
                lobbyLeader,
                leader,
                viewerTeam,
                joined
              });
            } else {
              logger.error('404: ' + req.url + ' - ' + req.ip);
              return res.sendFile(path.join(__dirname, "..", 'www/error/404.html'));
            };
        });

      } else {
        logger.error('404: ' + req.url + ' - ' + req.ip);
        return res.sendFile(path.join(__dirname, "..", 'www/error/404.html'));
      };

      });
  });
}

exports.delete = function(connection, data){
  logger.debug('Running Lobby Deletion Cron Job');
  for(let i in data){
    var timeA = moment(data[0].lobby_cTime);
    var timeB = moment(Date.now());
    var diff = timeB.diff(timeA, 'minutes');
    if(diff >= 10 && data[i].lobby_status == "ENDED"){
      logger.debug('Deleting Lobby: ' + data[i].lobby_code);
      connection.query('UPDATE account_compliments SET lobby_complete = lobby_complete + 1 WHERE id IN (SELECT id FROM lobbies_team WHERE lobby_code = ?)',
      [data[i].lobby_code], function(err, row, fields){
        if(err) logger.error(new Error(err));
        connection.query('DELETE FROM lobbies WHERE lobby_code = ?',
         [data[i].lobby_code], function(err, row, fields){
          if(err) logger.error(new Error(err));
        });
      });
    }
    // else if(diff >= 270){
    //   logger.debug('Force Deleting Long-Running Lobby: ' + data[i].lobby_code);
    //   connection.query('DELETE FROM lobbies WHERE lobby_code = ?',
    //     [data[i].lobby_code], function(err, data, fields){
    //       if(err) logger.error(new Error(err));
    //     });
    // }
  }
}

exports.joinTeam = function(req, res){
  logger.info(`${req.ip} is requesting to join a lobby.`);

  var logged;
  var verify = req.session.verify;
  var authname;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  // Check if player is already in the lobby team
  var code = req.body.lobby_code;
  var teamSelected = req.body.lobby_team_select;

  req.getConnection(function(err, connection){
    if(err) logger.error(new Error(err));
    connection.query('SELECT * FROM lobbies_team WHERE lobby_code = ? AND id = ?',
      [code, req.session.acid], function(err, data, fields){
        if(err) logger.error(new Error(err));
        if(data.length <= 0){
          connection.query('INSERT INTO lobbies_team (lobby_code, id, team) VALUES (?, ?, ?)',
            [code, req.session.acid, teamSelected], function(err, data, fields){
              if(err) logger.error(new Error(err));
              res.redirect('/lobby?code=' + code);
            });
        }else{
          // Check the player's current team, then switch to the new team
          if(data[0].team == teamSelected){
            res.redirect('/lobby?code=' + code);
          }else{
            connection.query('UPDATE lobbies_team SET team = ? WHERE lobby_code = ? AND id = ?',
              [teamSelected, code, req.session.acid], function(err, data, fields){
                if(err) logger.error(new Error(err));
                res.redirect('/lobby?code=' + code);
              });
          }
        }
      });
  });
}

exports.leaving = function(req, res){
  logger.info(`${req.ip} is requesting to leave a lobby.`);

  var logged;
  var verify = req.session.verify;
  var authname;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  var code = req.body.lobby_code;

  req.getConnection(function(err, connection){
    if(err) logger.error(new Error(err));
    connection.query('DELETE FROM lobbies_team WHERE lobby_code = ? AND id = ?',
      [code, req.session.acid], function(err, data, fields){
        if(err) logger.error(new Error(err));
        res.redirect('/lobbies');
      });
  });
}

exports.close = function(req, res){
  logger.info(`${req.ip} is requesting to close a lobby.`);

  var logged;
  var verify = req.session.verify;
  var authname;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  var code = req.body.lobby_code;

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('DELETE FROM lobbies WHERE lobby_code = ?',
      [code],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        res.redirect('/lobbies');
      });
  });
}

exports.readyLobby = function(req, res){
  logger.info(`${req.ip} is requesting to proceed status of a lobby.`);

  var logged;
  var verify = req.session.verify;
  var authname;

  if (req.session.loggedin) {
    logged = 1;
    authname = req.session.username;
    if (verify !== 'VERIFIED') {
      return res.render('verify', {
        logged: 1,
        user_name: username,
        e_mail: email
      });
    }
  } else {
    logged = 0;
    res.send("Please login to create or join a lobby!");
  }

  var code = req.body.lobby_code;
  var status = req.body.lobby_status;

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('UPDATE lobbies SET lobby_status = ? WHERE lobby_code = ?',
      [status, code],
      function (err, data, fields) {
        if (err) logger.error(new Error(err));
        res.redirect('/lobby?code=' + code);
      });
  });
}