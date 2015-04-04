/**
 * @class MandrillWebhookValidator
 * @singleton
 *
 * https://github.com/scryptmouse/mandrill-webhook-validator
 *
 * Copyright (c) 2015 Alexa Grey
 * Licensed under the MIT license.
 */

'use strict';

var crypto  = require('crypto')
  , _       = require('lodash')
;

/**
 * @property {String}
 */
var DEFAULT_AUTH_HEADER = 'X-Mandrill-Signature';

/**
 * @param {Object} [options={}]
 * @param {String} options.key
 * @param {String} options.url
 * @param {String} [options.auth_header="X-Mandrill-Signature"]
 * @param {Boolean} [options.end_on_failure=false]
 * @return {function(express.Request, express.Response, function(Error=): void): void}
 */
exports.createExpressMiddleware = function(options) {
  options = options || {};

  var key = options.key
    , url = options.url
  ;

  if (!key) {
    throw new Error('must provide key to webhook middleware');
  }

  if (!url) {
    throw new Error('must provide url to webhook middleware');
  }

  var auth_header = options.auth_header || DEFAULT_AUTH_HEADER;

  var end_on_failure = !!options.end_on_failure;

  return function _mandrillWebhookMiddleware(req, res, next) {
    var signature = req.get(auth_header.toLowerCase())
      , err       = null
    ;

    if (!signature) {
      err = new Error('Not Authorized');
      err.status = 401;
    } else if (signature !== makeSignature(key, url, req.body)) {
      err = new Error('Forbidden');
      err.status = 403;
    } else {
      req.mandrill_signature = signature;
    }

    if (end_on_failure && err) {
      return res.status(err.status).end(err.message);
    } else {
      return next(err);
    }
  };
};

/**
 * @param {String} key
 * @param {String} url
 * @param {Object} params
 * @return {String}
 */
var makeSignature = exports.makeSignature = function(key, url, params) {
  params = params || {};

  if (!key || !url) {
    return null;
  }

  var signature = stringifiedObject(params, url);

  return crypto.createHmac('sha1', key).update(signature).digest('base64');
};

function stringifiedObject(params, base) {
  var keys = Object.keys(params).sort();

  return keys.reduce(function(sig, key) {
    return sig + key + params[key];
  }, base || '');
}
