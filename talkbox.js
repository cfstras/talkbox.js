var connect = require('connect'),
	http = require('http'),
	app = http.createServer(connect().use(connect.static(__dirname+'/static'))),
	io = require('socket.io').listen(app),
    fs = require('fs'),
    repl = require('repl'),
    crypto = require('crypto'),
	check = require('validator').check,
    sanitize = require('validator').sanitize;
	
var Client = require('client.js');

io.set('log level', 1);
app.listen(80);

var name_regex = /^[A-Za-zäöü0-9-_\.:]{3,20}$/;
var name_symbols = 'A-Z a-z äöü 0-9-_\.:';
var name_minLen = 3;
var name_maxLen = 20;

var clients = [];
var auths = [];

io.sockets.on('connection', Client);

var makeMsg = function(client, data) {
	if (!data || !data.text) return undefined;
	
	return m = {
		id: client.id,
		name: client.name,
		text: sanitize(data.text.trim())
			.escape()
			.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
		date: new Date(),
	};
};

var addr2string = function(addr) {
	return addr.address+':'+addr.port;
};

var reloadAll = function() {
	sendAll('reload', {});
};

var sh = repl.start("master >");
sh.context.reloadAll = reloadAll;
sh.context.makeMsg = makeMsg;
sh.context.sendAll = sendAll;
sh.context.io = io;
sh.context.clients = clients;

