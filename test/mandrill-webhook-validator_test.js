'use strict';

var mandrill_webhook_validator  = require('../lib/mandrill-webhook-validator.js')
  , httpMocks                   = require('node-mocks-http')
  , fixtures                    = require('./fixtures')
  , util                        = require('util')
  , _                           = require('lodash')
;

var WEBHOOK_URL   = 'http://maus.pw:3000/mandrill'
  , KEY           = 'Y-D2ZZseFJBYf4R7KPQovA'
  , makeSignature = mandrill_webhook_validator.makeSignature
;

exports['express middleware error handling'] = {
  setUp: function(done) {
    this.request = httpMocks.createRequest({
      method: 'POST',
      url: '/mandrill',
      body: {}
    });

    this.response = httpMocks.createResponse();

    done();
  },

  'next(error) / unauthorized': function(test) {
    var middleware = createMiddleware();

    test.expect(5);

    middleware(this.request, this.response, unauthorized(test).bind(this));
  },

  'next(error) / forbidden': function(test) {
    var middleware = createMiddleware();

    test.expect(5);

    setAuth(this.request, 'never gonna get it');

    middleware(this.request, this.response, forbidden(test).bind(this));
  },

  'ends on error / unauthorized': function(test) {
    var middleware = createMiddleware({ end_on_failure: true });

    test.expect(4);

    middleware(this.request, this.response);

    unauthorized(test, true).call(this);

    test.done();
  },

  'ends on error / forbidden': function(test) {
    var middleware = createMiddleware({ end_on_failure: true });

    test.expect(4);

    setAuth(this.request, 'never gonna get it');

    middleware(this.request, this.response);

    forbidden(test, true).call(this);

    test.done();
  },

  'without required params': function(test) {
    test.expect(2);

    test.throws(function() {
      createMiddleware({key: ''});
    }, Error, 'explodes without key');

    test.throws(function() {
      createMiddleware({url: ''});
    }, Error, 'explodes without url');

    test.done();
  }
};

fixtures.forEach(function(fixture, idx) {
  var fixture_number  = idx + 1
    , express_suite   = {}
  ;

  express_suite.setUp = function(done) {
    this.request = httpMocks.createRequest({
      method: 'POST',
      url: '/mandrill',
      body: fixture.body
    });

    this.response = httpMocks.createResponse();

    done();
  };

  express_suite['verifies valid signature'] = function(test) {
    var middleware = createMiddleware();

    test.expect(3);

    setAuth(this.request, fixture.auth);

    middleware(this.request, this.response, function(err) {
      test.ifError(err, 'does not raise an error');
      test.ok(!this.response._isEndCalled(), 'response is ended');
      test.equal(this.request.mandrill_signature, fixture.auth, 'sets the signature on the request object');

      test.done();

    }.bind(this));
  };

  exports[util.format('express middleware (fixture #%d)', fixture_number)] = express_suite;

  exports[util.format('makeSignature (fixture #%d)', fixture_number)] = function(test) {
    test.expect(3);
    test.equal(makeSignature(KEY, WEBHOOK_URL, fixture.body), fixture.auth, 'validates');
    test.ok(!makeSignature(null, WEBHOOK_URL, fixture.body), 'blank with no key');
    test.ok(!makeSignature(KEY, null, fixture.body), 'blank with no url');
    test.done();
  };
});

function setAuth(request, auth) {
  request._setHeadersVariable('X-Mandrill-Signature', auth);
}

function createMiddleware(options) {
  options = options || {};

  _.defaults(options, {
    key: KEY,
    url: WEBHOOK_URL
  });

  return mandrill_webhook_validator.createExpressMiddleware(options);
}

function handleError(test, code, text) {
  return function(err) {
    test.ok(err, 'throws an error');
    test.ok(!this.response._isEndCalled(), 'response should not be ended');
    test.equal(err.status, code, 'should be unauthorized');
    test.equal(err.message, text, 'should have error text');
    test.ok(!this.request.mandrill_signature, 'mandrill_signature should not be set');

    test.done();
  };
}

function handleEndedError(test, code, text) {
  return function() {
    test.ok(this.response._isEndCalled(), 'response should be ended');
    test.equal(this.response.statusCode, code, 'should have error status');
    test.equal(this.response._getData(), text, 'should have error text');
    test.ok(!this.request.mandrill_signature, 'mandrill_signature should not be set');
  };
}

function unauthorized(test, ended) {
  var code  = 401
    , text  = 'Not Authorized'
  ;

  if (ended) {
    return handleEndedError(test, code, text);
  } else {
    return handleError(test, code, text);
  }
}

function forbidden(test, ended) {
  var code  = 403
    , text  = 'Forbidden'
  ;

  if (ended) {
    return handleEndedError(test, code, text);
  } else {
    return handleError(test, code, text);
  }
}
