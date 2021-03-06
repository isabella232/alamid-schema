alamid-schema
=============
**Extendable mongoose-like schemas for node.js and the browser**

[![npm status](https://nodei.co/npm/alamid-schema.svg?downloads=true&stars=true)](https://npmjs.org/package/alamid-schema)<br>
[![build status](https://travis-ci.org/peerigon/alamid-schema.svg)](http://travis-ci.org/peerigon/alamid-schema)
[![dependencies](https://david-dm.org/peerigon/alamid-schema.svg)](http://david-dm.org/peerigon/alamid-schema)
[![devDependency Status](https://david-dm.org/peerigon/alamid-schema/dev-status.svg)](https://david-dm.org/peerigon/alamid-schema#info=devDependencies)

If you like [mongoose](http://mongoosejs.com/) schemas and you want to use them standalone, **alamid-schema** is the right module for you.

__alamid-schema__ helps you with

- validation of data
- using mongoose-like schemas without using mongoose
- sharing data-definition between client & server
- normalizing data (coming soon)
- striping readable/writeable fields (coming soon)

Use it on the server to...
 - normalize and validate incoming requests
 - strip private fields from the response

Use it on the client to...
- validate forms
- define view models

```javascript
var Schema = require("alamid-schema");

var Panda = new Schema("Panda", {
    name: String,
    age: {
        type: Number,
        required: true,
        writable: false,
        readable: true
    },
    mood: {
        type: String,
        enum: ["grumpy", "happy"]
    },
    birthday: Date
});
```

## Examples

### Schema Definition

You can define your schema with concrete values...

```javascript
var PandaSchema = new Schema({
    name: "panda",
    age: 12,
    friends: {
        type: []
    }
});
```

...or with abstract types...

```javascript
var PandaSchema = new Schema({
    name: String,
    age: Number,
    friends: {
        type: Array
    }
});
```

### Extend

Sometimes you want to extend your Schema and add new properties.


```javascript
var PandaSchema = new Schema({
    name: String,
    age: Number,
    friends: {
        type: Array
    }
});

var SuperPanda = PandaSchema.extend("SuperPanda", {
    xRay: true,
    canFly: {
        type: Boolean
    }
});
```

We have a superpanda now... which can fly and has xray eyes!
That's basically the same as...

```javascript
var SuperPanda = new Schema({
    name: String,
    age: Number,
    friends: {
        type: Array
    },
    xRay: true, //added
    canFly: {   //added
        type: Boolean
    }
});
```


__Overwriting properties__

If you define a property in the schema you are extending with, the extending schema takes precedence.


```javascript
var Animal = new Schema({
    name: String,
    age: String
});

var Panda = Animal.extend("Panda", {
    age: Number
    color: String
});
```

equals...

```javascript
var Panda = new Schema("Panda", {
    name: String,
    age: Number,   //overwritten
    color: String  //added
});
```

### Plugin: Validation

The validation plugins adds - *suprise!* - validation support.

```javascript
var Schema = require("alamid-schema");

Schema.use(require("alamid-schema/plugins/validation"));

var PandaSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 9,
        max: 99
    },
    mood: {
        type: String,
        enum: ["happy", "sleepy"]
    },
    treasures: {
        type: Array,
        minLength: 3
    },
    birthday: Date
});

var panda = {
    name: "Hugo",
    age: 3,
    mood: "happy"
};

PandaSchema.validate(panda, function(validation) {
    if (!validation.result) {
        console.log(validation.errors);
        return;
    }

    console.log("happy panda");
});
```

outputs...

```javascript
{
    result: false,
    errors: {
        age: [ 'min' ]
    }
}
```


_Included validators:_

- required
- min (works on Number)
- max (works on Number)
- enum
- minLength (works on String, Array)
- maxLength (works on String, Array)
- hasLength (works on String, Array)
- matches (performs a strict comparison, also accepts RegExp)

_Writing custom validators:_

You can write sync and async validators..

```javascript

// sync
function oldEnough(age) {
    return age > 18 || "too-young";
}

// async
function nameIsUnique(name, callback) {
    fs.readFile(__dirname + "/names.json", function(err, names) {
        if(err) {
            throw err;
        }

        names = JSON.parse(names);
        callback(names.indexOf(name) === -1 || "name-already-taken");
    });
}

var PandaSchema = new Schema({
    name: {
        type: String,
        required: true,
        validate: nameIsUnique
    },
    age: {
        type: Number,
        validate: oldEnough,
        max: 99
    }
});

var panda = {
    name: "hugo",
    age: 3,
    mood: "happy"
};

PandaSchema.validate(panda, function(validation) {
    if(!validation.result) {
        console.log(validation.errors);
        return;
    }
    console.log("happy panda");
});
```

outputs...


```javascript
{
    name: [ "name-already-taken" ],
    age:  [ "too-young" ]
}
```

_Note:_ validators will be called with `this` bound to `model`.

### Promises

The `validate()` method also returns a promise:

```javascript
PandaSchema.validate(panda)
	.then(function (validation) {
		...
	})
```

The promise will still be resolved even when the validation fails, because a failed validation is
not an error, it's an expected state. 

The promise provides a reference to the final validation result object. It contains the intermediate
result of all synchronous validators:

```javascript
var promise = PandaSchema.validate(panda);

if (promise.validation.result) {
    console.log("Synchronous validation of " + Object.keys(validation.errors) + " failed");
}
```

__Important notice:__ You must bring your own ES6 Promise compatible polyfill!

## API

### Core

#### Schema([name: String, ]definition: Object)

Creates a new schema.

#### .fields: Array

The array of property names that are defined on the schema. Do not modify this array.

#### .only(key1: Array|String[, key2: String, key3: String, ...]): Schema

Returns a subset with the given keys of the current schema. You may pass an array with keys or just the keys as arguments.

#### .extend([name: String, ]definition: Object): Schema

Creates a new schema that inherits from the current schema. Field definitions are merged where appropriate.
If a definition conflicts with the parent definition, the child's definition supersedes.

#### .strip(model: Object)

Removes all properties from `model` that are not defined in `fields`. Will not remove properties that are inherited from the prototype.

### Readable & Writable fields

You can define readable and writable fields in the schema. By default, every field is read- and writable.

```javascript
var PandaSchema = new Schema({
    id: {
        type: Number,
        required: true,
        readable: true,
        writable: false
    },
    lastModified: {
        readable: true,
        writable: false
    }
};
```

#### .writableFields()

Returns an array containing the keys of all writable fields:

```javascript
PandaSchema.writableFields(); // ["name", "age", "mood", "treasures", "birthday"]
```

#### .writable()

Creates a new schema that contains only the writable fields:

```javascript
var PandaWritableSchema = PandaSchema.writable();
```

#### .readableFields()

Returns an array containing the keys of all readable fields:

```javascript
PandaSchema.readableFields(); // ["name", "age", "mood", "treasures", "birthday"]
```

#### .readable()

Creates a new schema that contains only the readable fields:

```javascript
var PandaReadableSchema = PandaSchema.readable();
```

### Plugin: Validation

#### .validate(model: Object[, callback: Function]): Promise

Validate given model using the schema definitions. Callback will be called/Promise will be fulfilled with a validation object with `result` (Boolean) and `errors` (Object) containing the error codes.

## Sponsors

[<img src="https://assets.peerigon.com/peerigon/logo/peerigon-logo-flat-spinat.png" width="150" />](https://peerigon.com)
