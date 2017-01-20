
import { Router, Init } from './configuration';
import { AuthenticationService, RegistrationService } from './services';
import {
    MainControl,
    HomeController,
    LoginController,
    RegisterController,
    DashboardController,
    SandboxController,
    SharedController
} from './controllers'
import { Paint,Chat } from './directives'
import { IdToUsername} from './filters'

const app = angular.module('App', ['ngCookies', 'angular-jwt', 'angularMoment', 'ui.router', 'colorpicker.module','luegg.directives']);

app.config(Router)
    .service('AuthenticationService', AuthenticationService)
    .service('RegistrationService', RegistrationService)
    .run(Init)
    .directive('paint', Paint.factory())
    .directive('chat',Chat.factory())
    .controller('MainControl', MainControl)
    .controller('HomeController', HomeController)
    .controller('LoginController', LoginController)
    .controller('RegisterController', RegisterController)
    .controller('DashboardController', DashboardController)
    .controller('SandboxController',SandboxController)
    .filter('idToUsername',IdToUsername)