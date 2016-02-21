// =============================================
// IMPLEMENTATION
// =============================================
var Incident = require('../models/incident');

exports.GET = function getIncidents (req, res) {
  res.send('GET incidents');
};

exports.POST = function postIncidents (req, res) {
  var data = req.body;
  
  console.log(data);
  var incident = new Incident(data);

  incident.save().then(function(incident) {
    res.send(incident);    
  }).catch(function(error) {
    res.send(400, error.message);
  });
};
