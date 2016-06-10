'use strict';

const EventEmitter     = require('events').EventEmitter;
const check            = require('check-types');
const co               = require('co');
const debug            = require('debug')('config-live');
const redis            = require('./redis');
const utils            = require('./utils');
const RedisCacheClient = redis.CacheClient;
const RedisPubClient   = redis.PubClient;
const RedisSubClient   = redis.SubClient;

const PUB_CHANNEL = 'config-live:change';

class ConfigLive extends EventEmitter {
    constructor(host, port) {
        super();

        if (!check.string(host)) {
            throw new Error('Invalid host type. Must be a string.');
        }

        if (!check.number(port)) {
            throw new Error('Invalid port type. Must be a number.');
        }

        this._config        = {};
        this._cacheClient   = null;
        this._pubClient     = null;
        this._subClient     = null;
        this._pubSubOptions = { port, host };
        this._cacheOptions  = { port, host };
    }

    setConfig(config) {
        co(function* () {
            debug('SET CONFIG:', config);

            this._config = config;

            const overwrites = yield* this._cacheClient.getOverwrites();

            if (overwrites) {
                debug('OVERWRITES:', overwrites);
                this.mergeOverwrites(config, overwrites);
            }

            debug('CONFIG-LIVE IS INITIALIZED');

            this.emit('started', config);
        }.bind(this)).catch(err => this.error(err));
    }

    updateConfig(updated) {
        const newObj    = utils.flatToNested(updated);
        const keys      = Object.keys(updated);
        const propName  = keys[0];
        const propValue = updated[propName];

        this.mergeOverwrites(this._config, newObj);

        this.emit('updated', this._config);

        this.emit(`${propName}-updated`, propValue);
    }

    mergeOverwrites(config, overwrites) {
        const nestedOverwrites = utils.flatToNested(overwrites);

        Object.assign(config, nestedOverwrites);
    }

    set(key, value) {
        co(function* () {
            debug(`SET: ${key}:${value}`);

            yield* this._cacheClient.set(key, value);

            const message = {
                key,
                value
            };

            yield* this._pubClient.publish(PUB_CHANNEL, message);
        }.bind(this)).catch(err => this.error(err));
    }

    remove(key) {
        co(function* () {
            debug(`REMOVE: ${key}`);

            yield* this._cacheClient.remove(key);
        }.bind(this)).catch(err => this.error(err));
    }

    start(config) {
        debug('CONFIG-LIVE STARTING');

        this.startCacheClient();
        this.startPubClient();
        this.startSubClient();

        this.setConfig(config || {});
    }

    error(err) {
        debug('error:', err);
        this.emit('error', err);
    }

    startCacheClient() {
        this._cacheClient = new RedisCacheClient(this._cacheOptions);

        this._cacheClient.on('error', err => this.error(err));
    }

    startPubClient() {
        this._pubClient = new RedisPubClient(this._pubSubOptions);

        this._pubClient.on('error', err => this.error(err));
    }

    startSubClient() {
        this._subClient = new RedisSubClient(this._pubSubOptions);

        this._subClient.on('error', err => this.error(err));

        this._subClient.on('subscribe', (channel, count) =>
            this.emit('subscribe', channel, count)
        );

        this._subClient.on('message', (channel, message) => {
            if (channel === PUB_CHANNEL) {
                message = JSON.parse(message);

                // transform to hash style object
                const config = { [message.key]: message.value };

                this.updateConfig(config);
            }
        });

        this._subClient.subscribe(PUB_CHANNEL);
    }
}

module.exports = ConfigLive;
