var name2Key = require("kamelladjutant-common").name2Key;
var scrypt = require("scrypt");
var config = require("../config");

var rooms = {};
rooms.post = function(log, redisClient) {
    var checks = [
        [
            function requestIsJson(req) {
                return req.is("json");
            },
            function(req, res) {
                log.info("Request is not json but ", req.get("content-type"));
                res.status(400)
            }
        ],
        [
            function jsonResponseAccepted(req) {
                return req.accepts("json");
            },
            function(req, res) {
                log.info("Request doesn't expect json answer");
                res.status(406)
            }
        ],
        [
            function usernameSet(req) {
                return req.body.username
            },
            function(req, res) {
                log.info("username not set in ", req.body);
                res.status(400)
            }
        ],
        [
            function usernameIsString(req) {
                return typeof req.body.username == "string";
            
            },
            function(req, res) {
                log.info("username is not a string", req.body);
                res.status(400);
            }
        ],
        [
            function roomnameSet(req) {
                return req.body.roomname;
            },
            function(req, res) {
                log.info("roomname not set in ", req.body);
                res.status(400)
            }
        ],
        [
            function roomnameIsString(req) {
                return typeof req.body.roomname == "string";
            
            },
            function(req, res) {
                log.info("roomname is not a string in", req.body);
                res.status(400);
            }
        ],
        [
            function roomnameIsValid(req) {
                return req.body.roomname.match(/^[a-zA-Z0-9-]{5,64}$/);
            },
            function(req, res) {
                log.info("roomname is not valid", req.body);
                res.status(400);
            }
        ],
        [
            function redisOk(req) {
                return redisClient.connected;
            },
            function(req, res) {
                log.error("Redis not connected at http://%s:%s", config.redis.host, config.redis.port);
                return res.status(500).end();
            }
        ]
    ];

    var isError = function(req, res) {
        return checks.some(function(check) {
            if (!check[0](req)) {
                check[1](req, res);
                res.end();
                return true;
            } else {
                return false;
            }
        });
    }
    return function (req, res) {
        // mop: general, read only checks
        if (isError(req, res)) {
            return;
        }

        var roomname = req.body.roomname;
        // filters
        var username = req.body.username.trim();
        if (username.length == 0) {
            res.status(400).end();
            return false;
        }

        var password = null;;
        if (typeof req.body.password == "string" ) {
            var tmp = req.body.password.trim();
            if (tmp.length > 0) {
                password = tmp;
            }

        }

        var createRoom = function(roomKey, roomData, res) {
            redisClient.setnx(roomKey, JSON.stringify(roomData), function(err, reply) {
                if (err) {
                    log.error("Ooops...Got error setting ", roomKey, err);
                    res.status(500).end();
                    return;
                }

                if (reply == 0) {
                    log.info("Got a conflict setting", roomKey);
                    res.status(409).end();
                    return;
                }

                redisClient.expire(roomKey, 1800, function(err) {
                    if (err) {
                        log.error("Couldn't set key expiry!", err);
                        res.status(500).end();
                        return;
                    }
                    res.status(201);
                    res.json(roomData.server);
                });
            });
        }

        var roomKey = name2Key(roomname);
        // mop: randomly select one of the websocket servers later on
        var server = config.signalingServers[Math.floor(Math.random() * config.signalingServers.length)];
        var maxtime = 0.1;

        var roomData = {"server": server};
        if (password) {
            scrypt.passwordHash(password, maxtime, function(err, passwordHash) {
                if (err) {
                    log.error("Error crypting password :O", err);
                    res.status(500);
                    res.end();
                    return;
                }
                roomData.password = passwordHash;
                createRoom(roomKey, roomData, res);
            });
        } else {
            createRoom(roomKey, roomData, res);
        }
    }
}
rooms.get = function(log, redisClient) {
    return function(req, res) {
        log.debug("Trying to get room", req.params.roomName);
        var roomKey = name2Key(req.params.roomName);
        redisClient.get(roomKey, function(err, rawData) {
            if (err) {
                log.error("Error getting key" , roomKey, "from redis");
                return res.status(500).end();
            }
            if (rawData === null) {
                return res.status(404).end();
            }

            var data = JSON.parse(rawData);
            if (typeof data !== "object") {
                log.error("No object", rawData);
                return res.status(500).end();
            }
            res.json({"webSocketUri": data.server, "hasPassword": typeof data.password == "string"});
        });
    }
};

module.exports = rooms;
