'use strict';

const expect = require('chai').expect;

describe('requiring', () => {
    it('should not throw an error', () => {
        expect(() => require('./lib')).to.not.throw();
    });
});

describe('initializing', () => {
    const ConfigLive = require('./lib');

    it('should throw an error when no or invalid host is specified', () => {
        expect(() => new ConfigLive()).to.throw(/Invalid host type. Must be a string\./);
        expect(() => new ConfigLive(123)).to.throw(/Invalid host type. Must be a string\./);
        expect(() => new ConfigLive({})).to.throw(/Invalid host type. Must be a string\./);
    });

    it('should throw an error when no or invalid port is specified', () => {
        expect(() => new ConfigLive('localhost')).to.throw(/Invalid port type. Must be a number\./);
        expect(() => new ConfigLive('localhost', '123')).to.throw(/Invalid port type. Must be a number\./);
        expect(() => new ConfigLive('localhost', {})).to.throw(/Invalid port type. Must be a number\./);
    });

    it('should not throw an error when host and port are valid', () => {
        expect(() => new ConfigLive('localhost', 6379)).to.not.throw();
    });
});

describe('events', () => {
    const host        = 'localhost';
    const port        = 6379;
    const ConfigLive  = require('./lib');
    const cl          = new ConfigLive(host, port);
    const redis       = require('redis');
    const redisClient = redis.createClient(port, host);

    beforeEach(done => {
        redisClient.unref();
        redisClient.del('config-live:config', done);
    });

    it('should emit \'started\' when started', done => {
        cl.once('started', config => {
            expect(config).to.be.empty;
            done();
        });

        cl.start();
    });

    it('should emit \'updated\' when a value is set', done => {
        cl.once('updated', (config) => {
            expect(config).to.eql({ test: 'value1' });

            done();
        });

        cl.set('test', 'value1');
    });

    it('should emit key update when a value is set', done => {
        cl.once('test-updated', (value) => {
            expect(value).to.equal('value2');

            done();
        });

        cl.set('test', 'value2');
    });
});
