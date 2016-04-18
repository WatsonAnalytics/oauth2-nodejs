/*
###############################################################################
#
# The MIT License (MIT)
#
# Copyright (c) 2016 IBM Corp.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
###############################################################################
*/

var    http = require('http');
var   https = require('https');
var  qsutil = require('querystring');
var urlutil = require('url');
var    util = require('util');
var      fs = require('fs');
var    path = require("path");
var express = require('express');

var watson_analytics_api_url = 'api.ibm.com';
var watson_analytics_api_base_path = '/watsonanalytics/run';
var application_url = 'localhost';
var application_port = 5447;

var yourAppKey = JSON.parse(fs.readFileSync(__dirname+'/appkey.json', 'utf8'));
var redirect_url = 'http://' + application_url + ':' + application_port + '/demo/oauth2/code';

var access_tokens = { 'userID' : 'undefined', 'token' : 'undefined'};
// Store the access token for your application user.
function setAccessToken (token) {
    access_tokens.userID = 'demo-user';
    access_tokens.token = token;
};
                        
var app = express();
app.use(express.static(__dirname + '/')); 

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});

// Build the request to get an OAuth2 authorization code.
// The server builds the request here, but the browser must make the request.
app.get('/demo/oauth2/auth', function (req, res) {
    var locationURI = 'https://' + watson_analytics_api_url + watson_analytics_api_base_path + 
                        '/clientauth/v1/auth?' +
                        qsutil.stringify({
                            'response_type': 'code',
                            'client_id': yourAppKey.client_id,
                            'scope': 'userContext',
                            'state': 'xyz',
                            'redirect_uri': redirect_url
                        });
    res.writeHead(302, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Location': locationURI
    });
    res.end();
});

// Watson Analytics returns the authorization code by adding it to the redirect URL.
// The browser received HTTP 302 + location. The location is the redirect URL
// Trade the authorization code for an OAuth2 access token.
app.get('/demo/oauth2/code', function (req, res) {
  var url = urlutil.parse(req.url, true);
  var token_server_options = { 
          'hostname': watson_analytics_api_url,
          'path': watson_analytics_api_base_path + '/oauth2/v1/token',
          'method': 'POST',
          'headers': { 
              'X-IBM-Client-Id' : yourAppKey.client_id, 
              'X-IBM-Client-Secret' : yourAppKey.client_secret ,
              'Content-Type': 'application/x-www-form-urlencoded' }
  };
  var waReq = https.request(token_server_options, function(waRes) {
      var responseString = '';
      waRes.on('data', function(data) { responseString += data; });
      waRes.on('end', function() {
        var responseObject = JSON.parse(responseString);
        setAccessToken(responseObject.access_token);
        var apiLocationURI = 'http://' + application_url + ':' + application_port + '/integration.html';
        res.writeHead(302, {
            'Content-Type': 'text/html',
            'Location': apiLocationURI
        });  
        res.end();
      });
  });
  var body = qsutil.stringify({
        'grant_type': 'authorization_code',
              'code': url.query.code,
      'redirect_uri': redirect_url
  });
  waReq.write(body);
  waReq.end();  
});

// Use the ME API.
app.get('/demo/me', function (req, res) {
  var resource_server_options = { 
          'hostname': watson_analytics_api_url,
          'path': watson_analytics_api_base_path + '/accounts/v1/me',
          'method': 'GET',
          'headers': { 
              'X-IBM-Client-Id' : yourAppKey.client_id, 
              'X-IBM-Client-Secret' : yourAppKey.client_secret,
              'Authorization' : 'Bearer ' + access_tokens.token }
  };
  var waReq = https.get(resource_server_options, function(waRes) {
      var responseString = '';
      waRes.on('data', function(data) { responseString += data; });
      waRes.on('end', function() {
        var responseObject = JSON.parse(responseString);
        res.end(JSON.stringify(responseObject));
      });
  });
  waReq.end();
});

// Create and push a simple data set to Watson Analytics.
app.get('/demo/upload', function (req, res) {
    var request_options = { 
       'hostname': watson_analytics_api_url,
       'path': watson_analytics_api_base_path + '/data/v1/datasets',
       'method': 'POST',
       'headers': { 
           'X-IBM-Client-Id' : yourAppKey.client_id, 
           'X-IBM-Client-Secret' : yourAppKey.client_secret,
           'Authorization' : 'Bearer ' + access_tokens.token,
           'Content-Type': 'application/json' }
    };
    var waReq = https.request(request_options, function(waRes) {
        var responseString = '';
        waRes.on('data', function(data) { responseString += data; });
        waRes.on('end', function() {
          var responseObject = JSON.parse(responseString);
          pushDataToDataSet(responseObject.id, res);
        });
    });
    var date = new Date();
    var body = { name : 'YourApplication_' + date.toISOString() };
    waReq.write(JSON.stringify(body));
    waReq.end();
});

// Create a new empty data set that has a specified name.
function pushDataToDataSet(id, res) {
    var request_options = { 
       'hostname': watson_analytics_api_url,
       'path': watson_analytics_api_base_path + '/data/v1/datasets/' + id + '/content',
       'method': 'PUT',
       'headers': { 
           'X-IBM-Client-Id' : yourAppKey.client_id, 
           'X-IBM-Client-Secret' : yourAppKey.client_secret,
           'Authorization' : 'Bearer ' + access_tokens.token,
           'Content-Type': 'text/csv' }
    };
    var waReq = https.request(request_options, function(waRes) {
        var responseString = '';
        waRes.on('data', function(data) { responseString += data; });
        waRes.on('end', function() {
          var apiLocationURI = 'https://watson.analytics.ibmcloud.com';
          res.writeHead(302, {
              'Content-Type': 'text/html',
              'Location': apiLocationURI
          });  
          res.end();
        });
    });
    var body = 'c1, c2\n';
    body    += 'r1, r1\n';
    body    += 'r2, r2\n';
    waReq.write(body);
    waReq.end();
}

var server = http.createServer(app);
server.listen(application_port);
console.log('Application running: http://' + application_url + ':' + application_port);
