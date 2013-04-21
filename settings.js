var fs = require('fs');

var deftext = fs.readFileSync('settings.default.json',{encoding: 'utf8'});
var defaults = JSON.parse(deftext);

deepClone = function(object) {
	return JSON.parse(JSON.stringify(object));
}

deepAddAll = function(object, other){
	var changed = 0;
	for(var i in other) {
		if(typeof other[i] === 'object') {
			if(typeof object[i] !== 'object') {
				changed++;
				object[i] = deepClone(other[i]);
			} else {
				changed += deepAddAll(object[i],other[i]);
			}
		} else {
			if(other.hasOwnProperty(i) && !object.hasOwnProperty(i)) {
				changed++;
				object[i] = deepClone(other[i]);
			}
		}
	}
	return changed;
}

var read;
var err;
try {
	var read = fs.readFileSync('settings.json',{encoding: 'utf8'});
} catch (e) {
	err = e;
	if(e.code === 'ENOENT') { // File not found
		fs.writeFileSync('settings.json', JSON.stringify(defaults, null, "\t"));
		settings = defaults;
		console.log('Writing new settings.json file.');
	} else {
		throw e;
	}
}

if(!err) {
	var settings = JSON.parse(read);

	// copy new values over
	var changed = deepAddAll(settings,defaults);
	if(changed > 0){
		console.log(changed,'new settings added to config');
		fs.writeFileSync('settings.json', JSON.stringify(settings, null, "\t"));
	}
}

module.exports = settings;

