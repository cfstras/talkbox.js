
function Client(clientHandler, socket) {
	this.clientHandler = clientHandler;
	
	this.sock = socket;
	
	this.sock.on('auth', this.handleAuth.bind(this));
	this.sock.on('msg', clientHandler.receive.bind(clientHandler,this));
	this.sock.on('disconnect', clientHandler.disconnect.bind(clientHandler,this));
}

Client.prototype.send = function(msg) {
	this.sock.emit(msg.type, msg);
};

Client.prototype.handleAuth = function(data) {
	this.clientHandler.auth(this, data.uid, data.secret, data.name);
};

module.exports.Client = Client;
module.exports.init = function(io, clientHandler) {
	io.sockets.on('connection', function(socket) {
		new Client(clientHandler, socket);
	});
}

