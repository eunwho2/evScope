"use strict";
var graphInverter = (function() {
  var m_canvas;
  var m_context;
  var m_width;
  var m_height;
  var m_h2;										// m_height/2
  var m_trace = [];
  var m_voffset = [];

  var m_seconds_per_div	   = 60;
  var m_samples_per_second = 1;
  var m_divisions          = 10;
  var m_yscale             = 2048;
  var m_sample_bits        = 12;
  var m_volts_per_div      = 1;
  var m_vrange             = 1;
  var m_cursor_index       = 1;			// ?
  var m_cursor_seconds     = 0.0;
  var m_cursor_volts       = 0.0;
  var m_run                = true;
  var m_text_size          = 12;
  var m_updates            = 0;			// up count bottom of scope screen

  m_trace[0]           = null;
  m_trace[1]           = null;
  m_trace[2]           = null;
  m_trace[3]           = null;

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

  var mid_div_base = [0.0,5.0/10.0,1.0,5.0/10.0];
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
    {width:600,height:300}
  ];

  // responsive text size
  var text_size = [
      12,
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

		// 2018.03. delete by jsk
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
    ctx.fillStyle = "white";
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
    ctx.strokeStyle = 'black';
    ctx.lineWidth   = 4;
    drawPath(ctx,outline);
    ctx.restore();

    // draw the grid
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth   = 1;
    ctx.setLineDash([1,1]);
    drawLines(ctx,hgrid);
    drawLines(ctx,vgrid);
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
    ctx.fillText('seconds/div = ' + m_seconds_per_div.toFixed(4) + '    dS = ' + m_cursor_seconds.toFixed(4),2,y);

    y += dy + 1;
    ctx.fillText('volts/div   = ' + m_volts_per_div.toFixed(4)   + '    dV = ' + m_cursor_volts.toFixed(4) ,2,y);

    ctx.fillStyle = "darkgoldenrod";
    y += dy + 1;
    ctx.fillText('CH1 : RPM 500 RPM / DIV ',440,10);

    ctx.fillStyle = "indigo";
    y += dy + 1;
    ctx.fillText('CH2 : Irms 5A / DIV ',440,10+dy);

    ctx.fillStyle = "red";
    y += dy + 1;
    ctx.fillText('CH3 : P_total 2kW / DIV ',440,10+ dy * 2);

    ctx.fillStyle = "green";
    y += dy + 1;
    ctx.fillText('CH4 : P Power 2kW / DIV ',440,10 + dy * 3);

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
    ys = computeVerticalScale(m_vrange,m_yscale,m_height,m_volts_per_div);
    hs = computeHorizontalScale(m_seconds_per_div*m_divisions,m_samples_per_second,m_width);

    // compute horizonal scale

    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // set channel parameters
    switch(trace.channel) {
    case 0:
      ctx.translate(xaxis[0][0],xaxis[0][1] + voffset);
      ctx.strokeStyle = "darkgoldenrod";
      break;
    case 1:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "indigo";
      break;
    case 2:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "red";
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

  function onVerticalOffset(channel,offset)
  {
    if ((offset < -4)||(4 < offset)) {
      return;
    }
    m_voffset[channel-1] = offset * vdiv;
    onPaint(null);
  }

  /**
   * event handler for setting volts per division
   * @param volts
   */
  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;

    updateCursorDiff();
    onPaint(null);
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
      m_trace[3] = trace[3];
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
    if (m_trace[3] !== null) {
      drawTrace(m_context, m_trace[3], m_width, m_height, m_voffset[3]);
    }
    // draw text annotations
    drawAnnotations(m_context,m_width,m_height,m_text_size);
  }

  function onSampleBits(bits) {
      m_sample_bits = 12;
      m_yscale      = 2048;
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
    m_seconds_per_div = seconds;

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
    onPaint(null);0.
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
    m_cursor_seconds = Math.abs(m_cursor[0][0] - m_cursor[1][0]) * (m_seconds_per_div* 10.0 / m_width);
    m_cursor_volts   = Math.abs(m_cursor[2][1] - m_cursor[3][1]) * (m_volts_per_div * 10.0 / m_height);
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
    var parent = $("#plot1-parent");
    var size = getCanvasSize($(window).height(),parent.width(),parent.height());
    m_text_size = 12;
    m_canvas = $("#plot1")[0];
    m_width  = m_canvas.width  = size.width;
    m_height = m_canvas.height = size.height;
    m_h2     = m_height / 2;
    rescale(m_width,m_height);
    onPaint(null);
  }

  function onInit() {
    m_canvas  = $("#plot1")[0];
    m_context = m_canvas.getContext("2d");
    // attach resize event
    $(window).resize(onResize);
    onResize();
    onPaint(null);
  }

	//--- invert code table create
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
  };

})();
// --- end of graphInverter

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
  var m_seconds_per_div	   = 0.100;
  var m_samples_per_second = 600;
  var m_divisions          = 10;
  var m_yscale             = 2048;
  var m_sample_bits        = 12;
  var m_volts_per_div      = 1;
  var m_vrange             = 1;
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

  var mid_div_base = [0.0,5.0/10.0,1.0,5.0/10.0];
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

		// 2018.03. delete by jsk
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
    ctx.fillStyle = "white";
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
    ctx.strokeStyle = 'black';
    ctx.lineWidth   = 4;
    drawPath(ctx,outline);
    ctx.restore();

    // draw the grid
    ctx.save();
    ctx.strokeStyle = "black";
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
    ctx.strokeStyle = "darkgoldenrod";
    ctx.lineWidth   = 1;
    drawLine(ctx,xaxis[1]);
    ctx.restore();

    // draw the cursors
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "MediumSeaGreen";
    drawLine(ctx,m_cursor[0]);
    drawLine(ctx,m_cursor[2]);
    ctx.strokeStyle = "MediumSeaGreen";
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
    ctx.fillText('seconds/div = ' + m_seconds_per_div.toFixed(4) + '    dS = ' + m_cursor_seconds.toFixed(4),2,y);
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
    ys = computeVerticalScale(m_vrange,m_yscale,m_height,m_volts_per_div);
    hs = computeHorizontalScale(m_seconds_per_div*m_divisions,m_samples_per_second,m_width);

    // compute horizonal scale

    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // set channel parameters
    switch(trace.channel) {
    case 0:
      ctx.translate(xaxis[0][0],xaxis[0][1] + voffset);
      ctx.strokeStyle = "darkgoldenrod";
      break;
    case 1:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "indigo";
      break;
    case 2:
      ctx.translate(xaxis[1][0],xaxis[1][1] + voffset);
      ctx.strokeStyle = "red";
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

  function onVerticalOffset(channel,offset)
  {
    if ((offset < -4)||(4 < offset)) {
      return;
    }
    m_voffset[channel-1] = offset * vdiv;
    onPaint(null);
  }

  /**
   * event handler for setting volts per division
   * @param volts
   */
  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;

    updateCursorDiff();
    onPaint(null);
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
      m_trace[3] = trace[3];
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
    if (m_trace[3] !== null) {
      drawTrace(m_context, m_trace[3], m_width, m_height, m_voffset[3]);
    }
    // draw text annotations
    drawAnnotations(m_context,m_width,m_height,m_text_size);
  }

  function onSampleBits(bits) {
      m_sample_bits = 12;
      m_yscale      = 2048;
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
    m_seconds_per_div = seconds;

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
    onPaint(null);0.
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
    m_cursor_seconds = Math.abs(m_cursor[0][0] - m_cursor[1][0]) * (m_seconds_per_div* 10.0 / m_width);
    m_cursor_volts   = Math.abs(m_cursor[2][1] - m_cursor[3][1]) * (m_volts_per_div * 10.0 / m_height);
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
    $(window).resize(onResize);
    onResize();
    onPaint(null);
  }

	//--- invert code table create
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
  };
})();


