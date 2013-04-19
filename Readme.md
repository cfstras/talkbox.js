talkbox.js
==========

talkbox is a small and simple webchat built with node.js and jQuery.
Currently, there isn't any spam filtering, also nobody claims it's secure.

But: It's super fast to deploy, has a minimal footprint and you might be able to learn something while looking at it.

Demo
----
An instance running: http://talkbox.q1cc.net

Features
--------
Currently we have:

- webinterface (needs javascript in browser)
- xmpp-connector to have jabber/xmpp-users join your chat
- coloured nicknames!
- content embedding functionality for pictures and many websites like youtube, vimeo, etc.
- markdown support (github-flavoured)

Usage
-----
It couldn't be simpler!

**with npm**

	npm install talkbox
	npm start talkbox

**from git**

	git clone http://github.com/cfstras/talkbox.js.git
	cd talkbox.js
	npm install
	npm start

License
-------
talkbox.js is licensed under LGPLv3. See the LICENSE file for a copy.


Authors
-------
[cfstras](http://about.me/cfstras)  
[morth](http://morth.q1cc.net)

