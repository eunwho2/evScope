
//--- start the client application
var noVac = 1;
var socket = io.connect();
var messages = 0;

const dataLength = 600;

var graphCount = 0;

var graphData = new Array();

graphData[0] = { channel:0,length:dataLength,sample:[dataLength]};
graphData[1] = { channel:1,length:dataLength,sample:[dataLength]};
graphData[2] = { channel:2,length:dataLength,sample:[dataLength]};
graphData[3] = { channel:3,length:dataLength,sample:[dataLength]};

var scopeData = new Array();

scopeData[0] = { channel:0,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[1] = { channel:1,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[2] = { channel:2,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[3] = { channel:3,length:dataLength,sample:[NO_SCOPE_DATA]};


// var inputOffset = [1817,1817,2121,2009];

function graphClear(){
   for( var j = 0 ; j < 4 ; j++){
      for( var i = 0 ; i < 600 ; i++ ) graphData[j].sample[i] = 2048;
   }
   graphCount = 0;
   graphInverter.onPaint(graphData);
}

function scopeClear(){
   for( var j = 0 ; j < 4 ; j++){
      for( var i = 0 ; i < NO_SCOPE_DATA ; i++ )   scopeData[j].sample[i] = 2048;
   }
   graphInverter.onPaint(scopeData);
}

var gaugeSpeed={id:'gauge1',unit:'[RPM]',title:'Speed',min:0,max:2000,
mTick:[0,500,1000,1500,2000],
alarm:'[ {"from": 0, "to":1000,"color": "rgba(255,255,255,1.0)"},{"from": 1000,"to":1800, "color": "rgba(0,255,0,1)"},{"from":1800 ,"to":2000, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugePower={id:'gauge2',unit:'[kW]',title:'Power',min:0,max:5,
mTick:[0,1,2,3,4,5],
alarm:'[ {"from": 0, "to":2.2,"color": "rgba(255,255,255,1.0)"},{"from": 2.2,  "to":3.0, "color": "rgba(255,0,0,.3)"},{"from": 3.0,  "to":5.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI={id:'gauge3',unit:'[A]',title:'I_ac',min:0,max:20,
mTick:[0,5,10,15,20],
alarm:'[ {"from": 0, "to":10.0,"color": "rgba(255,255,255,1.0)"},{"from": 10.0,  "to":15.0, "color": "rgba(255,0,0,.3)"},{"from": 15.0,  "to":20.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeQ={id:'gauge4',unit:'[kW]',title:'Q kW',min:0,max:5,
mTick:[0,1,2,3,4,5],
alarm:'[ {"from": 0, "to":2.2,"color": "rgba(255,255,255,1.0)"},{"from": 2.2,  "to":3.0, "color": "rgba(255,0,0,.3)"},{"from": 3.0,  "to":5.0, "color": "rgba(255,0,0,1.0)"}]'
}

function gaugeInit(arg){
   var a = 'canvas[id=' + arg.id + ']';

   $(a).attr('data-units',arg.unit);
   $(a).attr('data-title',arg.title);
   $(a).attr('data-min-value',arg.min);
   $(a).attr('data-max-value',arg.max);
   $(a).attr('data-major-ticks',arg.mTick);
// $(a).attr('data-minor-ticks',5);
   $(a).attr('data-stroke-ticks',true);
   $(a).attr('data-highlights',arg.alarm);
}

$("document").ready(function() {
  if (oscope) {
    oscope.init();
  }
   var dummy = {0:0};

   graphInverter.init();

   gaugeInit(gaugeSpeed);
   gaugeInit(gaugePower);
   gaugeInit(gaugeI);
   gaugeInit(gaugeQ);

});



function btnStartGraph(){

   graphClear();
   socket.emit('graph',1);
}

function btnStopGraph(){
   // onOff = 0 --> stop send grpah data 
   socket.emit('graph',0);
}

function btnStartScope(){
   scopeClear();
   socket.emit('scope',1);
}

function btnStopScope(){
   socket.emit('scope',0);
}

function btnRunMotor(){
   cmd = '9:4:905:0.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnStopMotor(){
   msgTx.selVac = 1;
   socket.emit('btnClick',msgTx);
   cmd = '9:4:905:1.000e+0';  // sciCmdStop
   socket.emit('codeEdit',cmd);
}

function btnStartTest(){
   msgTx.selVac = 2;
   socket.emit('btnClick',msgTx);
}

function btnStopTest(){
   msgTx.selVac = 3;
   socket.emit('btnClick',msgTx);
}

function btnSpeedUp(){
   cmd = '9:4:905:2.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnSpeedDown(){
   cmd = '9:4:905:3.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnShutDown(){
   msgTx.selVac = 6;
   socket.emit('btnClick',msgTx);
}

function btnRestart(){
   msgTx.selVac = 7;
   socket.emit('btnClick',msgTx);
}

function sendSetScopeChCmd(ch,point,scale,offset){

   var returns = 'Invalid number';

   var addr = 101 + 3*ch;
   var sciCmd = '9:6:'+addr+':';
   var codeData = (point*1.0).toExponential(3);

   var setPoint = sciCmd + codeData;

   if( setPoint.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setPoint ;
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Point command =', setPoint);
      socket.emit('codeEdit',setPoint);
   },500);

   //--- setScale
   addr = 102 + 3*ch;
   sciCmd = '9:6:'+addr+':';
   codeData = (scale*1.0).toExponential(3);
   var setScale = sciCmd + codeData;

   if( setScale.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setScale ;
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Scale command =', setScale);
      socket.emit('codeEdit',setScale);
   },1000);

   //--- setOffset
   addr = 103 + 3*ch;
   sciCmd = '9:6:'+addr+':';
   codeData = (offset*1.0).toExponential(3);
   var setOffset = sciCmd + codeData;

   if( setOffset.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setOffse$
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Offset command =', setOffset);
      socket.emit('codeEdit',setOffset);
   },1500);
}

