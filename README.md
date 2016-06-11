# node-config-live

[![npm version](https://badge.fury.io/js/config-live.svg)](https://badge.fury.io/js/config-live) [![Build Status](https://travis-ci.org/technicallyjosh/node-config-live.svg?branch=master)](https://travis-ci.org/technicallyjosh/node-config-live) [![GitHub license](https://img.shields.io/badge/license-ISC-blue.svg)](https://raw.githubusercontent.com/technicallyjosh/node-config-live/master/LICENSE)

# Introduction

Config-live takes away the pain of reloading your NodeJS applications when configurations change. It uses a simple implementation of external caching and pub/sub for updates.

Right now config-live uses [Redis](http://redis.io) for it's caching of config key/values and pub/sub features. Bringing your own caching and pub/sub is in the works and will be implemented as addons.

Props to Stack Overflow for their NFig package that has inspired this!

**Important things to note:**
* NodeJS 4+ required
* No authentication is built in this package yet. e.g. username/password
* This module assumes that you are on a **per environment setup**. *(One Redis instance per environment)*

## Installation

```
npm i -S config-live
```

## Example Usage

Using the [config](https://github.com/lorenwest/node-config) module.

```js
const config     = require('config'); // if you are using config
const ConfigLive = require('config-live');
const configLive = new ConfigLive('localhost', 6379);

// config is an object
configLive.start(config);

configLive.on('error', err => {
    // DO SOMETHING. IT'S ON FIRE.
});

configLive.on('started', cfg => {
    // since the config module is global, this is useful for a fully merged update
    config.util.extendDeep(config, cfg);
});

// you can listen to the full updated config
configLive.on('updated', cfg => {
    // do something here?
});

// or you can listen to a specific simple key being updated
configLive.on('mykey-updated', value => {
    // can do something with new value
});

// or you can listen to a specific nested key being updated
configLive.on('mykey.mysecondkey-updated', value => {
    // can do something with new value
});

// single key set
configLive.set('mykey', 'myvalue');

// nested object key set
configLive.set('mykey.mysecondkey', 'myvalue');
```

## Debugging

```
DEBUG=config-live* node myapp.js
```

**More documentation coming soon!**
