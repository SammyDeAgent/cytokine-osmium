// Module Imports
const express = require('express');
// const router = express.Router({strict: true});
const session = require('express-session');
const busboy = require('connect-busboy');
// const Busboy = require('busboy');
// const multer = require('multer');
// const pFile = multer({dest: __dirname + '/public/user_pic'});
const fs = require('fs');
const fileUpload = require('express-fileupload');
const MySQLStore = require('express-mysql-session')(session);
const favicon = require('serve-favicon');
const path = require('path');
const slashes = require("connect-slashes"); //Eliminates trailing slashs
const cron = require('node-cron');

require('dotenv').config();

// Logger Module
const logger = require('./log')('Controller');

// SQL Connection
const mysql = require('mysql2');
const connection = require('express-myconnection'),
dbOptions = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_SCHEMA
};

// App initialization and Session
const app = express();
app.set('trust proxy', true);
app.use(connection(mysql, dbOptions, 'request'));
const sessionStore = new MySQLStore(dbOptions);
app.use(session({
	secret:				process.env.SESSION_SECRET,
	store:				sessionStore,
	cookie: {
      					maxAge: 30 * 24 * 60 * 60 * 1000
    },
	resave:				false,
	saveUninitialized:	false
}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(busboy());
app.use(fileUpload());
const port = process.env.PORT || 4200;

// Routes
var register				= require('./routes/auth/register');
var verifydata			= require('./routes/auth/verifydata');
var login						= require('./routes/auth/login');
var logout					= require('./routes/auth/logout');

var changeSitename	= require('./routes/auth/changeSitename');
var changeStext			= require('./routes/auth/changeStext');
var changePimage		= require('./routes/auth/changePimage');

var changeTimage 		= require('./routes/auth/changeTimage');
var changeTtext			= require('./routes/auth/changeTtext');

var teams						= require('./routes/teams');
var players					= require('./routes/players');
var lobbies					= require('./routes/lobbies');
var tourns					= require('./routes/tourns');

var index						= require('./routes/index');
var profile					= require('./routes/profile');

var compVote				= require('./routes/complimentVote');

var patch						= require('./routes/patch');

var exspell					= require('./routes/test/spells');
var ajaxtest 				= require('./routes/test/ajaxtest');
const { connect } = require('http2');

app.use(express.static('public'));

app.use(slashes(false));

// View engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Robots Page
app.get('/robots.txt', function(req, res) {
	res.sendFile(path.join(__dirname, 'robots.txt'));
	logger.info(`${req.ip} is requesting the robots.txt page.`);
});

// Home page
app.get('/', index.list);

// Registration page
app.get('/register', function(req, res){
	if(!req.session.loggedin){
		res.sendFile(path.join(__dirname,'www/register.html'));
	}
	else{
		logger.error('403: Forbidden' + ' - ' + req.ip);
		return res.sendFile(path.join(__dirname,'www/error/403.html'));
	}
});
app.post('/register', register.auth);

// Email verification
app.post('/verifydata', verifydata.auth);

// Account session authentication
app.get('/login', function(req, res){
	if(!req.session.loggedin){
		res.sendFile(path.join(__dirname,'www/login.html'));
	}else{
		logger.error('403: Forbidden' + ' - ' + req.ip);
		return res.sendFile(path.join(__dirname,'www/error/403.html'));
	}
});
app.post('/login', login.auth);
app.get('/logout', logout.auth);

// Your own profile page
app.get('/profile', profile.list);

// Profile settings
app.post('/changeSitename', changeSitename.auth);
app.post('/changeStext', changeStext.auth);
app.post('/changePimage', changePimage.auth);
app.post('/resetPimage', changePimage.reset);

// Players list and searching
app.get('/players', players.list);
app.get('/player', players.profile);
app.get('/playersSearch', players.search);

// Compliments and Ratings
app.post('/upVote', compVote.upvote);
app.post('/downVote', compVote.downvote);
app.post('/resetVote', compVote.reset);

// Teams list and searching
app.get('/teams', teams.list);
app.get('/team', teams.profile);
app.get('/teamsSearch', teams.search);

// Team creation
app.post('/createTeam', teams.create);

// Team join and leave + Disband
app.post('/joinTeam', teams.joining);
app.post('/leaveTeam', teams.leaving);
app.post('/disbandTeam', teams.disbanding);

// Team Profile Settings
app.post('/changeTimage', changeTimage.auth);
app.post('/resetTimage', changeTimage.reset);
app.post('/changeTtext', changeTtext.auth);

// Lobby list and searching
app.get('/lobbies', lobbies.list);
app.get('/lobby', lobbies.profile);

// Lobby Team join and leave + Disband
app.post('/joinLobbyTeam', lobbies.joinTeam);
app.post('/leaveLobby', lobbies.leaving);
app.post('/closeLobby', lobbies.close);

// Lobby Deletion
const conn = mysql.createConnection(dbOptions);
cron.schedule('* * * * *', function() {
	conn.query('SELECT * FROM lobbies', function(err, data){
		if (err) logger.error(new Error(err));
		lobbies.delete(conn, data);
	});
});

// Lobby creation + Starting
app.post('/createLobby', lobbies.create);
app.post('/readyLobby', lobbies.readyLobby);

// Tourns List and searching
app.get('/tournaments', tourns.list);
app.get('/tournament', tourns.profile);

// Tourn join and leave + Disband
app.post('/joinTourn', tourns.join);
app.post('/leaveTourn', tourns.leaving);
app.post('/closeTourn', tourns.close);

// Tourn Deletion
const conn2 = mysql.createConnection(dbOptions);
cron.schedule('* * * * *', function () {
	conn2.query('SELECT * FROM tournaments', function (err, data) {
		if (err) logger.error(new Error(err));
		tourns.delete(conn, data);
	});
});

// Tourn creation + starting
app.post('/createTourn', tourns.create);
app.post('/startTourn', tourns.start);
app.post('/endTourn', tourns.end);
app.post('/advance',tourns.advance);

// Patch and Updates
app.get('/patch', patch.list);

// Debug page
app.get('/debug', function(req,res){
	res.sendFile(path.join(__dirname,'www/debug.html'));
});

// Default Digital Ocean page
app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

// Testing Servers
app.get('/query', exspell.list);
app.post('/spells/create', exspell.create);

app.get('/ajaxtest',ajaxtest.init);
app.post('/ajaxtest',ajaxtest.search);

// Error Handling
app.get('*', function(req, res, next) {
  res.status(404);
  res.sendFile(path.join(__dirname,'www/error/404.html'));
	logger.error('404: ' + req.url + ' - ' + req.ip);
});

app.listen(port, function(){
	logger.info('Server started on port ' + port);
});

module.exports = app;