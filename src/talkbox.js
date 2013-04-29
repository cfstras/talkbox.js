var connect = require('connect'),
	http = require('http'),
	app = http.createServer(connect().use(connect.static(
		__dirname+'/../static',
		{redirect: true, maxAge: 1000}))),
	io = require('socket.io').listen(app),
	fs = require('fs'),
	repl = require('repl');

var settings = require('./settings'),
	ClientHandler = require('./clientHandler');
	webClient = require('./webClient'),
	XMPP = require('./xmpp');

io.set('log level', 1);
app.listen(80);

var sh = repl.start("talkbox >");
sh.context.io = io;
sh.context.settings = settings;
sh.context.XMPP = XMPP;

var clientHandler = new ClientHandler(settings);
webClient.init(io,clientHandler);

sh.context.clients = clientHandler.clients;
sh.context.auths = clientHandler.auths;
sh.context.reloadAll = clientHandler.reloadAll.bind(clientHandler);
sh.context.sendAll = clientHandler.sendAll.bind(clientHandler);
sh.context.make = clientHandler.make;

//var xmppClient = new XMPP(clientHandler,settings);

//sh.context.xmppClient = xmppClient;

