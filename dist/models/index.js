'use strict';
var mongoose = require('mongoose');
var friends = require('mongoose-friends');
var shortid = require('shortid');
shortid.seed(29283449);
var ObjectId = mongoose.Schema.Types.ObjectId;
//Friendship Schema
var friendshipSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'accepted', 'requested']
    },
    added: Date,
    _id: {
        type: ObjectId,
        ref: 'User'
    }
});
//Room Schema
var roomSchema = new mongoose.Schema({
    _id: {
        type: String,
        "default": shortid.generate,
        required: true
    },
    owner: {
        type: ObjectId,
        ref: 'User'
    },
    participants: [{
            type: ObjectId,
            ref: 'User'
        }],
    x: Number,
    y: Number,
    created: Date
});
//User Schema
var userSchema = new mongoose.Schema({
    _id: {
        type: ObjectId,
        required: true,
        default: function () { return new mongoose.Types.ObjectId(); }
    },
    username: {
        type: String,
        required: true,
        set: function (value) { return value.trim().toLowerCase(); },
        validate: [
            function (username) {
                return (username.match(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i) != null);
            },
            'Invalid email']
    },
    password: String,
    admin: {
        type: Boolean,
        default: false
    },
    friends: {
        accepted: [friendshipSchema],
        requested: [friendshipSchema],
        pending: [friendshipSchema]
    },
    rooms: {
        owned: [{ type: String, ref: "Room" }],
        others: [{ type: String, ref: "Room" }]
    }
});
userSchema.plugin(friends());
var friendshipModel = mongoose.model('Friendship', friendshipSchema);
exports.friendshipModel = friendshipModel;
var roomModel = mongoose.model('Room', roomSchema);
exports.roomModel = roomModel;
var userModel = mongoose.model('User', userSchema);
exports.userModel = userModel;
