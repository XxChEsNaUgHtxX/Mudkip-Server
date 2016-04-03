"use strict";

let filepath = 'config/customcolors.json';
let customColors = {};
let fs = require('fs');
let request = require('request');

function load() {
	fs.readFile(filepath, 'utf8', function (err, file) {
		if (err) return;
		customColors = JSON.parse(file);
	});
}
load();

function updateColor() {
	fs.writeFileSync(filepath, JSON.stringify(customColors));

	let newCss = '/* COLORS START */\n';

	for (let name in customColors) {
		newCss += generateCSS(name, customColors[name]);
	}
	newCss += '/* COLORS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* COLORS START */')) file.splice(file.indexOf('/* COLORS START */'), (file.indexOf('/* COLORS END */') - file.indexOf('/* COLORS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	request('http://play.pokemonshowdown.com/customcss.php?server=gold&invalidate', function callback(error, res, body) {
		if (error) return console.log('updateColor error: ' + error);
	});
}
//Gold.updateColor = updateColor;

function generateCSS(name, color) {
	let css = '';
	let rooms = [];
	name = toId(name);
	for (let room in Rooms.rooms) {
		if (Rooms.rooms[room].id === 'global' || Rooms.rooms[room].type !== 'chat' || Rooms.rooms[room].isPersonal) continue;
		rooms.push('#' + Rooms.rooms[room].id + '-userlist-user-' + name + ' strong em');
		rooms.push('#' + Rooms.rooms[room].id + '-userlist-user-' + name + ' strong');
		rooms.push('#' + Rooms.rooms[room].id + '-userlist-user-' + name + ' span');
	}
	css = rooms.join(', ');
	css += '{\ncolor: ' + color + ' !important;\n}\n';
	css += '.chat.chatmessage-' + name + ' em {\n';
	css += 'color: ' + color + ' !important;\n}\n';
	return css;
}

exports.commands = {
	lettercolour: 'lettercolor',
	customcolor: function (target, room, user) {
		if (!this.can('pban')) return false;
		target = target.split(',');
		for (let u in target) target[u] = target[u].trim();
		if (!target[1]) return this.parse('/help customcolor');
		if (toId(target[0]).length > 19) return this.errorReply("Usernames are not this long...");
		if (target[1] === 'delete') {
			if (!customColors[toId(target[0])]) return this.errorReply('/customcolor - ' + target[0] + ' does not have a custom color.');
			delete customColors[toId(target[0])];
			updateColor();
			this.sendReply("You removed " + target[0] + "'s custom color.");
			Rooms('staff').add(user.name + " removed " + target[0] + "'s custom color.").update();
			if (Users(target[0]) && Users(target[0]).connected) Users(target[0]).popup(user.name + " removed your custom color.");
			return;
		}

		this.sendReply("|raw|You have given <b><font color=" + target[1] + ">" + Tools.escapeHTML(target[0]) + "</font></b> a custom color.");
		Rooms('staff').add('|raw|' + Tools.escapeHTML(target[0]) + " has recieved a <b><font color=" + target[1] + ">custom color</fon></b> from " + Tools.escapeHTML(user.name) + ".").update();
		customColors[toId(target[0])] = target[1];
		updateColor();
	},
	lettercolorhelp: ["Commands Include:",
				"/lettercolor [user], [hex] - Gives [user] a custom color of [hex]",
				"/lettercolor [user], delete - Deletes a user's custom color"],

	colorpreview: function (target, room, user) {
		if (!this.canBroadcast()) return;
		target = target.split(',');
		for (let u in target) target[u] = target[u].trim();
		if (!target[1]) return this.parse('/help colorpreview');
		return this.sendReplyBox('<b><font size="3" color="' +  target[1] + '">' + Tools.escapeHTML(target[0]) + '</font></b>');
	},
	colorpreviewhelp: ["Usage: /colorpreview [user], [color] - Previews what that username looks like with [color] as the color."],
};
