var crypto = require('crypto'),
	check = require('validator').check;
	

var Make = require('./make');
var make = new Make(clients);
var color = require('./color');

function Client(clienthandler, socket) {
	this.send = this.send.bind(this);
	this.handleDisconnect = this.handleDisconnect.bind(this);
	var self = this;
	this.clienthandler = clienthandler;
	
	this.handleMsg = function(data) {
		clienthandler.handleMsg(this,data.text);
	}.bind(this);
	
	this.handleRen = function(data) {
		if(!data.name) {
			self.sock.emit('msg', make.serverMsg('msg','Invalid Message.'));
			return;
		}
		data.name = data.name.trim();
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
		this.clientHandler.disconnect(this);
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

Client.prototype.send = function(msg) {
	this.sock.emit(msg.type, msg);
};

var sendDisconnectMsg = function(id, name) {
	
};

var reloadAll = function() {
	sendAll('reload', {});
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

