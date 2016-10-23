/**
 * A typical handler should have three exported functions:
 *
 * 1. filter: which should decide whether or not this handler should handle the event
 * 2. handle: invoked if this handler should handle the event
 * 3. passthrough: else clean up if needed
 */
// var emit = function () {}
var messagingReport = require('../../../app/messaging/report');

var Incident = require('../../../app/models/incident');
var StatsIncident = require('../../../app/models/stats-incident');
var Report = require('../../../app/models/report');

var DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT = 5;
var DEFAULT_INCIDENT_TIME_RESOLUTION = 15; // minutes. Incidents should happen within this threshold to be counted as 1


module.exports = IncidentHandler;

function IncidentHandler (amqpConnection) {
    this.connection = amqpConnection;
}

IncidentHandler.prototype.filter = filter;
IncidentHandler.prototype.handle = handle;
IncidentHandler.prototype.passthrough = passthrough;
/**
 * If the returned promise returns true, the function handle must be invoked, else passthrough must be
 */
function filter (event) {
    console.log('[handler: incident.filter] Filtering event');

    if (event.type !== 'INCIDENT_REPORTED') {
        return Promise.resolve(false);
    }

    var incident = event.args[0];
    var date = new Date(incident.created_at); // incident is a POJO, created_at is a ISO-8601 string
    var roundedMinutes = Math.floor(date.getUTCMinutes() / DEFAULT_INCIDENT_TIME_RESOLUTION) * DEFAULT_INCIDENT_TIME_RESOLUTION;
    var lowerDate = new Date(incident.created_at);
    lowerDate.setUTCMinutes(roundedMinutes, 0, 0);
    // Minutes are rounded down to the nearest quarters

    var query = {
        created_at: {
          '$gte': lowerDate,
          '$lte': date,
        },
        location: incident.location,
        type: incident.type
    };
    console.log('[handler: incident.filter] Querying for', JSON.stringify(query));

    var docStats = Object.assign({}, query, { total: 1 });
    var updateOptions = { new: true };

    return new Promise(function (resolve, reject) {
      Incident.mapReduce({
        out: {
          merge: 'stats_incidents'
        },
        query: query,
        map: function () {
          var created_at = this.created_at;
          var year = created_at.getUTCFullYear(),
            month = created_at.getUTCMonth(),
            day = created_at.getUTCDate(),
            hour = created_at.getUTCHours(),
            minute = Math.floor(created_at.getUTCMinutes() / DEFAULT_INCIDENT_TIME_RESOLUTION) * DEFAULT_INCIDENT_TIME_RESOLUTION;

          if (minute === conditions.minute) {
            emit(
              {
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute,
                location: this.location.spec,
                type: this.type
              },
              {
                incident_list: [this._id],
                reported_by: [this.reported_by]
              });
          }
        },
        reduce: function (key, values) {
          return {
            reduced: 1,
            total: values.length,
            incident_list: values.map(function (item) { return item.incident_list[0]; }),
            reported_by: values.map(function (item) { return item.reported_by[0]; })
          };
        },
        scope: {
          conditions: { // Not the same as the variable conditions above
            minute: roundedMinutes
          },
          DEFAULT_INCIDENT_TIME_RESOLUTION: DEFAULT_INCIDENT_TIME_RESOLUTION
        },
        inline : 1
      }, handler);

      // Function private

      function handler (err, model, stats) {
        if (err) {
          console.warn('[handler: incident.filter] Could not updated stats incident by ID. Document not found.');

          return errorHandler(err);
        }
        console.log('[handler: incident.filter] Affected stats incident', JSON.stringify(model), JSON.stringify(stats));
        for (var i=0, len=stats.length; i<len; i++) {
          console.log('[handler: incident.filter] stat', JSON.stringify(stats[i]));
        }

        if (stats.counts.reduce) {
          var created_at = new Date(incident.created_at);
          var year = created_at.getUTCFullYear(),
              month = created_at.getUTCMonth(),
              day = created_at.getUTCDate(),
              hour = created_at.getUTCHours(),
              minute = Math.floor(created_at.getUTCMinutes() / DEFAULT_INCIDENT_TIME_RESOLUTION) * DEFAULT_INCIDENT_TIME_RESOLUTION,
              location = incident.location,
              type = incident.type;

          var id = {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute,
            location: location.spec,
            type: type
          };

          StatsIncident.findOne({_id: id}).lean().exec()
            .then(function (statsIncident) {
              if (!statsIncident) {
                return resolve(false);
              }

              console.log(JSON.stringify(statsIncident));
              if (statsIncident.value.total >= DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT) {
                var outParam = Object.assign({}, statsIncident.value, statsIncident._id)

                event.outParams = [outParam];
                resolve(true);
              }
              else {
                resolve(false);
              }
            })
            .catch(function (err) {
              reject(err);
            });
        }
      }

      function errorHandler (error) {
        console.error(error.message || '[handler: incident.filter] Unknown error');

        return Promise.resolve(false);
      }
    });
}


