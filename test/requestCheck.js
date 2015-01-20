var createApp = require("../lib/createApp");
var request = require('supertest');
var bunyan = require("bunyan");
var redis = require("redis-mock");

var log = bunyan.createLogger({name: 'test', streams: [{path: "/dev/null"}]});
//var log = bunyan.createLogger({name: "coordinator"});

describe("Request sanitizing test", function() {
    var app;
    beforeEach(function() {
        redisMock = redis.createClient();
        redisMock.connected = true;
        app = createApp(log, redisMock)
    });
    it("should not accept raw form data", function(done) {
        request(app)
            .post("/rooms")
            .set("Content-Type", "application/x-www-form-urlencoded")
            .expect(400, done)
    });
    it("should accept valid documents", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": "manni", "roomname": "mannis-dark-room"})
            .expect(201, done)
    });
    it("should reject non alphanum room names", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": "manni", "roomname": "mannis dark-room"})
            .expect(400, done)
    });
    it("should reject requests not containing any roomname", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": "manni", "roomnameas": "mannis-dark-room"})
            .expect(400, done)
    });
    it("should reject requests not containing any username", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"aausername": "manni", "roomname": "mannis-dark-room"})
            .expect(400, done)
    });
    it("should reject non string room names", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": "manni", "roomname": 1234})
            .expect(400, done)
    });
    it("should reject non string user names", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": 1234, "roomname": "1234"})
            .expect(400, done)
    });
    it("should reject conflicting roomnames", function(done) {
        request(app)
            .post("/rooms")
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .send({"username": "12345", "roomname": "12345"})
            .expect(201, function() {
                request(app)
                    .post("/rooms")
                    .set("Accept", "application/json")
                    .set("Content-Type", "application/json")
                    .send({"username": "12345", "roomname": "12345"})
                    .expect(409, done);
            })
    });
});
