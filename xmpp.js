var sanitize = require('validator').sanitize;
var xmpp = require('simple-xmpp');

var libClient, settings;

function init(_client, _settings) {
	libClient = _client;
	settings = _settings;
	
	xmpp.on('online', function() {
		console.log('xmpp: connected '+settings.xmpp.jid);
	});
	
	xmpp.on('chat', function(from, message) {
		var name = from;
		if(settings.xmpp.friends && settings.xmpp.friends[from]) {
			name = settings.xmpp.friends[from].alias;
		}
		libClient.sendAll('msg',{
			id: 'xmpp',
			name: name,
			text: sanitize(message.trim())
				.escape()
				.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
			date: new Date(),
		});
	});
	
	xmpp.on('error', function(err) {
		console.error(err);
	});
	
	xmpp.on('subscribe', function(from) {
		console.log('xmpp: auth from',from);
		if (settings.xmpp.friends
		&& settings.xmpp.friends.hasOwnProperty(from)) {
			console.log('xmpp:',settings.xmpp.friends[from.alias],'is my friend.')
			xmpp.acceptSubscription(from);
		}
	});
	
	if(settings.xmpp) {
		console.log('xmpp: connecting',settings.xmpp.jid);
		xmpp.connect(settings.xmpp);
		var friends = settings.xmpp.friends;
		if(friends) {
			for(k in friends) {
				if(friends.hasOwnProperty(k)) {
					console.log('xmpp: xmpp adding '+friends[k].alias+' <'+k+'>');
					xmpp.subscribe(k);
				}
			}
		}
		// check for incoming subscription requests
		xmpp.getRoster();
	} else {
		console.log('xmpp: no settings found.');
	}
}

module.exports.init = init;
