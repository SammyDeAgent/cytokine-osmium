// Module Imports
const express = require('express');
const path = require('path');

// App initialization
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
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

app.use(express.static('public'));

// View engine setup
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Servers
app.get('/', function(req,res){
	res.sendFile(path.join(__dirname,'www/index.html'));
});

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