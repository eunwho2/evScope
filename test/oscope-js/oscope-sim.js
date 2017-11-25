"use strict";

var udp = require('dgram');

var m_count   = 600;
var m_ipaddr  = "127.0.0.1";
var m_port    = 55003;

function oscope_sim(socket,ipaddr,port,count) {
    var offset;
    var i;
    var r;
    var v;
    var buffer;

    // channel 1
    offset = 0;
    buffer = new Buffer(4 + m_count * 2);
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
    socket.send(buffer,0,offset,port,ipaddr);

    // channel 2
    offset = 0;
    buffer = new Buffer(4 + m_count * 2);
    buffer.writeUInt16BE(2,offset);
    offset += 2;
    buffer.writeUInt16BE(count,offset);
    offset += 2;

    // create a value between -32767 .. +32767
    r = Math.random();
    for(i=0;i<count;++i) {
        v = Math.floor((Math.sin(r + Math.random())/Math.PI) * 58000);
        buffer.writeInt16BE(v,offset);
        offset += 2;
        r += 1.0;
    }
	// socket.send(buffer,0,offset,port,ipaddr);
	io.emit('trace',JSON.stringify(trace));
}

var m_sock = udp.createSocket('udp4');

m_sock.on('error',function(error) {console.log(error);});

setInterval(function() {
    oscope_sim(m_sock,m_ipaddr,m_port,m_count);
},250);

