import { HomeController, LoginController, RegisterController, DashboardController, SandboxController } from './controllers'
import { AuthenticationService } from './services'


export class Router {
    static $inject = ['$locationProvider',
        '$httpProvider',
        'jwtOptionsProvider',
        '$urlRouterProvider',
        '$stateProvider']
    constructor($locationProvider: ng.ILocationProvider,
        $httpProvider: ng.IHttpProvider,
        jwtOptionsProvider: jwtOptionsProvider,
        $urlRouterProvider: ng.ui.IUrlRouterProvider,
        $stateProvider: ng.ui.IStateProvider) {
        $locationProvider.html5Mode(true);

        $stateProvider

            .state('home', {
                url: '/',
                controller: HomeController,
                templateUrl: 'app/views/home.html'
            })

            .state('login', {
                url: '/login',
                controller: LoginController,
                templateUrl: 'app/views/login.html'
            })

            .state('register', {
                url: '/register',
                controller: RegisterController,
                templateUrl: 'app/views/register.html'
            })

            .state('dashboard', {
                url: '/dashboard',
                controller: DashboardController,
                templateUrl: 'app/views/dashboard.html'
            })

            .state('sandbox', {
                url: '/sandbox',
                controller: SandboxController,
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
                templateUrl: ($stateParams:any)=>'../api/sessions/' + $stateParams.id 
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
}

export class Init {
    static $inject = ['$rootScope',
        '$location',
        '$cookies',
        '$http',
        'authManager',
        'AuthenticationService']
    constructor($rootScope: IRootScopeServiceGlobals,
        $location: ng.ILocationService,
        $cookies: ng.cookies.ICookiesService,
        $http: ng.IHttpService,
        authManager: ng.jwt.IAuthManagerServiceProvider,
        AuthenticationService: AuthenticationService) {

        $rootScope['globals'] = $cookies.get('globals') || {};

        if ($rootScope.globals.currentUser) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata;
        }

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var restrictedPage = $.inArray($location.path(), ['/en','/es','/', '/login', '/register', '/sandbox']) === -1;
            var loggedIn = $rootScope.globals.currentUser;
            if (restrictedPage && !loggedIn) {
                $location.path('/login');
            }
        })

        $rootScope.$on('tokenHasExpired', function () {
            AuthenticationService.clearCredentials();
        });
        authManager.checkAuthOnRefresh();
    }
}