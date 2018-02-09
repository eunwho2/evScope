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

var msgCount = 100;
var trace = {channel:0,length:msgCount,sample:[msgCount]};

function simTraceData( ){
  var i;
  var r;
  var v;

  // channel 1
	// create a value between 1024
  r = Math.random();
  for(i=0 ; i<trace.length ; ++i) {
  	v = Math.floor(Math.sin(r/Math.PI) * 511 + 511);

    trace.sample[i] = v ;
    r += 1.0;
	}
}



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

//--- serial to inverter
const SerialPort = require('serialport');
// const Readline = SerialPort.parsers.Readline;
const sciPort = new SerialPort('/dev/ttyAMA0',{
    baudRate: 38400
});

//const parser = new Readline({delimiter: '03'});
//sciPort.pipe(parser);

sciPort.on('open',function(err){
    if(err) return console.log('Error on write : '+ err.message);
    console.log('serial open');
});

sciPort.on('error', function(err) {
    console.log('Error: ', err.message);
    console.log('Error Occured');
});

sciPort.on('data', function(data){
	console.log('Data:',data);
});

// var txMsg = [5,48,48,82,83,83,48,49,48,54,37,67,87,48,48,4,0];
var ENQ = '\x05';
var txMsg = ENQ+'01RST\x04';
//var txMsg = '\x05\x01RST\x04';
//var txMsg = '\x0500RSS01%PW01002\x04';
var EOT		= 0x04;

// var txMsg = ENQ+txMsg1+EOT;

setInterval(function(){
	console.log('txData: ', txMsg);
	sciPort.write(txMsg,function(err){
		if(err) return console.error(err);
//  	parser.on('data',function (data){
//			console.log(data);  
//		});
	});

},2000);


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

