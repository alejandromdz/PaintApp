

import * as sharedb from 'sharedb/lib/client';
import { EncodePath } from './encode-path';


    (function () {
        //PAINT
        const stage = new createjs.Stage("paintCanvas");
        const shape = new createjs.Shape();
        let color = 'rgba(0,0,0,1)';
        const size = 10;
        const ep = new EncodePath();

        //SHARE
        const socket = new WebSocket('ws://' + window.location.hostname + ':8080');
        const connection = new sharedb.Connection(socket);
        const id = /.*\/([^?]+)/.exec(window.location.pathname)[1];
        const doc = connection.get('sessions', id);
        
        //PAINT
        stage.addChild(shape);

        //SHARE
        doc.subscribe((err) => {
            if (err) throw err;
            if (!doc.data) return;
            recreateDrawing();
        });

        doc.on('op', () => {
            shape.graphics.setStrokeStyle(size, "round").beginStroke(color)
            const userCommand = doc.data['commands'][0]
            const id = Object.keys(userCommand)[0];
            execute(userCommand[id]);
            stage.update();
        });
        
    function  recreateDrawing() {
        if (!doc.data['commands']) return;
        shape.graphics.clear();
        color='rgba(0,0,0,1)'
        shape.graphics.setStrokeStyle(size, "round").beginStroke(color)
        for (let i = doc.data['commands'].length - 1; i > -1; i--) {
            const userCommand = doc.data['commands'][i]
            const id = Object.keys(userCommand)[0];
                execute(userCommand[id]);
        }
        stage.update();
    }

    function execute(command: string) {
        if (/^rgba/.test(command)) {
            color = command;
            shape.graphics
                .beginStroke(color)
        }
        else {
            shape.graphics
                .decodePath(command);
        }
    }

    })()