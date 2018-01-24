"use strict";
var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var cons         = require('consolidate');

var routes    = require('./routes/index');
var users     = require('./routes/users');
// var socket    = require('./lib/socket');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var port      = process.env.PORT || '3000';

//--- create express application
var app = express();
app.set('port', port);

//--- create server
var server = require('http').Server(app);

//--- connect socket.io to server
var io = require('socket.io')(server);

//--- view engine setup
app.engine('html',cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

//--- uncomment after placing your favicon in /public
//--- app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//--- production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//--- start server
console.log('http on : ' + port.toString());
server.listen(port);

//--- socket.io support

io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);
	socket.on('disconnect', function () {
  	console.log('disconnected from : ' + host);
  });

	socket.on('codeTable',function(from,msg){
  	console.log('received codeTable request');
  });
});


var iopi =require('./ABElectronics_NodeJS_Libraries/lib/iopi/iopi');

var dIn10 = new iopi(0x20);
var dIn11 = new iopi(0x21);
dIn10.setPortDirection(0,0xff);
dIn10.setPortDirection(1,0xff);

dIn11.setPortDirection(0,0xff);
dIn11.setPortDirection(1,0xff);

var dOut10 = new iopi(0x22);
var dOut11 = new iopi(0x23);

dOut10.setPortDirection(0,0x00);
dOut10.setPortDirection(1,0x00);

dOut11.setPortDirection(0,0x00);
dOut11.setPortDirection(1,0x00);

var count = 0 
setInterval(function() {

	var portVal= dIn10.readPort(0);

	count = 0;	
	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 
	dOut10.writePort(0,~portVal);

	portVal = dIn10.readPort(1);
	count++;	
	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 
	dOut10.writePort(1,~portVal);

	portVal = dIn11.readPort(0);
	count++;	
	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 
	dOut11.writePort(0,~portVal);

	portVal = dIn11.readPort(1);
	count++;	
	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 
	dOut11.writePort(1,~portVal);


},1000);


// NodeJS SPI Dump for MCP3008 - Created by Mikael Levén

/*
var Mcp3008 = require('mcp3008.js');
var adc = new Mcp3008();

/*
setInterval(function() {
	for (var channel = 0; channel <= 7; channel++) {
		adc.read(channel,function(value){
			console.log('ch%d = %d',channel,value);
		});	
  };
}, 1000);
*/


/*
var channel = 7;
setInterval(function() {
	adc.read(channel,function(value){
		console.log('ch%d = %d',channel,value);
	});	
}, 1000);

process.on('SIGTERM', function () {
    process.exit(0);
});

process.on('SIGINT', function () {
    process.exit(0);
});

process.on('exit', function () {
    console.log('\nShutting down, performing GPIO cleanup');
    rpio.spiEnd();
    process.exit(0);
});
*/