var msgTx = { selVac: 0};
var traceOnOff = 0;
var monitorOnOff = 0;

var ch1_list = document.getElementsByName('ch1_list1_list2')[0];
var ch2_list = document.getElementsByName('ch2_list1_list2')[0];
var ch3_list = document.getElementsByName('ch3_list1_list2')[0];
var ch4_list = document.getElementsByName('ch4_list1_list2')[0];

var ChList = new Array();
ChList[0] ='';
ChList[1] = ['U|4','V|5','W|6','d|0','q|1','D|2','Q|3'];
ChList[2] = ['U|11','V|12','W|13','d|7','q|8','D|9','Q|10'];
ChList[3] = ['Iu|14','Iv|15','se|18','cmd|19','Vdc|16','T|17'];
ChList[4] = ['U|20','V|21','W|22'];
ChList[5] = ['Theta|30','ThetaM|31','sinTheta|32','cosTheta|33','we|34','wr|35','wr_m|36'];

function updateCh1Select(selectedGroup){
    if (selectedGroup>0){
        for (var i=0; i < ChList[selectedGroup].length; i++)
            ch1_list.options[i]=new Option(ChList[selectedGroup][i].split("|")[0], ChList[selectedGroup][i].split("|")[1]);
    }
}

function updateCh2Select(selectedGroup){
    if (selectedGroup>0){
        for (i=0; i < ChList[selectedGroup].length; i++)
            ch2_list.options[i]=new Option(ChList[selectedGroup][i].split("|")[0], ChList[selectedGroup][i].split("|")[1]);
    }
}

function updateCh3Select(selectedGroup){
    if (selectedGroup>0){
        for (i=0; i < ChList[selectedGroup].length; i++)
            ch3_list.options[i]=new Option(ChList[selectedGroup][i].split("|")[0], ChList[selectedGroup][i].split("|")[1]);
    }
}

function updateCh4Select(selectedGroup){
    ch4_list.options.length=0;
    if (selectedGroup>0){
        for (i=0; i < ChList[selectedGroup].length; i++)
            ch4_list.options[i]=new Option(ChList[selectedGroup][i].split("|")[0], ChList[selectedGroup][i].split("|")[1]);
    }
}

var chSelected = new Array();
chSelected[0] = 0;
chSelected[1] = 1;
chSelected[2] = 2;
chSelected[3] = 3;
chSelected[4] = 4;
chSelected[5] = 5;

function selectScopeCh(ch, selected){
   chSelected[ch] = selected;
}

