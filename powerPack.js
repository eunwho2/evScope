//"use strict";



var inveStart = 0;
var digiOut = 0xff;

/*
var i2c				= require('i2c-bus');
var piI2c			= i2c.openSync(1);


var writeMcp23017 = function(address,port,byte){

  return new Promise(function ( resolve , reject ){

    if(port) var GPIO = 0x13;
    else     var GPIO = 0x12;

    piI2c.writeByte(address,GPIO,byte,function(err){
      if(err){
        reject(err);
      }
      else{
        resolve();
      }
    });
  });
}

var writeCmdMcp23017 = function(address,port,byte){

  return new Promise(function ( resolve , reject ){

    piI2c.writeByteSync(address,port,byte,function(err){
      if(err){
        reject(err);
      }
      else{
        resolve();
      }
    });
  });
}

//--- start of digital inout routine

var ADDR1 = 0x20;
var ADDR2 = 0x21;

writeMcp23017(ADDR1,0,0xff);

piI2c.writeByteSync(ADDR1,0,0,function(err){
	if(err) console.log(err);
});

piI2c.writeByteSync(ADDR1,1,0xff,function(err){
	if(err) console.log(err);
});

piI2c.writeByteSync(ADDR2,0,0,function(err){
	if(err) console.log(err);
});

piI2c.writeByteSync(ADDR2,1,0,function(err){
	if(err) console.log(err);
});


var readMcp23017 = function(address,port){

  return new Promise(function ( resolve , reject ){

    var GPIO = 0x12;

    if( port ) GPIO = 0x13;
    else       GPIO = 0x12;
   
    piI2c.readByte(address,GPIO,function(err,Byte){
      if(err){
        reject(err);
      }
      else{
        resolve(Byte);
      }
    });
  });
}

*/

var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyAMA0',{
   baudRate: 230400,
	databits: 8,
	parity: 'none',
	stopBits: 1,
	flowControl: false
});

const parser = new Readline();
port.pipe(parser);

port.on('open',function(err){
   if(err) return console.log('Error on write : '+ err.message);
   console.log('serial open');
});

port.on('error', function(err) {
    console.log('Error: ', err.message);
    console.log('Error Occured');
});

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


var count = 0; 
var channel = 0;
var dataLength = 600;
var traceOnOff =0;			// 1 --> send tarace data to client
var monitorOnOff =0;			// 1 --> send tarace data to client
var codeEditOnOff =0;			// 1 --> send tarace data to client
var getCodeList = 0;

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

	socket.on('traceOnOff',function(msgTx){
		codeEditOnOff = 0;
		monitorOnOff = 0;
		traceOnOff = msgTx;
		traceCount = 0;
	});

	socket.on('scope',function(msg){
		codeEditOnOff = 0;
		traceOnOff = msg;
		monitorOnOff = 0;
		console.log('traceOnOff ='+ '    ' + traceOnOff);
	});

	socket.on('codeEdit',function(msg){
		traceOnOff = 0;
		monitorOnOff = 0;
		console.log(msg);
		//setTimeout(function(){
		//port.write('9:4:000:0.000e+0');
		port.write(msg);
			codeEditOnOff = 1;
		//},100);
	});

	socket.on('getCodeList',function(msg){
		codeEditOnOff = 0;
		port.write('9:4:901:0.000e+0');
		getCodeList = 1;
	});

