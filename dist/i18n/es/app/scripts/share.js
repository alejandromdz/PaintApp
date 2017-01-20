"use strict";
var sharedb = require('sharedb/lib/client');
var encode_path_1 = require('./encode-path');
(function () {
    //PAINT
    var stage = new createjs.Stage("paintCanvas");
    var shape = new createjs.Shape();
    var color = 'rgba(0,0,0,1)';
    var size = 10;
    var ep = new encode_path_1.EncodePath();
    //SHARE
    var socket = new WebSocket('ws://' + window.location.hostname + ':8080');
    var connection = new sharedb.Connection(socket);
    var id = /.*\/([^?]+)/.exec(window.location.pathname)[1];
    var doc = connection.get('sessions', id);
    //PAINT
    stage.addChild(shape);
    //SHARE
    doc.subscribe(function (err) {
        if (err)
            throw err;
        if (!doc.data)
            return;
        recreateDrawing();
    });
    doc.on('op', function () {
        shape.graphics.setStrokeStyle(size, "round").beginStroke(color);
        var userCommand = doc.data['commands'][0];
        var id = Object.keys(userCommand)[0];
        execute(userCommand[id]);
        stage.update();
    });
    function recreateDrawing() {
        if (!doc.data['commands'])
            return;
        shape.graphics.clear();
        color = 'rgba(0,0,0,1)';
        shape.graphics.setStrokeStyle(size, "round").beginStroke(color);
        for (var i = doc.data['commands'].length - 1; i > -1; i--) {
            var userCommand = doc.data['commands'][i];
            var id_1 = Object.keys(userCommand)[0];
            execute(userCommand[id_1]);
        }
        stage.update();
    }
    function execute(command) {
        if (/^rgba/.test(command)) {
            color = command;
            shape.graphics
                .beginStroke(color);
        }
        else {
            shape.graphics
                .decodePath(command);
        }
    }
})();
