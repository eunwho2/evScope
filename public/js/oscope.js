"use strict";

var oscope = (function() {
  var m_canvas;
  var m_context;
  var m_width;
  var m_height;
  var m_h2;
  var m_trace = [];
  var m_voffset = [];
  // these must match the initial values of the controls
  // doh! no two way data bindind
  var mSecPerDiv		   = 0.100;
  var m_samples_per_second = 600;
  var m_divisions          = 10;
  var m_yscale             = 1024;
  var m_sample_bits        = 10;
  var m_volts_per_div      = 2.5;
  var m_vrange             = 5;
  var m_cursor_index       = 2;
  var m_cursor_seconds     = 0.0;
  var m_cursor_volts       = 0.0;
  var m_run                = true;
  var m_size_index         = 0;
  var m_text_size          = 12;
  var m_updates            = 0;

  m_trace[0]           = null;
  m_trace[1]           = null;
  m_trace[2]           = null;
  m_trace[3]           = null;

  m_voffset[0]         = 0;
  m_voffset[1]         = 0;
  m_voffset[2]         = 0;
  m_voffset[3]         = 0;

  // ==============================================================
  // background display scaffolding
  // ==============================================================
  var outline_base = [
    [0.0,0.0],
    [1.0,0.0],
    [1.0,1.0],
    [0.0,1.0],
    [0.0,0.0]
  ];
  var outline;

  var xaxis_base = [
    [0.0,5.0/10.0,1.0,5.0/10.0], // channel 1
    [0.0,5.0/10.0,1.0,5.0/10.0]  // channel 2
  ];
  var xaxis;

  var vdiv_base  =  1.0/10.0;
  var vdiv;

  var mid_div_base = [
    0.0,5.0/10.0,1.0,5.0/10.0
  ];
  var mid_div = [0,0,0,0];

  var hgrid_base = [
    [0.0,1.0/10.0,1.0,1.0/10.0],
    [0.0,2.0/10.0,1.0,2.0/10.0],
    [0.0,3.0/10.0,1.0,3.0/10.0],
    [0.0,4.0/10.0,1.0,4.0/10.0],
    [0.0,5.0/10.0,1.0,5.0/10.0],
    [0.0,6.0/10.0,1.0,6.0/10.0],
    [0.0,7.0/10.0,1.0,7.0/10.0],
    [0.0,8.0/10.0,1.0,8.0/10.0],
    [0.0,9.0/10.0,1.0,9.0/10.0],
  ];var hgrid;

  var vgrid_base = [
    [1.0/10.0,0.0,1.0/10.0,1.0],
    [2.0/10.0,0.0,2.0/10.0,1.0],
    [3.0/10.0,0.0,3.0/10.0,1.0],
    [4.0/10.0,0.0,4.0/10.0,1.0],
    [5.0/10.0,0.0,5.0/10.0,1.0],
    [6.0/10.0,0.0,6.0/10.0,1.0],
    [7.0/10.0,0.0,7.0/10.0,1.0],
    [8.0/10.0,0.0,8.0/10.0,1.0],
    [9.0/10.0,0.0,9.0/10.0,1.0]
  ];
  var vgrid;

  var cursor_base = [
    [0.0,0.0,0.0,1.0],  // 0 horizontal
    [0.0,0.0,0.0,1.0],  // 1 horizontal
    [0.0,0.0,1.0,0.0],  // 2 vertical
    [0.0,0.0,1.0,0.0],  // 3 vertical
  ];
  var m_cursor;

  // responsive sizes for canvas
  // aspect ratio of available sizes needs to be 4 over 3
  // and must fit the twitter boostrap grid size allocated
  var canvas_size = [
    {width:600,height:450},
    {width:400,height:300},
    {width:200,height:150}
  ];

  // responsive text size
  var text_size = [
      12,
      8,
      6
  ];

  function getCanvasSize(window_height,parent_width,parent_height) {
    var r;
    if (window_height > parent_height) {
      parent_height = window_height;
    }
    var s = canvas_size.filter(function(v) {
      return ((v.width < parent_width)&&(v.height < parent_height));
    });

    // if nothing matches
    if (s.length <= 0) {
      // use the smallest
      r = s[2];
    }
    else {
      // use first fit
      r = s[0];
    }

    return r;
  }

  function getTextSize(width) {
    var s;

    s = canvas_size.reduce(function(p,v,i) {
      return (width <= v.width) ? text_size[i] : p;
    },text_size[2]);

    return s;
  }

  function rescale(w,h) {
    // rescale horizontal divisions
    hgrid = hgrid_base.map(function (v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // rescale vertical division size
    vdiv = vdiv_base * h;

    // rescale vertical divisions
    vgrid = vgrid_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // scale channel axes
    xaxis = xaxis_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // rescale outline
    outline = outline_base.map(function(v) {
      var d = [0,0];
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      return d;
    });

    // rescale cursor
    m_cursor = cursor_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // rescale mid divider
    mid_div[0] = mid_div_base[0] * w;
    mid_div[1] = mid_div_base[1] * h;
    mid_div[2] = mid_div_base[2] * w;
    mid_div[3] = mid_div_base[3] * h;
  }

  function clear(ctx,width,height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,width,height);
  }

  function drawLine(ctx,line)  {
      ctx.beginPath();
      ctx.moveTo(line[0],line[1]);
      ctx.lineTo(line[2],line[3]);
      ctx.stroke();
  }

  function drawLines(ctx,lines) {
    lines.forEach(function(v) {
      drawLine(ctx,v);
    });
  }

  function drawPath(ctx,path) {
    ctx.beginPath();
    ctx.moveTo(path[0][0],path[0][1]);
    path.slice(1).forEach(function(v) {
      ctx.lineTo(v[0],v[1]);
    });
    ctx.stroke();
  }

  function drawBackground(ctx,width,height,voffset) {
    // clear background
    clear(ctx,width,height);

    // draw geometry with cartesian coordinates (0,0) lower left
    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // draw the outline
    ctx.save();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth   = 6;
    drawPath(ctx,outline);
    ctx.restore();

    // draw the grid
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([1,1]);
    drawLines(ctx,hgrid);
    drawLines(ctx,vgrid);
    ctx.restore();

    // draw the x axes
    ctx.save();
    ctx.translate(0,voffset[0]);
    ctx.strokeStyle = "magenta";
    ctx.lineWidth   = 1;
    drawLine(ctx,xaxis[0]);
    ctx.restore();

    ctx.save();
    ctx.translate(0,voffset[1]);
    ctx.strokeStyle = "yellow";
    ctx.lineWidth   = 1;
    drawLine(ctx,xaxis[1]);
    ctx.restore();

    // draw the cursors
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "blue";
    drawLine(ctx,m_cursor[0]);
    drawLine(ctx,m_cursor[2]);
    ctx.strokeStyle = "orange";
    drawLine(ctx,m_cursor[1]);
    drawLine(ctx,m_cursor[3]);
    ctx.restore();

    ctx.restore();
  }

  function drawAnnotations(ctx,width,height,dy)
  {
    var t;
    var y;

    ctx.font = dy.toFixed(0) + "px monospace";
    ctx.fillStyle = "lime";
    y = dy + 1;

    ctx.fillText('sec/div     = ' + (mSecPerDiv*1.0).toFixed(3) + '     dS = ' + m_cursor_seconds.toFixed(4),2,y);

    y += dy + 1;
    ctx.fillText('volts/div   = ' + m_volts_per_div.toFixed(4)   + '    dV = ' + m_cursor_volts.toFixed(4) ,2,y);

    t = (m_run) ? ("RUN : " + m_updates.toFixed(0)) : "STOP";
    ctx.fillStyle = (m_run) ? 'lime' : 'red';
    ctx.fillText(t,2,height-4);
  }

  function computeVerticalScale(vrange,yscale,height,volts) {
    // divide by 2 to make scale for signed value
    return (vrange / yscale) * (height / volts) * 0.5;
  }

  function computeHorizontalScale(seconds,samples_per_second,width) {
    return width / (seconds * samples_per_second);
  }

  function drawTrace(ctx,trace,width,height,voffset) {
    var t = [];
    var ys;
    var hs;
    var i;

    // compute scale factors
    ys = computeVerticalScale(m_vrange,m_yscale,m_height,m_volts_per_div*10);
    hs = computeHorizontalScale(mSecPerDiv*m_divisions,m_samples_per_second,m_width);

    // compute horizonal scale

    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // set channel parameters
    switch(trace.channel) {
    case 0:
      ctx.translate(xaxis[0][0],xaxis[0][1] + voffset);
      ctx.strokeStyle = "yellow";
      break;
    case 1:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "blue";
      break;
    case 2:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "magenta";
      break;
    case 3:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "green";
      break;
    }
    
    // scale the trace y axis
    // samples are Int16Array
    for(i=0;i<trace.length;++i) {
      t.push([i*hs,trace.sample[i] * ys]);
    }

    // draw it
    drawPath(ctx,t);
    
    ctx.restore();    
    // restore context
  }

  function onPaint(trace) {
    // draw oscope background
    drawBackground(m_context,m_width,m_height,m_voffset);

    // update trace if running and there is a new trace
    if (m_run & (trace !== null)) {
      // count updates
      m_updates++;
      // store the trace by channel
//      m_trace[trace.channel] = trace;
      m_trace[0] = trace[0];
      m_trace[1] = trace[1];
      m_trace[2] = trace[2];
    }

    // draw last traces
    if (m_trace[0] !== null) {
      drawTrace(m_context, m_trace[0], m_width, m_height, m_voffset[0]);
    }
    if (m_trace[1] !== null) {
      drawTrace(m_context, m_trace[1], m_width, m_height, m_voffset[1]);
    }
    if (m_trace[2] !== null) {
      drawTrace(m_context, m_trace[2], m_width, m_height, m_voffset[2]);
    }
    // draw text annotations
    drawAnnotations(m_context,m_width,m_height,m_text_size);
  }

  function onSampleBits(bits) {
    switch(bits) {
    case 8:
      m_sample_bits = 8;
      m_yscale      = 128;
      break;
		case 10:
      m_sample_bits = 10;
      m_yscale      = 512;
      break;
    case 12:
      m_sample_bits = 12;
      m_yscale      = 2048;
      break;
    case 16:
      m_sample_bits = 16;
      m_yscale      = 32768;
      break;
    default:
      m_sample_bits = 16;
      m_yscale      = 32768;
      break;
    }
    onPaint(null);
  }

  function onVerticalOffset(channel,offset)
  {
    if ((offset < -4)||(4 < offset)) {
      return;
    }
    m_voffset[channel-1] = offset * vdiv;
    onPaint(null);
  }

  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;

    updateCursorDiff();
    onPaint(null);
  }

  function onSecondsPerDiv(seconds) {
    mSecPerDiv = seconds;

    updateCursorDiff();
    onPaint(null);
  }

  /**
   * event handler for samples per second
   * @param samples_per_second
   */
  function onSamplesPerSecond(samples_per_second) {
    // no zero or negative
    if (samples_per_second < Number.MIN_VALUE) {
      m_samples_per_second = 600;
    }
    else {
      // rate is in samples/second
      m_samples_per_second = samples_per_second;
    }
    onPaint(null);
  }

  /**
   * set voltage range (maximum volts per sample)
   * @param vrange
   */
  function onVoltageRange(vrange) {
    m_vrange = vrange;
    onPaint(null);
  }

  function updateCursorDiff() {
    // compute current cursor diff in seconds
    m_cursor_seconds = Math.abs(m_cursor[0][0] - m_cursor[1][0]) * (mSecPerDiv * 10.0 / m_width);
    m_cursor_volts   = Math.abs(m_cursor[2][1] - m_cursor[3][1]) * (m_volts_per_div   * 10.0 / m_height);
  }

  function onCursorMove(x,y) {
    var cursor = m_cursor[m_cursor_index];
    switch(m_cursor_index) {
    case 0:
    case 1:
      cursor[0] = x;
      cursor[2] = x;
      break;
    case 2:
    case 3:
      cursor[1] = m_height - y;
      cursor[3] = m_height - y;
      break;
    }

    updateCursorDiff();
    onPaint(null);
  }

  function onCursorSelect(index) {
    m_cursor_index = index;
  }

  function onRunStop(run) {
    m_run = run;
  }

  function onResize() {
    var parent = $("#oscope-parent");
    var size = getCanvasSize($(window).height(),parent.width(),parent.height());
    m_text_size = getTextSize(size.width);
    m_canvas = $("#oscope")[0];
    m_width  = m_canvas.width  = size.width;
    m_height = m_canvas.height = size.height;
    m_h2     = m_height / 2;
    rescale(m_width,m_height);
    onPaint(null);
  }

  function onInit() {
    m_canvas  = $("#oscope")[0];
    m_context = m_canvas.getContext("2d");
    // attach resize event
    $(window).resize(onResize);
    onResize();
    onPaint(null);

  }

	//--- invert code table create
  function createCodeTable(arg1) {
  }

  return {
    init               : onInit,
    onResize           : onResize,
    onPaint            : onPaint,
    onSampleBits       : onSampleBits,
    onVoltsPerDiv      : onVoltsPerDiv,
    onSecondsPerDiv    : onSecondsPerDiv,
    onSamplesPerSecond : onSamplesPerSecond,
    onVoltageRange     : onVoltageRange,
    onVerticalOffset   : onVerticalOffset,
    onCursorMove       : onCursorMove,
    onCursorSelect     : onCursorSelect,
    onRunStop          : onRunStop,
		createCodeTable		 : createCodeTable
  };

})();


