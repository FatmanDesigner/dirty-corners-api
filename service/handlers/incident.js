/**
 * A typical handler should have three exported functions:
 * 
 * 1. filter: which should decide whether or not this handler should handle the event
 * 2. handle: invoked if this handler should handle the event
 * 3. passthrough: else clean up if needed
 */

var StatsIncident = require('../../app/models/stats-incident');

var DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT = 5;
var DEFAULT_INCIDENT_TIME_RESOLUTION = 15; // minutes. Incidents should happen within this threshold to be counted as 1

/**
 * If the returned promise returns true, the function handle must be invoked, else passthrough must be
 */ 
exports.filter = function filter (event) {
    console.log('[handler: incident.filter]');

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
    
    var doc = Object.assign({}, conditions, { total: 1 });
    var updateOptions = { new: true };
    
    return StatsIncident.findOne(conditions).then(function (statsIncident) {
        if (!statsIncident) {
            console.log('[handler: incident.filter] Stats incident not found. Creating new one', doc);
            
            return new StatsIncident(doc).save();
        }
        
        console.log('[handler: incident.filter] Incrementing total by one', statsIncident.id);
        return StatsIncident.findByIdAndUpdate(statsIncident.id, { $inc: {total: 1 }}, updateOptions);
    }).then(handler).catch(errorHandler);
    
    // Function private
    
    function handler (statsIncident) {
        if (!statsIncident) {
            console.warn('[handler: incident.filter] Could not updated stats incident by ID. Document not found.');
            return Promise.resolve(false);
        }
        console.log('[handler: incident.filter] Affected stats incident', statsIncident.id);
        
        if (statsIncident.total < DEFAULT_MINIMUM_INCIDENTS_BEFORE_FILING_REPORT) {
            return false;
        }
        else {
            return true;
        }
    }
    
    function errorHandler (error) {
        console.error(error.message || '[handler: incident.filter] Unknown error');
        
        return Promise.resolve(false);
    }
};

exports.handle = function handle (event) {
    console.log('[handler: incident.handle]');
    
    return Promise.resolve();    
};

/**
 * passthrough has no arguments on purpose. This function is supposed to be a cleanup function.
 */
exports.passthrough = function handle () {
    console.log('[handler: incident.passthrough]');
    
    return Promise.resolve();
};