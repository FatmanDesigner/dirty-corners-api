var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var reportSchema = new Schema({
    year: Number,
    month: Number, // starts from 0 to 11, just to be JS friendly
    day: Number,
    hour: Number,
    minute: Number, // Should rounded down to nearest quarters
    location:{  // For each Incident Stats, a report is generated with either placeid or country, administrative_area_level_1...
        placeid: String,
        route: String,
        locality: String,
        administrative_area_level_2: String,
        administrative_area_level_1: String,
        country: String
    },
    location_level: String, // The most specific level type: placeid | route | locality | admin administrative_area_level_1 | administrative_area_level_2 | country
    type: String,
    confirmed_total: Number,
    denied_total: Number,
    confirmed_by: {
        type: [String], // A SET of userIDs 
        default: []
    },
    denied_by: {
        type: [String], // A SET of userIDs 
        default: []
    },
    stats_incident: { type: Schema.Types.ObjectId, ref: 'stats_incident' }, // Gets the list of backing evidence here
    created_at: Date,
    updated_at: Date
}, { autoIndex: false });

reportSchema.index({
    year: -1,
    month: -1,
    day: -1,
    hour: -1,
    minute: -1,
    "location.placeid": 1,
    "location.route": 1,
    "location.locality": 1,
    "location.administrative_area_level_2": 1,
    "location.administrative_area_level_1": 1,
    "location.country": 1,
    type: 1
}, { unique: true });

reportSchema.virtual('responded_by').get(function () { return this.confirmed_by.concat(this.denied_by); });
reportSchema.virtual('responded_total').get(function () { return this.confirmed_total + this.denied_total; });

// See https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
reportSchema.pre('save', function (next) {
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
var Report = mongoose.model('report', reportSchema);
module.exports = Report;