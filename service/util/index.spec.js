var expect = require('expect.js');
var createEvent = require('./index').createEvent;
var deserialize = require('./index').deserialize;

describe('Unit Test: util.createEvent', function () {
    it('must be a function', function () {
        expect(createEvent).to.be.a('function');
    });
    
    it('must serialize event into a String Buffer', function () {
       var eventType = 'INCIDENT_REPORTED';
       var eventArgs = 'aNumber';
       
       event = createEvent(eventType, eventArgs);
       
       expect(event).to.be.a(Buffer);
    });
    
    it('must deserialize event into a JSON', function () {
       var eventType = 'INCIDENT_REPORTED';
       var eventArgs = 'aNumber';
       
       event = createEvent(eventType, eventArgs);
       var json = deserialize(event);
       
       expect(json).to.be.a(Object);
       expect(json.type).to.be.ok;
       expect(json.args).to.be.ok;
    });
    
    it('must be able to handle single argument event', function () {
        var eventType = 'INCIDENT_REPORTED';
        
        event = createEvent(eventType, 'aNumber');
        var json = JSON.parse(event.toString())
        
        expect(json.type).to.be.ok;
        expect(json.args).to.be.an('array');
    });
    
    it('must be able to handle multiple argument event', function () {
        var eventType = 'INCIDENT_REPORTED';
        
        event = createEvent(eventType, 'aNumber', 1234);
        var json = JSON.parse(event.toString())
        
        expect(json.type).to.be.ok;
        expect(json.args).to.be.an('array');
    });
    
    it('must throw exception in case of invalid arguments', function () {
        var eventType = 'INCIDENT_REPORTED';
        
        expect(createEvent).withArgs().to.throwException();
        expect(createEvent).withArgs(eventType).to.throwException();
    });
});
