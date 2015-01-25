var config = require("./config");

var bunyan = require("bunyan");
var redis = require("redis");

var createApp = require("./lib/createApp");

var log = bunyan.createLogger({name: "coordinator"});
var env = process.env.NODE_ENV || "development";

if (env == "development") {
    log.level("debug");
}
var redisClient;
var redisLocation;
if (config.redis.socket) {
    redisClient = redis.createClient(config.redis.socket);
    redisLocation = config.redis.socket;
} else {
    redisLocation = config.redis.host + ":" + config.redis.port;
    redisClient = redis.createClient(config.redis.port, config.redis.host);
}
redisClient.on("error", function(err) {
    log.error("Redis error", err);
});

var app = createApp(log, redisClient);

log.info("Waiting for connection to redis server " + redisLocation);
redisClient.on("ready", function() {
    log.info("Redis is ready at " + redisLocation);
    var server = app.listen(config.port, function () {
        var host = server.address().address
        var port = server.address().port
        
        log.info('Kamelladjutant listening at http://%s:%s', host, port)
    });
});

