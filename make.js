

exports = function(clients) {
	this.clients = clients;
}

exports.prototype.serverMsg = function(type,message) {
	return {
		type: type,
		name: 'server',
		server: true,
		text: message,
		date: new Date()
	};
};

exports.prototype.userlist = function() {
	var list = [];
	for(i in clients) {
		list.push(prepareUserToSend(clients[i]));
	}
	return list;
};

exports.prototype.userToSend = function(client) {
	return {
		id: client.id,
		name: client.name};
};