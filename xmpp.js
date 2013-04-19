var sanitize = require('validator').sanitize;
var lib = require('simple-xmpp');

function XMPP(libClient, settings) {
	this.libClient = libClient;
	this.settings = settings.xmpp;
	lib.on('online', this.handleOnline.bind(this));
	lib.on('chat', this.handleChat.bind(this));
	lib.on('error', this.handleError.bind(this));
	lib.on('subscribe', this.handleSubscribe.bind(this));
	lib.on('buddy', this.handleBuddy.bind(this));
	this.send = this.send.bind(this);
	this.clients = {};
	if(this.settings) {
		console.log('xmpp: connecting',this.settings.jid);
		lib.connect(this.settings);
		var friends = this.settings.friends;
		if(friends) {
			for(k in friends) {
				if(friends.hasOwnProperty(k)) {
					console.log('xmpp: xmpp adding '+friends[k].alias+' <'+k+'>');
					lib.subscribe(k);
				}
			}
		}
		// check for incoming subscription requests
		lib.getRoster();
	} else {
		console.log('xmpp: no settings found.');
	}
}

XMPP.prototype.handleOnline = function() {
	console.log('xmpp: connected '+this.settings.jid);
};

XMPP.prototype.handleChat = function(from, message) {
	var name = from;
	if(this.settings.friends && this.settings.friends[from]) {
		name = this.settings.friends[from].alias;
	}
	this.libClient.sendAll('msg',{
		id: 'xmpp:'+from,
		name: name,
		text: sanitize(message.trim())
			.escape()
			.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
		date: new Date()
	});
};

XMPP.prototype.handleError = function(err) {
	console.error(err);
};

XMPP.prototype.handleSubscribe = function(from) {
	console.log('xmpp: auth from',from);
	if (this.settings.friends
	&& this.settings.friends.hasOwnProperty(from)) {
		console.log('xmpp:',this.settings.friends[from].alias,'is my friend.')
		lib.acceptSubscription(from);
	}
};

XMPP.prototype.handleBuddy = function(jid, state, statusText) {
	console.log('xmpp: buddy',jid,state,statusText);
	//if(!this.clients[])
};

XMPP.prototype.send = function(type, message) {
	var msgFrom = message.name;
	var msgText = message.text;
	
	if(type ==='msg') {
		// nothing to do
	} else if(type ==='userjoin') { 
		// nothing to do, xmpp has no userlist
		return
	} else if(type ==='ren') { 
		msgFrom = message.msg.name;
		msgText = message.msg.text;
	} else if(type ==='userleave') { 
		// nothing to do, xmpp has no userlist
		return
	} else if(type ==='disconnect') { 
		// nothing to do
	} else {
		console.error('xmpp: unknown message',type,message);
		return;
	}
	var msg = '['+msgFrom+'] '+msgText;
	var friends = this.settings.friends;
	for(k in friends) {
		if(friends.hasOwnProperty(k)
		&& message.id !== 'xmpp:'+k) {
			var msg = '['+message.name+'] '+message.text;
			lib.send(k, msg);
		}
	}
};

function XMPPClient(parent,jid,alias) {
	this.parent = parent;
	this.status = lib.OFFLINE;
	this.name = alias+':xmpp';
	this.jid = jid;
	this.id = 'xmpp:'+jid;
	//this.libClient.clients.push(this);
}

module.exports = XMPP;

