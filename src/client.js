var crypto = require('crypto'),
	check = require('validator').check;
	

var Make = require('./make');
var make = new Make(clients);
var color = require('./color');

function Client(clientHandler, socket) {
	this.send = this.send.bind(this);
	this.handleAuth = this.handleAuth.bind(this);
	this.handleRen = this.handleRen.bind(this);
	this.handleMsg = this.handleMsg.bind(this);
	
	this.clientHandler = clientHandler;
	
	this.handleDisconnect = function() {
		this.clientHandler.disconnect(this);
	};
	
	console.info('incoming connection from '
		+ addr2string(socket.handshake.address));
	this.id = socket.id;
	this.sock = socket;
	this.name = "unnamed_"+(Math.floor(Math.random()*10000));
	this.color = color.genColor();
	
	this.sock.on('auth', this.handleAuth);
	this.sock.on('msg', this.handleMsg);
	this.sock.on('ren', this.handleRen);
	this.sock.on('disconnect', this.clientHandler.disconnect.bind(clientHandler,this));
}

Client.prototype.send = function(msg) {
	this.sock.emit(msg.type, msg);
};

Client.prototype.handleMsg = function(data) {
	this.clientHandler.receive(this, data.text);
};

Client.prototype.handleAuth = function(data) {
	this.clientHandler.auth(this, data.uid,data.secret, data.name);
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

