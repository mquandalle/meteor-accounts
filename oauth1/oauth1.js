
// XXX Use oauth verifier

OAuth = function(config) {
  _.extend(this, config);
};

OAuth.prototype._getAuthHeaderString = function(headers) {
  return 'OAuth ' +  _.map(headers, function(val, key) {
    return encodeURIComponent(key) + '="' + encodeURIComponent(val) + '"'; 
  }).sort().join(', ');
};

OAuth.prototype.getRequestToken = function(callbackUrl) {

  var headers = this._buildHeader({
    oauth_callback: callbackUrl
  });

  var response = this._call('post', this._urls.requestToken, headers);
  var tokens = querystring.parse(response.content);

  this.requestToken = tokens.oauth_token;
};

OAuth.prototype.getAccessToken = function(oauthToken) {

  var headers = this._buildHeader({
    oauth_token: oauthToken
  });

  var response = this._call('post', this._urls.accessToken, headers);
  var tokens = querystring.parse(response.content);

  this.accessToken = tokens.oauth_token;
  this.accessTokenSecret = tokens.oauth_token_secret;
};

OAuth.prototype._call = function(method, url, headers) {
  
  // Get the signature
  headers.oauth_signature = this._getSignature(method.toUpperCase(), url, headers, this.accessTokenSecret);

  // Make a authorization string according to oauth1 spec
  var authString = this._getAuthHeaderString(headers);

  // Make signed request
  var response = Meteor.http[method.toLowerCase()](url, {
    headers: {
      Authorization: authString
    }
  });

  if (response.error)
    throw response.error;
    
  return response;
};

OAuth.prototype.call = function(method, url) {
  var headers = this._buildHeader({
    oauth_token: this.accessToken
  });

  var response = this._call(method, url, headers);

  return response.data;
};

OAuth.prototype.get = function(url) {
  return this.call('get', url);
};

OAuth.prototype._buildHeader = function(headers) {
  return _.extend({
    oauth_consumer_key: this._appId,
    oauth_nonce: Meteor.uuid().replace(/\W/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: (new Date().valueOf()/1000).toFixed().toString(),
    oauth_version: '1.0'
  }, headers);
};

OAuth.prototype._getSignature = function(method, url, rawHeaders, oauthSecret) {

  var headers = this._encodeHeader(rawHeaders);

  var parameters = _.map(headers, function(val, key) {
    return key + '=' + val;
  }).sort().join('&');

  var signatureBase = [
    method,
    encodeURIComponent(url),
    encodeURIComponent(parameters)
  ].join('&');

  var signingKey = encodeURIComponent(this._secret) + '&';
  if (oauthSecret)
    signingKey += encodeURIComponent(oauthSecret);

  return crypto.createHmac('SHA1', signingKey).update(signatureBase).digest('base64');
};

OAuth.prototype._encodeHeader = function(header) {
  return _.reduce(header, function(memo, val, key) {
    memo[encodeURIComponent(key)] = encodeURIComponent(val);
    return memo;
  }, {});
};
