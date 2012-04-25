var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , url = require('url')
  , net = require('net')
  , exec = require("child_process").exec
  , fs = require('fs');

app.listen(8000);


var user_info={};
var info={};
var i=0;

function handler (req, res) {
  
  if ( req.url == "/"){
	  fs.readFile(__dirname + '/index.html',
	  function (err, data) {
		if (err) {
		  res.writeHead(500);
		  return res.end('Error loading index.html');
		}
		//user_info.push(req.connection._peername);
		info = req.connection;

		res.writeHead(200);
		res.end(data);
	  });
  }
}


io.sockets.on('connection', function (socket) {
	user_info[socket.id] = {};
	var user = user_info[socket.id];
	user.id = socket.id;

	try{
		user.ip = info._peername.address;
	}catch(e){
		user.ip = "동수";
	}
	var init_msg = {
		"msg"	: "Connect: " + user.ip,
		"mode"	: "msg",
		"send_msg" : "Connect: " + user.ip
	}
  	socket.emit('recieve_msg', init_msg);
  	socket.emit('set_user', user);
  	socket.broadcast.emit('recieve_msg', init_msg);

  	socket.on('write_message',function(msg){

		exec(msg,function(error, stdout, stderr){

			var result = {};
			result.send_msg = msg;
			if(error == null){
				result.msg = "<span class='cmd'># "+msg+"</span> \n"+stdout;
				result.mode = "cmd";
			}else{
				if(msg == "map"){
					result.mode = "map";
					result.type = "all_open";
					result.loader = user;
					result.users = user_info;
				}else{
					result.msg = "<span class='msg'>"+user.ip+":</span>"+msg+" \n";
					result.mode = "msg";
				}
			}
  		socket.emit('recieve_msg', result);
  		socket.broadcast.emit('recieve_msg', result);
		});
	});

	socket.on('zoom_changed',function(level){
		var result = {};
		result.mode	= "map";
		result.type = "zoom_changed";
		result.value= level;
  		//socket.emit('recieve_msg', result);
  		socket.broadcast.emit('recieve_msg', result);
	});

	socket.on('center_changed',function(LatLng){
		var result = {};
		result.mode	= "map";
		result.type = "center_changed";
		result.value= LatLng;
  		//socket.emit('recieve_msg', result);
  		socket.broadcast.emit('recieve_msg', result);
	});

	socket.on('marking',function(LatLng){
		var result = {};
		result.mode	= "map";
		result.type = "marking";
		result.value= LatLng;
  		socket.emit('recieve_msg', result);
  		socket.broadcast.emit('recieve_msg', result);
	});

	socket.on('send_geo',function(obj){
		user_info[obj.user.id]['geo'] = obj.geo;
		console.log(user_info);
	});

	socket.on('map_changed',function(obj){
		var result = {};
		result.mode	= "map";
		result.type = "map_changed";
		result.value= obj;
  		socket.broadcast.emit('recieve_msg', result);
		console.log(obj);
	});

});
