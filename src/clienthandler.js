var marked = require('marked'),
	base64id = require('base64id');

var color = require('./color'),
	Make = require('./make');

var name_regex = /^[A-Za-zäöü0-9-_\.	]{3,30}$/;
var name_symbols = 'A-Z a-z äöü 0-9 - _ \.';
var name_minLen = 3;
var name_maxLen = 30;

//TODO UIDS!

function ClientHandler(settings) {
	this.make = new Make(this.clients);
	this.clients = [];
	this.auths = [];
};

ClientHandler.prototype.receive(client,text) {
	if (text === undefined) {
		this.send(client, this.make.serverMsg('msg','Invalid message.'));
		return;
	}
	text = text.trim();
	// command evaluation
	if(text[0] === '/') {
		text = text.substring(1);
		var alias  = text.match(/(n(ick|ame)?|a(lias)?) (.*)/);
		if(alias) {
			this.rename(client,alias[4]);
			return;
		}
		//TODO insert more commands here
		this.make.serverMsg('msg','Invalid command.')
		return;
	}
	
	// empty markup
	if(!marked(text))
		return false;
	
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

ClientHandler.prototype.auth = function(client, uid, secret, name) {
	if(!secret) {
		this.newAuth(client);
		return;
	}
	client.name = data.name;
	self.auth = findId(auths,secret); //TODO
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

ClientHandler.prototype.newAuth = function(client) {
	var uid;
	do {
		uid = base64id.generateId();
	} while (!this.auths.hasOwnProperty(uid));
	var auth = {
		uid: uid,
		secret = base64id.generateId()+base64id.generateId(),
		name: client.name
	};
	console.info('user', auth.name, 'gets new auth');
	this.auths[uid] = auth;
	client.auth = auth;
	this.welcome(client);
};

ClientHandler.prototype.rename = function(client, newName) {
	if(!newName) {
		this.send(client, make.serverMsg('msg','Invalid Message.'));
		return;
	}
	newName = newName.trim();
	if(this.getUserByName(newName)) {
		this.send(client, make.serverMsg('msg','This nickname is already taken!'));
		return;
	}
	if(name_regex.test(newName) && newName !== "server") {
		var old = client.name;
		console.info('rename: '+old+' -> '+newName);
		client.name = newName;
		if(client.auth) {
			client.auth.name = newName;
			this.sendAll('ren', make.userToSend(client));
			this.sendAll(make.serverMsg('msg', old + ' is now known as ' + newName));
			// if there is no auth object, he isn't logged in
			// --> no need to inform others
		}
	} else {
		this.send(client,make.serverMsg('Invalid nickname format, allowed symbols: '
			+ '<pre>'+name_symbols+'</pre>, length '+name_minLen+' - '+name_maxLen);
	}
};

ClientHandler.prototype.welcome = function(client) {
	var join = this.make.userToSend(client)
	join.type = 'userjoin';
	this.sendAll(join);
	
	client.auth.login = new Date();
	this.clients.push(client);
	console.info('join:',client);
	
	var welcome = this.make.userToSend(client);
	welcome.secret = client.auth.secret;
	welcome.type = 'welcome';
	this.send(client,welcome);
	
	this.send(client, this.serverMsg('msg',
		'welcome, ' + client.name + '! To change your nick, use'
		+ ' /nick thisIsANewNickname'));
	
	this.sendUserlist(client);
};

ClientHandler.prototype.getUserByName = function(name) {
	for(i in clients) {
		if(clients[i].name === name)
			return clients[i];
	}
	return null;
}

