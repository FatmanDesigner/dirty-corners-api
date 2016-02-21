var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var incidentSchema = new Schema({
  type: String,
  location: {
    latlng: [Number, Number],
    spec: {
      placeid: String,
      route: String,
      locality: String,
      administrative_area_level_2: String,
      administrative_area_level_1: String,
      country: String
    }
  },
  created_at: Date,
  updated_at: Date
});

// See https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
incidentSchema.pre('save', function(next) {
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
var Incident = mongoose.model('incident', incidentSchema);

// make this available to our users in our Node applications
module.exports = Incident;