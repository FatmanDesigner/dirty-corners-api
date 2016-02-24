console.info('Checking for environment variables...');
if (process.env.MONGOLAB_URI) {
    console.info('MONGOLAB_URI:', process.env.MONGOLAB_URI);
}
if (process.env.CLOUDAMQP_URL) {
    console.info('CLOUDAMQP_URL:', process.env.CLOUDAMQP_URL);
}
console.log('Checking for environment variables... DONE');

// Services and third party components
var open = require('amqplib').connect(process.env.CLOUDAMQP_URL);
var mongoose = require('mongoose').connect(process.env.MONGOLAB_URI);

// Application domain
var util = require('../util');
var incidentHandler = require('../handlers/incident');
var QUEUE_NAME = 'events';


// AMQP Consumer
open.then(function connected (conn) {
  var ok = conn.createChannel();
  ok = ok.then(function channelCreated (channel) {
    channel.assertQueue(QUEUE_NAME);
    channel.consume(QUEUE_NAME, function channelConsumed (msg) {
      if (!msg) {
        console.warn('Message is null');
        channel.ack();
        return;
      }
      var event = util.deserialize(msg.content);
      
      /** 
       * TODO IMPORTANT BUSINESS LOGIC
       * Check for the total number of reported event of the same type
       * to decide whether or not to crate a report or simply increment
       * the stats for that date and time and type and location
       */      
      var promise;
      // TODO When we have multiple handlers, we must have priority for ordering and loop thru all handlers.
      // TOD Decide whether acknowledge only when all is good or a specifically important handler is good.
      promise = incidentHandler.filter(event).then(
          function (shouldHandle) {
              if (shouldHandle === true) {
                  return incidentHandler.handle(event);
              }
              else {
                  return incidentHandler.passthrough();
              }
          }
      );
      
      promise.then(function () {
          channel.ack(msg);
      });
    });
  });
  return ok;
}).then(null, console.warn);
