'use strict';

// Global Environment Setup
const REDIS_URL = process.env['REDIS_URL'] || 'redis://h:pbpj0i83hu83s51ndk3tvsfg6qi@ec2-54-83-34-248.compute-1.amazonaws.com:11539';

const APP_ID = '797308096995810'
const APP_SECRET = 'b92d41be4e42080ca57a793b840eb24b'
const PAGE_ID = '501671276707976';
const FACEBOOK_FEED_LIMIT = 100;

const FB_OPTIONS = {
  version: 'v2.1'
};

var redis = require("redis");
var FB = require('fb');

FB.options(FB_OPTIONS);
FB.setAccessToken(APP_ID + '|' + APP_SECRET);

// Function definitions

function main () {
  let client = redis.createClient(REDIS_URL);
  let queueProcessingDeferred = Promise.defer();

  queueProcessingDeferred.promise.then(function (result) {
    console.log('Processing feed items is completed. Last created item at', result.lastCreatedTime);
    console.log('Updating fanpage:crawl_since before exit');
    client.set('fanpage:crawl_since', result.lastCreatedTime, function () {
      console.log('Exiting...');

      process.exit(0);
    });
  });

  // Detail implementation
  client.on("error", function (err) {
    console.log("Error " + err);

    process.exit(1);
  });

  client.on('connect', onConnect);

  function onConnect () {
    client.get('fanpage:crawl_since', function (err, reply) {
      let promise;
      let lastCreatedTime;

      if (err) {
        promise = getFeed();
      }
      else {
        lastCreatedTime = new Date(reply);
        console.log('Resuming feed from', lastCreatedTime);
        promise = getFeed(lastCreatedTime);
      }

      promise.then(function (feedItems) {
        if (!feedItems.length) {
          return Promise.resolve([]);
        }

        // A little queue processor
        return new Promise(function (resolve) {
          doWork();

          function doWork () {
            let item = feedItems.pop();
            if (!item) {
              resolve();
            }

            lastCreatedTime = item['created_time'];
            feedItemWorker(item).then(doWork);
          }
        });
      }).then(function () {
        queueProcessingDeferred.resolve({
          lastCreatedTime
        });
      });
    });
  }
}

/**
 * Gets Facebook feed from fan page since the given datetime
 *
 * @param since Date
 * @return Promise<Array>
 */
function getFeed (since) {
  console.log(`Accessing endpoint "${PAGE_ID}/feed"...`);

  let query = {
    limit: FACEBOOK_FEED_LIMIT
  };
  if (since) {
    console.log(since);

    query['since'] = since.toISOString();
  }

  return new Promise(function (resolve, reject) {
    FB.api(
      `/${PAGE_ID}/feed`,
      'GET',
      query,
      function (response) {
        let data = response['data'];
        if (!data) {
          console.log(response['error'] || 'Unknown');

          return rejec(response['error'] || 'Unknown');
        }

        console.log(`Receiving ${data.length} items in feed...`);

        let result = data.map(parseFeedItem);
        resolve(result);
      }
    );
  });

  function parseFeedItem (item) {
    var from =item.from;
    var to = item.to;
    var message = item.message
    var status_type = item.status_type
    var created_time = item.created_time;
    var description = item.description;
    var link = item.link;

    return {
      from, to, message, description, link, status_type, created_time
    };
  }
}

function feedItemWorker (feedItem) {
  console.log('Processing item...', feedItem.message);

  return Promise.resolve(true);
}
// Execution

main();