//--- start the client application

const dataLength = 600;

var traceCount = 0;

var traceData0 = { channel:0,length:dataLength,sample:[dataLength]}
var traceData1 = { channel:1,length:dataLength,sample:[dataLength]}
var traceData2 = { channel:2,length:dataLength,sample:[dataLength]}

var trace =[traceData0,traceData1,traceData2];
 
var adcValue = [0,0,0,0,0,0,0,0];

var noVac = 1;

var socket = io.connect();
var messages = 0;

socket.on('trace', function (msg) {
  traceData0.sample[traceCount] = msg.channel[0];
  traceData1.sample[traceCount] = msg.channel[1];
  traceData2.sample[traceCount] = msg.channel[2];

	traceCount = (traceCount > 599) ? 0 : traceCount+1;
	console.log(msg.channel[0]);
  oscope.onPaint(trace);
});

socket.on('noVacTx',function(msg){
    noVac = msg.selVac;
    document.getElementById('idVacRec').innerHTML = noVac;    
});


socket.on('vacuum', function (msg) {
	$('#gauge0').attr('data-value', (msg.data[0])/10  );
	$('#gauge1').attr('data-value', (msg.data[1])/500 );
	$('#gauge2').attr('data-value', (msg.data[2])/4000 );
	$('#gauge3').attr('data-value', (msg.data[3])/4000 );
	$('#gauge4').attr('data-value', (msg.data[4])/4000 );
	$('#gauge5').attr('data-value', (msg.data[5])/4000 );
	$('#gauge6').attr('data-value', (msg.data[6])/4000 );
	$('#gauge7').attr('data-value', (msg.data[7])/4000 );
});

