"use strict";

var oscope = (function() {
  var m_canvas;
  var m_context;
  var m_width;
  var m_height;
  var m_h2;

  // these must match the initial values of the controls
  // doh! no two way data bindind
  var m_seconds_per_div    = 0.100;
  var m_samples_per_second = 600;
  var m_divisions          = 10;
  var m_yscale             = 32768;
  var m_sample_bits        = 16;
  var m_volts_per_div      = 2.5;
  var m_vrange             = 5;

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

  // responsive sizes for canvas
  // aspect ratio of available sizes needs to be 4 over 3
  // and must fit the twitter boostrap grid size allocated
  var canvas_size = [
    {width:600,height:450},
    {width:400,height:300},
    {width:200,height:150}
  ];


  // ===================================================
  // SCALING AND LAYOUT
  // ===================================================

  /**
   * figure out height of canvas based on window and parent size
   * find the first fit from the canvas_size array
   * @param window_height

   * @param parent_width
   * @param parent_height
   * @returns {*}
   */
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

  /**
   * rescale layout when size changes
   * @param w width
   * @param h height
   */
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

  /**
   * clear the background
   * @param ctx canvas context
   * @param width  of rect
   * @param height of rect
   */
  function clear(ctx,width,height) {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,width,height);
  }

  /**
   * draw a single line from specified endpoints
   * @param ctx
   * @param x0
   * @param y0
   * @param x1
   * @param y1
   */
  function drawLine(ctx,x0,y0,x1,y1)  {
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.stroke();
  }

  /**
   * draw a set of lines
   * @param ctx
   * @param lines array of endpoints
   */
  function drawLines(ctx,lines) {
    lines.forEach(function(v,i,a) {
      drawLine(ctx,v[0],v[1],v[2],v[3]);
    });
  }

  /**
   * draw a path from a set of points
   * @param ctx
   * @param path
   */
  function drawPath(ctx,path) {
    ctx.beginPath();
    ctx.moveTo(path[0][0],path[0][1]);
    path.slice(1).forEach(function(v) {
      ctx.lineTo(v[0],v[1]);
    });
    ctx.stroke();
  }

  /**
   * draw the background with the outline, grid etc
   * @param ctx
   * @param width
   * @param height
   */
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
  }

  /**
   * vertical scale factor
   * (voltage range/counts per sample) *  (pixels per yaxis / volts per yaxis) = pixel per count
   * @param vrange
   * @param yscale
   * @param height
   * @param volts
   * @returns {number}
   */
  function computeVerticalScale(vrange,yscale,height,volts) {
    // divide by 2 to make scale for signed value
    return (vrange / yscale) * (height / volts) * 0.5;
  }

  /**
   * horizontal scale factor in pixels/sample
   * @param seconds
   * @param sps
   * @param width
   * @returns {number}
   */
  function computeHorizontalScale(seconds,samples_per_second,width) {
    return width / (seconds * samples_per_second);
  }

  /**
   * draw a single trace
   * @param ctx
   * @param trace
   * @param width used to scale x axis
   * @param height used to scale y axis
   */
  function drawTrace(ctx,trace,width,height) {
    var t = [];
    var ys;
    var hs;
    var i;

    // compute scale factors
    ys = computeVerticalScale(m_vrange,m_yscale,m_height,m_volts_per_div*10);
    hs = computeHorizontalScale(m_seconds_per_div*m_divisions,m_samples_per_second,m_width);

    // compute horizonal scale

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
    for(i=0;i<trace.length;++i) {
      t.push([i*hs,trace.sample[i] * ys]);
    }

    // draw it
    drawPath(ctx,t);
    
    ctx.restore();    
    // restore context
  }

  /**
   * repaint the display
   * @param trace optional trace
   */
  function onPaint(trace) {
    drawBackground(m_context,m_width,m_height);
    if (trace) {
      drawTrace(m_context, trace,m_width,m_height);
    }
  }

  // ===================================================
  // EVENT HANDLERS
  // ===================================================

  /**
   * event handler for setting number of bits per sample
   * @param bits
   */
  function onSampleBits(bits) {
    switch(bits) {
    case 8:
      m_sample_bits = 8;
      m_yscale      = 128;
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
  }

  /**
   * event handler for setting volts per division
   * @param volts
   */
  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;
  }

  /**
   * event handler for setting seconds per division
   * @param seconds
   */
  function onSecondsPerDiv(seconds) {
    m_seconds_per_div = seconds;
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
  }

  /**
   * set voltage range (maximum volts per sample)
   * @param vrange
   */
  function onVoltageRange(vrange) {
    m_vrange = vrange;
  }

  /**
   * event handler for window resize
   */
  function onResize() {
    var parent = $("#oscope-parent");
    var size;
    size = getCanvasSize($(window).height(),parent.width(),parent.height());
    m_canvas = $("#oscope")[0];
    m_width  = m_canvas.width  = size.width;
    m_height = m_canvas.height = size.height;
    m_h2     = m_height / 2;
    rescale(m_width,m_height);
    onPaint(null);
  }

  /**
   * initialize the oscope
   */
  function onInit() {
    m_canvas  = $("#oscope")[0];
    m_context = m_canvas.getContext("2d");
    // attach resize event
    $(window).resize(onResize);
    onResize();
    onPaint(null);
  }


  return {
    init               : onInit,
    onResize           : onResize,
    onPaint            : onPaint,
    onSampleBits       : onSampleBits,
    onVoltsPerDiv      : onVoltsPerDiv,
    onSecondsPerDiv    : onSecondsPerDiv,
    onSamplesPerSecond : onSamplesPerSecond,
    onVoltageRange     : onVoltageRange
  };
})();

