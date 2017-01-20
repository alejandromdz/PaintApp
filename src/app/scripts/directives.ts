import {PaintController} from './controllers';
import {ChatController} from './controllers';

export class Paint implements ng.IDirective{
    restrict='E';
    templateUrl='app/views/paint.html'
    replace=true;
    controller=PaintController;
    static inject=[];
    constructor(){
    }
    static factory():ng.IDirectiveFactory{
        return ()=> new Paint();
    }
}

export class Chat implements ng.IDirective{
    restrict='E';
    templateUrl='app/views/chat.html'
    replace=true;
    controller=ChatController;
    static inject=[];
    constructor(){

    }
    static factory():ng.IDirectiveFactory{
        return ()=> new Chat();
    }
}