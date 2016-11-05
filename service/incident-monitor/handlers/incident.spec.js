require('es6-promise').polyfill();
require('es6-object-assign').polyfill();

var expect = require('expect.js');
var sinon = require('sinon');
var mockery = require('mockery');


describe('Unit Test: Incident (event) handler interface', function () {
  it('must have "filter", "handle" and "passthrough" functions', function () {
    var IncidentHandler = require('./incident');

    expect(IncidentHandler.prototype.filter).to.be.a('function');
    expect(IncidentHandler.prototype.handle).to.be.a('function');
    expect(IncidentHandler.prototype.passthrough).to.be.a('function');
  });

  it('must not allows non-INCIDENT_REPORT event to be handled', function (done) {
    var IncidentHandler = require('./incident');
    var incidentHandler = new IncidentHandler();
    var invalidEvent = {type: 'BLAH_REPORT'};

    var result = incidentHandler.filter(invalidEvent);
    expect(result).to.be.a(Promise);
    result.then(function (resolved) {
      expect(resolved).to.be.a('boolean');
      expect(resolved).to.be(false);

      done();
    })
  });

  it('must throw error when handling event with valid outParams', function () {
    var IncidentHandler = require('./incident');
    var incidentHandler = new IncidentHandler();
    var invalidEvent = {type: 'INCIDENT_REPORT'};

    expect(incidentHandler.handle).to.throwError();
  });

  it('must have a passthrough which returns a Promise', function () {
    var IncidentHandler = require('./incident');
    var incidentHandler = new IncidentHandler();

    expect(incidentHandler.passthrough()).to.be.a(Promise);
  });
});

describe('Unit Test: Incident (event) handler', function () {
  before(function () {
    mockery.registerMock('../../../app/models/stats-incident', function () {
      var model = function () {
      };
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
      var model = function () {
      };
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

  after(function () {
    // disable mock after tests complete
    mockery.disable();
  });

  it('must check for an existing Stats Incident when filtering', function (done) {
    // Load the mocked stuff first
    var Incident = require('../../../app/models/incident');
    var StatsIncident = require('../../../app/models/stats-incident');
    var mockedIncidentPOJO = {_id: 'hex12asc', location: {spec: {}}, created_at: new Date()};
    var mockedStatsIncident = {
      id: 'hexstats1222',
      total: 1,
      toObject: sinon.stub().returns({})
    };

    sinon.stub(Incident, 'mapReduce', function (options, callback) {
      var stats = {
        counts: {
          reduce: true
        }
      };
      var model = {}

      callback(null, model, stats);
    });
    sinon.stub(StatsIncident, 'findOne').returns(
      {
        lean: function lean() {
          return {
            exec: function exec() {
              return Promise.resolve(null);
            }
          }
        }
      }
    );

    // Test subject
    var IncidentHandler = require('./incident');
    var incidentHandler = new IncidentHandler();
    var validEvent = {type: 'INCIDENT_REPORTED', args: [mockedIncidentPOJO]};

    var promise = incidentHandler.filter(validEvent);

    promise.then(
      function (resolved) {
        expect(resolved).to.be(false);
        expect(StatsIncident.findOne.calledOnce).to.be(true);

        done();
      },
      done
    );
  });
});
