var crypto = require('crypto'),
	check = require('validator').check;
	

var Make = require('./make');
var make = new Make(clients);
var color = require('./color');

function Client(clientHandler, socket) {
	this.send = this.send.bind(this);
	this.handleDisconnect = this.handleDisconnect.bind(this);
	this.handleAuth = this.handleAuth.bind(this);
	this.handleRen = this.handleRen.bind(this);
	this.handleMsg = this.handleMsg.bind(this);
	
	this.clientHandler = clientHandler;
	
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
	
	console.info('incoming connection from '
		+ addr2string(socket.handshake.address));
	this.id = socket.id;
	this.sock = socket;
	this.name = "unnamed_user_"+(Math.floor(Math.random()*1000));
	this.color = color.genColor();
	
	this.sock.on('auth', this.handleAuth);
	this.sock.on('msg', this.handleMsg);
	this.sock.on('ren', this.handleRen);
	this.sock.on('disconnect', this.handleDisconnect);
}

Client.prototype.send = function(msg) {
	this.sock.emit(msg.type, msg);
};

Client.prototype.handleMsg = function(data) {
	this.clientHandler.handleMsg(this,data.text);
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


module.exports.Client = Client;
module.exports.clients = clients;
module.exports.reloadAll = reloadAll;
module.exports.make = make;
module.exports.sendAll = sendAll;
module.exports.sendDisconnectMsg = sendDisconnectMsg;

