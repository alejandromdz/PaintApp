import { AuthenticationService, RegistrationService } from './services';
import * as sharedb from 'sharedb/lib/client';
import { EncodePath } from './encode-path';
import * as xor from 'bitwise-xor'
import * as IO from 'socket.io-client/dist/socket.io.js'

export class MainControl {
    static $inject = ['$scope', '$cookies'];
    constructor(private $scope: any,
        private $cookies: ng.cookies.ICookiesService) {
        $scope.setLang = (lang) => {
            $cookies.put('lang', lang, { path: '/' })
        }
    }
    //Generic hex<->base64 convertion methods.
    public static hexToBase64(str: string) {
        return btoa(String.fromCharCode.apply(null,
            str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    }
    public static base64ToHex(str: string) {
        for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
            var tmp = bin.charCodeAt(i).toString(16);
            if (tmp.length === 1) tmp = "0" + tmp;
            hex[hex.length] = tmp;
        }
        return hex.join("");
    }
}

export class DashboardController {
    static $inject = ['$http', '$scope', '$state', '$compile', '$timeout'];
    constructor(private $http: ng.IHttpService,
        private $scope: any,
        private $state: ng.ui.IStateService,
        private $compile: ng.ICompileService,
        private $timeout: ng.ITimeoutService) {

        const socket = IO('ws://' + window.location.hostname + ':8081');

        socket.emit('login', { id: $scope._id });

        socket.on('update', (users) => {
            $timeout(() => {
                $scope.users = users;
            }, 0);
        })
        socket.on('notification',(notifications)=>{
            $timeout(()=>{
                $scope.notifications=notifications;
            })
        })
        $state.go('dashboard.home');

        $scope.layers = {}
        $scope.chats = {}

        $scope.setLayer = ($event, id) => {
            $event.stopPropagation();
            if (!$scope.layers[id])
            { $scope.layers[id] = 1 }
            else {
                $scope.layers[id] = 0;
            }
            $scope.$broadcast('layersChange');
        }

        $scope.changeState = (state: string) => {
            $state.go(state);
        }
        $scope.createSession = (session) => {
            $http.put('../../api/sessions', session)
                .success((data: any) => {
                    getUserData();
                })
        }
        $scope.setSession = (session) => {
            $scope.currentSession = session;
        }
        $scope.searchFriend = (friendString: string) => {
            $http.get('../../api/search/' + friendString)
                .success((data: any) => {
                    $scope.friendSuggestions = data;
                });
        }
        $scope.sendRequest = (id: string) => {
            $http.get('../../api/self/request/' + id).success((data: any) => {
                getUserData();
            })
        }
        $scope.addToSession = (sessionId: string, userId: string) => {
            console.log(sessionId, userId);
            $http.put('../../api/sessions/' + sessionId, { id: userId }).success((data: any) => {
                getUserData();
            })
        }
        $scope.createChat = (myId: string, friendId: string) => {

            if (!$scope.chats[friendId]) {
                $scope.chats[friendId] = true;
                const chatScope: any = $scope.$new(false);
                chatScope.myId = myId;
                chatScope.friendId = friendId;
                const chatWindow = $compile('<chat></chat>');
                angular.element('body').append(chatWindow(chatScope));
                $scope.renderChat();
            }


        }
        $scope.$on('windowChatClosed', (ev, id) => {
            delete $scope.chats[id];
            $scope.renderChat();
        })
        $scope.renderChat = () => {
            $timeout(() => {
                let i = 0;
                for (var friendId in $scope.chats) {
                    angular.element(`[data-chat-id="${friendId}"]`).css('left', `${i * 310}px`)
                    i++;
                }
            }, 10);
        }
        const getUserData = () => {
            $http.get('/api/self').success((data: any) => {
                $scope.self = data;
                $scope.friends = data.friends;
                $scope.sessions = data.rooms;
            });
        }

        getUserData();
    }
}

export class HomeController {
    constructor(private $scope: angular.IScope) {
    }
}

export class LoginController {
    static $inject = ['$scope', '$rootScope', '$location', 'AuthenticationService']
    constructor(private $scope: any,
        private $rootScope: any,
        private $location: ng.ILocationService,
        private AuthenticationService: AuthenticationService) {
        AuthenticationService.clearCredentials();

        $scope.login = function () {
            AuthenticationService.login($scope.username, $scope.password, function (data: any, status) {
                $rootScope._id = data._id;
                if (data.success) {
                    AuthenticationService.setCredentials($scope.username, $scope.password, data.token);
                    $location.path('/dashboard');
                } else {
                    $scope.error = "Login Failed";
                }
            });
        }
    }
}

export class RegisterController {
    static $inject = ['$scope', '$rootScope', '$location', 'AuthenticationService', 'RegistrationService']
    constructor(private $scope: IScopeRegister,
        private $rootScope: IRootScopeServiceGlobals,
        private $location: ng.ILocationService,
        private AuthenticationService: AuthenticationService,
        private RegistrationService: RegistrationService) {
        AuthenticationService.clearCredentials();

        $scope.register = function (user: any) {
            const { username, password } = user;

            RegistrationService.register(username, password, function (data: any, status) {
                if (data.success) {
                    AuthenticationService.setCredentials(username, password, data.token);
                    $location.path('/dashboard');
                } else {
                    $scope.error = "Registration Failed";
                }
            });
        }
    }
}

export class SandboxController {
    //PAINT
    static $inject = ['$scope'];
    private color: string;
    private oldX: number;
    private oldY: number;
    private size: number;
    private stage: createjs.Stage;
    private shape: createjs.Shape;
    private isDrawing: boolean;
    private ep: EncodePath;
    constructor(public $scope: any) {

        this.stage = new createjs.Stage("paintCanvas");
        this.shape = new createjs.Shape();
        this.color = 'rgba(0,0,0,1)';
        this.size = 10;
        this.isDrawing = false;
        this.ep = new EncodePath();

        $scope.$on('colorpicker-selected', (event, data) => {
            setTimeout(() => {
                this.color = event.targetScope.color;
            }, 10);
        });

        this.stage.enableDOMEvents(true);
        this.stage.addChild(this.shape);

        this.stage.on("stagemousemove", (evt: any) => {
            if (this.oldX && this.isDrawing) {
                this.shape.graphics.beginStroke(this.color)
                    .setStrokeStyle(this.size, "round")
                this.ep.clear()
                    .moveTo(this.oldX, this.oldY)
                    .lineTo(evt.stageX, evt.stageY);
                this.shape.graphics.decodePath(this.ep.code);
                this.stage.update();
            }
            this.oldX = evt.stageX;
            this.oldY = evt.stageY;
        });

        this.stage.on("stagemouseup", (event) => {
            this.isDrawing = false;
        });

        this.stage.on("stagemousedown", (event) => {
            this.isDrawing = true;
        });

    }
}

export class PaintController {

