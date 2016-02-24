var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var statsIncidentSchema = new Schema({
    year: Number,
    month: Number, // starts from 0 to 11, just to be JS friendly
    day: Number,
    hour: Number,
    minute: Number, // Should rounded down to nearest quarters
    location:{
        placeid: String,
        route: String,
        locality: String,
        administrative_area_level_2: String,
        administrative_area_level_1: String,
        country: String
    },
    type: String,
    total: Number,
    report: { type: Schema.Types.ObjectId, ref: 'report' },
    created_at: Date,
    updated_at: Date
}, { autoIndex: false });

statsIncidentSchema.index({
    year: -1,
    month: -1,
    day: -1,
    hour: -1,
    minute: -1,
    location: 1,
    type: 1
}, { unique: true });

// See https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
statsIncidentSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

// the schema is useless so far
// we need to create a model using it
var StatsIncident = mongoose.model('stats_incident', statsIncidentSchema);

// make this available to our users in our Node applications
module.exports = StatsIncident;