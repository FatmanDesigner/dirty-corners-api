require('es6-promise').polyfill();

var expect = require('expect.js');
var sinon = require('sinon');
var mockery = require('mockery');

describe('Report controller: GET_ID', function () {
    var reports;
    
    before(function() {
        mockery.registerMock('../models/report', function () {
            var model = function () {};
            model.findById = function () { 
                console.warn('Should be overriden with sinon.stub');
                throw new Error('Not implemented');
            };
            
            return model;
        }());
        // mock the error reporter
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });
        
        reports = require('./reports');
    });
    
    afterEach(function () {
        // var Incident = require('../models/incident');
        // Incident.prototype.save.restore(); 
    });
    
    after(function() {
        // disable mock after tests complete
        mockery.disable();
    });
    
    it('has GET_ID handler', function () {
        expect(typeof(reports.GET_ID)).equal('function');
    });
    
    it('responds to /:id?verb=confirm where id=1', function (done) {
        var Report = require('../models/report');
        sinon.stub(Report, 'findById').returns({
            lean: function () { 
                return Promise.resolve({});
            }
        });
        
        var req = { 
            params: { id: 1 },
            verb: 'confirm'
        };
        var spy = sinon.spy();
        var res = {
            send: spy
        };
        
        reports = require('./reports');
        reports.GET_ID(req, res);
        
        process.nextTick(function () {
            expect(spy.calledOnce).to.equal(true);
            done();
        });
    });
});

