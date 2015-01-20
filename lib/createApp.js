var express = require('express');
var bodyParser = require('body-parser');
var postRoom = require("./rooms").post;
var getRoom  = require("./rooms").get;
var config = require("../config");

var cors = function(req, res, next) {
    if (config.allowOrigin) {
        res.header('Access-Control-Allow-Origin', config.allowOrigin);
        res.header('Access-Control-Allow-Methods', 'POST, GET');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
}

module.exports = function(log, redisClient) {
    var app = express();
    app.use(bodyParser.json()); // for parsing application/json
    app.use(cors);

    app.post('/rooms', postRoom(log, redisClient));
    app.get('/rooms/:roomName', getRoom(log, redisClient));
    return app; 
}
