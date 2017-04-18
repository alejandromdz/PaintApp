export class AuthenticationService
    {
    static $inject = ['$rootScope','$http','$cookies'];
    constructor(private $rootScope:IRootScopeServiceGlobals,
                private $http:ng.IHttpService, 
                private $cookies:ng.cookies.ICookiesService)
        {}
       public login(username:string,password:string,callback:Function){
            
             this.$http.post('/api/login', { username: username, password: password })
               .success(function (data,status) {          
                   callback(data,status);
                });
        }

        public setCredentials(username:string,password:string,token:string){

            this.$rootScope.globals = {
                currentUser: {
                    username: username
                }
            }
            this.$cookies.put('token',token,{path:'/'});
            }

        public clearCredentials  () {
            this.$rootScope.globals = {};
        }    
}

export class RegistrationService{

    static $inject = ['$rootScope','$http','$cookies'];
    constructor(private $rootScope:IRootScopeServiceGlobals,
                private $http:ng.IHttpService, 
                private $cookies:ng.cookies.ICookiesService)
        {
            
        }

        public register (username:string,password:string,callback:Function){
            
             this.$http.post('/api/register', { username: username, password: password})
               .success(function (data,status) {
                   callback(data,status);
                });
        
        }


}
 