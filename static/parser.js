function parse(msg) {
	//linkify
	msg = linkify(msg);
	return msg;
}

function linkify(text) {
    var urls = /(\b[A-z]+:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var linkified = text.replace(urls,"<a href='$1'>$1</a>");
    return linkified;
}