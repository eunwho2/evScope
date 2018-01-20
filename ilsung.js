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

//--- serial to inverter
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const sciPort = new SerialPort('/dev/ttyAMA0',{
    baudRate: 115200
});
const parser = new Readline();
sciPort.pipe(parser);
sciPort.on('open',function(err){
    if(err) return console.log('Error on write : '+ err.message);
    console.log('serial open');
});

sciPort.on('error', function(err) {
    console.log('Error: ', err.message);
    console.log('Error Occured');
});


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

// error handlers

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
    sciPort.write('9:4:900:0.000e+0',function(err){
    	if(err) return console.error(err);
      parser.on('data',function (data){
      	socket.emit('codeTable',data);
      });
		});
  });
});



//var i2c =require('i2c');
//var address = 0x20;
//var wire = new i2c(address,{device:'/dev/i2c-1'});

/*
wire.scan(function (err,data){

});
*/

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

var pin = 0;
setInterval(function() {

//  var portVal = ~portVal1;
//	dOut10.writePort(0,portVal);

	var portVal= dIn10.readPort(0);
	dOut10.writePort(0,~portVal);

	portVal = dIn10.readPort(1);
	dOut10.writePort(1,~portVal);

	portVal = dIn11.readPort(0);
	dOut11.writePort(0,~portVal);

	portVal = dIn11.readPort(1);
	dOut11.writePort(1,~portVal);


},300);




