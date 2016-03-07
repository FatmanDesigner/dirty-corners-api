var util = require('../../service/util');

var QUEUE_NAME = 'events';
var commonOptions = { durable: true };
var messageOption = { persistent: true };

var channel;

// Producer
exports.publish = function publish (connection, report) {
    if (channel) {
        console.log('[messaging:report] Reusing the channel...');
        channel.sendToQueue(QUEUE_NAME, util.createEvent('REPORT_GENERATED', report));
        
        return Promise.resolve();
    }
    
    console.log('[messaging:report] Opening new channel...');
    return connection.createChannel().then(onChannelCreated);
    
    // Function private
    function onChannelCreated (ch) {
        console.log('[service:report] Opening new channel... DONE');
        ch.assertQueue(QUEUE_NAME, commonOptions); // Python declare equivalence
        channel = ch;
        
        channel.sendToQueue(QUEUE_NAME, util.createEvent('REPORT_GENERATED', report));
    }
};