    //PAINT
    static $inject = ['$scope'];
    private color: string;
    private oldX: number;
    private oldY: number;
    private size: number;
    private stage: createjs.Stage;
    private shape: createjs.Shape;
    private isDrawing: boolean;
    private ep: EncodePath;

    //SHARE
    private socket: WebSocket;
    private connection: sharedb.Connection;
    private doc: sharedb.Doc;
    private id: string;
    private userId: string;


    constructor(public $scope: any) {
        //PAINT
        this.stage = new createjs.Stage("paintCanvas");
        this.shape = new createjs.Shape();
        this.color = 'rgba(0,0,0,1)';
        this.size = 10;
        this.isDrawing = false;
        this.ep = new EncodePath();

        //SHARE
        this.socket = new WebSocket('ws://' + window.location.hostname + ':8080');
        this.connection = new sharedb.Connection(this.socket);
        this.id = /.*\/([^?]+)/.exec(window.location.pathname)[1];
        this.doc = this.connection.get('sessions', this.id);
        this.userId = $scope.self._id;

        $scope.$on('colorpicker-selected', (event, data) => {
            setTimeout(() => {
                this.color = event.targetScope.color;
                let command = {};
                command[MainControl.hexToBase64(this.userId)] = this.color;
                this.doc.submitOp([{ p: ['commands', 0], li: command }]);
            }, 10);
        });

        //PAINT

        this.stage.enableDOMEvents(true);
        this.stage.addChild(this.shape);

        this.stage.on("stagemousemove", (evt: any) => {
            if (this.oldX && this.isDrawing) {
                this.shape.graphics.beginStroke(this.color)
                    .setStrokeStyle(this.size, "round")
                this.ep.clear()
                    .moveTo(this.oldX, this.oldY)
                    .lineTo(evt.stageX, evt.stageY);
                this.shape.graphics.decodePath(this.ep.code);
                let command = {};
                command[MainControl.hexToBase64(this.userId)] = this.ep.code;
                this.doc.submitOp([{ p: ['commands', 0], li: command }]);
                this.stage.update();
            }
            this.oldX = evt.stageX;
            this.oldY = evt.stageY;
        });

        this.stage.on("stagemouseup", (event) => {
            this.isDrawing = false;
        });

        this.stage.on("stagemousedown", (event) => {
            this.isDrawing = true;
        });

        //SHARE

        this.doc.subscribe((err) => {
            if (err) throw err;
            if (!this.doc.data) return;
            this.recreateDrawing();
        });

        this.doc.on('op', () => {
            this.shape.graphics.setStrokeStyle(this.size, "round").beginStroke(this.color)
            const userCommand = this.doc.data['commands'][0]
            const id = Object.keys(userCommand)[0];
            if (/^rgba/.test(userCommand[id])) {
                this.execute(userCommand[id]);
            }
            else if (!this.$scope.layers[MainControl.base64ToHex(id)]) {
                this.execute(userCommand[id]);
            }
            this.stage.update();
        });
        $scope.$on('layersChange', (event, data) => { this.recreateDrawing() })
    }

