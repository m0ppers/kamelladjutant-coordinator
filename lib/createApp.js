var express = require('express');
var bodyParser = require('body-parser');
var postRoom = require("./rooms").post;
var getRoom  = require("./rooms").get;
var config = require("../config");

var allowedOrigins = config.allowOrigin;
if (allowedOrigins && !Array.isArray(allowedOrigins)) {
    allowedOrigins = [allowedOrigins];
}

var cors = function(req, res, next) {
    if (allowedOrigins) {
        var origin = req.get("origin");
        var allowedOrigin = allowedOrigins.filter(function(allowedOrigin) {
            return allowedOrigin == origin;
        });
        if (allowedOrigin.length >= 1) {
            res.header('Access-Control-Allow-Origin', allowedOrigin[0]);
        }

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
