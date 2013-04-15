var connect = require('connect'),
	http = require('http'),
	app = http.createServer(connect().use(connect.static(__dirname+'/static'))),
	io = require('socket.io').listen(app),
    fs = require('fs'),
    repl = require('repl'),
    crypto = require('crypto'),
	check = require('validator').check,
    sanitize = require('validator').sanitize

io.set('log level', 1);
app.listen(80);

var name_regex = /^[A-Za-zäöü0-9-_\.:]{3,20}$/;
var name_symbols = 'A-Z a-z äöü 0-9-_\.:';
var name_minLen = 3;
var name_maxLen = 20;

var clients = [];
var auths = [];

io.sockets.on('connection', function (socket) {
	console.info('incoming connection from '
		+ addr2string(socket.handshake.address));
	var client = {
		id: socket.id,
		sock: socket,
		name: "unnamed_user_"+(Math.floor(Math.random()*1000))};
	socket.on('auth', function(data) {
		if(!data.secret) {
			newAuth(client, socket);
		} else {
			client.name = data.name;
			var auth = findId(auths, data.secret);
			if(auth != null) {
				client.name = data.name;
				auth.name = data.name;
				welcome(client, auth, socket);
			} else {
				console.info('auth '+data.secret.substring(0,7)
				 + '.. for user '+data.name+' not found');
				newAuth(client, socket)
			}
		}
	});
	socket.on('msg', function(data) {
		var message = makeMsg(client, data);
		if(!message) {
			socket.emit('msg', {name: 'server', server:true,
				text: 'Invalid Message.'});
		} else {
			sendAll('msg',message);
		}
	});
	
	socket.on('ren', function(data) {
		if(!data.name) {
			socket.emit('msg', {name: 'server', server:true,
				text: 'Invalid Message.'});
			return;
		}
		data.name = data.name.trim()
			.replace(/<.*>/gm,"");
		if(name_regex.test(data.name)) {
			var old = client.name;
			console.info('user rename: '+old+' -> '+data.name);
			client.name = data.name;
			client.auth.name = client.name;
			if(client.auth != null) {
				sendAll('ren', {
					id: client.id,
					name: client.name,
					msg: {
						type: 'ren',
						name: 'server',
						server: true,
						text: old + ' is now known as '
							+ client.name,
						date: new Date()
					}
				});
			}
		} else {
			socket.emit('err', {
				type: 'name',
				text: 'Invalid nickname format, allowed symbols: '
				+ '<pre>'+name_symbols+'</pre>, length '+name_minLen+' - '+name_maxLen,
				date: new Date()
			});
		}
	});
	socket.on('disconnect', function() {
		console.info('disconnect: from '
			+ addr2string(socket.handshake.address));
		var i = clients.indexOf(client)
		if(i != -1) {
			clients.splice(i,1)
			sendAll('msg',{
				text: 'user ' + client.name
				+ ' left channel.',
				name: 'server',
				server: true,
				date: new Date()});
			sendAll('userleave', {
				id: client.id,
				name: client.name});
		} // else: he was not authed.
	});
	
});

var newAuth = function(client, socket) {
	crypto.randomBytes(48, function(ex, buf) {
		var sec = buf.toString('hex');
		var auth = {
			id: sec,
			name: client.name
		};
		console.info('user '+auth.name
			+ ' gets new auth ' + sec.substring(0,7) + '..');
		auths.push(auth);
		welcome(client, auth, socket);
	});
};

var welcome = function(client, auth, socket) {
	sendAll('userjoin',prepareUserToSend(client));
	auth.login = new Date();
	client.auth = auth;
	clients.push(client);
	console.info('user '+auth.name+' joined from '
		+ addr2string(socket.handshake.address));
	socket.emit('welcome', {
		id: socket.id,
		secret: auth.id,
		name: auth.name
	});
	socket.emit('msg', {
		text: 'welcome, ' + auth.name
		+ '! To change your nick, use /nick thisIsANewNickname',
		name: 'server',
		server: true,
		date: new Date()});
	sendAll('msg',{
		text: 'user ' + client.name
		+ ' joined channel.',
		name: 'server',
		server: true,
		date: new Date()});
	socket.emit('userlist',makeUserlist());
}

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

var sendAll = function(type, message) {
	for(i in clients) {
		clients[i].sock.emit(type, message);
	}
}
var makeUserlist = function() {
	var list = [];
	for(i in clients) {
		list.push(prepareUserToSend(clients[i]));
	}
	return list;
}
var prepareUserToSend = function(client) {
	return {
		id: client.id,
		name: client.name};
};

var sendUserlist = function(socket) {
	clients[i].sock.emit('userlist', makeUserlist());
};

var findId = function(arr,id) {
	for(i in arr) {
		if(id == arr[i].id) {
			return arr[i];
		}
	}
	return null;
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

