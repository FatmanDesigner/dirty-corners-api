var url = process.env.CLOUDAMQP_URL;
var open = require('amqplib').connect(url);
var util = require('../util');

var QUEUE_NAME = 'events';

// Producer
module.exports = function publish (incident) {
    var promise;
    
    promise = open.then(function (conn) {
        var ok = conn.createChannel();
      
        ok = ok.then(function (channel) {
            channel.assertQueue(QUEUE_NAME); // Python declare equivalence
            
            channel.sendToQueue(QUEUE_NAME, util.createEvent('INCIDENT_REPORTED', incident));
            
            // TODO Close the channel
        });
        
        return ok;
    });
    
    return promise;
};