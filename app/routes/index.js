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
var reports = router.route('/reports');
var reportById = router.route('/reports/:id');

reports.get(routeReports.GET);

reportById.get(routeReports.GET_ID);
reportById.put(routeReports.PUT_ID);

//========================================
var routeUserProfile = require('./user-profile');
var userProfile = router.route('/profile');

userProfile.get(routeUserProfile.GET_ID);
userProfile.put(routeUserProfile.PUT_ID);
