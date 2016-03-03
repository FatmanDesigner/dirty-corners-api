require('es6-promise').polyfill();

var expect = require('expect.js');

describe('Report model', function () {
  var Report = require('./report');
  
  it('must calculate the responded_by from confirmed_by and denied_by', function () {
     var report = new Report({
         confirmed_by: ['facebook|1'],
         denied_by: ['facebook|2'],
     });
     
     expect(report.responded_by).to.be.ok;
     expect(report.responded_by).to.contain('facebook|1');
     expect(report.responded_by).to.contain('facebook|2');
  });
  
  it('must calculate the responded_total from confirmed_total and denied_total', function () {
     var report = new Report({
         confirmed_total: 1,
         denied_total: 1,
     });
     
     expect(report.responded_total).to.be.ok;
     expect(report.responded_total).to.equal(2);
  });
});