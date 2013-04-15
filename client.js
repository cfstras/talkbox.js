
var clients = [];
var auth = [];

module.exports.Client = Client;
module.exports.clients = clients;

var make = require('make.js')(clients);

function Client(socket) {
	console.info('incoming connection from '
		+ addr2string(socket.handshake.address));
	this.id = socket.id;
	this.sock = socket;
	this.name = "unnamed_user_"+(Math.floor(Math.random()*1000))};
	this.sock.on('auth', function(data) {
		if(!data.secret) {
			this.newAuth();
		} else {
			this.name = data.name;
			this.auth = auths.findId(data.secret);
			if(auth) {
				//TODO check if username is valid
				this.name = data.name;
				this.auth.name = data.name;
				this.welcome();
			} else {
				console.info('auth '+data.secret.substring(0,7)
				 + '.. for user '+data.name+' not found');
				this.newAuth();
			}
		}
	});
	this.sock.on('msg', this.handleMsg);
	
	this.sock.on('ren', this.handleRen);
	
	this.sock.on('disconnect', this.handleDisconnect);
}

Client.prototype.handleMsg = function(data) {
	var message = makeMsg(this, data);
	if(!message) {
		this.sock.emit('msg', make.serverMsg('msg','Invalid Message.'));
	} else {
		sendAll('msg',message);
	}
});

Client.prototype.handleRen = function(data) {
	if(!data.name) {
		this.sock.emit('msg', make.serverMsg('msg','Invalid Message.'));
		return;
	}
	data.name = data.name.trim()
		.replace(/<.*>/gm,"");
	if(name_regex.test(data.name)) {
		var old = this.name;
		console.info('user rename: '+old+' -> '+data.name);
		this.name = data.name;
		if(this.auth) {
			this.auth.name = this.name;
			sendAll('ren', {
				id: this.id,
				name: this.name,
				msg: make.serverMsg('ren',
					old + ' is now known as '
						+ this.name),
				});
		}
	} else {
		this.sock.emit('err', {
			type: 'name',
			text: 'Invalid nickname format, allowed symbols: '
			+ '<pre>'+name_symbols+'</pre>, length '+name_minLen+' - '+name_maxLen,
			date: new Date()
		});
	}
});

Client.prototype.handleDisconnect = function() {
	console.info('disconnect: from '
		+ addr2string(this.sock.handshake.address));
	var i = clients.indexOf(this)
	if(i != -1) {
		clients.splice(i,1)
		sendAll('msg',{
			text: 'user ' + this.name
			+ ' left channel.',
			name: 'server',
			server: true,
			date: new Date()});
		sendAll('userleave', {
			id: this.id,
			name: this.name});
	} // else: he was not authed.
});

Client.prototype.welcome = function() {
	sendAll('userjoin',make.userToSend(this));
	this.auth.login = new Date();
	clients.push(this);
	console.info('user '+this.auth.name+' joined from '
		+ addr2string(this.sock.handshake.address));
	this.sock.emit('welcome', {
		id: this.sock.id,
		secret: this.auth.id,
		name: this.auth.name
	});
	this.sock.emit('msg', {
		text: 'welcome, ' + this.auth.name
		+ '! To change your nick, use /nick thisIsANewNickname',
		name: 'server',
		server: true,
		date: new Date()});
	sendAll('msg',{
		text: 'user ' + this.name
		+ ' joined channel.',
		name: 'server',
		server: true,
		date: new Date()});
	this.sock.emit('userlist',makeUserlist());
};

Client.prototype.newAuth = function() {
	crypto.randomBytes(48, function(ex, buf) {
		var sec = buf.toString('hex');
		var auth = {
			id: sec,
			name: client.name
		};
		console.info('user '+auth.name
			+ ' gets new auth ' + sec.substring(0,7) + '..');
		auths.push(auth);
		this.welcome();
		//TODO?
	});
};


var sendAll = function(type, message) {
	for(i in clients) {
		clients[i].sock.emit(type, message);
	}
};

var sendUserlist = function(socket) {
	clients[i].sock.emit('userlist', makeUserlist());
};

Array.prototype.findId = function(id) {
	for(i in this) {
		if(id === this[i].id) {
			return this[i];
		}
	}
	return null;
};