//--- start the client application

const dataLength = 600;

var graphData = new Array();

graphData[0] = { channel:0,length:dataLength,sample:[dataLength]};
graphData[1] = { channel:1,length:dataLength,sample:[dataLength]};
graphData[2] = { channel:2,length:dataLength,sample:[dataLength]};
graphData[3] = { channel:3,length:dataLength,sample:[dataLength]};

var scopeData = new Array();

scopeData[0] = { channel:0,length:dataLength,sample:[dataLength]};
scopeData[1] = { channel:1,length:dataLength,sample:[dataLength]};
scopeData[2] = { channel:2,length:dataLength,sample:[dataLength]};
scopeData[3] = { channel:3,length:dataLength,sample:[dataLength]};

 
var noVac = 1;

var socket = io.connect();
var messages = 0;

socket.on('trace', function (msg) {

	console.log(msg);
  // oscope.onPaint(trace);

});


// var inputOffset = [1817,1817,2121,2009];
var graphCount = 0;

//socket.on('graph', function (msg) {

function btnGraphClear(){
	for( var j = 0 ; j < 4 ; j++){
		for( var i = 0 ; i < 600 ; i++ )	graphData[j].sample[i] = 0;
	}
	graphCount = 0;
	graphInverter.onPaint(graphData);
}

socket.on('graph', function (msg) {
 
	console.log('rpm =',msg.rpm,'Irms =',msg.Irms,'P_total =',msg.P_total,' RePower = ',msg.RePower,'ImPower = ',msg.ImPower);
	graphCount = ( graphCount < 600 ) ? graphCount + 1 : 0 ;

	graphData[0].sample[graphCount] = msg.rpm ; 
	graphData[1].sample[graphCount] = msg.Irms ; 
	graphData[2].sample[graphCount] = msg.P_total; 
	graphData[3].sample[graphCount] = msg.ImPower; 
	graphInverter.onPaint(graphData);
//convert to
	var speed = 	((msg.rpm 		-2048)/ 2048) * 2000;
	var power = 	((msg.P_total	-2048)/ 2048) * 10;
	var I_rms = 	((msg.Irms		-2048)/ 2048) * 20;
	var Q_power = 	((msg.ImPower	-2048)/ 2048) * 10;

   $('#gauge1').attr('data-value', speed);
   $('#gauge2').attr('data-value', power);
   $('#gauge3').attr('data-value', I_rms);
   $('#gauge4').attr('data-value', Q_power);
});

function btnScopeClear(){
	for( var j = 0 ; j < 4 ; j++){
		for( var i = 0 ; i < 600 ; i++ )	scopeData[j].sample[i] = 0;
	}
	graphInverter.onPaint(graphData);
}

socket.on('scope', function (msg) {

	// console.log('socket on scope =',msg);

	var chanel = msg.Ch - 49;

	//console.log('chanel = ',chanel);
	scopeData[chanel].sample = msg.data ;

	if(chanel == 3 ){ 
		oscope.onPaint(scopeData);
	}

});

socket.on('disconnect',function() {
  console.log('disconnected');
});

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

//---- end of oscope.js
