(function() {
  'use strict';

  angular.module('oauth.amazon', ['oauth.utils'])
    .factory('$ngCordovaAmazon', Amazon);

  function Amazon($q, $http, $cordovaOauthUtility) {
    return { signin: oauthAmazon };

    /*
     * Sign into the Amazon Service
     *
     * @param    string clientId
     * @param    string clientSecret
     * @param    object options
     * @return   promise
     */
    function oauthAmazon(clientId, clientSecret, options) {
      var deferred = $q.defer();
      if(window.cordova) {
        if($cordovaOauthUtility.isInAppBrowserInstalled()) {
          var redirect_uri = "http://localhost/callback";
          if(options !== undefined) {
            if(options.hasOwnProperty("redirect_uri")) {
              redirect_uri = options.redirect_uri;
            }
          }
          var browserRef = window.cordova.InAppBrowser.open("https://www.amazon.com/ap/oa?client_id=" + clientId + "&redirect_uri=" + redirect_uri + "&response_type=code&scope=profile", "_blank", "location=no,clearsessioncache=yes,clearcache=yes");
          browserRef.addEventListener("loadstart", function(event) {
            if((!!(event.url).match(redirect_uri))) {
              var requestToken = (event.url).split("code=")[1];
              $http({method: "post", headers: {'Content-Type': 'application/x-www-form-urlencoded'}, url: "https://api.amazon.com/auth/o2/token", data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=" + redirect_uri + "&grant_type=Authorization_code" + "&code=" + requestToken })
                .success(function(data) {
                  deferred.resolve(data);
                })
                .error(function(data, status) {
                  deferred.reject("Problem authenticating");
                })
                .finally(function() {
                  setTimeout(function() {
                    browserRef.close();
                  }, 10);
              });
            }
          });
          browserRef.addEventListener('exit', function(event) {
            deferred.reject("The sign in flow was canceled");
          });
        } else {
          deferred.reject("Could not find InAppBrowser plugin");
        }
      } else {
        deferred.reject("Cannot authenticate via a web browser");
      }
      return deferred.promise;
    }
  }

  Amazon.$inject = ['$q', '$http', '$cordovaOauthUtility'];
})();
