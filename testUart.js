const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyAMA0',{
//   baudRate: 230400
   baudRate: 115200
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

//	var buff = new Buffer(data,'utf8');

	var buff2 = data.substr(24);
	var buff = new Buffer(buff2,'utf8');

	console.log('received data =' + buff.toString('hex'));

	var i = 0;
	var lsb = (buff[ i*3 + 2] & 0x0f) * 1 + (buff[i*3 + 1] & 0x0f) * 16;
	var msb = ( buff[i*3] & 0x0f ) * 256;
	var tmp = msb + lsb;
	console.log ( ' rpm = ', tmp );


	i = 1;
	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1]  & 0x0f) * 16;
	msb = ( buff[i*3] & 0x0f ) * 256;
	tmp = msb + lsb;
	console.log ( ' Irms = ', tmp );

	i = 2;
	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
	msb = ( buff[i*3] & 0x0f ) * 256;
	tmp = msb + lsb;
	console.log ( ' P_total = ', tmp );

	i = 3;
	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
	msb = ( buff[i*3] & 0x0f ) * 256;
	tmp = msb + lsb;
	console.log ( ' P_power = ', tmp );

	i = 4;
	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
	msb = ( buff[i*3] & 0x0f ) * 256;
	tmp = msb + lsb;
	console.log ( ' Q_power = ', tmp );	

});


setInterval(function() {
	  port.write('9:4:900:0.000e+0');
},3000);
