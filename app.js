const http = require('http');
const fs = require('fs');
const hostname = 'localhost';

const port = 8080;
var html;

const server = http.createServer((req, res) => {
	if(req.url === "/"){
		res.statusCode = 200;
  		res.setHeader('Content-Type', 'text/html');
  		html = fs.readFileSync('www/home.html');
  		res.write(html);
  		res.end();
	}else {
		res.statusCode = 404;
		res.end("<html><body><title>Osmium 404</title><h1>Error 404: Osmium Unknown Directive</h1></body></html>");
	}
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});