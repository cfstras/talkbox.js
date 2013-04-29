var marked = require('marked'),
	base64id = require('base64id');

var color = require('./color'),
	Make = require('./make');

var name_regex = /^[A-Za-zäöü0-9-_\.	]{3,30}$/;
var name_symbols = 'A-Z a-z äöü 0-9 - _ \.';
var name_minLen = 3;
var name_maxLen = 30;

function ClientHandler(settings) {
	this.make = new Make(this.clients);
	this.clients = [];
	this.auths = [];
};

ClientHandler.prototype.receive = function(client, text) {
	if(typeof text === 'object' && typeof text.text === 'string') {
		text = text.text;
	} else if(typeof text !== 'string'){
		this.send(client, this.make.serverMsg('msg','Invalid message.'));
		return;
	}
	
	text = text.trim();
	// command evaluation
	if(text[0] === '/') {
		text = text.substring(1);
		var alias  = text.match(/(n(ick|ame)?|a(lias)?) (.+)/);
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

ClientHandler.prototype.send = function(client,msg) {
	client.send(msg);
}

ClientHandler.prototype.sendAll = function(msg) {
	for(i in this.clients) {
		this.send(this.clients[i],msg);
	}
}

ClientHandler.prototype.disconnect = function(client) {
	console.info('disconnected: ', client.name, client.id);
	var i = this.clients.indexOf(client)
	if(i != -1) {
		this.clients.splice(i,1)
		this.sendAll('userleave', {
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
	if(!secret || !uid) {
		this.newAuth(client);
		return;
	}
	var auth = this.auth[uid];
	if(!auth || auth.secret !== secret) {
		// user secret is invalid!!!
		//TODO note this in the database
		console.info('auth '+data.secret.substring(0,7)
			+ '.. for user '+data.name+' not found / invalid');
		this.newAuth(client);
		return;
	}
	if(name && this.isNameValid(name)) {
		client.name = name;
	} else {
		client.name = auth.name;
	}
	this.welcome(client);
}

ClientHandler.prototype.newAuth = function(client) {
	var uid;
	for (tries=0;
		tries<10 && (!tries || this.auths.hasOwnProperty(uid));
		tries++) {
		uid = base64id.generateId();
	}
	var auth = {
		uid: uid,
		secret: base64id.generateId()+base64id.generateId(),
		name: client.name
	};
	console.info('user', auth.name, 'gets new auth');
	this.auths[uid] = auth;
	client.auth = auth;
	this.welcome(client);
};

ClientHandler.prototype.rename = function(client, newName) {
	var newName = this.isNameValid(newName);
	if(newName === false) {
		this.send(client, this.make.serverMsg('msg','This nickname is already taken!'));
		return;
	}
	if(newName === null) {
		this.send(client,make.serverMsg('Invalid nickname format, allowed symbols: '
			+ '<pre>'+name_symbols+'</pre>, length '+name_minLen+' - '+name_maxLen));
		return;
	}
	var old = client.name;
	console.info('rename: '+old+' -> '+newName);
	client.name = newName;
	if(client.auth) {
		client.auth.name = newName;
		var renmsg = this.make.userToSend(client);
		renmsg.type = 'ren';
		this.sendAll(renmsg);
		this.sendAll(this.make.serverMsg('msg', old + ' is now known as ' + newName));
		// if there is no auth object, he isn't logged in
		// --> no need to inform others
	}
};

// Checks if a given name is valid and allowed.
// returns one of these:
//	null for an invalid name
//	false for a name that is alreay taken
//	a string containing the valid name
ClientHandler.prototype.isNameValid = function(name) {
	name = name.trim();
	if(!name) {
		return null;
	}
	if(this.getUserByName(name)) {
		return false;
	}
	if(name !== "server" && name_regex.test(name)) {
		return name;
	}
	return null;
};

ClientHandler.prototype.welcome = function(client) {
	client.color = color.genColor();
	if(!client.name) client.name = "unnamed_"+(Math.floor(Math.random()*10000));
	client.uid = client.auth.uid;
	
	var join = this.make.userToSend(client)
	join.type = 'userjoin';
	this.sendAll(join);
	
	client.auth.login = new Date();
	this.clients.push(client);
	console.info('join:',client.name, client.uid);
	
	var welcome = this.make.userToSend(client);
	welcome.secret = client.auth.secret;
	welcome.uid = client.uid;
	welcome.type = 'welcome';
	this.send(client,welcome);
	
	this.send(client, this.make.serverMsg('msg',
		'welcome, ' + client.name + '! To change your nick, use'
		+ ' /nick thisIsANewNickname'));
	
	this.sendUserlist(client);
};

ClientHandler.prototype.getUserByName = function(name) {
	for(i in this.clients) {
		if(this.clients[i].name === name)
			return this.clients[i];
	}
	return null;
}

ClientHandler.prototype.reloadAll = function() {
	this.sendAll({type: 'reload'});
};

module.exports = ClientHandler;
