var urlregex = /(\b[A-z]+:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

function parse(msg) {
	//linkify
	return linkify(msg);
}

function linkify(text) {
	return text.replace(urlregex,'<a href="$1" target="_blank">$1</a>');
}
