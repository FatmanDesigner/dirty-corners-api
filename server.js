if (process.env.MONGOLAB_URI) {
    console.log('MONGOLAB_URI:', process.env.MONGOLAB_URI);
}
if (process.env.AUTH0_CLIENT_SECRET) {
    console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET);
}
if (process.env.AUTH0_AUDIENCE) {
    console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
}
if (process.env.CLOUDAMQP_URL) {
    console.log('CLOUDAMQP_URL:', process.env.CLOUDAMQP_URL);
}

// Libraries
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
var jwt = require('express-jwt');

var messaging = require('./app/messaging');

// Security
var jwtCheck = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_AUDIENCE
});
var corsMiddleware = cors();

mongoose.connect(process.env.MONGOLAB_URI);
// Application domain
var appRoutes = require('./app/routes');

var app = express();
app.use(bodyParser.json());
app.use(messaging({ url: process.env.CLOUDAMQP_URL }));
// TODO Mount your routes
app.use('/api', corsMiddleware, jwtCheck, appRoutes);

var routeWebHooks = require('./app/routes/web-hooks');
app.get('/hooks/page', routeWebHooks.GET);

// APPLICATION handlers
app.use(function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(err.status).send(err.message);
});

var PORT = process.env['PORT'] || 5000;
app.listen(PORT, function (error) {
    console.log('Listening on port ' + PORT);
});
