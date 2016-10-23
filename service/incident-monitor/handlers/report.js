/**
 * A typical handler should have three exported functions:
 *
 * 1. filter: which should decide whether or not this handler should handle the event
 * 2. handle: invoked if this handler should handle the event
 * 3. passthrough: else clean up if needed
 */
var uuid = require('node-uuid');

var StatsIncident = require('../../../app/models/stats-incident');
var Report = require('../../../app/models/report');
var User = require('../../../app/models/user');

var DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT = 5;
var DEFAULT_INCIDENT_TIME_RESOLUTION = 15; // minutes. Incidents should happen within this threshold to be counted as 1


module.exports = ReportHandler;

function ReportHandler (amqpConnection) {
    this.connection = amqpConnection;
}

ReportHandler.prototype.filter = filter;
ReportHandler.prototype.handle = handle;
ReportHandler.prototype.passthrough = passthrough;
/**
 * If the returned promise returns true, the function handle must be invoked, else passthrough must be
 */
function filter (event) {
    console.log('[handler: report.filter] Filtering event');

    if (event.type !== 'REPORT_GENERATED') {
        return Promise.resolve(false);
    }

    // var report = event.args[0];
    // var date = new Date(report.created_at); // incident is a POJO, created_at is a ISO-8601 string

    console.log('[handler: report.filter] Will handle the event');
    return Promise.resolve(true);
    // Function private

    function handler () {

    }

    function errorHandler (error) {
        console.error(error.message || '[handler: report.filter] Unknown error');

        return Promise.resolve(false);
    }
}


function handle (event) {
    console.log('[handler: report.handle] Handling event...');

    var report = event.args[0];
    var notification = generateNotification(report);
    // TODO Based on the location of the report, a number of users who live in that area will receive requests for confirmation in their list of "reports_to_confirm"
    // TODO Exclude report owners and those who has already received the same notification

    console.log('[handler: report.handle] Finding all users...');
    return User.find({}).then(notifyUsers)
        .then(function () {
            return true;
        });

    function notifyUsers (users) {
        if (!users.length) {
            return Promise.resolve();
        }
        console.log('[handler: report.handle] Notifying', users.length, 'users....');

        var promises = [];
        var user;

        while (user = users.shift()) {
            promises.push(User.findByIdAndUpdate(user._id, {
                $push: {
                    reports_to_confirm: notification
                }
            }));
        }

        return Promise.all(promises);
    }

    function generateNotification (report) {
        return {
            id: uuid.v4(),
            status: 'unread',
            report_id: report._id,
            created_at: Date.now()
        };
    }
}

/**
 * passthrough has no arguments on purpose. This function is supposed to be a cleanup function.
 */
function passthrough () {
    console.log('[handler: report.passthrough]');

    return Promise.resolve();
}
