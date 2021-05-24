const express = require('express');
const path = require('path');

const mysql = require('mysql');
const con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "Sql_osmium576",
	database: "osmium"
});
con.connect(function(err){
	if(err) console.log("Oops...");
	console.log("Connection established.");
});

// var testtable = require('./routes/testtable');

const app = express();
const port = process.env.PORT || 4200;

app.use(express.static('public'));
// app.set('views', __dirname + '/views');

// app.set('view engine', 'ejs');

app.get('/', function(req,res){
	res.sendFile(path.join(__dirname,'www/home.html'));
});

app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

// app.get('/query', testtable.list);

// app.use(app.router);

app.listen(port);

module.exports = app;