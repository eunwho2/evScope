const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyAMA0',{
   baudRate: 230400
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


parser.on('data',function (data){
	console.log('received data =' + data );
});


setInterval(function() {
	  port.write('9:4:900:0.000e+0');
},2000);
