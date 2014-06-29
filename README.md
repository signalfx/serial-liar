# Fake number generators
A javascript library to generate infinite streams of numbers.

## Install
Three options:
* A prebuilt and minified file at `dist/serial-liar.js`
* `bower install serial-liar` 
* `npm install serial-liar`

## Example
```javascript
var serialLiar = require('serial-liar'); // not nescessary in browsers

var data = serialLiar.arithmetic(Math.PI * 2 / 25)
	.map(Math.sin)
	.add(serialLiar.randomWalk())
	.multiply(10);

var oneNumberFromSerial = data(); // or data.next();
var arrayOfNumbersFromSerial = data(100); // or data.next(100);
```

## API
```javascript

// CREATING SERIAL NUMBER GENERATOR
// A sequence which will always return 42
serial = serialLiar.constant(42);
serial(5); // [42, 42, 42, 42, 42]

// A sequence which adds 5 each time
serial = serialLiar.arithmetic(5, 1);
serial(5); // [1, 6, 11, 16, 21]

// A sequence which multiplies by 2 each time
serial = serialLiar.geometric(2, 1);
serial(5); // [1, 2, 4, 8, 16]


// A sequence which cycles on a given pattern
serial = serialLiar.cyclic([4, 8, 15, 16, 23, 42]);
serial(5); // [4, 8, 15, 16, 23]

// A random walk incrementing or decrementing between -1 and 1 randomly
// An optional start parameter can be provided
serial = serialLiar.randomWalk(0);
serial(5); // [0, 0.12, 0.2234, 1.20034, 0.50403]


// RETRIEVING NUMBERS
// Get the next number
serial(); // or serial.next();

// Get the next 1000 numbers as an array
serial(1000); // or serial.next(1000);



// MANIPULATING SERIAL NUMBER GENERATORS
// Add multiple serials together
serial.add(otherSerial, andAnotherSerial);

// Add 5 to all numbers coming out of this generator. This is exactly the
// same as serial.add(serialLiar.constant(5))
serial.add(5); 

// Multiply multiple serials together (in order, with the target serial being first).
// If the next numbers from these serials would have been 1 (serial), 2 (otherSerial)
// and 3 (andAnotherSerial), then the next call to the serial would result in 9.
serial.multiply(otherSerial, andAnotherSerial);

// Scale a serial, multiplying each result by 10. This is exactly the same as
// serial.multiply(serialLiar.multiply(10));
serial.multiply(10); // or serial.mul(10)

// Subtract, divide, and shorthands behave similar to .add and .multiply
serial.subtract(anotherSerial); // or serial.sub(anotherSerial)
serial.divide(5); // or serial.div(5)

// Transform the results coming out of a generator
serial.map(Math.sin);
```

## Developing
You'll need [Node.js](http://nodejs.org/) and Grunt (`npm install -g grunt-cli` after installing node) to develop this package.

```
git clone git@github.com:oztu/serial-liar.git
npm install
grunt dev
```

This will build the project, watch for changes to do rebuilds, and open a server listening on localhost:8000 where you can view the example as you develop.

## Credits
This was inspired by Alan Kang's project, dgen (https://github.com/akngs/dgen), which has a very similar feature set to this pacakge. I decided to rewrite the functionality because dgen required RequireJS, was written in TypeScript, and I found the interface clunky.
