var express = require('express');
var app = express();
let fs = require('fs')
const webpush = require('web-push'); 

var subscription = undefined;

//Generate VAPID Key pair from https://web-push-codelab.glitch.me/
//Or use node webpush library
//Public Key has to be shared with main.js --> applicationServerPublicKey
webpush.setVapidDetails(
  'mailto:michaelgun@edu.aau.at',
  'BMyOwR7Let_vdyaorHuOoU49ey1R2xA_1SgPC7X7IROmxOCBnVAkKmoieD_qjPa0hHZv4dWqMyWqvKIJiDoutCY',  //Public Key
  'g1KlpeYWBfZZ83eujKrrQcmPL-jnnLGKCYmi6Fjym_E' //Private Key
);

//Helper method to support different content types for various requests
function getContentType(fileUrl){
  let fileExtension = fileUrl.substring(fileUrl.lastIndexOf('.'), fileUrl.length)
  switch (fileExtension){
    case '.html':   return 'text/html'  
    case '.css':    return 'text/css'
    case '.js':     return 'application/javascript'
    case '.json':   return 'application/json'
    default:        return 'text/plain'
  }
}

//Send push Notification
function sendPushNotification(subscription){
  webpush.sendNotification(subscription, 'My Push Message')
  .then(() => {
    console.log('Notification sent successfully')
  })
  .catch((err) => {
    console.log('Subscription invalid: ', err);
    }
  );
}

//Handle subscription and store on server (in database ideally)
app.post('/subscribe', function (req, res) {
  req.on('data', (data) => {
    console.log('Subscription received: ' + data);
    //TODO: Store subscription in database or array
    subscription = JSON.parse(data);
    if(!subscription.endpoint){
      res.status(400).json({message: 'error - no subscription'})
    }
    else{
      res.status(200).json({message: 'Subscription received'})
    }
    
  });
})

//Handle request for push notification --> send push
app.post('/requestPush', function(req, res) {
  console.log('Received command to send push notification')
  if(subscription){
    console.log('Subscription ok, sending push to client')
    sendPushNotification(subscription);
    res.status(200, {message: 'OK, sending push to client'})
  }
  else{
    console.log('Not subscribed - abort')
    res.status(400).json({message: 'Not subscribed'})
  }
})

//Answer initial request with index.html file
app.get('/', function (req, res) {
  console.log('got ' + req.url + ' as route')
  fs.readFile('public/index.html', (err, data) => {
    if(err){
      res.status(404).json({message: 'not found'})
    }
    else{
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
      console.log('responded with index.html')
    }
  })
})

//Answer any requests with the proper file
app.get('/*', function (req, res) {
  console.log('got ' + req.url + ' as route')
  fs.readFile('public' + req.url, (err, data) => {
    if(err){
      res.status(404).json({message: 'file not found'});
    }
    else{
      res.writeHead(200, {'Content-Type': getContentType(req.url)});
      res.write(data);
      res.end();
      console.log('Responded with ' + req.url)
    }
  });
});

app.listen(3000, function () {
  console.log('Webserver listening on port 3000!');
});
