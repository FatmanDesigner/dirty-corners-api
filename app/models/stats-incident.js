var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var statsIncidentSchema = new Schema({
  id: {
    year: Number,
    month: Number, // starts from 0 to 11, just to be JS friendly
    day: Number,
    hour: Number,
    minute: Number, // Should rounded down to nearest quarters
    location: {
      placeid: String,
      route: String,
      locality: String,
      administrative_area_level_2: String,
      administrative_area_level_1: String,
      country: String
    },
    type: String,
  },
  value: {
    total: Number,
    report: { type: Schema.Types.ObjectId, ref: 'report' },
    incident_list: [{ type: Schema.Types.ObjectId, ref: 'incident' }],
    reported_by: [{ type: String, ref: 'user' }]
  }
}, {
  autoIndex: false,
  _id: false,
  noId: true,
  noVirtualId: true,
});

// the schema is useless so far
// we need to create a model using it
var StatsIncident = mongoose.model('stats_incident', statsIncidentSchema);

// make this available to our users in our Node applications
module.exports = StatsIncident;
