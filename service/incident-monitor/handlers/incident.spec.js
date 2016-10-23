require('es6-promise').polyfill();
require('es6-object-assign').polyfill();

var expect = require('expect.js');
var sinon = require('sinon');
var mockery = require('mockery');


describe('Unit Test: Incident (event) handler interface', function () {
    it('must have "filter", "handle" and "passthrough" functions', function () {
        var incidentHandler = require('./incident');

        expect(incidentHandler.filter).to.be.a('function');
        expect(incidentHandler.handle).to.be.a('function');
        expect(incidentHandler.passthrough).to.be.a('function');
    });

    it('must not allows non-INCIDENT_REPORT event to be handled', function (done) {
        var incidentHandler = require('./incident');
        var invalidEvent = { type: 'BLAH_REPORT' };

        var result = incidentHandler.filter(invalidEvent);
        expect(result).to.be.a(Promise);
        result.then(function (resolved) {
            expect(resolved).to.be.a('boolean');
            expect(resolved).to.be(false);

            done();
        })
    });

    it('must throw error when handling event with valid outParams', function () {
       var incidentHandler = require('./incident');
       var invalidEvent = { type: 'INCIDENT_REPORT' };

       expect(incidentHandler.handle).to.throwError();
    });

    it('must have a passthrough which returns a Promise', function () {
        var incidentHandler = require('./incident');

        expect(incidentHandler.passthrough()).to.be.a(Promise);
    });
});

describe('Unit Test: Incident (event) handler', function () {
    before(function () {
        mockery.registerMock('../../../app/models/stats-incident', function () {
            var model = function () {};
            model.prototype = {
                save: function () {
                    console.warn('save should be overriden with sinon.mock');
                    throw new Error('Not implemented');
                }
            };
            model.findOne = function () {
                console.warn('findOne should be overriden with sinon.stub');
                throw new Error('Not implemented');
            };

            return model;
        }());

        mockery.registerMock('../../../app/models/report', function () {
            var model = function () {};
            model.prototype = {
                save: function () {
                    console.warn('save should be overriden with sinon.mock');
                    throw new Error('Not implemented');
                },
                findOne: function () {
                    console.warn('findOne should be overriden with sinon.mock');
                    throw new Error('Not implemented');
                }
            };

            return model;
        });
        // mock the error reporter
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

    //   var StatsIncident = require('../../app/models/stats-incident');
    //   var Report = require('../../app/models/report');

   });

    after(function() {
        // disable mock after tests complete
        mockery.disable();
    });

    it('must create a new Stats Incident when one does not exist', function (done) {
        // Load the mocked stuff first
        var StatsIncident = require('../../../app/models/stats-incident');
        var mockedIncidentPOJO = { _id: 'hex12asc', location: {spec: {}}, created_at: new Date() };
        var mockedStatsIncident = {
            id: 'hexstats1222',
            total: 1,
            toObject: sinon.stub().returns({})
        };

        sinon.stub(StatsIncident, 'findOne').returns(Promise.resolve(null));
        sinon.stub(StatsIncident.prototype, 'save').returns(mockedStatsIncident);

        // Test subject
        var incidentHandler = require('./incident');
        var validEvent = { type: 'INCIDENT_REPORTED' , args: [mockedIncidentPOJO]};

        var promise = incidentHandler.filter(validEvent);
        console.log(promise);

        promise.then(
            function (resolved) {
                expect(StatsIncident.findOne.calledOnce).to.be(true);
                expect(StatsIncident.prototype.save.calledOnce).to.be(true);
                expect(resolved).to.be(false);

                done();
            },
            done
        );
    });
});
