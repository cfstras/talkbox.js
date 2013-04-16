
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
var myId = "";

function onMsg(data) {
	console.log(data);
	addMessage(data);
};
function onRen(data) {
	if(data.id === myId) {
		localStorage.setItem('name',data.name);
	}
	addMessage(data.msg);
	$('#userlist .inner #'+data.id).fadeOut(200, function() {
        $(this).text(data.name).fadeIn(100);
    });
	find(userlist,data.id).name = data.name;
};
function onUserList(data) {
	//TODO check userlist
	setUserlist(data);
};
function onErr(data) {
	data.server = true;
	data.name = 'server';
	addMessage(data);
};
function onUserLeave(user) {
	console.log('dc: '+user.name);
	var index = findIndexById(userlist, user.id);
	if(index != -1) {
		userlist.splice(index,1);
	} else {
		console.info('got userleave: '+user+', but not found in list'+userlist);
	}
	setUserlist(userlist)
};
function onUserJoin(data) {
	userlist.push(data);
	setUserlist(userlist);
};
function onReload() {
	location.reload();
};
function onConnect() {
	socket.emit('auth',{
		secret: localStorage.getItem('secret'),
		name: localStorage.getItem('name')
	});
	overlayMsg("logging in...");
};
function onWelcome(data) {
	localStorage.setItem('secret',data.secret);
	localStorage.setItem('name',data.name);
	myId = data.id;
	$('#overlay').fadeOut(300);
	$('#overlaymessage').fadeOut(300);
};
function onDisconnect() {
	overlayMsg("disconnected");
	addMessage({
		name: 'error',
		server: true,
		text: 'disconnected from server',
		date: new Date()});
	$('#userlist .inner').fadeOut(200).empty();
};
function onReconnecting() {
	overlayMsg("reconnecting...");
};
function onReconnectFailed() {
	overlayMsg("gave up reconnect for now");
	setTimeout(connect,1000*60); // sleep 60 seconds, then reconnect
};
function onConnectFailed() {
	overlayMsg("gave up connect for now");
	setTimeout(connect,1000*60); // sleep 60 seconds, then reconnect
};

addMessage = function(data) {
	var date = new Date(data.date);
	var user = findById(userlist, data.id);
	var d = $('<div class="message'
		+ '" style="opacity: 0;">'
		
		+ '<span class="name'+(data.server?' server':'') + '"'
		+ (data.server?'':' style="color:'+user.color+'"') +'>'
		+ data.name + ':</span>'
		+ '<span class="text">' + data.text + '</span>'
		+ '<span class="right">' + date.toLocaleTimeString() + '</span>'
		+ '</div>')
		.appendTo('#msgs #inner')
		.animate({
			opacity: 1
		}, 150);
	$('#msgs').animate({
		scrollTop: $('#msgs #inner').height()
	},150);
	return d;
};

setUserlist = function(data) {
	$('#userlist .inner').fadeIn(50);
	userlist = data;
	$('#userlist .inner .user').each(function(i, el) {
		user = findById(userlist, el.id);
		if (user === null) {
			$(this).animate({
				opacity: 0
			},200).slideUp(200,function() {
				$('#userlist .inner .user:hidden').remove();
			});
		}
	});
	for(i in userlist) {
		if ($('#userlist .inner #'+userlist[i].id)
			.length===0) {
			makeUserEl(userlist[i])
			.appendTo('#userlist .inner')
			.animate({
				opacity: 1
			}, 200);
		}
	}
};
makeUserEl = function(user) {
	return $('<span class="user" id="' + user.id
				+ '" style="opacity: 0;color:'+user.color+';">'
				+ user.name + '</span>');
}

function overlayMsg(message) {
	$('#overlay').fadeIn(300);
	$('#overlaymessage #connect').fadeOut(300,function() {
		$(this).html(message).fadeIn(300);
	});
	$('#overlaymessage').fadeIn(300);
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
	//s$('button').click();
});


