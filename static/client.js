
var socket;
var connect = function(){
	socket = io.connect('', {
		'max reconnection attempts': 15,
		'sync disconnect on unload': true,
		'connect timeout': 5000
	});
	socket.on('msg', onMsg);
	socket.on('ren', onRen);
	socket.on('userlist',onUserList);
	socket.on('err',onErr);
	socket.on('userleave',onUserLeave);
	socket.on('userjoin',onUserJoin);
	socket.on('reload',onReload);
	socket.on('connect',onConnect);
	socket.on('welcome',onWelcome);
	socket.on('disconnect',onDisconnect);
	socket.on('reconnecting',onReconnecting);
	socket.on('reconnect_failed',onReconnectFailed);
	socket.on('connect_failed',onConnectFailed);
};

var userlist = [];
var myName = "";
var myId = "";
var notificationsSupported = false;
var notificationsEnabled = false;
var windowFocused = true;
var unreadmessages = 0;
var unreadusers = 0;
var unreadmsgusers = [];
var stopAlert = null;
var alertInfo = {};

function initClient() {
	notificationsSupported = !!window.Notification;
	if (notificationsSupported) {
		var perm = Notification.permission;
		if(!perm) {
			var notif = new Notification("testing")
			notif.onshow = function(){this.close()};
			perm = notif.permission;
		}
		checkNotificationPerm(perm);
	}
	
	//init marked
	marked.setOptions({
		gfm: true,
		tables: true,
		breaks: true,
		pedantic: true,
		sanitize: true,
		smartLists: true,
		langPrefix: 'lang-'
	});
}

function checkNotificationPerm(perm) {
	console.log(perm);
	if(perm === 'denied') {
		// user has denied permissions.
		//TODO notify him of that maybe?
	} else if(perm === 'default') {
		// set up question box
		var notifs = $('#overlaymessage #notifications');
		notifs.find('.sure').click(function() {
			closeOverlay('#notifications');
			requestNotificationPerm();
		});
		notifs.find('.nope').click(function() {
			closeOverlay('#notifications');
		});
		notifs.fadeIn(300);
		$('#overlaymessage').fadeIn(300);
		
	} else if(perm === 'granted') {
		//yay
		notificationsEnabled = true;
	} else {
		//browser is incompatible
		console.log('what does a notification permission level of"',perm,'"mean?');
	}
}

function requestNotificationPerm() {
	Notification.requestPermission(checkNotificationPerm);
}

function onMsg(data) {
	console.log(data);
	addMessage(data);
	if(windowFocused) {
		//do nothing
	} else {
		if(unreadmsgusers.indexOf(data.name) === -1 && !data.server) {
			unreadmsgusers.push(data.name);
		}
		if(!data.server) {
			unreadmessages++;
			unreadusers = unreadmsgusers.length;
			alertInfo.msgs = unreadmessages;
			alertInfo.users = unreadusers;
			alertInfo.oldTitle = "talkbox";//TODO: move to settings
			stopAlert && stopAlert();
			document.title = "talkbox";	
			stopAlert = AlertUnread(alertInfo);
		}
	}
}

function onRen(data) {
	if(data.id === myId) {
		localStorage.setItem('name',data.name);
		myName = data.name;
	}
	addMessage(data.msg);
	$('#userlist .inner #'+data.id).fadeOut(200, function() {
		$(this).text(data.name).fadeIn(100);
	});
	
	var user = findById(userlist,data.id);
	var index = 0;
	if((index = unreadmsgusers.indexOf(user.name)) !== -1) {
		unreadmsgusers[index] = data.name;
	}
	user.name = data.name;
};

function onUserList(data) {
	//TODO check if userlist has a valid format
	setUserlist(data);
}

function onErr(data) {
	data.server = true;
	data.name = 'server';
	addMessage(data);
}

function onUserLeave(user) {
	console.log('dc: '+user.name);
	var index = findIndexById(userlist, user.id);
	if(index != -1) {
		userlist.splice(index,1);
	} else {
		console.info('got userleave: '+user+', but not found in list'+userlist);
	}
	setUserlist(userlist)
}

function onUserJoin(data) {
	userlist.push(data);
	setUserlist(userlist);
}

function onReload() {
	location.reload();
}

function onConnect() {
	socket.emit('auth',{
		secret: localStorage.getItem('secret'),
		name: localStorage.getItem('name')
	});
	overlayMsg("logging in...");
}

function onWelcome(data) {
	localStorage.setItem('secret',data.secret);
	localStorage.setItem('name',data.name);
	myId = data.id;
	myName = data.name;
	closeOverlay('#connect');
}

function onDisconnect() {
	overlayMsg("disconnected");
	addMessage({
		name: 'error',
		server: true,
		text: 'disconnected from server',
		date: new Date()});
	$('#userlist .inner').fadeOut(200).empty();
}

function onReconnecting() {
	overlayMsg("reconnecting...");
}

function onReconnectFailed() {
	overlayMsg("gave up reconnect for now");
	setTimeout(connect,1000*60); // sleep 60 seconds, then reconnect
}

