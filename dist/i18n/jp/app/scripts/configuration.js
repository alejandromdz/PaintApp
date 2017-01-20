"use strict";
var controllers_1 = require('./controllers');
var Router = (function () {
    function Router($locationProvider, $httpProvider, jwtOptionsProvider, $urlRouterProvider, $stateProvider) {
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('home', {
            url: '/',
            controller: controllers_1.HomeController,
            templateUrl: 'app/views/home.html'
        })
            .state('login', {
            url: '/login',
            controller: controllers_1.LoginController,
            templateUrl: 'app/views/login.html'
        })
            .state('register', {
            url: '/register',
            controller: controllers_1.RegisterController,
            templateUrl: 'app/views/register.html'
        })
            .state('dashboard', {
            url: '/dashboard',
            controller: controllers_1.DashboardController,
            templateUrl: 'app/views/dashboard.html'
        })
            .state('sandbox', {
            url: '/sandbox',
            controller: controllers_1.SandboxController,
            templateUrl: '../get-sandbox'
        })
            .state('dashboard.home', {
            url: '/home',
            templateUrl: 'app/views/dashboard/home.html'
        })
            .state('dashboard.sessions', {
            url: '/sessions',
            templateUrl: 'app/views/dashboard/sessions.html'
        })
            .state('dashboard.sessionById', {
            url: '/sessions/:id',
            templateUrl: function ($stateParams) { return '../api/sessions/' + $stateParams.id; }
        })
            .state('dashboard.friends', {
            url: '/friends',
            templateUrl: 'app/views/dashboard/friends.html'
        });
        jwtOptionsProvider.config({
            tokenGetter: ['$cookies', function ($cookies) {
                    return $cookies.get('token');
                }]
        });
        $httpProvider.interceptors.push('jwtInterceptor');
    }
    Router.$inject = ['$locationProvider',
        '$httpProvider',
        'jwtOptionsProvider',
        '$urlRouterProvider',
        '$stateProvider'];
    return Router;
}());
exports.Router = Router;
var Init = (function () {
    function Init($rootScope, $location, $cookies, $http, authManager, AuthenticationService) {
        $rootScope['globals'] = $cookies.get('globals') || {};
        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var restrictedPage = $.inArray($location.path(), ['/en', '/es', '/', '/login', '/register', '/sandbox']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        });
        $rootScope.$on('tokenHasExpired', function () {
            AuthenticationService.clearCredentials();
        });
        authManager.checkAuthOnRefresh();
    }
    Init.$inject = ['$rootScope',
        '$location',
        '$cookies',
        '$http',
        'authManager',
        'AuthenticationService'];
    return Init;
}());
exports.Init = Init;
