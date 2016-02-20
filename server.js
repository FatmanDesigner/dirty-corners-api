var express = require('express');

var app = express();
var router = new express.Router();

router.route('/spots').get(function(req, res) {
   res.send('GET spots');
});

app.use('/api', router);


var PORT = process.env['PORT'] || 5000;
app.listen(PORT, function (error) {
    console.log('Listening on port ' + PORT);
});