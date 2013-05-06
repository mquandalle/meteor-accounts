// https://dev.twitter.com/docs/api/1.1/get/account/verify_credentials
Twitter.whitelistedFields = ['profile_image_url', 'profile_image_url_https', 'lang'];

Oauth.registerService('twitter', 1, Twitter._urls, function(oauthBinding) {
  var identity = oauthBinding.get('https://api.twitter.com/1.1/account/verify_credentials.json').data;

  var serviceData = {
    id: identity.id_str,
    screenName: identity.screen_name,
    accessToken: oauthBinding.accessToken,
    accessTokenSecret: oauthBinding.accessTokenSecret
  };

  // include helpful fields from twitter
  var fields = _.pick(identity, Twitter.whitelistedFields);
  _.extend(serviceData, fields);

  return {
    serviceData: serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
});
