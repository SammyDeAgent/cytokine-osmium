const fs = require("fs");
const {
  request
} = require("http");
const path = require("path");
const moment = require('moment');
const {
  connect
} = require("http2");

// Logger Module
const logger = require('../log')('Tourns');

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

exports.list = function(req, res){
  logger.info(`${req.ip} is requesting the tournaments page.`);

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
    if (err) logger.error(new Error(err));

    connection.query('SELECT * FROM tournaments', function (err, data, fields) {
      if (err) logger.error(new Error(err));
      res.render('tourns', {
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
   logger.info(`${req.ip} is requesting to create a tournament.`);

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
  var name = req.body.tournament_name;
  var desc = req.body.tournament_desc;
  var region = req.body.tournament_region
  var game = req.body.tournament_game;
  var type = req.body.tournament_type;

  var skill = req.body.tournament_skill;
  if (skill == '') {
    skill = "Any Level";
  };

  var leader = req.body.tournament_leader;

  // open = 1 means public, open = 0 means private
  var open = req.body.tournament_open;
  if (open == null) open = 1;
  else open = 0;

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));

    // Check if leader has already created a lobby;
    connection.query("SELECT * FROM tournaments WHERE tournament_leader = ?", [leader], function (err, data, fields) {
      if (err) logger.error(new Error(err));
      if (data.length <= 0) {

        var code = codeGen();

        var pass = null;
        if (open == 0) pass = codeGen(6);

        connection.query(
          "INSERT INTO tournaments (tournament_code, tournament_name, tournament_desc, tournament_leader, tournament_cTime, tournament_open, tournament_region, tournament_pass, tournament_status, tournament_game, tournament_type, tournament_skill) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [code, name, desc, leader, new Date(), open, region, pass, 'WAITING', game, type, skill],
          function (err, data, fields) {
            if (err) logger.error(new Error(err));

            // Tournament leader don't have to join the tournament

            res.redirect('/tournament?code=' + code);
          });
      } else {
        logger.warn(`${req.ip} has already created a tournament.`);
        res.send("You have already created a tournament!");
      }
    });
  });
}

exports.profile = function(req, res){
  logger.info(`${req.ip} is requesting the tournament profile page.`);

  var logged;
  var verify = req.session.verify;
  var acid = req.session.acid;
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

  // Query for that tourn' information
  var tournCode = req.query.code;

  // Object obtained from the query
  var tournInfo = {};
  var tree = [];
  var players = [];
  var participations;

  req.getConnection(function (err, connection) {
    if(err) logger.error(new Error(err));
    connection.query('SELECT * FROM tournaments, accounts WHERE accounts.id = tournaments.tournament_leader AND tournaments.tournament_code = ?',
    [tournCode], function (err, data, fields) {
      if(err) logger.error(new Error(err));
      if(data.length > 0){

        // Get max climb and max bracket
        var max_climb = data[0].max_climb;
        var max_bracket = data[0].max_bracket;

        if(acid == data[0].tournament_leader) leader = 1;
        
        // Check if joined
        connection.query('SELECT * FROM tournaments_tree WHERE tournament_code = ? AND id = ?',
        [tournCode, acid ], function (err, data2, fields) {
          if(err) logger.error(new Error(err));
          if(data2.length > 0) joined = 1;

          // Get player count
          connection.query('SELECT * FROM tournaments_tree WHERE tournament_code = ?',
          [tournCode], function (err, data3, fields) {
            if(err) logger.error(new Error(err));
            participations = data3.length;
            
            // Process tournament tree
            connection.query('SELECT tournaments_tree.id, climb, bracket, matchpoint, username, sitename, pimage FROM tournaments_tree, accounts WHERE tournaments_tree.id = accounts.id AND tournament_code = ? ORDER BY climb ASC, bracket ASC',
            [tournCode], function (err, data4, fields) {
              if (err) logger.error(new Error(err));

              var tempClimb = 1, tempBracket = 1;
              var climbObj = [];
             
              for(var i = 0; i < data4.length; i++){
                var bracketObj = {};
                if(data4[i].climb == tempClimb){
                  bracketObj = {
                    id: data4[i].id,
                    climb: data4[i].climb,
                    bracket: data4[i].bracket,
                    username: data4[i].username,
                    sitename: data4[i].sitename,
                    pimage: data4[i].pimage,
                    matchpoint: data4[i].matchpoint
                  };
                }else{
                  tempClimb++;
                  bracketObj = {
                    id: data4[i].id,
                    climb: data4[i].climb,
                    bracket: data4[i].bracket,
                    username: data4[i].username,
                    sitename: data4[i].sitename,
                    pimage: data4[i].pimage,
                    matchpoint: data4[i].matchpoint
                  };
                }
                climbObj.push(bracketObj);
              }
              tree.push(climbObj);
              //console.log(tree);

              
              res.render('tourn', {
                logged,
                code: data[0].tournament_code,
                name: data[0].tournament_name,
                desc: data[0].tournament_desc,
                status: data[0].tournament_status,
                region: data[0].tournament_region,
                game: data[0].tournament_game,
                type: data[0].tournament_type,
                skill: data[0].tournament_skill,
                participations,
                authname,
                leader,
                joined,
                tournInfo,
                tree,
                max_climb,
                max_bracket,
                players
              });
            });

          });
        });
      } else {
        logger.error('404: ' + req.url + ' - ' + req.ip);
        return res.sendFile(path.join(__dirname, "..", 'www/error/404.html'));
      };
    });
  });
}