/*
	socket.on('btnClick',function(msgTx){
		console.log(msgTx.selVac);
		var digitalOut = 1;
		if( msgTx.selVac == 0){
			inveStart = 1;
			digiOut = digiOut & 0xfe;
			writeMcp23017(ADDR1,0,digiOut);
		}else if( msgTx.selVac == 1){
			inveStart = 0;
			digiOut = digiOut | 1;
			writeMcp23017(ADDR1,0,digiOut);
		} else if( msgTx.selVac == 2){
			testOn = true;
		} else if( msgTx.selVac == 3){
			testOn = false;
		} else if( msgTx.selVac == 4){
			digiOut = digiOut | 4;			// clear ArmOff;
			digiOut = digiOut & 0xfd;
			writeMcp23017(ADDR1,0,digiOut);
			setTimeout(function(){ 
				digiOut = digiOut | 6 ;			
				writeMcp23017(ADDR1,0,digiOut); 
			}, 5000);
		} else if( msgTx.selVac == 5){
			digiOut = digiOut | 2;			// clear ArmOff;
			digiOut = digiOut & 0xfb;
			writeMcp23017(ADDR1,0,digiOut);
			setTimeout(function(){ 
				digiOut = digiOut | 6 ;
				writeMcp23017(ADDR1,0,digiOut); 
			}, 5000);
		} else if( msgTx.selVac == 6){
			shutdown(function(output){
    			console.log(output);
			});
		} else if( msgTx.selVac == 7){
			gracefulShutdown();
		}
  });
*/

	//--- emitt graph proc 
	myEmitter.on('event',function(param){
		socket.emit('graph',param);
	});    

	myEmitter.on('monitor',function(param){
		socket.emit('monitor',param);
	});    

	myEmitter.on('codeTable',function(msg){
		socket.emit('codeTable',msg);
	});    

	myEmitter.on('codeEdit',function(msg){
		socket.emit('codeEdit',msg);
	});    
	//-- end of emitt grpah proc
/*
	setInterval(function() {
		traceData.state = machineState;
		// socket.emit('trace',traceData);
	},2000);
*/
});

var graphData=[[],[],[],[]];
var graphProcCount = 0;
var testMsg = {data:[]};
var buffer2 = new Buffer(811);
var buffer3 = new Buffer(811);

parser.on('data',function (data){
	var temp1 = 0;
	var temp2 = 0;
	var y =0;

	if(codeEditOnOff){
		console.log(data);		
		codeEditOnOff = 0;		
		myEmitter.emit('codeEdit', data);
		return;

	}else if(getCodeList){
		var tmp1 = data.split(':');
		getCodeList = 0;		
		myEmitter.emit('codeTable', data);
		return;

	}else if( traceOnOff){

		var temp1 = data[0] & 63;
		var temp2 = data[1];

		var buff = new Buffer(data);
		// var buff = new Buffer(data,'utf8');
		// console.log(buff[0],buff[1],buff[2],buff[3]);
		// console.log(data.toString());
		// console.log(data.toString('hex'));
		console.log(buff.toString('hex'));
		
/*
		temp1 = data.length-4;
		y = data.slice(temp1,temp1+4);
		var ch = y.toString();
		var tmp1 = data.split(',');
		var graphArry =[];

		// console.log(tmp1);

		for( var i = 0; i< 100; i++){
			graphArry.push( tmp1[i] * 1);
		}

		if		 ( ch[2] == '0') graphData[0] = graphArry;
		else if( ch[2] == '1') graphData[1] = graphArry;
		else if( ch[2] == '2') graphData[2] = graphArry;
		else if( ch[2] == '3'){
			graphData[3] = graphArry;
			myEmitter.emit('event', graphData);
		}      		
*/

/*

		if ( (data[1] & 1 ) !== 0 )  temp1 = temp1 + 64;
		if ( (data[1] & 2 ) !== 0 )  temp1 = temp1 + 128;

		var temp3 = temp2 & 63;
		var temp4 = temp3 >> 2;
		
		temp1 = temp1 + temp4 * 256;

		console.log('data[0] = ' + data[0] + '  :  ' + 'data[1] = ' + data[1]);
		// console.log('received scope data = '+temp1);

*/
		return;

	}else if(monitorOnOff){
		myEmitter.emit('monitor', data);
		return;
	}else{
		console.log(data);
		return;
	}	
	return;

});

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}


function printLine(){
}



setInterval(function(){
	var stamp = new Date().toLocaleString();
	console.log(stamp);
},10000);



//--- start of main routune
// digital out proc 

/*
setInterval(function() {

	// 0 --> relay ON
	digiOut = (inveStart) ? digiOut & 0xfe : digiOut | 1 ;
	writeMcp23017(ADDR1,0,digiOut);


	var promise = readMcp23017(ADDR1,1); //외부 입력을 읽음

	promise
	.then(function(byte){
		console.log(byte);

	}).catch(function(err){
		console.log(err);
	});

},1000);
*/

setInterval(function() {
	if(traceOnOff){
	  port.write('9:4:900:1.000e+2');
	}else if(monitorOnOff){
	  port.write('9:4:900:0.000e+0');
	}

},4000);

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

