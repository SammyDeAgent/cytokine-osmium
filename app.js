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
	res.sendFile(path.join(__dirname,'www/home.html'));
});

app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

app.get('/query', exspell.list);
app.post('/spells/create', function(req, res, next){
	const details = req.body;
	var sql = "INSERT INTO ex_spell (spell_code, spell_name, spell_type, spell_desc, author) VALUES ('"+details.spellCode+"','"+details.spellName+"','"+details.spellType+"','"+details.spellDesc+"','"+details.spellAuthor+"')";
	req.getConnection(function(err, connection){
		connection.query(sql, details, function(err, data){
			if (err) throw err;
				console.log("Record inserted successfully.");
		});
	});
	res.redirect('/query');
});

app.listen(port);

module.exports = app;