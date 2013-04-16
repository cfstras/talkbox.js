var connect = require('connect'),
	http = require('http'),
	app = http.createServer(connect().use(connect.static(
		__dirname+'/static',
		{redirect: true, maxAge: 1000}))),
	io = require('socket.io').listen(app),
	fs = require('fs'),
	repl = require('repl');

var libClient = require('./client');

io.set('log level', 1);
app.listen(80);

io.sockets.on('connection', function(socket) {
	new libClient.Client(socket);
});

var sh = repl.start("master >");
sh.context.reloadAll = libClient.reloadAll;
sh.context.make = libClient.make;
sh.context.sendAll = libClient.sendAll;
sh.context.io = io;
sh.context.clients = libClient.clients;
sh.context.auths = libClient.auths;
