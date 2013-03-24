
var socket = io.connect();
var userlist = [];
var myId = "";

socket.on('msg', function (data) {
	console.log(data);
	addMessage(data);
});
socket.on('ren', function (data) {
	if(data.id === myId) {
		localStorage.setItem('name',data.name);
	}
	addMessage(data.msg);
	$('#userlist .inner #'+data.id).fadeOut(200, function() {
        $(this).text(data.name).fadeIn(100);
    });
	find(userlist,data.id).name = data.name;
});
addMessage = function(data) {
	var date = new Date(data.date);
	var d = $('<div class="message'
		+ '" style="opacity: 0;">'
		
		+ '<span class="name'+(data.server?' server':'') + '">'
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
socket.on('userlist', function (data) {
	//TODO check userlist
	setUserlist(data);
});
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
				+ '" style="opacity: 0;">'
				+ user.name + '</span>');
}
socket.on('err', function(data) {
	data.server = true;
	data.name = 'server';
	addMessage(data);
});
socket.on('userleave', function(user) {
	console.log('dc: '+user.name);
	var index = findIndexById(userlist, user.id);
	if(index != -1) {
		userlist.splice(index,1);
	} else {
		console.info('userleave: '+user+', not found in list'+userlist);
	}
	setUserlist(userlist)
});
socket.on('userjoin', function(data) {
	userlist.push(data);
	setUserlist(userlist);
});
socket.on('reload', function() {
	location.reload();
});
socket.on('connect', function() {
	socket.emit('auth',{
		secret: localStorage.getItem('secret'),
		name: localStorage.getItem('name')
	});
});
socket.on('welcome', function(data) {
	localStorage.setItem('secret',data.secret);
	localStorage.setItem('name',data.name);
	myId = data.id;
});
socket.on('disconnect', function() {
	addMessage({
		name: 'error',
		server: true,
		text: 'disconnected from server',
		date: new Date()});
	$('#userlist .inner').fadeOut(200).empty();
});
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
};
$(document).ready(function() {
	$('#inputbox').keyup(function(event) {
		//console.log('shift: '+event.shiftKey+' ctrl: '+event.ctrlKey+' which: '+event.which);
		if(event.keyCode === 13
			&& !(event.ctrlKey || event.shiftKey)) {
			send();
		} else if((event.ctrlKey || event.shiftKey)
			&& (event.keyCode === 13
			|| event.keyCode == 10) ) {
			if(!event.shiftKey)
				$('#inputbox').insertAtCaret('\n');
		}
	});
	//s$('button').click();
});