    private recreateDrawing() {
        if (!this.doc.data['commands']) return;
        this.shape.graphics.clear();
        this.color = 'rgba(0,0,0,1)'
        this.shape.graphics.setStrokeStyle(this.size, "round").beginStroke(this.color)
        for (let i = this.doc.data['commands'].length - 1; i > -1; i--) {
            const userCommand = this.doc.data['commands'][i]
            const id = Object.keys(userCommand)[0];
            if (/^rgba/.test(userCommand[id])) {
                this.execute(userCommand[id]);
            }
            else if (!this.$scope.layers[MainControl.base64ToHex(id)]) {
                this.execute(userCommand[id]);
            }
        }
        this.stage.update();
    }

    private execute(command: string) {
        if (/^rgba/.test(command)) {
            this.color = command;
            this.shape.graphics
                .beginStroke(this.color)
        }
        else {
            this.shape.graphics
                .decodePath(command);
        }
    }
}

export class ChatController {
    static $inject = ['$scope', '$timeout', '$rootScope'];
    private socket: WebSocket;
    private connection: sharedb.Connection;
    private doc: sharedb.Doc;
    private chatId: string;
    private myIdBase64: string;

    constructor(private $scope: any,
        private $timeout: ng.ITimeoutService,
        private $rootScope: ng.IRootScopeService) {

        this.socket = new WebSocket('ws://' + window.location.hostname + ':8080');
        this.connection = new sharedb.Connection(this.socket);
        const { myId, friendId } = $scope;
        this.myIdBase64 = MainControl.hexToBase64(myId);
        const myIdBuffer = new Buffer(myId, 'hex');
        const friendIdBuffer = new Buffer(friendId, 'hex');
        const idXor = xor(myIdBuffer, friendIdBuffer);
        const idString = idXor.toString('hex');
        this.chatId = MainControl.hexToBase64(idString);
        this.doc = this.connection.get('chats', this.chatId);

        $scope.myIdBase64 = this.myIdBase64;

        $scope.sendMessage = () => {
            const message = {};
            message[this.myIdBase64] = { d: new Date(), t: $scope.inputMessage };
            this.doc.submitOp([{ p: ['messages', 0], li: message }]);
            $scope.inputMessage = '';
        }

        //CHAT
        $(document).on('click', '.card-header span.icon_minim', function (e) {
            e.stopImmediatePropagation()
            var $this = $(this);
            console.log($this);
            if (!$this.hasClass('card-collapsed')) {
                $this.parents('.card').find('.card-block').slideUp();
                $this.addClass('card-collapsed');
                $this.removeClass('fa-minus').addClass('fa-plus');
            } else {
                $this.parents('.card').find('.card-block').slideDown();
                $this.removeClass('card-collapsed');
                $this.removeClass('fa-plus').addClass('fa-minus');
            }
        });
        $(document).on('focus', '.card-footer input.chat_input', function (e) {
            var $this = $(this);
            if ($('#minim_chat_window').hasClass('card-collapsed')) {
                $this.parents('.card').find('.card-block').slideDown();
                $('#minim_chat_window').removeClass('card-collapsed');
                $('#minim_chat_window').removeClass('fa-plus').addClass('fa-minus');
            }
        });

        $(document).on('click', '.icon_close', function (e) {
            const chatWindow = $(this).parent().parent().parent().parent().parent().parent();
            const chatId = chatWindow.data('chat-id')
            $rootScope.$broadcast('windowChatClosed', chatId)
            chatWindow.parent().remove();

        });

        //SHARE

        this.doc.subscribe((err) => {
            if (err) throw err;
            if (!this.doc.data) return;
            $scope.$apply(() => {
                $scope.messages = this.doc.data.messages;
            });
        });

        this.doc.on('op', () => {
            $timeout(() => {
                $scope.messages = this.doc.data.messages;
            }, 0);
        });
    }
}