function handle (event) {
    if (!event.outParams || !event.outParams.length) {
        throw new Error('Out params missing. Expecting statsIncident.');
    }
    var statsIncident = event.outParams[0];

    console.log('[handler: incident.handle] Stats Incident #', statsIncident._id);
    // TODO If there is a need for multiple level of reports, fan out here
    // FIXME Find a better way to transfer statsIncident

    var condition = {
        year: statsIncident.year,
        month: statsIncident.month,
        day: statsIncident.day,
        hour: statsIncident.hour,
        minute: statsIncident.minute,
        type: statsIncident.type
    };

    if (statsIncident.report) {
        // Do nothing because a report is already created
        console.log('[handler: incident.handle] A report for Stats Incident had already been created for Stats Incident', statsIncident._id);

        return true;
    }
    else if (statsIncident.location.placeid) {
        condition.location = {
            placeid: statsIncident.location.placeid
        };
    }
    else {
        condition.location = Object.assign({}, statsIncident.location);
        delete condition.location.placeid;
    }

    var location_level = ((('placeid' in statsIncident.location)?'placeid':null)
                         || (('route' in statsIncident.location)?'route':null)
                         || (('locality' in statsIncident.location)?'locality':null)
                         || (('administrative_area_level_2' in statsIncident.location)?'administrative_area_level_2':null)
                         || (('administrative_area_level_1' in statsIncident.location)?'administrative_area_level_1':null)
                         || (('country' in statsIncident.location)?'country':null)
                         );
    var docReport = Object.assign({}, condition,
        {
            location_level: location_level,
            confirmed_total: 0,
            denied_total: 0,
            stats_incident: statsIncident._id,
            reported_by: statsIncident.reported_by,
        });

    console.log('[handler: incident.handle] Querying for report', condition);
    var self = this;

    return Report.findOne(condition).then(function (report) {
        // FIXME Find the updated statsIncident from database to have to list of reporters
        if (report) {
            // Do nothing because a report is already created
            console.log('[handler: incident.handle] A report for Stats Incident had already been created');

            return true;
        }

        return createReport.call(self, statsIncident, docReport);
        // Possibly send to Pubnub for notifications here

        // Leave it here as guidance
        // return Report.findByIdAndUpdate(report.id,
        //     {
        //         $inc: { total: 1 },
        //         $push: { incident_list: incident.id }
        //     }, updateOptions);
    });

    function createReport (statsIncident, docReport) {
        console.log('[handler: incident.handle] Creating a new report for Stats incident #', statsIncident._id);

        return (new Report(docReport)).save().then(function (report) {
            console.log('[handler: incident.handle] Associating new report to Stats incident #', statsIncident._id);

            return StatsIncident.findByIdAndUpdate(statsIncident._id, { report: report.id }).then(function () {
                console.log('### FLAG ###');

                return report;
            });
        }).then(function (report) {
            console.log('### FLAG ### connection:', self.connection);

            // Let report handler do the job
            messagingReport.publish(self.connection, report.toObject());
            return true;
        });
    }
}

/**
 * passthrough has no arguments on purpose. This function is supposed to be a cleanup function.
 */
function passthrough () {
    console.log('[handler: incident.passthrough]');

    return Promise.resolve();
}
