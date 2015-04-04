# mandrill-webhook-validator [![Build Status](https://secure.travis-ci.org/scryptmouse/mandrill-webhook-validator.png?branch=master)](http://travis-ci.org/scryptmouse/mandrill-webhook-validator)

Validator functionality for [Mandrill's](http://mandrill.com/) somewhat complex [webhook request signing](http://help.mandrill.com/entries/23704122-Authenticating-webhook-requests).

## Getting Started
Install the module with: `npm install mandrill-webhook-validator --save`

## Documentation
### Direct usage
```javascript
var validator = require('mandrill-webhook-validator')
  , signature = request.get('X-Mandrill-Signature')
;

if (signature === validator.makeSignature(WEBHOOK_KEY, WEBHOOK_URL, request.body)) {
  // signed correctly!
}
```

### In Express
A middleware generator is provided for quick use with express. On a successful
authentication, it'll set `mandrill_signature` on the `request` object.

By default, it will forward an error with proper HTTP status codes on invalid
webhook requests for the application to handle however. If you would like for
it to bypass default error handling and end the response immediately (with a
plain text status message), use the option `{ end_on_failure: true }`.

```javascript
var validator	= require('mandrill-webhook-validator')
  , express		= require('express')
  , router      = express.router()
;

// To use the normal express `next(err)` on authentication failure
router.use(validator.createExpressMiddleware({ key: WEBHOOK_KEY, url: WEBHOOK_URL }));

// To end the respone immediately on a failed authentication, use `end_on_failure`
router.use(validator.createExpressMiddleware({ key: WEBHOOK_KEY, url: WEBHOOK_URL, end_on_failure: true }));
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2015 Alexa Grey
Licensed under the MIT license.
