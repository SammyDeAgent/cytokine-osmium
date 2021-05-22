import { createServer } from 'http';
import { readFileSync } from 'fs';
const hostname = 'localhost';

const port = 8080;
var html;

const server = createServer((req, res) => {
	if(req.url === "/"){
		res.statusCode = 200;
  		res.setHeader('Content-Type', 'text/html');
  		html = readFileSync('www/home.html');
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