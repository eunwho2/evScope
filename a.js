var iopi =require('./ABElectronics_NodeJS_Libraries/lib/iopi/iopi');

var dIn10 = new iopi(0x20);
var dIn11 = new iopi(0x21);

dIn10.setPortDirection(0,0xff);
dIn10.setPortDirection(1,0xff);

dIn11.setPortDirection(0,0xff);
dIn11.setPortDirection(1,0xff);

var dOut10 = new iopi(0x22);
var dOut11 = new iopi(0x23);

dOut10.setPortDirection(0,0x00);
dOut10.setPortDirection(1,0x00);

dOut11.setPortDirection(0,0x00);
dOut11.setPortDirection(1,0x00);


setInterval(function() {

  var portVal= dIn10.readPort(0);
  console.log('dIn10_0 : %d',portVal);
  dOut10.writePort(0,~portVal);

  portVal = dIn10.readPort(1);
  console.log('dIn10_1 : %b',portVal);
  dOut10.writePort(1,~portVal);

  portVal = dIn11.readPort(0);
  console.log('dIn11_0 : %b',portVal);
  dOut11.writePort(0,~portVal);

  portVal = dIn11.readPort(1);
  console.log('dIn11_1 : %b',portVal);
  dOut11.writePort(1,~portVal);

},1000);


