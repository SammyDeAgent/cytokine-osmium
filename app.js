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

// SQL Connection
const mysql = require('mysql2');
const connection = require('express-myconnection'),
dbOptions = {
	host: "localhost",
	user: "root",
	password: "Sql_osmium576",
	database: "osmium"
};

// App initialization and Session
const app = express();
app.use(connection(mysql, dbOptions, 'request'));
const sessionStore = new MySQLStore(dbOptions);
app.use(session({
	secret: 'cyto osmium',
	store: sessionStore,
	resave: false,
	saveUninitialized: false
}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(busboy());
app.use(fileUpload());
const port = process.env.PORT || 4200;

// Routes
var exspell = require('./routes/spells');
var register = require('./routes/auth/register');
var login = require('./routes/auth/login');
var logout = require('./routes/auth/logout');
var index = require('./routes/index');
var profile = require('./routes/profile');
var changeSitename = require('./routes/auth/changeSitename');
var changePimage = require('./routes/auth/changePimage');
var players = require('./routes/players');

app.use(express.static('public'));

app.use(slashes(false));

// View engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Servers
app.get('/', index.list);

app.get('/register', function(req, res){
	if(!req.session.loggedin){
		res.sendFile(path.join(__dirname,'www/register.html'));
	}
	else{
		res.write("You cannot register when logged in!");
		res.end();
	}
});
app.post('/register', register.auth);

app.get('/login', function(req, res){
	if(!req.session.loggedin){
		res.sendFile(path.join(__dirname,'www/login.html'));
	}else{
		res.write("You are already logged in!");
		res.end();
	}
});
app.post('/login', login.auth);
app.get('/logout', logout.auth);

app.get('/profile', profile.list);

app.post('/changeSitename', changeSitename.auth);
app.post('/changePimage', changePimage.auth);
app.post('/resetPimage', changePimage.reset);

app.get('/players', players.list);

app.get('/debug', function(req,res){
	res.sendFile(path.join(__dirname,'www/debug.html'));
});

app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

app.get('/query', exspell.list);
app.post('/spells/create', exspell.create);

app.listen(port, function(){
	console.log('App started on Port '+port);
});

module.exports = app;