function onConnectFailed() {
	overlayMsg("gave up connect for now");
	setTimeout(connect,1000*60); // sleep 60 seconds, then reconnect
}

function addMessage(data) {
	var date = new Date(data.date);
	var user = findById(userlist, data.id);
	var d = $('<div class="message'
		+ '" style="opacity: 0;">'
		+ '<span class="right">' + date.toLocaleTimeString() + '</span>'
		+ '<span class="name'+(data.server?' server' : '') + '" '
		+ (user && user.color?'style="color:'+user.color+'"' : '') +'>'
		+ data.name + ':</span>'
		+ '<span class="text">' + marked(data.text) + '</span>'
		+ '</div>')
		.appendTo('#msgs #inner')
		.animate({
			opacity: 1
		}, 150);
	d.find('a')
		.oembed() // oEmbed handles youtube etc
		.filter(function(el){ // filter all remaining images
			return this.href.match(/\.(jpe?g|png|gif|svg)$/i)
		})
		.each(function() { //put an image in
			$(this).html('<img src="' + this.href + '" />'); 
		});
	$('#msgs').animate({
		scrollTop: $('#msgs #inner').height()
	},150);
	if(data.name != myName) {
		notify(data);
	}
	return d;
};

function notify(data) {
	//TODO use alternatives when not supported
	// Possible Alternatives:
	//  Prepend something to window title
	//  Flash Tab
	if(windowFocused) return;
	console.log("focused:");
	if(!notificationsEnabled) return;
	if(!notificationsSupported) return;
	
	var notif = new Notification(
		data.name, {
			body: data.text,
			tag: 'talkbox.message'
		}
	);
	console.log('notifying',notif);
	//notif.onclose
	notif.onshow = function() {
		var self = this;
		setTimeout(function(){self.close();},5000);
	};
	//notif.onclick
	//notif.onerror

}

function setUserlist(data) {
	$('#userlist .inner').fadeIn(50);
	userlist = data;
	$('#userlist .inner .user').each(function(i, el) {
		var user = findById(userlist, el.id);
		if (user === null) {
			$(this).animate({
				opacity: 0
			},200).slideUp(200,function() {
				$('#userlist .inner .user:hidden').remove();
			});
		}
	});
	for(i in userlist) {
		if ($('#userlist .inner #'+userlist[i].id.replace(/[:\.@]/g,'__'))
			.length===0) {
			makeUserEl(userlist[i])
			.appendTo('#userlist .inner')
			.animate({
				opacity: 1
			}, 200);
		}
	}
};

function makeUserEl(user) {
	return $('<span class="user" id="' + user.id.replace(/[:\.@]/g,'__')
		+ '" style="opacity: 0; color:'+user.color+';">'
		+ user.name + '</span>');
}

function overlayMsg(message) {
	$('#overlay').fadeIn(300);
	$('#overlaymessage #connect').html(message).fadeIn(300);
	$('#overlaymessage').fadeIn(300);
}

function closeOverlay (subElement){
	// check if there are subElements remaining, if not, fadeOut message
	if($('#overlaymessage').find(':visible').size() <= 1){
		$('#overlaymessage').fadeOut(300);
	}
	
	//fadeOut other stuff
	if(subElement) {
		$('#overlaymessage').find(subElement).fadeOut(300,closeOverlay);
	}
	$('#overlay').fadeOut(300);
}

send = function() {
	var inp = $('#inputbox');
	var text = inp.val();
	inp.val('');
	var aliasreg = /^\/(alias|name|nick|n|a) (.*)/;
	var aliasrep = /^\/(alias|name|nick|n|a) /;
	if(text.match(aliasreg)) {
		socket.emit('ren', {name: text.replace(aliasrep,'')});
	} else {
		socket.emit('msg', {text: text});
	}
	//inp.prop('disabled',true);
	//setTimeout(function() {
	//	inp.prop('disabled',false);
	//},100);
};
$(document).ready(function() {
	//disable JS warning
	$('#javascript').remove();
	$('#overlay').hide();
	$('#overlaymessage').hide();
	initClient();
	overlayMsg("connecting...");
	connect();
	$('#inputbox').keydown(function(event) {
		//console.log('shift: '+event.shiftKey+' ctrl: '+event.ctrlKey+' which: '+event.which);
		if(event.keyCode === 13
			&& !(event.ctrlKey || event.shiftKey)) {
			send();
			return false;
		} else if((event.ctrlKey || event.shiftKey)
			&& (event.keyCode === 13
			|| event.keyCode == 10) ) {
			if(!event.shiftKey)
				$('#inputbox').insertAtCaret('\n');
		}
	});
	$(window).blur(function(){
		windowFocused = false;
		console.log("unfocus");
		if(!unreadmessages) {
			stopAlert && stopAlert();
		}
	}).focus(function() {
		windowFocused = true;
		console.log("focus");
		// reset title notification data
		unreadmessages = 0;
		unreadmsgusers = [];
		document.title = "talkbox"; //TODO move to settings
		stopAlert && stopAlert();
		stopAlert = null;
	});
	//s$('button').click();
});
