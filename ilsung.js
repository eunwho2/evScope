//"use strict";

const SerialPort = require('serialport');
const ByteLength = require('./byte-length');
const port = new SerialPort('/dev/ttyAMA0',{
// baudRate: 115200
   baudRate: 230400
// baudRate: 38400
});
const parser = port.pipe(new ByteLength({length:811}));

const eventEmitter = require('events');
class MyEmitter extends eventEmitter{};
const myEmitter = new MyEmitter();

var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var cons         = require('consolidate');

var routes    = require('./routes/index');
var users     = require('./routes/users');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var portAddr  = process.env.PORT || '3000';

//--- create express application
var app = express();
app.set('port', portAddr);

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

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var count = 0 
var channel = 0;
var dataLength = 600;

//--- start server
console.log('http on : ' + portAddr.toString());
server.listen(portAddr);

//--- socket.io support

io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);
	socket.on('disconnect', function () {
  	console.log('disconnected from : ' + host);
  });

//	socket.on('codeTable',function(from,msg){
	socket.on('codeTable',function(msg){
  	console.log('received codeTable request',msg);
  });

	socket.on('btnClick',function(msgTx){

		var digitalOut = 1;

		// digitalOutBuf = 0 ;
		// setTimeOut( console.log('out') ,1000);
  });

	//--- emitt graph proc 
	myEmitter.on('trip',function(param){
		socket.emit('trip',param);
	});		

	myEmitter.on('event',function(param){
		socket.emit('graph',param);
	});    
	//-- end of emitt grpah proc

	setInterval(function() {
		traceData.state = machineState;
		socket.emit('trace',traceData);
	},2000);
});

function getAdcData(){
  port.write('9:4:900:1.000e+2',function(err){
      if(err){
          console.error(err);
      }else{
         parser.on('data',function (data){
            var temp1 = 0;
            var temp2 = 0;
            var graphData=[[],[],[],[]];
            var count = 0;
				var i =0;

				for( i = 0 ; i < 202 ; i++ ){
					if( !(data / 2) ){ temp1 = data[i];
					} else {	temp2 = data[i];
						graphData[0].push(temp1 + temp2*256);
            	}
				}
				for( i = 202 ; i < 204 ; i++ ){
					if( !(data / 2) ){ temp1 = data[i];
					} else {	temp2 = data[i];
						graphData[1].push(temp1 + temp2*256);
            	}
				}
				for( i = 404 ; i < 606 ; i++ ){
					if( !(data / 2) ){ temp1 = data[i];
					} else {	temp2 = data[i];
						graphData[2].push(temp1 + temp2*256);
            	}
				}
				for( i = 606 ; i < 808 ; i++ ){
					if( !(data / 2) ){ temp1 = data[i];
					} else { temp2 = data[i];
						graphData[3].push(temp1 + temp2*256);
            	}
				}
         });
			myEmitter.emit('event', graphData);      
		}
	});
}

setInterval(function() {

},5000);

var exec = require('child_process').exec;

function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down gracefully.");
  server.close(function() {
    console.log("Closed out remaining connections.");
    process.exit()
  });
  
   // if after 
   setTimeout(function() {
       console.error("Could not close connections in time, forcefully shutting down");
       process.exit()
  }, 10*1000);
}

process.on('SIGTERM', function () {
    process.exit(0);
});

process.on('SIGINT', function () {
    process.exit(0);
});
 
process.on('exit', function () {
    console.log('\nShutting down, performing GPIO cleanup');
    process.exit(0);
});

