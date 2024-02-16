# mktemp

[![Build Status](https://travis-ci.org/sasaplus1/mktemp.svg?branch=master)](https://travis-ci.org/sasaplus1/mktemp)
[![npm version](https://badge.fury.io/js/mktemp.svg)](https://badge.fury.io/js/mktemp)
[![Try mktemp on RunKit](https://badge.runkitcdn.com/mktemp.svg)](https://npm.runkit.com/mktemp)
[![renovate](https://badges.renovateapi.com/github/sasaplus1/mktemp)](https://renovatebot.com)

mktemp command for node.js

## Installation

```console
$ npm install mktemp
```

## Usage

```js
var mktemp = require('mktemp');

mktemp.createFile('XXXXX.txt', function(err, path) {
  if (err) throw err;

  // path match a /^[\da-zA-Z]{5}\.txt$/
  console.log(path);
});

// return value match a /^[\da-zA-Z]{5}\.tmp$/
mktemp.createFileSync('XXXXX.tmp');

mktemp.createDir('XXXXXXX', function(err, path) {
  if (err) throw err;

  // path match a /^[\da-zA-Z]{7}$/
  console.log(path);
});

// return value match a /^XXX-[\da-zA-Z]{3}$/
mktemp.createDirSync('XXX-XXX');
```

if support Promise, can use Promise style.

```js
var mktemp = require('mktemp');

mktemp
  .createFile('XXXXX.txt')
  .then(function(path) {
    // path match a /^[\da-zA-Z]{5}\.txt$/
    console.log(path);
  })
  .catch(function(err) {
    console.error(err);
  });

mktemp
  .createDir('XXXXX')
  .then(function(path) {
    // path match a /^[\da-zA-Z]{5}$/
    console.log(path);
  })
  .catch(function(err) {
    console.error(err);
  });
```

mktemp functions are replace to random string from placeholder "X" in template. see example:

```js
mktemp.createFileSync('XXXXXXX');  // match a /^[\da-zA-Z]{7}$/
mktemp.createFileSync('XXX.tmp');  // match a /^[\da-zA-Z]{3}\.tmp$/
mktemp.createFileSync('XXX-XXX');  // match a /^XXX-[\da-zA-Z]{3}$/
```

## Functions

### createFile(template[, callback])

* `template`
  * `String` - filename template
* `callback`
  * `function(err, path)` - callback function
    * `err` : `Error|Null` - error object
    * `path` :  `String` -  path

create blank file of unique filename. permission is `0600`.

it throws TypeError if node.js unsupported Promise and callback is not a function.

### createFileSync(template)

* `template`
  * `String` - filename template
* `return`
  * `String` - path

sync version createFile.

### createDir(template[, callback])

* `template`
  * `String` - dirname template
* `callback`
  * `function(err, path)` - callback function
    * `err` : `Error|Null` - error object
    * `path` : `String` - path

create directory of unique dirname. permission is `0700`.

it throws TypeError if node.js unsupported Promise and callback is not a function.

### createDirSync(template)

* `template`
  * `String` - dirname template
* `return`
  * `String` - path

sync version createDir.

## Contributors

* [Michael Ficarra](https://github.com/michaelficarra)
* [rjz](https://github.com/rjz)

## License

The MIT license.
