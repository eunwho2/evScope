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
var socket    = require('./lib/socket');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var port      = process.env.PORT || '3000';


// create express application
var app = express();
app.set('port', port);

// create server
var server = require('http').Server(app);

// connect socket.io to server
var io = require('socket.io')(server);

// view engine setup
app.engine('html',cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
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

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// ================================================================
// start server
// ================================================================
console.log('http on : ' + port.toString());
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// ================================================================
// socket.io support
// ================================================================
socket.init(io);

// ================================================================
// datagram receiver
// ================================================================
receiver.init(process.env.OSCOPE_PORT || '55003',socket.send);

// =================================================================
// support functions for express
// =================================================================
/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case 'EACCES':
    console.error(bind + ' requires elevated privileges');
    process.exit(1);
    break;
  case 'EADDRINUSE':
    console.error(bind + ' is already in use');
    process.exit(1);
    break;
  default:
    throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = (typeof addr === 'string') ? 'pipe ' + addr  : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// new for debug
var count = 600;

function socketEmitSim() {
    var offset;
    var i;
    var r;
    var v;
    var buffer;
    var samples = new Int16Array(count);        // array of int16_t's to us$

  // there is a single instance of variable 'trace'.
  var trace = {
    channel         : 0,     // display channel : 1,2
    length          : 0,     // unsigned 16 bit integer, number of samples, max$
    sample          : samples
  };

    // channel 1
    offset = 0;
    buffer = new Buffer(4 + count * 2);
    buffer.writeUInt16BE(1,offset);
    offset += 2;
    buffer.writeUInt16BE(count,offset);
    offset += 2;

    // create a value between -32767 .. +32767
    r = Math.random();
    for(i=0;i<count;++i) {
        v = Math.floor(Math.sin(r/Math.PI) * 32767);
        buffer.writeInt16BE(v,offset);
        offset += 2;
        r += 1.0;
    }

	offset = 0;
	for(i=0; i < count;i++) {
        trace.sample[i] = buffer.readInt16BE(offset);
        offset += 2;
      }

	trace.channel = 1;
	trace.length  = count;

    io.emit('trace',JSON.stringify(trace));

    // channel 2
    offset = 0;
    buffer = new Buffer(4 + count * 2);
    buffer.writeUInt16BE(1,offset);
    offset += 2;
    buffer.writeUInt16BE(count,offset);
    offset += 2;

    // create a value between -32767 .. +32767
    r = Math.random();
    for(i=0;i<count;++i) {
        v = Math.floor(Math.cos(r/Math.PI) * 32767);
        buffer.writeInt16BE(v,offset);
        offset += 2;
        r += 1.0;
    }
	
	offset = 0;
	for(i=0;i<count;i++) {
        trace.sample[i] = buffer.readInt16BE(offset);
        offset += 2;
      }

	trace.channel = 2;
	trace.length  = count;

    io.emit('trace',JSON.stringify(trace));

    // channel 3
    offset = 0;
    buffer = new Buffer(4 + count * 2);
    buffer.writeUInt16BE(1,offset);
    offset += 2;
    buffer.writeUInt16BE(count,offset);
    offset += 2;

    // create a value between -32767 .. +32767
    r = Math.random();
    for(i=0;i<count;++i) {
        v = Math.floor(Math.cos(r/Math.PI+Math.PI) * 32767);
        buffer.writeInt16BE(v,offset);
        offset += 2;
        r += 1.0;
    }
	
	offset = 0;
	for(i=0;i<count;i++) {
        trace.sample[i] = buffer.readInt16BE(offset);
        offset += 2;
      }

	trace.channel = 3;
	trace.length  = count;

    io.emit('trace',JSON.stringify(trace));

    // channel 4
    offset = 0;
    buffer = new Buffer(4 + count * 2);
    buffer.writeUInt16BE(1,offset);
    offset += 2;
    buffer.writeUInt16BE(count,offset);
    offset += 2;

    // create a value between -32767 .. +32767
    r = Math.random();
    for(i=0;i<count;++i) {
        v = Math.floor(Math.sin(r/Math.PI+Math.PI) * 32767);
        buffer.writeInt16BE(v,offset);
        offset += 2;
        r += 1.0;
    }
	
	offset = 0;
	for(i=0;i<count;i++) {
        trace.sample[i] = buffer.readInt16BE(offset);
        offset += 2;
      }

	trace.channel = 4;
	trace.length  = count;

    io.emit('trace',JSON.stringify(trace));

}

setInterval(function() {
    socketEmitSim( );
},250);



