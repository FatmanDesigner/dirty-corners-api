var express = require('express');
var router = new express.Router();

module.exports = router;
//========================================
var routeIncidents = require('./incidents');
var incidents = router.route('/incidents');

incidents.get(routeIncidents.GET);
incidents.post(routeIncidents.POST);

//========================================
var routeReports = require('./reports');
var reports = router.route('/reports/:id');

reports.get(routeReports.GET_ID);
reports.put(routeReports.PUT_ID);
