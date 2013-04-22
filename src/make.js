var sanitize = require('validator').sanitize,
	marked = require('marked');

function Make(clients) {
	this.clients = clients;
	var self = this;
	
	this.serverMsg = function(type,message) {
		return {
			type: type,
			name: 'server',
			server: true,
			text: message,
			date: new Date()
		};
	};

	this.userlist = function() {
		var list = [];
		list.type = 'userlist';
		for(i in self.clients) {
			list.push(self.userToSend(clients[i]));
		}
		return list;
	};
	
	this.userToSend = function(client) {
		return {
			uid: client.uid,
			name: client.name,
			color: client.color
		};
	};

}

module.exports = Make;
