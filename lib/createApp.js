var express = require('express');
var bodyParser = require('body-parser');
var postCreateRoom = require("./postCreateRoom");
var config = require("../config");

var cors = function(req, res, next) {
    if (config.allowOrigin) {
        res.header('Access-Control-Allow-Origin', config.allowOrigin);
        res.header('Access-Control-Allow-Methods', 'POST');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    next();
}

module.exports = function(log, redisClient) {
    var app = express();
    app.use(bodyParser.json()); // for parsing application/json
    app.use(cors);

    app.post('/create-room', postCreateRoom(log, redisClient));
    return app; 
}
