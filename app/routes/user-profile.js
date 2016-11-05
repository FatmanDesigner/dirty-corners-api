var _ = require('lodash');
var User = require('../models/user');


exports.GET_ID = function (req, res) {
  var user = req.user;

  if (!user || !user.sub) {
    return res.status(401).send('Unauthorized access');
  }

  console.log('[user-profile] Finding user', user.sub);
  var key = user.sub.split('|'); // sub takes the form of provider|identifier, eg: facebook|12323
  var oauthKey = key[0];
  var oauthValue = key[1];

  var condition = {};
  condition['oauth.' + oauthKey] = oauthValue;

  return User.findOne(condition).then(function(profile) {
    res.send(profile);
  });
};

exports.PUT_ID = function (req, res) {
  console.log('Handling user-profile PUT');
  var data = req.body;
  var user = req.user;

  if (!user || !user.sub) {
    return res.status(401).send('Unauthorized access');
  }

  var key = user.sub.split('|'); // sub takes the form of provider|identifier, eg: facebook|12323
  var oauthKey = key[0];
  var oauthValue = key[1];

  var condition = {};
  condition['oauth.' + oauthKey] = oauthValue;

  // req.data:
  //     addresses: {
  //       home: String,
  //       work: String
  //     },
  //     settings: {
  //       receive_reports: Boolean,
  //         geolocation_enabled: Boolean
  //     }

  return User.findOne(condition).then(function (profile) {
    if ('addresses' in data) {
      Object.assign(profile.addresses, data.addresses);
    }

    if ('settings' in data) {
      Object.assign(profile.settings, data.settings);
    }

    return profile.save();
  }).then(function (profile) {
    console.log('[user-profile] Updated user: %j', profile._id);

    res.send(profile);
  }).catch(errorHandler);

  function errorHandler (err) {
    res.status(400).send(err.message);
  }
};

exports.PUT_ID = validateBodyFields(['addresses', 'settings'], [])(exports.PUT_ID);


function validateBodyFields (validFields, requiredFields) {
  console.log('Will validate body fields');

  return function (handler) {
    return function (req, res) {
      console.log('Handling request');

      var data = req.body;
      console.log('data: %j', data)

      var fields = Object.keys(data);
      var invalidFields = _.difference(fields, validFields);

      if (invalidFields && invalidFields.length) {
        return res.status(400).send('Invalid fields: ' + _.toString(invalidFields));
      }

      var missingFields = _.difference(requiredFields, fields);
      if (missingFields && missingFields.length) {
        return res.status(400).send('Missing fields ' + _.toString(missingFields));
      }

      handler(req, res);
    };
  }
}
