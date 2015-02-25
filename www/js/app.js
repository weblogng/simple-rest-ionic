// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('SimpleRESTIonic', ['ionic', 'angular-storage', 'weblogng'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.constant('ENDPOINT_URI', 'https://simple-rest-api.herokuapp.com/api/')
.constant('weblogngConfig', {
    apiKey: 'd156e786-9cb4-4737-99ad-fdb905340275',
    options: {
      publishNavigationTimingMetrics: true,
      publishUserActive: true,
      application: 'simple-rest-website'
    }
  })
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
$stateProvider
  .state('dashboard', {
  url: '/dashboard',
  views: {
    dashboard: {
      templateUrl: 'dashboard.html',
      controller: 'DashboardCtrl as dashboard'
    }
  }
})
  .state('login', {
  url: '/login',
  views: {
    login: {
      templateUrl: 'login.html',
      controller: 'LoginCtrl as login'
    }
  }
});

    $urlRouterProvider.otherwise('/dashboard');

    $httpProvider.interceptors.push('APIInterceptor');
})
.service('APIInterceptor', function($rootScope, UserService) {
    var service = this;

    service.request = function(config) {
        var currentUser = UserService.getCurrentUser(),
            access_token = currentUser ? currentUser.access_token : null;

        if (access_token) {
            config.headers.authorization = access_token;
        }
        return config;
    };

    service.responseError = function(response) {
        if (response.status === 401) {
            $rootScope.$broadcast('authorized');
        }
        return response;
    };
})
.service('UserService', function(store) {
    var service = this,
        currentUser = null;

    service.setCurrentUser = function(user) {
        currentUser = user;
        store.set('user', user);
        return currentUser;
    };

    service.getCurrentUser = function() {
        if (!currentUser) {
            currentUser = store.get('user');
        }
        return currentUser;
    };
})
.service('LoginService', function($http, ENDPOINT_URI) {
    var service = this,
        path = 'Users/';

    function getUrl() {
        return ENDPOINT_URI + path;
    }

    function getLogUrl(action) {
        return getUrl() + action;
    }

    service.login = function(credentials) {
        return $http.post(getLogUrl('login'), credentials);
    };

    service.logout = function() {
        return $http.post(getLogUrl('logout'));
    };

    service.register = function(user) {
        return $http.post(getUrl(), user);
    };
})
.service('ItemsModel', function ($http, ENDPOINT_URI) {
    var service = this,
        path = 'items/';

    function getUrl() {
        return ENDPOINT_URI + path;
    }

    function getUrlForId(itemId) {
        return getUrl(path) + itemId;
    }

    service.all = function () {
        return $http.get(getUrl());
    };

    service.fetch = function (itemId) {
        return $http.get(getUrlForId(itemId));
    };

    service.create = function (item) {
        return $http.post(getUrl(), item);
    };

    service.update = function (itemId, item) {
        return $http.put(getUrlForId(itemId), item);
    };

    service.destroy = function (itemId) {
        return $http.delete(getUrlForId(itemId));
    };
})
.controller('LoginCtrl', function($rootScope, $state, LoginService, UserService){
    var login = this;

    function signIn(user) {
        LoginService.login(user)
            .then(function(response) {
                user.access_token = response.data.id;
                UserService.setCurrentUser(user);
                $rootScope.$broadcast('authorized');
                $state.go('dashboard');
            });
    }

    function register(user) {
        LoginService.register(user)
            .then(function(response) {
                login(user);
            });
    }

    function submit(user) {
        console.log("handling submit of " + user);
        login.newUser ? register(user) : signIn(user);
    }

    login.newUser = false;
    login.submit = submit;
})
.controller('MainCtrl', function ($rootScope, $state, LoginService, UserService) {
    var main = this;

    function logout() {
        LoginService.logout()
            .then(function(response) {
                main.currentUser = UserService.setCurrentUser(null);
                $state.go('login');
            }, function(error) {
                console.log(error);
            });
    }

    $rootScope.$on('authorized', function() {
        main.currentUser = UserService.getCurrentUser();
    });

    $rootScope.$on('unauthorized', function() {
        console.log("user is unauthorized, sending to login");
        main.currentUser = UserService.setCurrentUser(null);
        $state.go('login');
    });

    main.logout = logout;
    main.currentUser = UserService.getCurrentUser();
})
.controller('DashboardCtrl', function(ItemsModel){

    var dashboard = this;

    function getItems() {
        ItemsModel.all()
            .then(function (result) {
                dashboard.items = result.data;
            });
    }

    function createItem(item) {
        ItemsModel.create(item)
            .then(function (result) {
                initCreateForm();
                getItems();
            });
    }

    function updateItem(item) {
        ItemsModel.update(item.id, item)
            .then(function (result) {
                cancelEditing();
                getItems();
            });
    }

    function deleteItem(itemId) {
        ItemsModel.destroy(itemId)
            .then(function (result) {
                cancelEditing();
                getItems();
            });
    }

    function initCreateForm() {
        dashboard.newItem = { name: '', description: '' };
    }

    function setEditedItem(item) {
        dashboard.editedItem = angular.copy(item);
        dashboard.isEditing = true;
    }

    function isCurrentItem(itemId) {
        return dashboard.editedItem !== null && dashboard.editedItem.id === itemId;
    }

    function cancelEditing() {
        dashboard.editedItem = null;
        dashboard.isEditing = false;
    }

    function cancelCreateItem() {
        initCreateForm();
        dashboard.isCreating = false;
    }

    dashboard.items = [];
    dashboard.editedItem = null;
    dashboard.isEditing = false;
    dashboard.isCreating = false;
    dashboard.getItems = getItems;
    dashboard.createItem = createItem;
    dashboard.updateItem = updateItem;
    dashboard.deleteItem = deleteItem;
    dashboard.setEditedItem = setEditedItem;
    dashboard.isCurrentItem = isCurrentItem;
    dashboard.cancelEditing = cancelEditing;
    dashboard.cancelCreateItem = cancelCreateItem;

    initCreateForm();
    getItems();
})
;
