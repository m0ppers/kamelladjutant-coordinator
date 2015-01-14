var express = require('express');
var bodyParser = require('body-parser');
var postCreateRoom = require("./postCreateRoom");

module.exports = function(log, redisClient) {
    var app = express();
    app.use(bodyParser.json()); // for parsing application/json

    app.post('/create-room', postCreateRoom(log, redisClient));
    return app; 
}
