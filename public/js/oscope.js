"use strict";

var oscope = (function() {
  var m_canvas;
  var m_context;
  var m_width;
  var m_height;
  var m_h4;
  var m_yscale = 32768;
  var m_sample_bits = 16;
  var m_min_y;
  var m_max_y;
  var m_volts;

  var outline_base = [
    [0.0,0.0],
    [1.0,0.0],
    [1.0,1.0],
    [0.0,1.0],
    [0.0,0.0]
  ];
  var outline;

  var xaxis_base = [
    [0.0,3.0/10.0,1.0,3.0/10.0], // channel 1
    [0.0,7.0/10.0,1.0,7.0/10.0]  // channel 2
  ];
  var xaxis;

  var mid_div_base = [
    0.0,3.0/6.0,1.0,3.0/6.0
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
    [1.0/8.0,0.0,1.0/8.0,1.0],
    [2.0/8.0,0.0,2.0/8.0,1.0],
    [3.0/8.0,0.0,3.0/8.0,1.0],
    [4.0/8.0,0.0,4.0/8.0,1.0],
    [5.0/8.0,0.0,5.0/8.0,1.0],
    [6.0/8.0,0.0,6.0/8.0,1.0],
    [7.0/8.0,0.0,7.0/8.0,1.0]
  ];
  var vgrid;

  // responsive sizes for canvas
  // aspect ratio of available sizes needs to be 4 over 3
  // and must fit the twitter boostrap grid size allocated
  var canvas_size = [
    {width:600,height:450},
    {width:400,height:300},
    {width:200,height:150}
  ];


  // figure out height of canvas based on window and parent size
  // find the first fit from the canvas_size array
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
      r = canvas_size[2];
    }
    else {
      // use first fit
      r = s[0];
    }
    return r;
  }

  function rescale(w,h) {
    // rescale horizontal divisions
    hgrid = hgrid_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

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

    // rescale mid divider
    mid_div[0] = mid_div_base[0] * w;
    mid_div[1] = mid_div_base[1] * h;
    mid_div[2] = mid_div_base[2] * w;
    mid_div[3] = mid_div_base[3] * h;
  }

  function onResize() {
    var parent = $("#oscope-parent");
    var size;
    size = getCanvasSize($(window).height(),parent.width(),parent.height());
    m_canvas = $("#oscope")[0];
    m_width  = m_canvas.width  = size.width;
    m_height = m_canvas.height = size.height;
    m_h4     = m_height / 4;
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

  function clear(ctx,width,height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,width,height);
  }

  function drawLine(ctx,x0,y0,x1,y1)  {
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.stroke();
  }

  function drawLines(ctx,lines) {
    lines.forEach(function(v,i,a) {
      drawLine(ctx,v[0],v[1],v[2],v[3]);
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

  function drawBackground(ctx,width,height) {
    // clear background
    clear(ctx,width,height);

    // draw geometry with cartesian coordinates (0,0) lower left
    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // draw the outline
    ctx.strokeStyle = 'blue';
    ctx.lineWidth   = 4;
    drawPath(ctx,outline);

    // draw the grid
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([1,1]);
    drawLines(ctx,hgrid);
    drawLines(ctx,vgrid);
    ctx.restore();

    // draw the x axes
    ctx.strokeStyle = "blue";
    ctx.lineWidth   = 1;
    drawLines(ctx,xaxis);
    ctx.restore();

    // draw the middle divider
    ctx.save();
    ctx.strokeStyle = "magenta";
    ctx.lineWidth   = 2.0;
    drawLine(ctx,mid_div[0],mid_div[1],mid_div[2],mid_div[3]);
    ctx.restore();

    // draw text with (0,0) upper left
    ctx.font = "20px monospace";
    ctx.fillStyle = "red";
    ctx.fillText("1",xaxis[1][0]+2,xaxis[1][1]+5);
    ctx.fillStyle = "green";
    ctx.fillText("2",xaxis[0][0]+2,xaxis[0][1]+5);
  }

  function drawTrace(ctx,trace,width,height) {
    var t = [];
    var ys;
    var i;

    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // set channel parameters
    switch(trace.channel) {
    case 1:
      ctx.translate(xaxis[0][0],xaxis[0][1]);
      ctx.strokeStyle = "red";
      break;
    case 2:
      ctx.translate(xaxis[1][0],xaxis[1][1]);
      ctx.strokeStyle = "green";
      break;
    }
    
    // scale the trace y axis
    // samples are Int16Array
    ys = m_h4 / m_yscale;
    for(i=0;i<trace.length;++i) {
      t.push([i,trace.sample[i] * ys]);
    }

    // draw it
    drawPath(ctx,t);
    
    ctx.restore();    
    // restore context
  }

  function onPaint(trace) {
    drawBackground(m_context,m_width,m_height);
    if (trace) {
      drawTrace(m_context, trace,m_width,m_height);
    }
  }

  // ===================================================
  // event handler for setting number of bits per sample
  // ===================================================
  var sample_bits = [8,12,16];
  function onSampleBits(index) {
    var bits;
    if (index > 2) return;

    bits = sample_bits[index];
    switch(bits) {
    case 8:
      m_sample_bits = 8;
      m_min_y = -128;
      m_max_y =  127;
      break;
    case 12:
      m_sample_bits = 12;
      m_min_y = -2048;
      m_max_y =  2047;
      break;
    case 16:
      m_sample_bits = 16;
      m_min_y = -32768;
      m_max_y =  32767;
      break;
    default:
      m_sample_bits = 16;
      m_min_y = -32768;
      m_max_y =  32767;
      break;
    }
    alert(bits);
  }

  // ===================================================
  // event handler for setting volts per division
  // ===================================================
  var volts_per_div = [1,2,5];
  function onVoltsPerDiv(index) {
    var vd;
    if (index > 2) return;
    vd = volts_per_div[index];
    switch(vd) {
    case 1:
      m_volts = 10.0;
      break;
    case 2:
      m_volts = 20.0;
      break;
    case 5:
      m_volts = 50.0;
      break;
    default:
      break;
    }
    alert(vd);
  }

  return {
    init          : onInit,
    resize        : onResize,
    paint         : onPaint,
    onSampleBits  : onSampleBits,
    onVoltsPerDiv : onVoltsPerDiv
  };
})();

