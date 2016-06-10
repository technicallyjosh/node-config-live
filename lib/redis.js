'use strict';

const EventEmitter = require('events').EventEmitter;
const redis        = require('redis');
const Promise      = require('bluebird');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const KEY = 'config-live:config';

class BaseClient extends EventEmitter {
    constructor(opts) {
        super();

        this.client = redis.createClient(opts.port, opts.host);

        this.client.on('error', err => this.emit('error', err));
    }
}

class CacheClient extends BaseClient {
    constructor(opts) {
        super(opts);
    }

    *set(field, value) {
        return yield this.client.hsetAsync(KEY, field, value);
    }

    *remove(field) {
        return yield this.client.hdelAsync(KEY, field);
    }

    *getOverwrites() {
        return yield this.client.hgetallAsync(KEY);
    }

    *getOverwrite(field) {
        return yield this.client.hgetAsync(KEY, field);
    }
}

class PubClient extends BaseClient {
    constructor(opts) {
        super(opts);
    }

    *publish(channel, message) {
        yield this.client.publishAsync(channel, JSON.stringify(message));
    }
}

class SubClient extends BaseClient {
    constructor(opts) {
        super(opts);

        this.client.on('message', (channel, message) =>
            this.emit('message', channel, message)
        );

        this.client.on('subscribe', (channel, count) =>
            this.emit('subscribe', channel, count)
        );
    }

    subscribe(channel) {
        this.client.subscribe(channel);
    }
}

module.exports = {
    CacheClient,
    PubClient,
    SubClient
};
