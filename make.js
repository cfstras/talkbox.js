var sanitize = require('validator').sanitize;
var marked = require('marked');

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
		if (!data || data.text===undefined)
			return undefined;
		data.text = data.text.trim();
		if(!marked.parser(marked.lexer(data.text)))
			return false;
		return m = {
			id: client.id,
			name: client.name,
			text: sanitize(data.text)
				.escape()
				.replace(/(\r\n|\n|\r)/gm, '<br />\n'),
			date: new Date(),
		};
	};

}

module.exports = Make;
