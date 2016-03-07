var util = require('../../service/util');

var QUEUE_NAME = 'events';
var commonOptions = { durable: true };
var messageOption = { persistent: true };

var channel;

// Producer
exports.publish = function publish (connection, incident) {
    if (channel) {
        console.log('[service:report-incident] Reusing the channel...');
        channel.sendToQueue(QUEUE_NAME, util.createEvent('INCIDENT_REPORTED', incident));
        
        return Promise.resolve();
    }
    
    console.log('[messaging:incident] Opening new channel...');
    return connection.createChannel().then(onChannelCreated);
    
    // Function private
    function onChannelCreated (ch) {
        console.log('[service:report-incident] Opening new channel... DONE');
        ch.assertQueue(QUEUE_NAME, commonOptions); // Python declare equivalence
        channel = ch;
        
        channel.sendToQueue(QUEUE_NAME, util.createEvent('INCIDENT_REPORTED', incident), messageOption);
    }
};