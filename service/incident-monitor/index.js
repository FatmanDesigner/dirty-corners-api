// TODO Change this into folder monitors

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
var IncidentHandler = require('../handlers/incident');
var ReportHandler = require('../handlers/report');

var QUEUE_EVENTS = 'events';
var QUEUE_REPORTS = 'reports';
var commonOptions = { durable: true };


// AMQP Consumer
open.then(function connected (conn) {
  onExit(conn);

  var promise = conn.createChannel();
  promise = promise.then(function channelCreated (channel) {
    channel.assertQueue(QUEUE_EVENTS, commonOptions);
    channel.consume(QUEUE_EVENTS, function channelConsumed (msg) {
      if (!msg) {
        console.warn('Message is null');

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
      var incidentHandler = new IncidentHandler(conn);
      // TODO When we have multiple handlers, we must have priority for ordering and loop thru all handlers.
      // TOD Decide whether acknowledge only when all is good or a specifically important handler is good.
      Promise.all([
          incidentHandler.filter(event).then(
              function (shouldHandle) {
                  if (shouldHandle === true) {
                      return incidentHandler.handle(event);
                  }
                  else {
                      return incidentHandler.passthrough();
                  }
              }
          )
      ]).then(function () {
         console.log('All handlers has completed');
      });
    }, { noAck: true });

    channel.consume(QUEUE_REPORTS, function consumeReportChannels (msg) {
      if (!msg) {
        console.warn('Message is null');

        return;
      }
      console.log('Consuming queue "reports"...');

      var event = util.deserialize(msg.content);
      var reportHandler = new ReportHandler(conn);

      reportHandler.filter(event).then(
        function (shouldHandle) {
          if (shouldHandle === true) {
            return reportHandler.handle(event);
          }
          else {
            return reportHandler.passthrough();
          }
        }
      ).then(function () {
        console.log('Consuming queue "reports" DONE');
      });
    }, { noAck: true });
  });

  return promise;
}).then(null, console.warn);

function onExit (connection) {
    process.on('exit', function () {
        console.log('[service:report-incident] Process exiting normally...');

        connection.close();
    });
}
