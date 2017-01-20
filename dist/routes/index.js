"use strict";
var models_1 = require('../models');
var jwt = require('jsonwebtoken');
var path = require('path');
//POST api/login
function login(req, res) {
    models_1.userModel.findOne({
        username: req.body.username
    }, function (err, user) {
        if (err)
            throw err;
        if (!user) {
            res.send({ success: false, message: 'Authentication failed. User not found.' });
        }
        else {
            if (user.get('password') === req.body.password) {
                var token = jwt.sign({ username: user.get('username') }, 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn', {
                    expiresIn: 6000
                });
                res.json({ success: true, token: token, _id: user._id }).send();
            }
            else {
                res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
            }
        }
    });
}
exports.login = login;
//GET api/self
function self(req, res) {
    var user = req.user;
    var username = user.username, admin = user.admin, _id = user._id;
    var friends;
    models_1.userModel.findById(_id, function (error, user) {
        var rooms = user.rooms;
        models_1.userModel.getFriends(user, function (error, friendships) {
            if (error)
                friends = {};
            else {
                var pending = friendships.filter(function (friend) { return friend.status === "pending"; }).reduce(function (acc, current) {
                    var added = current.added, status = current.status, _id = current._id, username = current.friend.username;
                    acc.push({ added: added, _id: _id, status: status, username: username });
                    return acc;
                }, []);
                var accepted = friendships.filter(function (friend) { return friend.status === "accepted"; }).reduce(function (acc, current) {
                    var added = current.added, status = current.status, _id = current._id, username = current.friend.username;
                    acc.push({ added: added, _id: _id, status: status, username: username });
                    return acc;
                }, []);
                var requested = friendships.filter(function (friend) { return friend.status === "requested"; }).reduce(function (acc, current) {
                    var added = current.added, status = current.status, _id = current._id, username = current.friend.username;
                    acc.push({ added: added, _id: _id, status: status, username: username });
                    return acc;
                }, []);
                friends = { accepted: accepted, pending: pending, requested: requested };
            }
            var response = { username: username, admin: admin, _id: _id, friends: friends, rooms: rooms };
            models_1.roomModel.find({ owner: _id }, function (err, owned) {
                if (error) {
                    response.rooms = { owned: [] };
                }
                else {
                    response.rooms = { owned: owned };
                }
                models_1.roomModel.find({ participants: _id }, function (err, others) {
                    if (error) {
                        response.rooms.others = [];
                    }
                    else {
                        response.rooms.others = others;
                    }
                    res.json(response);
                });
            });
        });
    });
}
exports.self = self;
//GET api/sessions/:id
function getSessionById(req, res) {
    var id = req.params.id;
    res.render('session', { id: id });
}
exports.getSessionById = getSessionById;
//PUT api/sessions
function createsession(req, res, next) {
    var _a = req.body, x = _a.x, y = _a.y, _id = req.user._id;
    var room = new models_1.roomModel({
        owner: _id,
        x: x,
        y: y,
        created: new Date(),
        participants: []
    });
    room.save(function (error, room) {
        if (error) {
            console.log(error);
        }
        models_1.userModel.findByIdAndUpdate(_id, { $push: { "rooms.owned": room._id } }, function (err, user) {
            if (error) {
                console.log(error);
            }
            res.send(200);
        });
    });
}
exports.createsession = createsession;
//POST api/register
function register(req, res, next) {
    var _a = req.body, username = _a.username, password = _a.password;
    var user = new models_1.userModel({
        username: username,
        password: password,
        friends: [],
        admin: true
    });
    models_1.userModel.findOne({ username: username }, function (err, existingUser) {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            return res.status(409).send({ error: 'Account with that email address already exists.' });
        }
        user.save(function (err) {
            if (err) {
                return next(err);
            }
            var token = jwt.sign({ username: user.get('username') }, 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn', {
                expiresIn: 300
            });
            res.json({ success: true, token: token });
        });
    });
}
exports.register = register;
//GET api/search
function searchFriends(req, res, next) {
    var pattern = req.params.pattern;
    models_1.userModel.find({ username: new RegExp(pattern, 'ig') }).sort({ username: 1 }).exec(function (err, friends) {
        if (err) {
            return next(err);
        }
        res.json(friends);
    });
}
exports.searchFriends = searchFriends;
//GET api/self/request/:id
function sendRequest(req, res, next) {
    var idFrom = req.params.id;
    var idTo = req.user._id;
    models_1.userModel.requestFriend(idFrom, idTo, function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
    });
}
exports.sendRequest = sendRequest;
//PUT api/sessions/:id
function invite(req, res, next) {
    var sessionId = req.params.id;
    var userId = req.body.id;
    models_1.roomModel.findByIdAndUpdate(sessionId, { $push: { participants: userId } }, function (error, session) {
        models_1.userModel.findByIdAndUpdate(userId, { $push: { "rooms.others": session } }, function (error, user) {
            res.send(200);
        });
    });
}
exports.invite = invite;
//GET get-sandbox
function getSandbox(req, res, next) {
    res.render('sandbox');
}
exports.getSandbox = getSandbox;
//GET :id
function getSharedSession(req, res, next) {
    var id = req.params.id;
    models_1.roomModel.find({ _id: id }, function (err, sessions) {
        if (sessions.length === 0) {
            res.sendFile(path.join(__dirname, '../404.html'));
        }
        else {
            res.render('shared', { id: id });
        }
    });
}
exports.getSharedSession = getSharedSession;
