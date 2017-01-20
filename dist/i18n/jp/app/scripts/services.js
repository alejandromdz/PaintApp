"use strict";
var AuthenticationService = (function () {
    function AuthenticationService($rootScope, $http, $cookies) {
        this.$rootScope = $rootScope;
        this.$http = $http;
        this.$cookies = $cookies;
    }
    AuthenticationService.prototype.login = function (username, password, callback) {
        this.$http.post('/api/login', { username: username, password: password })
            .success(function (data, status) {
            callback(data, status);
        });
    };
    AuthenticationService.prototype.setCredentials = function (username, password, token) {
        this.$rootScope.globals = {
            currentUser: {
                username: username
            }
        };
        this.$cookies.put('token', token, { path: '/' });
    };
    AuthenticationService.prototype.clearCredentials = function () {
        this.$rootScope.globals = {};
    };
    AuthenticationService.$inject = ['$rootScope', '$http', '$cookies'];
    return AuthenticationService;
}());
exports.AuthenticationService = AuthenticationService;
var RegistrationService = (function () {
    function RegistrationService($rootScope, $http, $cookies) {
        this.$rootScope = $rootScope;
        this.$http = $http;
        this.$cookies = $cookies;
    }
    RegistrationService.prototype.register = function (username, password, callback) {
        this.$http.post('/api/register', { username: username, password: password })
            .success(function (data, status) {
            callback(data, status);
        });
    };
    RegistrationService.$inject = ['$rootScope', '$http', '$cookies'];
    return RegistrationService;
}());
exports.RegistrationService = RegistrationService;
