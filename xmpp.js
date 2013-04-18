var sanitize = require('validator').sanitize;
var xmpp = require('simple-xmpp');

var friends = ['claus.ferdinand@gmail.com'];
var libClient;

function init(_client, _friends) {
	libClient = _client;
	friends = friends.concat(_friends);
	
	xmpp.on('online', function() {
		console.log('Yes, I\'m connected!');
	});

	xmpp.on('chat', function(from, message) {
		libClient.sendAll('msg',{
			id: 'xmpp',
			name: from,
			text: sanitize(message.trim())
				.escape()
				.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
			date: new Date(),
		});
		xmpp.send(from, 'echo: ' + message);
	});

	xmpp.on('error', function(err) {
		console.error(err);
	});

	xmpp.on('subscribe', function(from) {
		console.log('auth from',from);
		if (friends.indexOf(from) != -1) {
			console.log('he is my friend.')
			xmpp.acceptSubscription(from);
		}
	});

	xmpp.connect({
		jid         : 'talkbox.js.test@jabber.systemli.org',
		password    : 'insert your password here, motherfucker',
		host        : 'jabber.systemli.org',
		port        : 5222
	});

	xmpp.subscribe('claus.ferdinand@gmail.com');
	// check for incoming subscription requests
	xmpp.getRoster();
}



module.exports.init = init;