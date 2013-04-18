var connect = require('connect'),
	http = require('http'),
	app = http.createServer(connect().use(connect.static(__dirname+'/static'))),
	io = require('socket.io').listen(app),
	fs = require('fs'),
	repl = require('repl');

var libClient = require('./client'),
	xmpp = require('./xmpp');

io.set('log level', 1);
app.listen(80);

io.sockets.on('connection', function(socket) {
	var c = new libClient.Client(socket);
});

xmpp.init(libClient,[]);

var sh = repl.start("master >");
sh.context.reloadAll = libClient.reloadAll;
sh.context.make = libClient.make;
sh.context.sendAll = libClient.sendAll;
sh.context.io = io;
sh.context.clients = libClient.clients;
sh.context.auths = libClient.auths;