exports.join = function(req, res){
  logger.info(`${req.ip} is requesting to join a tournament.`);

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
    res.send("Please login to create or join a tournament!");
  }

  // Check if player is already in the tournament
  var code = req.body.tournament_code;
  var acid = req.session.acid;

  req.getConnection(function (err, connection) {
    if(err) logger.error(new Error(err));
    connection.query('SELECT * FROM tournaments_tree WHERE tournament_code = ? AND id = ?',
    [code, acid],function(err, data, fields){
      if(err) logger.error(new Error(err));
      if(data.length > 0){
        logger.warn(`${req.ip} is already in the tournament.`);
        res.send("You are already in the tournament!");
      } else {
        // Insert player into the tournament
        connection.query('INSERT INTO tournaments_tree (tournament_code, id, climb, bracket, matchpoint) VALUES (?, ?, ?, ?, ?)',
        [code, acid, null, null, 0], function(err, data, fields){
          if(err) logger.error(new Error(err));
          res.redirect('/tournament?code=' + code);
        });
      }
    });
  });
};

exports.leaving = function(req, res){
  logger.info(`${req.ip} is requesting to leave a tournament.`);

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
    res.send("Please login to create or join a tournament!");
  }

  var code = req.body.tournament_code;
  var acid = req.session.acid;

   req.getConnection(function (err, connection) {
     if (err) logger.error(new Error(err));
     connection.query('DELETE FROM tournaments_tree WHERE tournament_code = ? AND id = ?',
       [code, acid],
       function (err, data, fields) {
         if (err) logger.error(new Error(err));
         res.redirect('/tournaments');
       });
   });
};

exports.close = function(req, res){
  logger.info(`${req.ip} is requesting to close a tournament.`);
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
    res.send("Please login to create or join a tournament!");
  }

  var code = req.body.tournament_code;
  
  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('DELETE FROM tournaments WHERE tournament_code = ?',
    [code], function (err, data, fields) {
      if (err) logger.error(new Error(err));
      res.redirect('/tournaments');
    });
  });
};