describe('Report controller: PUT_ID', function () {
    var Report;
    var reports;
    
    before(function() {
        mockery.registerMock('../models/report', function () {
            var model = function () {};
            model.prototype = {
                save: function () { 
                    console.warn('Should be overriden with sinon.stub');
                    throw new Error('Not implemented');
                }
            };
            model.findById = function () { 
                console.warn('Should be overriden with sinon.stub');
                throw new Error('Not implemented');
            };
            model.findByIdAndModify = function () { 
                console.warn('Should be overriden with sinon.stub');
                throw new Error('Not implemented');
            };
            
            return model;
        }());
        // mock the error reporter
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });
        
        reports = require('./reports');
    });
    
    afterEach(function () {
        if (Report) {
            Report.findById.restore && Report.findById.restore(); 
            Report.findByIdAndModify.restore && Report.findByIdAndModify.restore();     
        }
    });
    
    after(function() {
        // disable mock after tests complete
        mockery.disable();
    });
    
    it('has PUT_ID handler', function () {
        expect(typeof(reports.PUT_ID)).equal('function');
    });
    
    it('confirms report properly', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        Report = require('../models/report');
        
        var mockedReport = {
            __v: 0,
            _id: 'abc123',
            type: 'accident',
            year: 2016,
            month: 3,
            day: 2,
            hour: 10,
            minute: 10,
            location: {
                placeid: '123',
                administrative_area_level_1: 'Ho Chi Minh City',
                country: 'Vietnam'
            },
            location_level: 'placeid',
            reported_by: [],
            confirmed_by: [],
            denied_by: [],
            confirmed_total: 0,
            denied_total: 0,
            toObject: sinon.stub()
        };

        sinon.stub(Report, 'findById').returns({
            lean: function () {
                return Promise.resolve(mockedReport);
            }
        });

        sinon.stub(Report, 'findByIdAndModify', function() {
            mockedReport.confirmed_by.push('facebook|user123');
            mockedReport.confirmed_total = 1;
            
            return Promise.resolve({
                lean: function () { 
                    return Promise.resolve(mockedReport);
                }
            });
        });
            
        var req = {
            params: { id: 1 },
            user: { sub: 'facebook|user123' },
            query: { verb: 'confirm' }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('send').once();
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        
        process.nextTick(function() {
            expect(Report.findById.calledOnce).to.equal(true);
            expect(Report.findByIdAndModify.calledOnce).to.equal(true);
            // TODO Fix the assertion
            mock.verify();
            done();
        });
    });
    
    it('generates error for improper request: Confirm own report', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        Report = require('../models/report');
        
        var mockedReport = {
            __v: 0,
            _id: 'abc123',
            type: 'accident',
            year: 2016,
            month: 3,
            day: 2,
            hour: 10,
            minute: 10,
            location: {
                placeid: '123',
                administrative_area_level_1: 'Ho Chi Minh City',
                country: 'Vietnam'
            },
            location_level: 'placeid',
            reported_by: ['facebook|user123'],
            confirmed_by: [],
            denied_by: [],
            confirmed_total: 0,
            denied_total: 0,
            toObject: sinon.stub()
        };

        sinon.stub(Report, 'findById').returns({
            lean: function () {
                return Promise.resolve(mockedReport);
            }
        });

        sinon.stub(Report, 'findByIdAndModify', function() {
            mockedReport.confirmed_by.push('facebook|user123');
            mockedReport.confirmed_total = 1;
            
            return Promise.resolve({
                lean: function () { 
                    return Promise.resolve(mockedReport);
                }
            });
        });
            
        var req = {
            params: { id: 1 },
            user: { sub: 'facebook|user123' },
            query: { verb: 'confirm' }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('status').withArgs(400).returns(res);
        mock.expects('send').withArgs('Cannot confirm or deny own Report').once();
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        
        process.nextTick(function() {
            expect(Report.findById.calledOnce).to.equal(true);
            expect(Report.findByIdAndModify.callCount).to.equal(0);
            // TODO Fix the assertion
            // mock.verify();
            // Report.findByIdAndModify.restore(); 
            done();
        });
    });
    
    it('generates error for improper request: Confirm multiple times', function (done) {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        Report = require('../models/report');
        
        var mockedReport = {
            __v: 0,
            _id: 'abc123',
            type: 'accident',
            year: 2016,
            month: 3,
            day: 2,
            hour: 10,
            minute: 10,
            location: {
                placeid: '123',
                administrative_area_level_1: 'Ho Chi Minh City',
                country: 'Vietnam'
            },
            location_level: 'placeid',
            reported_by: [],
            confirmed_by: ['facebook|user123'],
            denied_by: [],
            confirmed_total: 1,
            denied_total: 0,
            toObject: sinon.stub()
        };

        sinon.stub(Report, 'findById').returns({
            lean: function () {
                return Promise.resolve(mockedReport);
            }
        });

        sinon.stub(Report, 'findByIdAndModify', function() {
            mockedReport.confirmed_by.push('facebook|user123');
            mockedReport.confirmed_total = 1;
            
            return Promise.resolve({
                lean: function () { 
                    return Promise.resolve(mockedReport);
                }
            });
        });
            
        var req = {
            params: { id: 1 },
            user: { sub: 'facebook|user123' },
            query: { verb: 'confirm' }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('status').withArgs(400).returns(res);
        mock.expects('send').withArgs('Cannot confirm or deny mulitple times').once();
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        
        process.nextTick(function() {
            expect(Report.findById.calledOnce).to.equal(true);
            expect(Report.findByIdAndModify.callCount).to.equal(0);
            // TODO Fix the assertion
            // mock.verify();
            // Report.findByIdAndModify.restore(); 
            done();
        });
    });
    
    it('generates error for improper request: No user', function () {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var req = {
            params: { id: 1 },
            // user: { sub: 'facebook|user123' },
            query: { verb: 'confirm' }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('status').withArgs(401).returns(res);
        mock.expects('send').withArgs('Unauthorized access');
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        mock.verify();
    });
    
    it('generates error for improper request: No verb', function () {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var req = {
            params: { id: 1 },
            user: { sub: 'facebook|user123' },
            query: {
            //    verb: 'confirm'
            }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('status').withArgs(400).returns(res);
        mock.expects('end').once();
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        mock.verify();
    });
    
    it('generates error for improper request: Invalid verb', function () {
        // Why it's called unittest?
        // Because we know all about the internal implementation of the unit.
        
        var req = {
            params: { id: 1 },
            user: { sub: 'facebook|user123' },
            query: {
                verb: 'junk'
            }
        };
        
        var res = {
            status: function () { return this; },
            end: function () { return this; },
            send: function () { return this; }
        };
        var mock = sinon.mock(res);
        mock.expects('status').withArgs(400).returns(res);
        mock.expects('end').once();
        
        // Perform the tested action
        reports.PUT_ID(req, res);
        mock.verify();
    });
});