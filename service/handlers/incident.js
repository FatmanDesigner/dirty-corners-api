/**
 * A typical handler should have three exported functions:
 * 
 * 1. filter: which should decide whether or not this handler should handle the event
 * 2. handle: invoked if this handler should handle the event
 * 3. passthrough: else clean up if needed
 */

var StatsIncident = require('../../app/models/stats-incident');
var Report = require('../../app/models/report');

var DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT = 5;
var DEFAULT_INCIDENT_TIME_RESOLUTION = 15; // minutes. Incidents should happen within this threshold to be counted as 1

/**
 * If the returned promise returns true, the function handle must be invoked, else passthrough must be
 */ 
exports.filter = function filter (event) {
    console.log('[handler: incident.filter] Filtering event');

    if (event.type !== 'INCIDENT_REPORTED') {
        return Promise.resolve(false);
    }
    
    var incident = event.args[0];
    var date = new Date(incident.created_at); // incident is a POJO, created_at is a ISO-8601 string
    
    var roundedMinutes = Math.floor(date.getMinutes() / DEFAULT_INCIDENT_TIME_RESOLUTION) * DEFAULT_INCIDENT_TIME_RESOLUTION;
    // Minutes are rounded down to the nearest quarters
    
    var conditions = {
        year: date.getFullYear(),
        month: date.getMonth(), // starts with 0
        day: date.getDate(),
        hour: date.getHours(),
        minute: roundedMinutes,
        location: incident.location.spec,
        type: incident.type
    };
    console.log('[handler: incident.filter] Querying for', conditions);
    
    var docStats = Object.assign({}, conditions, { total: 1 });
    var updateOptions = { new: true };
    
    return StatsIncident.findOne(conditions).then(function (statsIncident) {
        if (!statsIncident) {
            docStats.incident_list = [incident._id];
            console.log('[handler: incident.filter] Stats incident not found. Creating new one', docStats);
            
            return new StatsIncident(docStats).save();
        }
        
        console.log('[handler: incident.filter] Incrementing total by one', statsIncident.id);
        return StatsIncident.findByIdAndUpdate(statsIncident.id, 
                {
                    $inc: { total: 1 },
                    $push: { incident_list: incident._id }
                }, updateOptions);
    }).then(handler).catch(errorHandler);
    
    // Function private
    
    function handler (statsIncident) {
        if (!statsIncident) {
            console.warn('[handler: incident.filter] Could not updated stats incident by ID. Document not found.');
            return Promise.resolve(false);
        }
        console.log('[handler: incident.filter] Affected stats incident', statsIncident.id);
        
        if (statsIncident.total < DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT) {
            return Promise.resolve(false);
        }
        else {
            // WARNING: Original event has been mutated
            event.outParams = [statsIncident.toObject()];
            
            return Promise.resolve(true);
        }
    }
    
    function errorHandler (error) {
        console.error(error.message || '[handler: incident.filter] Unknown error');
        
        return Promise.resolve(false);
    }
};


exports.handle = function handle (event) {
    if (!event.outParams || !outParams.length) {
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
        });
    
    console.log('[handler: incident.handle] Querying for report', condition);
    return Report.findOne(condition).then(function (report) {
        if (!report) {
            console.log('[handler: incident.handle] Creating a new report for Stats incident #', statsIncident._id);
            
            return (new Report(docReport)).save().then(function (report) {
                console.log('[handler: incident.handle] Associating new report to Stats incident #', statsIncident._id);
                
                return StatsIncident.findByIdAndUpdate(statsIncident._id, { report: report.id });
            });
            
            // Possibly send to Pubnub for notifications here
        }
        // Else do nothing because a report is already created
        console.log('[handler: incident.handle] A report for Stats Incident had already been created');
        
        return true;
        // Leave it here as guidance
        // return Report.findByIdAndUpdate(report.id, 
        //     {
        //         $inc: { total: 1 },
        //         $push: { incident_list: incident.id }
        //     }, updateOptions);
    });
};

/**
 * passthrough has no arguments on purpose. This function is supposed to be a cleanup function.
 */
exports.passthrough = function handle () {
    console.log('[handler: incident.passthrough]');
    
    return Promise.resolve();
};