var config = require("./config");

var bunyan = require("bunyan");
var redis = require("redis");

var createApp = require("./lib/createApp");

var log = bunyan.createLogger({name: "coordinator"});
var env = process.env.NODE_ENV || "development";

if (env == "development") {
    log.level("debug");
}
var redisClient = redis.createClient(config.redis.port, config.redis.host);
redisClient.on("error", function(err) {
    log.error("Redis error", err);
});

var app = createApp(log, redisClient);

log.info("Waiting for redis server " + config.redis.host + ":" + config.redis.port + " to start");
redisClient.on("ready", function() {
    log.info("Redis is ready at http://%s:%s", config.redis.host, config.redis.port);
    var server = app.listen(config.port, function () {
        var host = server.address().address
        var port = server.address().port
        
        redisClient.set("wursti", "warsti");
        log.info('Kamelladjutant listening at http://%s:%s', host, port)
    });
});

