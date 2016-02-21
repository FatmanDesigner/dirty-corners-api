var expect = require('expect.js');
var sinon = require('sinon');

var incident = require('./incidents');

describe('Incident controller: GET', function () {
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
    it('has POST handler', function () {
        expect(typeof(incident.POST)).equal('function');
    });
    
    it('resonds to /', function () {
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
        
        expect(res.send.calledOnce).to.equal(true);
        expect(res.send.calledWith({
                type: 'accident',
                location: {
                    latlng: [1,2],
                    spec: {
                        placeid: '123'
                    }
                }
            })).to.equal(true);
    });
});