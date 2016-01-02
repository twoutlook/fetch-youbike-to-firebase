// Mark, 2016-01-02 11:32
// try heroku,
// but to solve firebase token expire in 24 hours first
// Azure free Web App will stop after cnt ???
// unless to upgrade
// https://azure.microsoft.com/en-gb/documentation/articles/web-sites-configure/
// c9.io has similar situation, but no sure if upgrade will solve this problem

// === require section ===
var Firebase= require("firebase");
var schedule= require('node-schedule');
var request= require('request');
var zlib= require('zlib');

// === constants or variables
var url_source="http://data.taipei/youbike";
// var url_target="https://youbike2.firebaseio.com/heroku/";
var url_target="https://taipeiomg-youbike.firebaseio.com/heroku/";

// var token_admin="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2IjowLCJkIjp7InVpZCI6ImFkbWluIiwiY2hpbmVzZSI6Iui2hee0mueuoeeQhuWToSIsInNvbWUiOiJhcmJpdHJhcnkiLCJkYXRhIjoiaGVyZSJ9LCJpYXQiOjE0NTE1NzE0Mzd9.8wXWTagoogpnz-8hShZMSz1WKHxeLOv7BEktcEETk0k";

// https://github.com/firebase/firebase-token-generator-node
// admin:true, so it won't expire
var token_admin="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZG1pbiI6dHJ1ZSwidiI6MCwiZCI6eyJ1aWQiOiJyb290Iiwibm90ZSI6IjIwMTYtMDEtMDIgYnkgTWFyayIsImRhdGEiOiJoZXJlIn0sImlhdCI6MTQ1MTcwNTE4NH0.opV8QBjcBdCIECPnceT65dGptl3yImen7AgN3nDLNSs";

var firebaseRef= new Firebase(url_target);


var options= {
  url: url_source,
  headers: {
    'X-some-headers': 'Some headers',
    'Accept-Encoding': 'gzip, deflate',
  },
  encoding: null
};

// === Action! ===
console.log ("=== Year 2016 ===");
console.log ("  url_source="+url_source);
console.log ("  url_target="+url_target);
console.log ("=================");

console.log ("步驟一, login to firebase");

firebaseRef.authWithCustomToken(token_admin, function(error, authData) {
  if (error) {
    console.log("  ... Authentication Failed!", error);
  } else {
    //  console.log("Authenticated successfully with payload:", authData);
    console.log("  ... uid:", authData.uid);
    console.log("  ... authData:", authData);

  }
});

console.log ("步驟二, 定時將資料由 Taipei Opendata 搬到 Firebase");


var cnt=0;
schedule.scheduleJob('*/30 * * * * *', function(){ // every 30 seconds
  //
  var strDate=new Date().toISOString().
  replace(/T/, ' ').      // replace T with a space
  replace(/\..+/, '')     // delete the dot and everything after

  cnt++;
  console.log("...going to update firebase, "+ strDate+ ", cnt="+cnt);

  request.get(options, function (error, response, body) {

    if (!error && response.statusCode== 200) {
      // If response is gzip, unzip first
      var encoding= response.headers['content-encoding']
      if (encoding && encoding.indexOf('gzip') >= 0) {
        zlib.gunzip(body, function(err, dezipped) {
          var json_string= dezipped.toString('utf-8');
          var json= JSON.parse(json_string);

          firebaseRef.set(json.retVal, onComplete);

        });
      } else {
        // Response is not gzipped
      }
    }

    var onComplete= function(error) {
      if (error) {
        console.log('...Synchronization failed ######################');
      } else {
        console.log('...Synchronization succeeded!');
      }
    };
  });
});
