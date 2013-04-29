var base64id = require('base64id'),
	lib = require('simple-xmpp'),
	color = require('./color');

function XMPP(clientHandler, settings) {
	this.clientHandler = clientHandler;
	this.settings = settings.xmpp;
	lib.on('online', this.handleOnline.bind(this));
	lib.on('chat', this.handleChat.bind(this));
	lib.on('error', this.handleError.bind(this));
	lib.on('subscribe', this.handleSubscribe.bind(this));
	lib.on('buddy', this.handleBuddy.bind(this));
	this.clients = {};
	if(this.settings) {
		console.log('xmpp: connecting',this.settings.jid);
		lib.connect(this.settings);
		var friends = this.settings.friends;
		if(friends) {
			for(k in friends) {
				if(friends.hasOwnProperty(k) && friends[k].alias) {
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
	var client = this.clients[from];
	if(!client) {
		console.log('xmpp: message from unknown ignored:',from);
		return;
	}
	this.clientHandler.receive(client,message);
};

XMPP.prototype.handleError = function(err) {
	console.error(err);
};

XMPP.prototype.handleSubscribe = function(from) {
	console.log('xmpp: auth from',from);
	if (this.settings.friends
	&& this.settings.friends.hasOwnProperty(from)
	&& this.settings.friends[from].alias) {
		console.log('xmpp:',this.settings.friends[from].alias,'is my friend.')
		lib.acceptSubscription(from);
	}
};

XMPP.prototype.handleBuddy = function(jid, state, statusText) {
	var client = this.clients[jid];
	var friend = this.settings.friends[jid];
	if(!friend || !friend.alias) {
		//console.log('xmpp: ignoring state from not-friend',jid,state);
		return;
	}
	if(!client) {
		client = this.clients[jid] = new XMPPClient(
			jid, this.settings.friends[jid].alias);
	}
	if(this.clientHandler.clients.indexOf(client) === -1) {
		if(state !== lib.STATUS.OFFLINE) {
			// logged in
			this.clientHandler.addUser(client);
			console.log('xmpp: join',jid,state,statusText);
		}
	} else {
		if(state === lib.STATUS.OFFLINE) {
			//logged off
			this.clientHandler.disconnect(client);
		}
	}
	client.status = state;
	console.info('xmpp: buddy',jid,state,'status:',statusText);
};

function XMPPClient(jid, alias) {
	this.status = lib.OFFLINE;
	this.name = alias+':xmpp';
	this.jid = jid;
	this.uid = base64id.generateId();
	this.color = color.genColor();
	
	this.send = this.send.bind(this);
}

XMPPClient.prototype.send = function(message) {
	var msgFrom = message.name;
	var msgText = message.text;
	var type = message.type;
	
	if(type ==='msg') {
		// nothing to do
		if(message.uid === this.uid) {
			// message was sent by me, suppress
			return;
		}
	} else {
		console.error('xmpp: unknown message',type,message);
		return;
	}
	var msg = '['+message.name+'] '+message.text;
	lib.send(this.jid, msg);
};

module.exports = XMPP;

