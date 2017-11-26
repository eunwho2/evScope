module.exports = (function() {
  var io;

  /**
   * initialize the websocket connection handler
   * @param sio reference the socket.io server, passed in by the application
   */
  function init(sio, sci) {
    io = sio;
		sciPort = sci;  

    // listen for socket.io connections
    io.sockets.on('connection', function (socket) {
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
  }

  /**
   * this function is passed to the datagram receiver.js
   * it is called when a trace datagram is received
   * @param err     the receiver encountered an error
   * @param trace   trace object as defined in receiver.js
   */
  function send(err,trace) {
    // handle errors
    if (err) {
      console.log(err);
      return;
    }
    // emit a trace event to the connected client. this causes socket.io to send a websocket message
    // to the browser that is then consumed by the socket.io script on the web page
    // mark the socket.io event 'volatile' as they come very fast and can be dropped if needed
/*
    io.sockets.sockets.forEach(function(v,i,a) {
      v.volatile.emit('trace',JSON.stringify(trace));
    });
*/
	 //console.log(trace);
     io.emit('trace',JSON.stringify(trace));

  }

  // return the socket handler object
  return {
    init : init,
    send : send
  };
})();


