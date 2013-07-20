// @export Meteor.loginWithTwitter
Meteor.loginWithTwitter = function(options, callback) {
  // support a callback without options
  if (! callback && typeof options === "function") {
    callback = options;
    options = null;
  }

  var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
  Twitter.requestCredential(options, credentialRequestCompleteCallback);
};