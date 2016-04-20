exports.GET = function getPageFeed (req, res) {
  var challenge = req.query['hub.challenge'];

  res.status(200).send(challenge);
};
