var sanitize = require('validator').sanitize;

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
		for(i in self.clients) {
			list.push(self.userToSend(clients[i]));
		}
		return list;
	};
	
	this.userToSend = function(client) {
		return {
			id: client.id,
			name: client.name,
			color: client.color
		};
	};
	
	this.msg = function(client, data) {
		if (!data || !data.text) return undefined;
		
		return m = {
			id: client.id,
			name: client.name,
			text: sanitize(data.text.trim())
				.escape()
				.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
			date: new Date(),
		};
	};

}

module.exports = Make;
