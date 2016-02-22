// =============================================
// IMPLEMENTATION
// =============================================
var Incident = require('../models/incident');

exports.GET = function getIncidents (req, res) {
  res.send('GET incidents');
};

exports.POST = function postIncidents (req, res) {
  var data = req.body;
  
  var incident = new Incident(data);

  incident.save().then(function(incident) {
    console.log('[controller.incident.POST] Incident has been saved');
    res.send(incident);    
  }).catch(function(error) {
    res.send(400, error.message);
  });
};