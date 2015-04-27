"user strict";
var assert   = require('assert');
var receiver = require('../lib/receiver.js');

describe('Array', function(){
    it('should receive 1,600,600', function(done){
        function trace_callback(err,trace)
        {
            assert.equal(err,null);
            assert.equal(trace.channel,1);
            assert.equal(trace.length,600);
            assert.equal(trace.sample.length,600);
            done();
        }
        receiver.init(55003,trace_callback);
    });
});

