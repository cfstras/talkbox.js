var crypto = require('crypto'),
	check = require('validator').check;
	
var clients = [];
var auths = [];

var Make = require('./make');
var make = new Make(clients);
var color = require('./color');

var name_regex = /^[A-Za-zäöü0-9-_\.	]{3,30}$/;
var name_symbols = 'A-Z a-z äöü 0-9 - _ \.';
var name_minLen = 3;
var name_maxLen = 30;

function Client(socket) {
	var self = this;
	this.handleMsg = function(data) {
		var message = make.msg(self, data);
		if(message === undefined) {
			self.sock.emit('msg', make.serverMsg('msg','Invalid Message.'));
		} else if(message === false) {
			return;
		} else {
			sendAll('msg',message);
		}
	};
	this.handleRen = function(data) {
		if(!data.name) {
			self.sock.emit('msg', make.serverMsg('msg','Invalid Message.'));
			return;
		}
		data.name = data.name.trim()
			.replace(/<.*>/gm,"");
		if(userExists(data.name)) {
			self.sock.emit('err', {
				type: 'name',
				text: 'This nickname is already taken!',
				date: new Date()
			});
		} else {
			if(name_regex.test(data.name) && data.name !== "server") {
				var old = self.name;
				console.info('user rename: '+old+' -> '+data.name);
				self.name = data.name;
				if(self.auth) {
					self.auth.name = self.name;
					sendAll('ren', {
						id: self.id,
						name: self.name,
						msg: make.serverMsg('ren',
							old + ' is now known as '
								+ self.name),
						});
					// if there is no auth object, he isn't logged in
					// --> no need to inform others
				}
			} else {
				self.sock.emit('err', {
					type: 'name',
					text: 'Invalid nickname format, allowed symbols: '
					+ '<pre>'+name_symbols+'</pre>, length '+name_minLen+' - '+name_maxLen,
					date: new Date()
				});
			}
		}
	};
	this.handleAuth = function(data) {
		if(!data.secret) {
			self.newAuth();
		} else {
			self.name = data.name;
			self.auth = findId(auths,data.secret);
			if(self.auth) {
				//TODO check if username is valid
				self.name = data.name;
				self.auth.name = data.name;
				self.welcome();
			} else {
				console.info('auth '+data.secret.substring(0,7)
				 + '.. for user '+data.name+' not found');
				self.newAuth();
			}
		}
	};
	this.handleDisconnect = function() {
		console.info('disconnect: from '
			+ addr2string(self.sock.handshake.address));
		var i = clients.indexOf(self)
		if(i != -1) {
			clients.splice(i,1)
			sendDisconnectMsg(self.id, self.name);
		} // else: he was not logged in.
	};
	this.welcome = function() {
		sendAll('userjoin',make.userToSend(self));
		self.auth.login = new Date();
		clients.push(self);
		console.info('user '+self.auth.name+' joined from '
			+ addr2string(self.sock.handshake.address));
		self.sock.emit('welcome', {
			id: self.sock.id,
			secret: self.auth.id,
			name: self.auth.name
		});
		self.sock.emit('msg', {
			text: 'welcome, ' + self.auth.name
			+ '! To change your nick, use /nick thisIsANewNickname',
			name: 'server',
			server: true,
			date: new Date()});
		self.sock.emit('userlist',make.userlist());
	};
	this.newAuth = function() {
		crypto.randomBytes(48, function(ex, buf) {
			var sec = buf.toString('hex');
			var auth = {
				id: sec,
				name: self.name
			};
			console.info('user '+auth.name
				+ ' gets new auth ' + sec.substring(0,7) + '..');
			auths.push(auth);
			self.auth = auth;
			self.welcome();
		});
	};
	this.send = function(type, message) {
		self.sock.emit(type, message);
	};
	
	console.info('incoming connection from '
		+ addr2string(socket.handshake.address));
	this.id = socket.id;
	this.sock = socket;
	this.name = "unnamed_user_"+(Math.floor(Math.random()*1000));
	this.color = color.genColor();
	var f = this.handleAuth;
	this.sock.on('auth', this.handleAuth);
	this.sock.on('msg', this.handleMsg);
	
	this.sock.on('ren', this.handleRen);
	
	this.sock.on('disconnect', this.handleDisconnect);
}

var sendAll = function(type, message) {
	clients.forEach(function(c){
		c.send(type, message);
	});
};

var sendDisconnectMsg = function(id, name) {
	sendAll('userleave', {
		id: id,
		name: name});
};

var reloadAll = function() {
	sendAll('reload', {});
};

var sendUserlist = function(socket) {
	clients[i].sock.emit('userlist', makeUserlist());
};

var findId = function(arr,id) {
	for(i in arr) {
		if(id === arr[i].id) {
			return arr[i];
		}
	}
	return null;
};

var addr2string = function(addr) {
	return addr.address+':'+addr.port;
};

var userExists = function(newname) {
	for(key in clients) {
		if(clients[key].name === newname)
			return true;
	}
	return false;
} 

module.exports.Client = Client;
module.exports.clients = clients;
module.exports.reloadAll = reloadAll;
module.exports.make = make;
module.exports.sendAll = sendAll;
module.exports.sendDisconnectMsg = sendDisconnectMsg;

