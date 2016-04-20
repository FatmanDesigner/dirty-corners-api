exports.GET = function getPageFeed (req, res) {
  var challenge = req.query['hub.challenge'];

  res.status(200).send(challenge);
};

exports.POST = function getPageFeed (req, res) {
  var data = req.body;

  console.log(JSON.stringify(data));

  res.status(200);
};
