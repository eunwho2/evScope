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

	setInterval(function() {
		socket.emit('trace',traceData0);
	},1000);
});


var rpio = require('rpio');

rpio.spiBegin(0);
rpio.spiChipSelect(0);
rpio.spiSetCSPolarity(0,rpio.LOW);
rpio.spiSetClockDivider(2048);
rpio.spiSetDataMode(0);

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

const dataLength = 600;

var inMcp23017=[0,0,0,0];

var count = 0 
var channel = 0;


var traceData0 = { channel:0,length:dataLength,sample:[dataLength]}
var traceData1 = { channel:1,sample:[600]}
var traceData2 = { channel:2,sample:[600]}
var adcValue = [0,0,0,0,0,0,0,0];

for ( var key in traceData0.sample ){
	traceData0.sample[key] = traceData1.sample[key] = traceData2.sample[key]=0;
}

//	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 

setInterval(function() {

	inMcp23017[0] = dIn10.readPort(0);
	dOut10.writePort(0,~inMcp23017[0]);

	inMcp23017[1] = dIn10.readPort(1);
	dOut10.writePort(1,~inMcp23017[1]);

	inMcp23017[2] = dIn11.readPort(0);
	dOut11.writePort(0,~inMcp23017[2]);

	inMcp23017[3] = dIn11.readPort(1);
	dOut11.writePort(1,~inMcp23017[3]);
	
  for ( var channel = 0; channel <= 7; channel++){
		//prepare Tx buffer [trigger byte = 0x01] [channel = 0x80(128)] [placeholder = 0x01]
    var sendBuffer = new Buffer([0x01,(8 + channel<<4),0x1]);
    var recieveBuffer = new Buffer(3)
		rpio.spiTransfer(sendBuffer, recieveBuffer, sendBuffer.length); // send Tx buffer and recieve Rx buffer

    // Extract value from output buffer. Ignore first byte
    var junk = recieveBuffer[0];
    var MSB = recieveBuffer[1];
    var LSB = recieveBuffer[2];

    // Ignore first six bits of MSB, bit shift MSB 8 position and 
    // finally combine LSB and MSB to get a full 10bit value

    var value = ((MSB & 3 ) << 8 ) + LSB;
		adcValue[channel] = value;
		// process.stdout.write(value.toString() + (channel == 7 ? '\n' : '\t'));
  };

	traceData0.sample[count] = adcValue[0];
	traceData1.sample[count] = adcValue[1];
	traceData2.sample[count] = adcValue[2];
 
	count = (channel > 598 ) ? 0 : count+1; 
	channel = (channel > 6 ) ? 0 : channel+1; 
	
	if(( count % 4 ) == 0){
		console.log('count = ', count);
	  for ( var i = 0; i <= 7; i ++){
	    process.stdout.write(adcValue[i].toString() + (i == 7 ? '\n' : '\t'));
		}
	  for ( var i = 0; i <= 3; i ++){
	    process.stdout.write(inMcp23017[i].toString() + (i == 3 ? '\n' : '\t'));
		}
	}
},250);

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
