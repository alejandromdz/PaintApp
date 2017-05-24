"use strict";
var sharedb = require('sharedb/lib/client');
var encode_path_1 = require('./encode-path');
var xor = require('bitwise-xor');
var IO = require('socket.io-client/dist/socket.io.js');
var MainControl = (function () {
    function MainControl($scope, $cookies) {
        this.$scope = $scope;
        this.$cookies = $cookies;
        $scope.setLang = function (lang) {
            $cookies.put('lang', lang, { path: '/' });
        };
    }
    //Generic hex<->base64 convertion methods.
    MainControl.hexToBase64 = function (str) {
        return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    };
    MainControl.base64ToHex = function (str) {
        for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
            var tmp = bin.charCodeAt(i).toString(16);
            if (tmp.length === 1)
                tmp = "0" + tmp;
            hex[hex.length] = tmp;
        }
        return hex.join("");
    };
    MainControl.$inject = ['$scope', '$cookies'];
    return MainControl;
}());
exports.MainControl = MainControl;
var DashboardController = (function () {
    function DashboardController($http, $scope, $state, $compile, $timeout) {
        this.$http = $http;
        this.$scope = $scope;
        this.$state = $state;
        this.$compile = $compile;
        this.$timeout = $timeout;
        var socket = IO('ws://' + window.location.hostname + ':8081');
        socket.emit('login', { id: $scope._id });
        socket.on('update', function (users) {
            $timeout(function () {
                $scope.users = users;
            }, 0);
        });
        socket.on('notification', function (notifications) {
            $timeout(function () {
                $scope.notifications = notifications;
            });
        });
        $state.go('dashboard.home');
        $scope.layers = {};
        $scope.chats = {};
        $scope.setLayer = function ($event, id) {
            $event.stopPropagation();
            if (!$scope.layers[id]) {
                $scope.layers[id] = 1;
            }
            else {
                $scope.layers[id] = 0;
            }
            $scope.$broadcast('layersChange');
        };
        $scope.changeState = function (state) {
            $state.go(state);
        };
        $scope.createSession = function (session) {
            $http.put('../../api/sessions', session)
                .success(function (data) {
                getUserData();
            });
        };
        $scope.setSession = function (session) {
            $scope.currentSession = session;
        };
        $scope.searchFriend = function (friendString) {
            $http.get('../../api/search/' + friendString)
                .success(function (data) {
                $scope.friendSuggestions = data;
            });
        };
        $scope.sendRequest = function (id) {
            $http.get('../../api/self/request/' + id).success(function (data) {
                getUserData();
            });
        };
        $scope.addToSession = function (sessionId, userId) {
            console.log(sessionId, userId);
            $http.put('../../api/sessions/' + sessionId, { id: userId }).success(function (data) {
                getUserData();
            });
        };
        $scope.createChat = function (myId, friendId) {
            if (!$scope.chats[friendId]) {
                $scope.chats[friendId] = true;
                var chatScope = $scope.$new(false);
                chatScope.myId = myId;
                chatScope.friendId = friendId;
                var chatWindow = $compile('<chat></chat>');
                angular.element('body').append(chatWindow(chatScope));
                $scope.renderChat();
            }
        };
        $scope.$on('windowChatClosed', function (ev, id) {
            delete $scope.chats[id];
            $scope.renderChat();
        });
        $scope.renderChat = function () {
            $timeout(function () {
                var i = 0;
                for (var friendId in $scope.chats) {
                    angular.element("[data-chat-id=\"" + friendId + "\"]").css('left', i * 310 + "px");
                    i++;
                }
            }, 10);
        };
        var getUserData = function () {
            $http.get('/api/self').success(function (data) {
                $scope.self = data;
                $scope.friends = data.friends;
                $scope.sessions = data.rooms;
            });
        };
        getUserData();
    }
    DashboardController.$inject = ['$http', '$scope', '$state', '$compile', '$timeout'];
    return DashboardController;
}());
exports.DashboardController = DashboardController;
var HomeController = (function () {
    function HomeController($scope) {
        this.$scope = $scope;
    }
    return HomeController;
}());
exports.HomeController = HomeController;
var LoginController = (function () {
    function LoginController($scope, $rootScope, $location, AuthenticationService) {
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$location = $location;
        this.AuthenticationService = AuthenticationService;
        AuthenticationService.clearCredentials();
        $scope.login = function () {
            AuthenticationService.login($scope.username, $scope.password, function (data, status) {
                $rootScope._id = data._id;
                if (data.success) {
                    AuthenticationService.setCredentials($scope.username, $scope.password, data.token);
                    $location.path('/dashboard');
                }
                else {
                    $scope.error = "Login Failed";
                }
            });
        };
    }
    LoginController.$inject = ['$scope', '$rootScope', '$location', 'AuthenticationService'];
    return LoginController;
}());
exports.LoginController = LoginController;
var RegisterController = (function () {
    function RegisterController($scope, $rootScope, $location, AuthenticationService, RegistrationService) {
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$location = $location;
        this.AuthenticationService = AuthenticationService;
        this.RegistrationService = RegistrationService;
        AuthenticationService.clearCredentials();
        $scope.register = function (user) {
            var username = user.username, password = user.password;
            RegistrationService.register(username, password, function (data, status) {
                if (data.success) {
                    AuthenticationService.setCredentials(username, password, data.token);
                    $location.path('/dashboard');
                }
                else {
                    $scope.error = "Registration Failed";
                }
            });
        };
    }
    RegisterController.$inject = ['$scope', '$rootScope', '$location', 'AuthenticationService', 'RegistrationService'];
    return RegisterController;
}());
exports.RegisterController = RegisterController;
var SandboxController = (function () {
    function SandboxController($scope) {
        var _this = this;
        this.$scope = $scope;
        this.stage = new createjs.Stage("paintCanvas");
        this.shape = new createjs.Shape();
        this.color = 'rgba(0,0,0,1)';
        this.size = 10;
        this.isDrawing = false;
        this.ep = new encode_path_1.EncodePath();
        $scope.$on('colorpicker-selected', function (event, data) {
            setTimeout(function () {
                _this.color = event.targetScope.color;
            }, 10);
        });
        this.stage.enableDOMEvents(true);
        this.stage.addChild(this.shape);
        this.stage.on("stagemousemove", function (evt) {
            if (_this.oldX && _this.isDrawing) {
                _this.shape.graphics.beginStroke(_this.color)
                    .setStrokeStyle(_this.size, "round");
                _this.ep.clear()
                    .moveTo(_this.oldX, _this.oldY)
                    .lineTo(evt.stageX, evt.stageY);
                _this.shape.graphics.decodePath(_this.ep.code);
                _this.stage.update();
            }
            _this.oldX = evt.stageX;
            _this.oldY = evt.stageY;
        });
        this.stage.on("stagemouseup", function (event) {
            _this.isDrawing = false;
        });
        this.stage.on("stagemousedown", function (event) {
            _this.isDrawing = true;
        });
    }
    //PAINT
    SandboxController.$inject = ['$scope'];
    return SandboxController;
}());
exports.SandboxController = SandboxController;
var PaintController = (function () {
    function PaintController($scope) {
        var _this = this;
        this.$scope = $scope;
        //PAINT
        this.stage = new createjs.Stage("paintCanvas");
        this.shape = new createjs.Shape();
        this.color = 'rgba(0,0,0,1)';
        this.size = 10;
        this.isDrawing = false;
        this.ep = new encode_path_1.EncodePath();
        //SHARE
        this.socket = new WebSocket('ws://' + window.location.hostname + ':8080');
        this.connection = new sharedb.Connection(this.socket);
        this.id = /.*\/([^?]+)/.exec(window.location.pathname)[1];
        this.doc = this.connection.get('sessions', this.id);
        this.userId = $scope.self._id;
        $scope.$on('colorpicker-selected', function (event, data) {
            setTimeout(function () {
                _this.color = event.targetScope.color;
                var command = {};
                command[MainControl.hexToBase64(_this.userId)] = _this.color;
                _this.doc.submitOp([{ p: ['commands', 0], li: command }]);
            }, 10);
        });
        //PAINT
        this.stage.enableDOMEvents(true);
        this.stage.addChild(this.shape);
        this.stage.on("stagemousemove", function (evt) {
            if (_this.oldX && _this.isDrawing) {
                _this.shape.graphics.beginStroke(_this.color)
                    .setStrokeStyle(_this.size, "round");
                _this.ep.clear()
                    .moveTo(_this.oldX, _this.oldY)
                    .lineTo(evt.stageX, evt.stageY);
                _this.shape.graphics.decodePath(_this.ep.code);
                var command = {};
                command[MainControl.hexToBase64(_this.userId)] = _this.ep.code;
                _this.doc.submitOp([{ p: ['commands', 0], li: command }]);
                _this.stage.update();
            }
            _this.oldX = evt.stageX;
            _this.oldY = evt.stageY;
        });
        this.stage.on("stagemouseup", function (event) {
            _this.isDrawing = false;
        });
        this.stage.on("stagemousedown", function (event) {
            _this.isDrawing = true;
        });
        //SHARE
        this.doc.subscribe(function (err) {
            if (err)
                throw err;
            if (!_this.doc.data)
                return;
            _this.recreateDrawing();
        });
        this.doc.on('op', function () {
            _this.shape.graphics.setStrokeStyle(_this.size, "round").beginStroke(_this.color);
            var userCommand = _this.doc.data['commands'][0];
            var id = Object.keys(userCommand)[0];
            if (/^rgba/.test(userCommand[id])) {
                _this.execute(userCommand[id]);
            }
            else if (!_this.$scope.layers[MainControl.base64ToHex(id)]) {
                _this.execute(userCommand[id]);
            }
            _this.stage.update();
        });
        $scope.$on('layersChange', function (event, data) { _this.recreateDrawing(); });
    }
    PaintController.prototype.recreateDrawing = function () {
        if (!this.doc.data['commands'])
            return;
        this.shape.graphics.clear();
        this.color = 'rgba(0,0,0,1)';
        this.shape.graphics.setStrokeStyle(this.size, "round").beginStroke(this.color);
        for (var i = this.doc.data['commands'].length - 1; i > -1; i--) {
            var userCommand = this.doc.data['commands'][i];
            var id = Object.keys(userCommand)[0];
            if (/^rgba/.test(userCommand[id])) {
                this.execute(userCommand[id]);
            }
            else if (!this.$scope.layers[MainControl.base64ToHex(id)]) {
                this.execute(userCommand[id]);
            }
        }
        this.stage.update();
    };
    PaintController.prototype.execute = function (command) {
        if (/^rgba/.test(command)) {
            this.color = command;
            this.shape.graphics
                .beginStroke(this.color);
        }
        else {
            this.shape.graphics
                .decodePath(command);
        }
    };
    //PAINT
    PaintController.$inject = ['$scope'];
    return PaintController;
}());
exports.PaintController = PaintController;
var ChatController = (function () {
    function ChatController($scope, $timeout, $rootScope) {
        var _this = this;
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.$rootScope = $rootScope;
        this.socket = new WebSocket('ws://' + window.location.hostname + ':8080');
        this.connection = new sharedb.Connection(this.socket);
        var myId = $scope.myId, friendId = $scope.friendId;
        this.myIdBase64 = MainControl.hexToBase64(myId);
        var myIdBuffer = new Buffer(myId, 'hex');
        var friendIdBuffer = new Buffer(friendId, 'hex');
        var idXor = xor(myIdBuffer, friendIdBuffer);
        var idString = idXor.toString('hex');
        this.chatId = MainControl.hexToBase64(idString);
        this.doc = this.connection.get('chats', this.chatId);
        $scope.myIdBase64 = this.myIdBase64;
        $scope.sendMessage = function () {
            var message = {};
            message[_this.myIdBase64] = { d: new Date(), t: $scope.inputMessage };
            _this.doc.submitOp([{ p: ['messages', 0], li: message }]);
            $scope.inputMessage = '';
        };
        //CHAT
        $(document).on('click', '.card-header span.icon_minim', function (e) {
            e.stopImmediatePropagation();
            var $this = $(this);
            console.log($this);
            if (!$this.hasClass('card-collapsed')) {
                $this.parents('.card').find('.card-block').slideUp();
                $this.addClass('card-collapsed');
                $this.removeClass('fa-minus').addClass('fa-plus');
            }
            else {
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
            var chatWindow = $(this).parent().parent().parent().parent().parent().parent();
            var chatId = chatWindow.data('chat-id');
            $rootScope.$broadcast('windowChatClosed', chatId);
            chatWindow.parent().remove();
        });
        //SHARE
        this.doc.subscribe(function (err) {
            if (err)
                throw err;
            if (!_this.doc.data)
                return;
            $scope.$apply(function () {
                $scope.messages = _this.doc.data.messages;
            });
        });
        this.doc.on('op', function () {
            $timeout(function () {
                $scope.messages = _this.doc.data.messages;
            }, 0);
        });
    }
    ChatController.$inject = ['$scope', '$timeout', '$rootScope'];
    return ChatController;
}());
exports.ChatController = ChatController;
