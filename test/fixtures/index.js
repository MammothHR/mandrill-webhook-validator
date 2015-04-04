'use strict';

var glob  = require('glob')
  , path  = require('path')
  , fs    = require('fs')
  , _     = require('lodash')
;

var Fixtures = module.exports = {};

var FIXTURES = Fixtures.FIXTURES = [];

Fixtures.forEach = FIXTURES.forEach.bind(FIXTURES);

var files = glob.sync(path.join(__dirname, 'c*.json'));

files.forEach(function(file) {
  FIXTURES.push(JSON.parse(fs.readFileSync(file, 'utf8')));
});

Object.defineProperty(Fixtures, 'length', {
  get: function() { return FIXTURES.length; }
});
