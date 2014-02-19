"use strict";

var determineType = require("./determineType.js"),
    value = require("value");

/**
 * Normalizes the schema definition and extracts keys and types
 *
 * @param {Object} definition
 * @return {Object}
 */
function processDefinition(definition) {
    var key,
        fieldDefinition,
        type,
        keys = [],
        types = {};

    for (key in definition) {
        if (definition.hasOwnProperty(key)) {
            keys.push(key);

            fieldDefinition = definition[key];
            type = determineType(fieldDefinition);

            // Normalize the type definition
            if (value(fieldDefinition).getConstructor() === Object) {
                definition[key].type = type;
            } else {
                definition[key] = {
                    type: type
                };
            }

            types[key] = type;
        }
    }

    return {
        keys: keys,
        types: types
    };
}

module.exports = processDefinition;