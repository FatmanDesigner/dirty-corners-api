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
    var incident;
    
    before(function() {
    // mock the error reporter
        mockery.enable({
          warnOnReplace: false,
          warnOnUnregistered: false,
          useCleanCache: true
        });
        
        incident = require('./incidents');
    });
    
    after(function() {
        // disable mock after tests complete
        mockery.disable();
    });
    
    it('has POST handler', function () {
        expect(typeof(incident.POST)).equal('function');
    });
    
    it('resonds to /', function (done) {
        var Incident = require('../models/incident');
        var incident = require('./incidents');
        
        var mockedIncident = {
            __v: 0,
            _id: 'abc123',
            type: 'accident',
            location: {
                latlng: [1,2],
                spec: {
                    placeid: '123'
                }
            }
        };
        
        sinon.stub(Incident.prototype, 'save').returns(null); // Promise.resolve(mockedIncident)
        
        var req = {
            body: {
                type: 'accident',
                location: {
                    latlng: [1,2],
                    spec: {
                        placeid: '123'
                    }
                }
            }
        };
        var res = {};
        res.send = sinon.spy();
        
        incident.POST(req, res);
        
        setTimeout(function() {
            expect(Incident.prototype.save.calledOnce).to.equal(true);
            // TODO Fix the assertion
            expect(res.send.calledOnce).to.equal(true);
            
            done();
        }, 0);
    });
});