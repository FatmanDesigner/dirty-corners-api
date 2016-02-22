require('es6-promise').polyfill();

var expect = require('expect.js');
var sinon = require('sinon');
var mockery = require('mockery');

describe('Incident controller: GET', function () {
    var incident = require('./incidents');
    
    it('has GET handler', function () {
        expect(typeof(incident.GET)).equal('function');
    });
    
    it('resonds to /', function () {
        var req = res = {};
        res.send = sinon.spy();
        
        incident.GET(req, res);
        
        expect(res.send.calledOnce).to.equal(true);
    });
});

describe('Incident controller: POST', function () {
    var incidents;
    
    before(function() {
        mockery.registerMock('../models/incident', function () {
            var model = function () {};
            model.prototype = {
                save: function () { 
                    console.warn('Should be overriden with sinon.mock');
                    throw new Error('Not implemented');
                }
            };
            
            return model;
        }());
        // mock the error reporter
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });
        
        incidents = require('./incidents');
    });
    
    afterEach(function () {
        // var Incident = require('../models/incident');
        // Incident.prototype.save.restore(); 
    });
    
    after(function() {
        // disable mock after tests complete
        mockery.disable();
    });
    
    it('has POST handler', function () {
        expect(typeof(incidents.POST)).equal('function');
    });
    
    it('creates new incident properly', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var Incident = require('../models/incident');
        
        var mockedIncident = {
            __v: 0,
            _id: 'abc123',
            type: 'accident',
            location: {
                latlng: [1,2],
                spec: {
                    placeid: '123',
                    administrative_area_level_1: 'Ho Chi Minh City',
                    country: 'Vietnam'
                }
            }
        };

        sinon.stub(Incident.prototype, 'save').returns(Promise.resolve(mockedIncident))
        
        var req = {
            body: {
                type: 'accident',
                location: {
                    latlng: [1,2],
                    spec: {
                        placeid: '123',
                        administrative_area_level_1: 'Ho Chi Minh City',
                        country: 'Vietnam'
                    }
                }
            }
        };
        var res = {};
        res.send = sinon.spy();
        // Perform the tested action
        incidents.POST(req, res);
        
        process.nextTick(function() {
            expect(Incident.prototype.save.calledOnce).to.equal(true);
            // TODO Fix the assertion
            expect(res.send.calledOnce).to.equal(true);
            Incident.prototype.save.restore(); 
            done();
        });
    });
    
    it('generates error for improper incident data: No JSON body', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var Incident = require('../models/incident');
        sinon.stub(Incident.prototype, 'save').returns(Promise.reject({ message: 'Invalid data' }));
        
        var req = {
            body: null
        };
        var send = sinon.spy();
        var status = sinon.stub().returns({ send: send }) ;
        var res = {
            status: status
        };
        
        // Perform the tested action
        incidents.POST(req, res);
        
        process.nextTick(function() {
            expect(Incident.prototype.save.callCount).to.equal(0);
            // TODO Fix the assertion
            expect(status.calledWith(400)).to.equal(true);
            expect(send.calledWith('Invalid data')).to.equal(true);
           
            Incident.prototype.save.restore();  
            done();
        });
    });
    
    it('generates error for improper incident data: No type', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var Incident = require('../models/incident');
        sinon.stub(Incident.prototype, 'save').returns(Promise.reject({ message: 'Invalid data' }));
        
        var req = {
            body: {
                location: {
                    latlng: [1,2],
                    spec: {
                        placeid: '123',
                        administrative_area_level_1: 'Ho Chi Minh City',
                        country: 'Vietnam'
                    }
                }
            }
        };
        var send = sinon.spy();
        var status = sinon.stub().returns({ send: send }) ;
        var res = {
            status: status
        };
        
        // Perform the tested action
        incidents.POST(req, res);
        
        process.nextTick(function() {
            expect(Incident.prototype.save.callCount).to.equal(0);
            // TODO Fix the assertion
            expect(status.calledWith(400)).to.equal(true);
            expect(send.calledWith('Invalid data')).to.equal(true);
           
            Incident.prototype.save.restore();  
            done();
        });
    });
    
    it('generates error for improper incident data: No latlng', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var Incident = require('../models/incident');
        sinon.stub(Incident.prototype, 'save').returns(Promise.reject({ message: 'Invalid data' }));
        
        var req = {
            body: {
                type: 'accident',
                location: {
                    spec: {
                        placeid: '123',
                        administrative_area_level_1: 'Ho Chi Minh City',
                        country: 'Vietnam'
                    }
                }
            }
        };
        var send = sinon.spy();
        var status = sinon.stub().returns({ send: send }) ;
        var res = {
            status: status
        };
        
        // Perform the tested action
        incidents.POST(req, res);
        
        process.nextTick(function() {
            expect(Incident.prototype.save.callCount).to.equal(0);
            // TODO Fix the assertion
            expect(status.calledWith(400)).to.equal(true);
            expect(send.calledWith('Invalid data')).to.equal(true);
           
            Incident.prototype.save.restore();  
            done();
        });
    });
    
    it('generates error for improper incident data: No location', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var Incident = require('../models/incident');
        sinon.stub(Incident.prototype, 'save').returns(Promise.reject({ message: 'Invalid data' }));
        
        var req = {
            body: {
                type: 'accident'
            }
        };
        var send = sinon.spy();
        var status = sinon.stub().returns({ send: send }) ;
        var res = {
            status: status
        };
        
        // Perform the tested action
        incidents.POST(req, res);
        
        process.nextTick(function() {
            expect(Incident.prototype.save.callCount).to.equal(0);
            // TODO Fix the assertion
            expect(status.calledWith(400)).to.equal(true);
            expect(send.calledWith('Invalid data')).to.equal(true);
           
            Incident.prototype.save.restore();  
            done();
        });
    });
});