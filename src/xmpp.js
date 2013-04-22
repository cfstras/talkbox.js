var base64id = require('base64id'),
	lib = require('simple-xmpp'),
	color = require('./color');

function XMPP(libClient, settings) {
	this.libClient = libClient;
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
	this.libClient.sendAll('msg',{
		id: client.id,
		name: client.name,
		text: message.trim(),
		date: new Date()
	});
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
			this,jid,
			this.settings.friends[jid].alias);
	}
	if(this.libClient.clients.indexOf(client) === -1) {
		if(state !== lib.STATUS.OFFLINE) {
			// logged in
			this.libClient.clients.push(client);
			this.libClient.sendAll('userjoin',
				this.libClient.make.userToSend(client));
			//TODO send 'join' event
			console.log('xmpp: join',jid,state,statusText);
		}
	} else {
		if(state === lib.STATUS.OFFLINE) {
			//logged off
			var i = this.libClient.clients.indexOf(client)
			if(i != -1) {
				this.libClient.clients.splice(i,1)
				//TODO send 'leave' event
			} else {
				// logged off but wasn't logged on.
			}
			console.log('xmpp: leave',jid,state,statusText);
		}
	}
	client.status = state;
	console.info('xmpp: buddy',jid,state,'status:',statusText);
};

function XMPPClient(parent,jid,alias) {
	this.parent = parent;
	this.status = lib.OFFLINE;
	this.name = alias+':xmpp';
	this.jid = jid;
	this.id = base64id.generateId();
	this.send = this.send.bind(this);
	this.color = color.genColor();
}

XMPPClient.prototype.send = function(type, message) {
	var msgFrom = message.name;
	var msgText = message.text;
	
	if(type ==='msg') {
		// nothing to do
		if(message.id === this.id) {
			return;
		}
	} else if(type ==='userjoin') { 
		// nothing to do, xmpp has no userlist
		return
	} else if(type ==='ren') { 
		msgFrom = 'server';
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
	var msg = '['+message.name+'] '+message.text;
	lib.send(this.jid, msg);
};

module.exports = XMPP;

