if (process.env.MONGOLAB_URI) {
    console.log('MONGOLAB_URI:', process.env.MONGOLAB_URI);
}

// Libraries
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect(process.env.MONGOLAB_URI);
// Application domain
var appRoutes = require('./app/routes');

var app = express();
app.use(bodyParser.json());
// TODO Mount your routes
app.use('/api', appRoutes);

var PORT = process.env['PORT'] || 5000;
app.listen(PORT, function (error) {
    console.log('Listening on port ' + PORT);
});