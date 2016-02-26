var url = process.env.CLOUDAMQP_URL;
// TODO Setup heartbeat "?heartbeat=10"
var open = require('amqplib').connect(url);
var util = require('../util');

var QUEUE_NAME = 'events';
var commonOptions = { durable: true, noAck: true };

var channel;

// Producer
module.exports = function publish (incident) {
    if (channel) {
        console.log('[service:report-incident] Reusing the channel...');
        channel.sendToQueue(QUEUE_NAME, util.createEvent('INCIDENT_REPORTED', incident));
        
        return Promise.resolve()
    }
    
    var promise;
    
    console.log('[service:report-incident] Opening new channel...');
    promise = open.then(function (conn) {
        onExit(conn);
        
        return conn.createChannel().then(onChannelCreated);
        
        function onChannelCreated (ch) {
            console.log('[service:report-incident] Opening new channel... DONE');
            ch.assertQueue(QUEUE_NAME, commonOptions); // Python declare equivalence
            channel = ch;
            
            channel.sendToQueue(QUEUE_NAME, util.createEvent('INCIDENT_REPORTED', incident));
        }
    });
    
    return promise;
};

function onExit (connection) {
    process.on('exit', function () {
        console.log('[service:report-incident] Process exiting normally...');
        
        connection.close(); 
    });
}