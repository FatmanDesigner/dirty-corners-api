if (process.env.MONGOLAB_URI) {
    console.log('MONGOLAB_URI:', process.env.MONGOLAB_URI);
}
if (process.env.AUTH0_SECRET) {
    console.log('AUTH0_SECRET:', process.env.AUTH0_SECRET);
}
if (process.env.AUTH0_AUDIENCE) {
    console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
}

// Libraries
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var jwt = require('express-jwt');

// Security
var jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_SECRET, 'base64'),
  audience: process.env.AUTH0_AUDIENCE
});
var corsMiddleware = cors();

mongoose.connect(process.env.MONGOLAB_URI);
// Application domain
var appRoutes = require('./app/routes');

var app = express();
app.use(bodyParser.json());
// TODO Mount your routes
app.use('/api', corsMiddleware, jwtCheck, appRoutes);

// APPLICATION handlers
app.use(function errorHandler(err, req, res, next) {
  console.error(err);
    
  res.status(err.status).send(err.message);
});

var PORT = process.env['PORT'] || 5000;
app.listen(PORT, function (error) {
    console.log('Listening on port ' + PORT);
});