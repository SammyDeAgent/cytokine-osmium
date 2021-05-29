// Module Imports
const express = require('express');
const session = require('express-session');
const favicon = require('serve-favicon');
const path = require('path');

// App initialization
const app = express();
app.use(session({
	secret: 'cyto osmium',
	resave: true,
	saveUninitialized: true
}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
const port = process.env.PORT || 4200;

// SQL Connection
const mysql = require('mysql2');
const connection = require('express-myconnection'),
dbOptions = {
	host: "localhost",
	user: "root",
	password: "Sql_osmium576",
	database: "osmium"
};
app.use(connection(mysql, dbOptions, 'request'));

// Routes
var exspell = require('./routes/spells');
var login = require('./routes/auth/login');
var logout = require('./routes/auth/logout');
var index = require('./routes/index');

app.use(express.static('public'));

// View engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Servers
app.get('/', index.list);

app.get('/login', function(req, res){
	res.sendFile(path.join(__dirname,'www/login.html'));
});
app.post('/login', login.auth);
app.get('/logout', logout.auth);


app.get('/debug', function(req,res){
	res.sendFile(path.join(__dirname,'www/debug.html'));
});

app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

app.get('/query', exspell.list);
app.post('/spells/create', exspell.create);

app.listen(port);

module.exports = app;