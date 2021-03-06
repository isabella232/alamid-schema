"use strict";

var processDefinition = require("./processDefinition.js");
var merge = require("./merge.js");

var slice = Array.prototype.slice;

function Schema() {
    Schema.prototype.constructor.apply(this, arguments);
}

/**
 * Creates a new Schema.
 *
 * @param {string} [name=Anonymous]
 * @param {string|Object} definition
 */
Schema.prototype.constructor = function (name, definition) {
    var schema;

    if (arguments.length === 1) {
        name = "Anonymous";
        definition = arguments[0];
    }

    this.name = name;
    this.definition = definition;

    schema = processDefinition(definition);

    this.fields = schema.fields;
    this.types = schema.types;
};

/**
 * Returns a subset of the current schema with the given fields. You may pass an array with fields
 * or just the keys as arguments.
 *
 * @param {string|Array} key1
 * @param {string} key2
 * @param {string} key3
 * @returns {Schema}
 */
Schema.prototype.only = function (key1, key2, key3) {
    var subset = Object.create(this);
    var fields;

    if (arguments.length === 1 && Array.isArray(key1)) {
        fields = key1;
    } else {
        fields = slice.call(arguments);
    }

    subset.fields = fields;

    return subset;
};

/**
 * Returns a subset of the current schema without the given keys. You may pass an array with fields
 * or just the keys as arguments.
 *
 * @param {string|Array} key1
 * @param {string} key2
 * @param {string} key3
 * @returns {Schema}
 */
Schema.prototype.except = function (key1, key2, key3) {
    var subset = Object.create(this);
    var fields;

    if (arguments.length === 1 && Array.isArray(key1)) {
        fields = key1;
    } else {
        fields = slice.call(arguments);
    }

    subset.fields = this.fields.filter(function (value) {
        return fields.indexOf(value) === -1;
    });

    return subset;
};

/**
 * Returns all writable fields as array.
 *
 * @returns {Array}
 */
Schema.prototype.writableFields = function () {
    var self = this;

    return this.fields.filter(function (key) {
        return self.definition[key].writable === true;
    });
};

/**
 * Returns a schema with only writable fields.
 *
 * @returns {Schema}
 */
Schema.prototype.writable = function () {
    return this.only(this.writableFields());
};

/**
 * Returns all writable Fields as array.
 *
 * @returns {Array}
 */
Schema.prototype.readableFields = function () {
    var self = this;

    return this.fields.filter(function (key) {
        return self.definition[key].readable === true;
    });
};

/**
 * Returns a Schema with only readable fields.
 *
 * @returns {Schema}
 */
Schema.prototype.readable = function () {
    return this.only(this.readableFields());
};

/**
 * Creates a new schema that inherits from the current schema. Field definitions are merged
 * where appropriate. If a definition conflicts with the parent definition, the child's definition supersedes.
 *
 * @param {string} [name=Anonymous]
 * @param {Object} definition
 * @returns {Schema}
 */
Schema.prototype.extend = function (name, definition) {
    if (arguments.length === 1) {
        name = "Anonymous";
        definition = arguments[0];
    }

    return new Schema(name, merge(this.definition, definition));
};

/**
 * Removes all properties that are not defined in this.fields.
 * Will not remove properties that are inherited from the prototype.
 *
 * @param {Object} model
 */
Schema.prototype.strip = function (model) {
    var fields = this.fields;

    Object.keys(model)
        .forEach(function (key) {
            if (fields.indexOf(key) === -1) {
                delete model[key];
            }
        });
};

/**
 * Calls the given function with the Schema as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Function}
 */
Schema.use = function (plugin, config) {
    plugin(this, config);

    return this;
};

module.exports = Schema;
