var express = require('express');
var router = new express.Router();
var routeIncidents = require('./incidents');

module.exports = router;
//========================================
var incidents = router.route('/incidents');

incidents.get(routeIncidents.GET);
incidents.post(routeIncidents.POST);