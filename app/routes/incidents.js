// =============================================
// IMPLEMENTATION
// =============================================
var Incident = require('../models/incident');
var reportIncident = require('../../service/incident-monitor/report-incident');

exports.GET = function getIncidents (req, res) {
  res.send('GET incidents');
};

exports.POST = function postIncidents (req, res) {
  var data = req.body;
  
  if (!data) {
    return res.status(400).send('Invalid data');
  }
  
  if (!('type' in data)) {
    return res.status(400).send('Invalid data');
  }
  
  if (!('location' in data)) {
    return res.status(400).send('Invalid data');
  }
  
  if (!('latlng' in data.location)) {
    return res.status(400).send('Invalid data');
  }
  
  var incident = new Incident(data);

  incident.save().then(function(incident) {
    console.log('[controller.incident.POST] Incident has been saved');
    // TODO Send a task item to RabbitMQ here
    return reportIncident(incident.toObject()).then(function () { return incident; });
  }).then(function() {    
    res.send(incident);    
  }).catch(function(error) {
    res.status(400).send(error.message);
  });
};