socket.on('codeTable', function (msg) {
  oscope.createCodeTable(msg);
});

socket.on('disconnect',function() {
  console.log('disconnected');
});


function radialGaugeInit(){

	var degreePerCelcius = '\xB0'+'C';

	$('#gauge0').attr('data-units',degreePerCelcius);
	$('#gauge0').attr('data-title',"온도계");

	$('#gauge0').attr('data-min-value',"0");
	$('#gauge0').attr('data-max-value',"200");
	$('#gauge0').attr('data-major-ticks',"[0,50,100,150,200]");
	$('#gauge0').attr('data-minor-ticks',"10");
	$('#gauge0').attr('data-stroke-ticks',"true");
	$('#gauge0').attr('data-highlights',
		'[{"from":0,"to":150,"color":"rgba(0,0,255,.3)"},{"from":150,"to":200,"color":"rgba(255,0,0,.3)"}]');
	
	$('#gauge1').attr('data-units','Mpa');
	$('#gauge1').attr('data-title',"압력계");

	$('#gauge1').attr('data-min-value',"0");
	$('#gauge1').attr('data-max-value',"2");
	$('#gauge1').attr('data-major-ticks',"[0,0.5,1.0,1.5,2.0]");
	$('#gauge1').attr('data-minor-ticks',"0.1");
	$('#gauge1').attr('data-stroke-ticks',"true");
	$('#gauge1').attr('data-highlights',
		'[{"from":0,"to":1.5,"color":"rgba(0,255,255,.3)"},{"from":1.5,"to":2.0,"color":"rgba(255,0,0,.3)"}]');

	for (var gaugeNumber = 0 ; gaugeNumber < 8 ; gaugeNumber++){ 
	$('#gauge'+gaugeNumber).attr('data-stroke-ticks',"true");
	// $('#gauge'+gaugeNumber).attr('data-highlights','[{"from": 0, "to": 1.5, "color": "rgba(0,0, 255, .3)"},{"from": 1.5, "to": 2,"color":"rgba(255, 0, 0, .3)"}]');
	$('#gauge'+gaugeNumber).attr('data-ticks-angle',"225");
	$('#gauge'+gaugeNumber).attr('data-start-angle',"67.5");
	$('#gauge'+gaugeNumber).attr('data-color-major-ticks',"#ddd");
	$('#gauge'+gaugeNumber).attr('data-color-minor-ticks',"#ddd");
	$('#gauge'+gaugeNumber).attr('data-color-title',"#eee");
	$('#gauge'+gaugeNumber).attr('data-color-units',"#ccc");
	$('#gauge'+gaugeNumber).attr('data-color-numbers',"#eee");
	$('#gauge'+gaugeNumber).attr('data-color-plate',"#222");

	$('#gauge'+gaugeNumber).attr('data-needle-type',"arrow");
	$('#gauge'+gaugeNumber).attr('data-needle-width',"2");
	$('#gauge'+gaugeNumber).attr('data-needle-circle-size',"7");
	$('#gauge'+gaugeNumber).attr('data-needle-circle-outer',"true");
	$('#gauge'+gaugeNumber).attr('data-needle-circle-inner',"false");

	$('#gauge'+gaugeNumber).attr('data-animation-duration',"150");
	$('#gauge'+gaugeNumber).attr('data-animation-rule',"linear");

	$('#gauge'+gaugeNumber).attr('data-border-shadow-width',"0");
	$('#gauge'+gaugeNumber).attr('data-borders',"true");
	$('#gauge'+gaugeNumber).attr('data-color-border-outer',"#333");
	$('#gauge'+gaugeNumber).attr('data-color-border-outer-end',"#111");
	$('#gauge'+gaugeNumber).attr('data-color-border-middle',"#222");
	$('#gauge'+gaugeNumber).attr('data-color-border-middle-end',"#111");
	$('#gauge'+gaugeNumber).attr('data-color-border-inner',"#111");
	$('#gauge'+gaugeNumber).attr('data-color-border-inner-end',"#333");

	$('#gauge'+gaugeNumber).attr('data-color-needle-shadow-down',"#333");
	$('#gauge'+gaugeNumber).attr('data-color-needle-circle-outer',"#333");
	$('#gauge'+gaugeNumber).attr('data-color-needle-circle-outer-end',"#111");
	$('#gauge'+gaugeNumber).attr('data-color-needle-circle-inner',"#111");
	$('#gauge'+gaugeNumber).attr('data-color-needle-circle-inner-end',"#222");

	$('#gauge'+gaugeNumber).attr('data-value-box-border-radius',"0");
	$('#gauge'+gaugeNumber).attr('data-color-value-box-rect',"#222");
	$('#gauge'+gaugeNumber).attr('data-color-value-box-rect-end',"#333");
	}

	for (var gaugeNumber = 2 ; gaugeNumber < 8 ; gaugeNumber++){ 
	$('#gauge'+gaugeNumber).attr('data-units','Mpa');
	$('#gauge'+gaugeNumber).attr('data-title',"진공 "+(gaugeNumber-1));

	$('#gauge'+gaugeNumber).attr('data-min-value',"-0.1");
	$('#gauge'+gaugeNumber).attr('data-max-value',"0.2");
	$('#gauge'+gaugeNumber).attr('data-major-ticks',"[-0.1,-0.05,0,0.05,0.1, 0.15, 0.2]");
	//$('#gauge'+gaugeNumber).attr('data-minor-ticks',"0.02");
	}
}

$("document").ready(function() {
  if (oscope) {
    oscope.init();
  }
	var dummy = {0:0};
	radialGaugeInit();
	socket.emit('codeTable',dummy);
});



setInterval( function () {
	var date = new Date();
	var n = date.toDateString();
	var time = date.toLocaleTimeString();
	document.getElementById('clock1').innerHTML = n +':'+ time;
}, 2000);
