// const http = require('http');
// const fs = require('fs');
// const hostname = 'localhost';

// const port = 4200;
// var html;

// const server = http.createServer((req, res) => {
// 	if(req.url === "/"){
// 		res.statusCode = 200;
//   		res.setHeader('Content-Type', 'text/html');
//   		html = fs.readFileSync('www/home.html');
//   		res.write(html);
//   		res.end();
// 	}else {
// 		res.statusCode = 404;
// 		res.end("<html><body><title>Osmium 404</title><h1>Error 404: Osmium Unknown Directive</h1></body></html>");
// 	}
// });

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 4200;

app.use(express.static('public'));

app.get('/', function(req,res){
	res.sendFile(path.join(__dirname,'www/home.html'));
});

app.listen(port);