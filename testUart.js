
//--- serial to inverter
const SerialPort = require('serialport');
// const ByteLength = require('./byte-length');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyAMA0',{
// baudRate: 115200
   baudRate: 230400
// baudRate: 38400
});

const parser = new Readline();
port.pipe(parser);

parser.on('data',function (data){
	console.log(data);
});



setInterval(function() {

	port.write('9:4:900:0.000e+0');

},2000);
