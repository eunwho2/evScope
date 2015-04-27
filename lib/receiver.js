"use strict";

// require node.js datagram and assert modules
var dgram  = require('dgram');
var assert = require('assert');

/**
 *  node-scope UDP datagram receiver
* Since this is a UDP receiver, it doesn't have connections. It will receive from any source (or multiple sources)
* and it will continue running until the application quits.
* Because node is single threaded a single instance of 'trace' is good enough
* it gets updated whenever a message is received and pased on via the callback. I suppose
* this limits memory allocation churn.
* If it makes sense a new trace object could be allocated for each message.
*/
module.exports = (function() {
  var MAX_SAMPLES = 600;                            // sized so one trace message can fit in an ethernet MTU
  var sock;                                         // socket to receive messages on
  var samples = new Int16Array(MAX_SAMPLES);        // array of int16_t's to use in the trace

  // there is a single instance of variable 'trace'.
  var trace = {
    channel         : 0,     // display channel : 1,2
    length          : 0,     // unsigned 16 bit integer, number of samples, maximum 600
    sample          : samples
  };

  /**
   * initialize the receiver
   * @param port           : ip port to listen for messages
   * @param trace_callback : called when a trace is received or on error : trace_callback(err,trace)
   */
  function init(port,trace_callback) {

    // needs a port and a callback
    assert.ok(port,"port not defined");
    assert.ok(trace_callback,"trace_callback not defined");

    // create the datagram socket
    sock = dgram.createSocket('udp4');

    // handle socket errors
    sock.on("error",function(err) {
      trace_callback(err);
      sock.close();
    });

    /**
     * receive a message from the embedded system, deconstruct it and pass it on
     * via the trace_callback.      *
     */
    // a
    sock.on("message",function(data,rinfo){
      var offset; // position in the message buffer
      var len;    // number of samples to read from the data buffer
      var i;      // loop index

      // use 'rinfo' if you want to see who sent the message

      // 'data' is a mode Buffer. use the node.js API for reading binary data from a Buffer
      trace.channel        = data.readUInt16BE(0);
      trace.length         = data.readUInt16BE(2);
      trace.sample         = samples;              // reset the sample field to the int16 array in case the callback function changed its value

      // limit max length (should this be an error?)
      len = Math.min(trace.length,MAX_SAMPLES);

      // get samples
      offset = 4;
      for(i=0;i<len;i++) {
        trace.sample[i] = data.readInt16BE(offset);
        offset += 2;
      }

      // callback to output handler
      trace_callback(null,trace);
    });

    sock.on("listening",function(){
      console.log("receiver : listening on port " + port);
    });

    // bind to the expected port
    sock.bind(port,function() {
      console.log('bound to ' + port);
    });

  }

  return {
    init : init
  };
})();
