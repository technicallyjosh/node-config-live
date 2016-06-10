'use strict';

module.exports.getImpl = function getImpl(object, property) {
    const elems = Array.isArray(property) ? property : property.split('.');
    const name  = elems[0];
    const value = object[name];

    if (elems.length <= 1) {
        return value;
    }

    // Note that typeof null === 'object'
    if (value === null || typeof value !== 'object') {
        return undefined;
    }

    return getImpl(value, elems.slice(1));
};

module.exports.flatToNested = function flatToNested(obj) {
    const result = {};

    for (const key in obj) {
        const parts = key.split(/\./);

        let container = result;

        while (parts.length > 1) {
            container = container[parts[0]] || (container[parts[0]] = {});
            parts.shift();
        }

        container[parts[0]] = obj[key];
    }

    return result;
};
