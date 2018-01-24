var rpio = require('rpio');

rpio.spiBegin(0);
rpio.spiChipSelect(0);
rpio.spiSetCSPolarity(0,rpio.LOW);
rpio.spiSetClockDivider(2048);
rpio.spiSetDataMode(0);

process.stdout.write('\x1b[36m');
for ( var channelHeader =0 ; channelHeader <= 7 ; channelHeader++){
	process.stdout.write('ch'+channelHeader.toString() + (channelHeader == 7 ? '\x1b[0m\n' : '\t'));
}

setInterval(function(){
		for ( var channel = 0; channel <= 7; channel++){
			//prepare Tx buffer [trigger byte = 0x01] [channel = 0x80(128)] [placeholder = 0x01]
			var sendBuffer = new Buffer([0x01,(8 + channel<<4),0x1]);
			var recieveBuffer = new Buffer(3)

			rpio.spiTransfer(sendBuffer, recieveBuffer, sendBuffer.length); // send Tx buffer and recieve Rx buffer


			// Extract value from output buffer. Ignore first byte
			var junk = recieveBuffer[0];
			var MSB	= recieveBuffer[1];
			var LSB = recieveBuffer[2];

			// Ignore first six bits of MSB, bit shift MSB 8 position and 
			// finally combine LSB and MSB to get a full 10bit value

			value = ((MSB & 3 ) << 8 ) + LSB;
			process.stdout.write(value.toString() + (channel == 7 ? '\n' : '\t'));
			//console.log(value);

	};
},1000);

process.on('SIGTERM',function () {
	process.exit(0);
});

process.on('SIGINT',function () {
	process.exit(0);
});

process.on('exit',function () {
	console.log('\nShutting down, performing GPIO cleanup');
	rpio.spiEnd();
	process.exit(0);
});

