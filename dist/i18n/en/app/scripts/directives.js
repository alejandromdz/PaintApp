"use strict";
var controllers_1 = require('./controllers');
var controllers_2 = require('./controllers');
var Paint = (function () {
    function Paint() {
        this.restrict = 'E';
        this.templateUrl = 'app/views/paint.html';
        this.replace = true;
        this.controller = controllers_1.PaintController;
    }
    Paint.factory = function () {
        return function () { return new Paint(); };
    };
    Paint.inject = [];
    return Paint;
}());
exports.Paint = Paint;
var Chat = (function () {
    function Chat() {
        this.restrict = 'E';
        this.templateUrl = 'app/views/chat.html';
        this.replace = true;
        this.controller = controllers_2.ChatController;
    }
    Chat.factory = function () {
        return function () { return new Chat(); };
    };
    Chat.inject = [];
    return Chat;
}());
exports.Chat = Chat;