function setScopeCh(ch){

   var chanel = ch+1;
   var selector = document.getElementById("idScaleCh"+chanel);
   var scale = selector[selector.selectedIndex].value;

   var setId = "idOffsetCh"+chanel;
   console.log("setId = ",setId); 
   var offset = document.getElementById(setId).value;

   console.log(chSelected[ch],scale,offset);
   sendSetScopeChCmd(ch,chSelected[ch],scale,offset);
}
// '9:4:901:0.000e+0'
function getSciCmd( ){

   var returns = 'Invalid number';
   var tmp1 = document.getElementById('txtCodeEdit1').value;
   var tmp2 = document.getElementById('txtCodeEdit2').value;

   tmp1 = tmp1 * 1;
   tmp2 = tmp2 * 1;

   if(isNaN(tmp1)) return returns;
   if(isNaN(tmp2)) return returns;
   if(( tmp1 > 990 ) || ( tmp1 < 0 )) return returns;

   var sciCmd = '9:4:';
   if(tmp1 < 10){
      sciCmd = sciCmd + '00';
   } else if ( tmp1 < 100 ){ 
      sciCmd = sciCmd + '0';
   }

   sciCmd = sciCmd + tmp1 + ':';

   var codeData = tmp2.toExponential(3);
   
   sciCmd = sciCmd + codeData;

   if((sciCmd.length) != 16) return returns;

   return sciCmd;
}
function btnReadCode(){ 
   var returns = getSciCmd( );

   //console.log(returns);

   if( returns.length == 16 ){
      socket.emit('codeEdit',returns);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnWriteCode(){
   var returns = getSciCmd( );

   if( returns.length == 16 ){
      var test = returns.replace('4','6');
      socket.emit('codeEdit',test);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnOptionSendCmd(){
   var selector = document.getElementById("idCmdSelect");
   var value = selector[selector.selectedIndex].value;
   var cmd = '9:4:902:5.000e+0';

   if(value == 0 ){
      cmd = '9:4:910:0.000e+0';  // read adc
      socket.emit('codeEdit',cmd);
   } else if(value == 1) { 
      cmd = '9:4:909:0.000e+0';  // read RPM
      socket.emit('codeEdit',cmd);
   } else if(value == 2) { 
      cmd = '9:4:902:5.000e+0';  // RESET
      socket.emit('codeEdit',cmd);
   } else if(value == 3) {          // READ ALL CODE
      cmd = '9:4:901:0.000e+0';  
      socket.emit('codeEdit',cmd);
   } else if(value == 4) { 
      cmd = '9:6:900:4.000e+1';  // save
      socket.emit('codeEdit',cmd);
   } else if(value == 5) { 
      cmd = '9:6:900:9.000e+1';  // reset all codes to factory setting
      socket.emit('codeEdit',cmd);
   } else if(value == 6) { 
      cmd = '9:4:900:1.000e+1';  // read trip record
      socket.emit('codeEdit',cmd);
   }
}


 // =============================================
  // canvas mouse event for cursor drag
  // =============================================
  var mouse_state = 0;
  $('#oscope').on('mousedown',function(event) {
    mouse_state = 1;

    oscope.onCursorMove(event.offsetX,event.offsetY);
  });

  $('#oscope').on('mouseup',function() {
    mouse_state = 0;

  });

  $('#oscope').on('mouseout',function() {
    mouse_state = 0;
  });

  $('#oscope').on('mousemove',function(event) {
    switch(mouse_state) {
    case 0:
      // do nothing
      break;
    case 1:
      oscope.onCursorMove(event.offsetX,event.offsetY);
      var temp = (225 - event.offsetY) * 4096 / 450;
      var x = document.getElementById('vcursor1').checked;

      if( x ) {
         document.getElementById('curVerStartPosi').innerHTML = parseInt(temp);
      }else{
         document.getElementById('curVerEndPosi').innerHTML = parseInt(temp);
      }
      break;
    }
  });

socket.on('scope', function (msg) {


   var chanel = msg.Ch - 49;

   console.log('received scope data chanel = '+ chanel);
   scopeData[chanel].sample = msg.data ;

   if(chanel == 3 ){ 
      oscope.onPaint(scopeData);
   }

});

socket.on('disconnect',function() {
  console.log('disconnected');
});

socket.on('message',function(msg){
   document.getElementById('codeEditResult').innerHTML = msg;
});   

socket.on('codeList', function (msg) {

   var msg1 = msg.substr(17);          // subtract uart command '9:6:900:5.000e+1:'
   var testIn = msg1.toString();
   
   //testIn.replace(/:,/g,'\r\n');
   var testIn1 = testIn.replace(/:/g,'\r\n');
   var testOut = testIn1.replace(/,/g,'\t');
   document.getElementById('txtCodeTable').innerHTML = testOut;
});

socket.on('trace', function (msg) {

   console.log(msg);
  // oscope.onPaint(trace);

});

socket.on('graph', function (msg) {
 
   console.log('rpm =',msg.rpm,'Irms =',msg.Irms,'P_total =',msg.P_total,' RePower = ',msg.RePower,'ImPower = ',msg.ImPower);
   graphCount = ( graphCount < 600 ) ? graphCount + 1 : 0 ;

   graphData[0].sample[graphCount] = msg.rpm ; 
   graphData[1].sample[graphCount] = msg.Irms ; 
   graphData[2].sample[graphCount] = msg.P_total; 
   graphData[3].sample[graphCount] = msg.ImPower; 
   graphInverter.onPaint(graphData);
//convert to
   var speed =    ((msg.rpm      -2048)/ 2048) * 2000;
   var power =    ((msg.P_total  -2048)/ 2048) * 10;
   var I_rms =    ((msg.Irms     -2048)/ 2048) * 20;
   var Q_power =  ((msg.ImPower  -2048)/ 2048) * 10;

   $('#gauge1').attr('data-value', speed);
   $('#gauge2').attr('data-value', power);
   $('#gauge3').attr('data-value', I_rms);
   $('#gauge4').attr('data-value', Q_power);
});



//--- end of ctrl.js
