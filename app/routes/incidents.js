// =============================================
// IMPLEMENTATION
// =============================================
var Incident = require('../models/incident');
var messagingIncident = require('../messaging/incident');

exports.GET = function getIncidents (req, res) {
  Incident.find({}).lean().then(function (incidents) {
    res.send({ incidents: incidents });
  });
};

exports.POST = function postIncidents (req, res) {
  var data = req.body;
  var user = req.user;
  
  if (!user || !user.sub) {
    return res.status(401).send('Unauthorized access');
  }
  
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
  
  if (!('spec' in data.location)) {
    return res.status(400).send('Invalid data');
  }
  else if (!('placeid' in data.location.spec || 'country' in data.location.spec)) {
    return res.status(400).send('Invalid data');  
  }
  
  console.log('[incidents.POST] Receiving individual report from user#', user.sub); // sub stands for subject, the person behinds the claim
  
  data.reported_by = user.sub;
  var incident = new Incident(data);

  incident.save().then(function(incident) {
    console.log('[controller.incident.POST] Incident has been saved');
    // TODO Send a task item to RabbitMQ here
    var connection = req.app.amqpConnection.connection;
    
    return messagingIncident.publish(connection, incident.toObject()).then(function () { return incident; });
  }).then(function() {    
    res.send(incident);    
  }).catch(function(error) {
    res.status(400).send(error.message);
  });
};
