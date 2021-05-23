const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 4200;

app.use(express.static('public'));

// Redirect http to https
app.use(function(req,res){
	if(!req.secure){
		res.redirect("https://"+req.headers.host+req.url);
	}
});

app.get('/', function(req,res){
	res.sendFile(path.join(__dirname,'www/home.html'));
});

app.get('/default', function(req,res){
	res.sendFile(path.join(__dirname,'www/default.html'));
});

app.listen(port);