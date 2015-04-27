node-oscope
===========
canvas + socket.io demo oscilloscope

A simple digital oscilloscope that takes data from a remote source and plots it like an oscope.

The project I am working at my day job is an embedded system that interfaces to some analog electronics. One of the
pieces of software we use is a display that looks like an oscilloscope display that show some voltages and frequencies
of the underlying circuits. We have a reasonably elaborate C++ program that runs on windows. It receives data from the embedded
system via UDP datagrams and displays them as waveforms on the screen. One of my coworkers made the idle suggestion that
it would be cool to have the display on a web browser so he wouldn't have to install the program on whatever computer
happened to be available when testing. I told him sure we can do that. I took it as a challenge. 

If you are an electrical engineer you can skip this paragraph. I'm not an EE, but as a software engineer 
I have interfaced to quite a few different embedded system devices. One type of device is the Analog to Digital Converter,
or A/D. An A/D device reads a voltage and converts it to a digital format that a CPU can deal with. Typical A/D's
provide a sample as an 8, 12 or 16 bit value, signed or unsigned, usually 2's complement but other formats could 
be used. Different A/D's can read different voltage ranges. Depending
on the circuitry there is not particular limit on the voltage range. When an A/D reads a voltage, it goes through a 
conversion process that takes some amount of time. The time required will determine how fast the CPU can read the digital value. 
This is the sample rate. Some exotic A/D's are very fast, and others on low-end devices run into the many microseconds.
At the low level the embedded software will read the output of the A/D by reading it from a dedicated address in the
memory map, as if it were a memory location that happens to be volatile. Depending on the CPU and OS, 
the embedded application might access it through a driver API or some other memory mapping setup. 
 
That said, for the purposes of this exercise just assume there is an embeddeed computer that has one or more A/D's and 
network access but no display. That computer can read the digital values and send them out as UDP datagrams in a binary
format (see the spec below). Then the task is get that data
into a web browser and display it. Since a web browser cannot natively receive UDP datagrams from an arbitrary source, 
there needs to be some infrastructure to take the datagrams and do something with them so they show up on a web page. Here 
are the parts I use to put this together:

* an embedded computer with a custom program to read data and send formatted UDP datagrams to a specified IP address
* a C running a node.js web server
* a node application that:
    * acts as sort of a reverse proxy between the client browsers and the embedded system
    * generates a real time feed of data to the client browser using websockets
* a web application served by the node server that implements the oscilloscope display

Let's build up this application in steps. 

Step 1 : embedded system simulator
----------------------------------
For now instead of a real embedded computer we will use a simple C program that sends simulated data. This will make
it easier to test. We can make versions of the program with different data formats, rates etc. There is code in the
repository under 'sim' that has a bare bones Visual Studio version and a Linux compatible version. (not much different
between the two other than some data types and initialization). I won't go into the implementation. You can inspect the
code to see what it is doing.

Code is in test/oscope-linux/oscope.c and/or test/oscope-win32/oscope.c

Step 2 : node.js UDP receiver backend
-------------------------------------
A node.js module that receives the formatted UDP datagrams and parses them into something that is friendlier to
the javascript environment.

* lib/receiver.js : udp datagram receiver 
* test/receiver-test.js : simple Mocha test fixture
    * run the oscope.c simulator 
    * >mocha test/receiver-test.js

simplified code excerpt:

    // parse UDP datagram into a trace object
    var trace = {
      channel         : 0,     // display channel : 1,2
      length          : 0,     // unsigned 16 bit integer, number of samples, maximum 600
      sample          :new Int16Array(MAX_SAMPLES)
    };
  
    function init(port,trace_callback) {
      // create the datagram socket
      sock = dgram.createSocket('udp4');
  
      sock.on("message",function(data,rinfo){
        // 'data' is a mode Buffer. use the node.js API for reading binary data from a Buffer
        trace.channel        = data.readUInt16BE(0);
        trace.length         = data.readUInt16BE(2);
  
        // get samples
        offset = 4;
        for(i=0;i<len;i++) {
          trace.sample[i] = data.readInt16BE(offset);
          offset += 2;
        }
  
        // callback to output handler
        trace_callback(null,trace);
      });
  
      // bind to the expected port
      sock.bind(port,function() {
        console.log('bound to ' + port);
      });
  
    }

Step 3 : A node.js web application that can serve the app.
----------------------------------------------------------
* node-oscope.js : an Express.js scaffold to serve the web pages and realtime data.
* lib/socket.js  : a module that uses socket.io to send the real time data stream to the browser
* localhost:3000/socket-test.html : test web page
    * npm start 
    * open socket-test.html in browser

simplified code excerpt:

    function init(sio) {
      io = sio;
  
      // listen for socket.io connections
      io.sockets.on('connection', function (socket) {
        socket.on('disconnect', function () {
          console.log('disconnect');
        });
      });
    }
  
    // this function is passed to the receiver.js module as the trace callback
    // it is called whenever a trace datagram is received and parsed
    function send(err,trace) {
      if (err) // handle the error
      
      // emit an event back to the client
      io.sockets.sockets.forEach(function(v,i,a) {
        v.volatile.emit('trace',JSON.stringify(trace));
      });
    }
    
Step 4 : A web app to actually display the digital data.
--------------------------------------------------------
This web app will display the waveforms on a Canvas elements. It will include Jquery for DOM manipulation and Bootstrap
to format the page and make it responsive.

* * *
 
Data Format
-----------
When interfacing between applications using network messages, it is important to document the exact structure
  and content of the messages. 
  
* Each datagram will have a minimal header and then a variable size array of data elements. 
* The data will be binary in network byte order (bit-endian). 
* Sizes are in bytes

<pre>
    OFFSET   SIZE    TYPE        DESCRIPTION
    0        2       uint16_t    channel number  [1 or 2] (the display will be able to display two 'traces')
    2        2       uint16_t    length N        [0-600] count of samples in the message, maximum 600
    4        2*N     int16_t     samples         array of N signed 16 bit samples with a range of -32768 .. 32767.
</pre>

When designing this format, there are some tradeoffs to make. Should the format specify more about the data? Or should
the web UI let the user specify what they are looking at? In a real oscilloscope, the data is just voltages at the end
of a probe. The operator
dials in the scaling and such using the oscope UI. For this app we will take that approach. The data will be very barebones
and the operator will need to dial in what it needs to look like. The other alternative would be for the data to be richer, with
specification of various parameters such as voltage range, time scale, name tag, etc. That would be a valid approach too and
would make sense if the embedded system were smarter and the web UI needed to be more automatic. 

One other important point is what format the samples are in. Are they 8, 12 or 16 bit values? Signed or unsigned? To keep it simple
we will let the embedded system send a single format and let the server and UI side specify what it is. Let's assume
the data is always signed 16 bits. If the embedded system is reading 8 or 12 bit data, it will have to sign extend that data to  16 
bits. We could have had multiple message formats and let the server side handle conversion of data. 

Why the restriction to 600 samples? Its an arbitrary application specific decision for a couple of reasons. First, it means that each datagram
will fit in the typical Maximum Transmission Unit (MTU) of an ethernet network, which is usually 1500 octets. That's not required for datagrams but it does mean there 
won't be fragmentation at least on the local network. Second, and probably more important, is that the Canvas element on the web page will be scaled in
multiples/fractions of 600 pixels in the X axis. A display isn't enhanced that much if you have more points than there are pixels in the
physical screen (fancy pixel shading aside). And I picked 600 because it fits a layout on a full size screen and can be divided down by 2's for
responsive display on smaller devices. Again, its kind of arbitrary and depends on the application.
    

