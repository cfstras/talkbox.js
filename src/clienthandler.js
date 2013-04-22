var marked = require('marked');

var color = require('./color'),
	Make = require('./make');

var name_regex = /^[A-Za-zäöü0-9-_\.	]{3,30}$/;
var name_symbols = 'A-Z a-z äöü 0-9 - _ \.';
var name_minLen = 3;
var name_maxLen = 30;

//TODO UIDS!

function ClientHandler(settings) {
	// binds to export functions
	this.receive = this.receive.bind(this);
	this.send = this.send.bind(this);
	this.sendAll = this.sendAll.bind(this);
	this.disconnect = this.disconnect.bind(this);
	this.sendUserlist = this.sendUserlist.bind(this);
	
	this.make = new Make(this.clients);
	this.clients = [];
	this.auths = [];
};

ClientHandler.prototype.receive(client,text) {
	if (text === undefined) {
		this.send(client, this.make.serverMsg('msg','Invalid Message.'));
		return;
	}
	if(!marked(text))
		return false;
	text = text.trim();
	var msg = {
		type: 'msg',
		uid: client.uid,
		name: client.name,
		text: text,
		date: new Date(),
	};
	this.sendAll(msg);
}

ClientHandler.prototype.send(client,msg) {
	client.send(msg);
}

ClientHandler.prototype.sendAll(msg) {
	for(i in clients) {
		this.send(clients[i],msg);
	}
}

ClientHandler.prototype.disconnect(client) {
	console.info('disconnected: ',client);
	var i = this.clients.indexOf(client)
	if(i != -1) {
		clients.splice(i,1)
		sendAll('userleave', {
			uid: client.uid,
			name: client.name
		});
	} // else: he was not logged in.
}

ClientHandler.prototype.sendUserlist = function(client) {
	var func = client ? this.send.bind(this,client) : this.sendAll;
	func(this.make.userlist());
}


