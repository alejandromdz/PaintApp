"use strict";
var configuration_1 = require('./configuration');
var services_1 = require('./services');
var controllers_1 = require('./controllers');
var directives_1 = require('./directives');
var filters_1 = require('./filters');
var app = angular.module('App', ['ngCookies', 'angular-jwt', 'angularMoment', 'ui.router', 'colorpicker.module', 'luegg.directives']);
app.config(configuration_1.Router)
    .service('AuthenticationService', services_1.AuthenticationService)
    .service('RegistrationService', services_1.RegistrationService)
    .run(configuration_1.Init)
    .directive('paint', directives_1.Paint.factory())
    .directive('chat', directives_1.Chat.factory())
    .controller('MainControl', controllers_1.MainControl)
    .controller('HomeController', controllers_1.HomeController)
    .controller('LoginController', controllers_1.LoginController)
    .controller('RegisterController', controllers_1.RegisterController)
    .controller('DashboardController', controllers_1.DashboardController)
    .controller('SandboxController', controllers_1.SandboxController)
    .filter('idToUsername', filters_1.IdToUsername);
