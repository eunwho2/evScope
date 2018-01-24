var mcpadc = require('mcp-spi-adc');

var tempSensor = mcpadc.open(1, {speedHz: 20000}, function (err) {
  if (err) throw err;

  setInterval(function () {
    tempSensor.read(function (err, reading) {
      if (err) throw err;

      console.log(reading.value);
    });
  }, 1000);
});