exports.start = function(req, res){
  logger.info(`${req.ip} is requesting to start a tournament.`);
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
    res.send("Please login to create or join a tournament!");
  }
 
  var code = req.body.tournament_code;
  var count = req.body.participations;

  // Calculate max climb and bracket including to count
  var maxClimb, maxBracket;
  function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
  }

  // Nearest 2 Exponent-Modulus
  function n2E(count) {
    var n = 1;
    var constant = 2 ** n;
    while (count > constant) {
      n++;
      constant = 2 ** (n);
    }
    return constant;
  }

  // Scale up count to next-highest 2-exponent-modulus
  function treeCal(count) {
    max = n2E(count);
    return getBaseLog(2, max);
  }

  maxClimb = treeCal(count);
  maxBracket = 2 ** (maxClimb - 1);

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('UPDATE tournaments SET tournament_status = ?, max_climb = ?, max_bracket = ? WHERE tournament_code = ?',
    ['ON-GOING', maxClimb, maxBracket, code], function (err, data, fields) {
      if (err) logger.error(new Error(err));
      
      // Get all signed up players and assign them climb and bracket
      connection.query('SELECT * FROM tournaments_tree WHERE tournament_code = ?',
      [code], function (err, data, fields) {
        if (err) logger.error(new Error(err));
        for(let x = 1; x < maxBracket+1; x+2){
          var constantBracket = x;
          for (i = 0; i <= 2; i++) {
            try {
              connection.query('UPDATE tournaments_tree SET climb = ?, bracket = ? WHERE tournament_code = ? AND id = ?',
                [maxClimb, constantBracket, code, data[x - 1].id],
                function (err, data, fields) {});
            } catch (err) {
              connection.query('UPDATE tournaments_tree SET climb = ?, bracket = ? WHERE tournament_code = ? AND id = ?',
                [maxClimb, constantBracket, code, null],
                function (err, data, fields) {});
            }
            x++;
          }

        };
        res.redirect('/tournament?code=' + code);
      });

    });
  });
};

exports.end = function(req, res){
  logger.info(`${req.ip} is requesting to start a tournament.`);
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
    res.send("Please login to create or join a tournament!");
  }

  var code = req.body.tournament_code;

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('UPDATE tournaments SET tournament_status = ? WHERE tournament_code = ?',
    ['ENDED', code], function (err, data, fields) {
      if (err) logger.error(new Error(err));
      res.redirect('/tournament?code=' + code);
    });
  });
};

exports.advance = function(req, res){
  logger.info(`${req.ip} is requesting to edit a bracket.`);
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
    res.send("Please login to create or join a tournament!");
  }
  
  var code = req.body.tournament_code;
  var bracket = req.body.bracket;
  var climb = req.body.climb;
  var matchpoints = (req.body.matchpoints).split('-');

  req.getConnection(function (err, connection) {
    if (err) logger.error(new Error(err));
    connection.query('SELECT * FROM tournaments_tree WHERE tournament_code = ? AND bracket = ? AND climb = ?',
    [code, bracket, climb], function (err, data, fields) {
      if (err) logger.error(new Error(err));
      for(i in data){
        connection.query('UPDATE tournaments_tree SET matchpoint = ? WHERE tournament_code = ? AND id = ?',
        [matchpoints[i], code, data[i].id], function (err, data2, fields) {
        });
      }
      res.redirect('/tournament?code=' + code);
    });
  });

};

exports.delete = function (connection, data) {
  logger.debug('Running Tournament Deletion Cron Job');
  for (let i in data) {
    var timeA = moment(data[0].tournament_cTime);
    var timeB = moment(Date.now());
    var diff = timeB.diff(timeA, 'minutes');
    if (diff >= 1440 && data[i].tournament_status == "ENDED") {
      logger.debug('Deleting Tournament: ' + data[i].tournament_code);
      connection.query('UPDATE account_compliments SET tourn_complete = tourn_complete + 1 WHERE id IN (SELECT id FROM tournaments_tree WHERE tournament_code = ?)',
        [data[i].tournament_code],
        function (err, row, fields) {
          if (err) logger.error(new Error(err));
          connection.query('DELETE FROM tournaments WHERE tournament_code = ?',
            [data[i].tournament_code],
            function (err, row, fields) {
              if (err) logger.error(new Error(err));
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