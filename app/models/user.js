var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var schema = new Schema({
    id: String,
    created_at: Date,
    updated_at: Date,
  /**
   * OPERATIONAL DATA
   */
    reports_to_confirm: [
      {
        id: String, // GUID for notification
        status: String,  // 'read' | 'unread',
        report_id: { type: Schema.Types.ObjectId, ref: 'report' },
        created_at: Date
      }
    ],
  /**
   * AUTHENTICATION DATA
   */
    oauth: {
      facebook: {
        type: String,
        index: true
      }
    },
  /**
   * PERSONAL DATA
   */
    addresses: {
      home: String,
      work: String
    },
    settings: {
      receive_reports: Boolean,
      geolocation_enabled: Boolean
    }
}, { autoIndex: false });

// See https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
schema.pre('save', function (next) {
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
var User = mongoose.model('user', schema);
module.exports = User;
