// A Circular buffer, stored in localStorage.
// Arguments:
//	name: the localStorage prefix for this buffer
//	cap: the capacity for this buffer.
function Buffer(name, cap) {
	this.name = name;
	// Helper function binds
	this.getCap = function() {
		return parseInt(localStorage.getItem(name+'-cap'));
	};
	this.setCap = function(cap) {
		localStorage.setItem(name+'-cap', cap);
	};
	this.getLength = function() {
		return parseInt(localStorage.getItem(name+'-len'));
	};
	this.setLength = function(cap) {
		localStorage.setItem(name+'-len', cap);
	};
	this.getHead = function() {
		return parseInt(localStorage.getItem(name+'-head'));
	};
	this.setHead = function(position) {
		localStorage.setItem(name+'-head', position);
	};
	this.getIndex = function(index) {
		return JSON.parse(localStorage.getItem(name+'-item-' + index));
	};
	this.setIndex = function(index, value) {
		localStorage.setItem(name+'-item-' + index, JSON.stringify(value));
	};
	
	this.setCap(cap);
	if(isNaN(this.getLength())) this.setLength(0);
	if(isNaN(this.getHead())) this.setHead(-1);
	
	// Returns the newest Element from the Buffer.
	// an extra argument can be specified to get older elements
	// 0 -> newest element, 1 -> element inserted before that one, ...
	this.get = function(index) {
		if(!index) index = 0;
		if(index < 0) return undefined;
		var head = this.getHead();
		var len = this.getCap();
		var position = (this.getHead() - index + len) % len;
		return this.getIndex(position);
	}
	
	// Adds a new element at the head of the buffer
	this.push = function(value) {
		var head = this.getHead();
		var cap = this.getCap();
		var len = this.getLength();
		var nextHead = (head + 1) % cap;
		this.setIndex(nextHead, value);
		this.setHead(nextHead);
		if(len < cap) this.setLength(len+1);
	}
	
	// Iterates through the buffer, beginning with the oldest element,
	// calling the provided callback function for every item.
	// callback is invoked with three arguments:
	//	the element value
	//	the element index
	//	the buffer being traversed
	this.forEach = function(callback) {
		var head = this.getHead();
		var cap = this.getCap();
		var len = this.getLength();
		for(var i = len-1; i >= 0; i--) {
			callback(this.get(i), i, this);
		}
	}
	
	// Resets this buffer, deleting all its contents.
	this.clear = function() {
		for(var i = 0; i < cap; i++) {
			localStorage.removeItem(name+'-item-'+i);
		}
		this.setCap(cap);
		this.setLength(0);
		this.setHead(-1);
	}
}