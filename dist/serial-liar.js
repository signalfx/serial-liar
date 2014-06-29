!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.serialLiar=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var internal = _dereq_('./internal'),
	constantSequence = internal.constantSequence,
	addSequences = internal.addSequences,
	substractSequences = internal.substractSequences,
	multiplySequences = internal.multiplySequences,
	divideSequences = internal.divideSequences,
	arrayFromSequence = internal.arrayFromSequence,
	compose = internal.compose;

function normalize (args){
	var sequences = Array.prototype.slice.call(args);
	return sequences.map(function (sequence){
		if(!isNaN(sequence)){
			return constantSequence(sequence);
		}

		return sequence;
	});
}

var generateApi = function (serial){
	var api = serial.next.bind(serial);
	api.add = serial.add.bind(serial);
	api.subtract = serial.subtract.bind(serial);
	api.sub = api.subtract;
	api.multiply = serial.multiply.bind(serial);
	api.mul = api.multiply;
	api.divide = serial.divide.bind(serial);
	api.div = api.divide;
	api.next = serial.next.bind(serial);
	api.map = serial.map.bind(serial);

	return api;
};

var Serial = module.exports = function (sequence){
	this.sequence = sequence;
	this.api = generateApi(this);
};

// Take a bunch of serials arguments, shift the current serial
// to the beginning and reduce them to make them to the current
// sequence
Serial.prototype._reduceHelper = function (reducer, sequences){
	sequences = normalize(sequences);
	sequences.unshift(this.sequence);
	this.sequence = reducer(sequences);
	
	return this.api;
};

Serial.prototype.add = function (){
	return this._reduceHelper(addSequences, arguments);
};

Serial.prototype.subtract = function (){
	return this._reduceHelper(substractSequences, arguments);
};

Serial.prototype.multiply = function (){
	return this._reduceHelper(multiplySequences, arguments);
};

Serial.prototype.divide = function (){
	return this._reduceHelper(divideSequences, arguments);
};

Serial.prototype.next = function (amount){
	if(!isNaN(amount)){
		return arrayFromSequence(this.sequence, amount);	
	}

	return this.sequence();
};

Serial.prototype.map = function (mapper){
	this.sequence = compose(mapper, this.sequence);
	return this.api;
};


},{"./internal":2}],2:[function(_dereq_,module,exports){
////////////////
// Sequences
function sequence (update, value){
	var first = true;

	return function step (){
		// First request should recieve the start value
		if (first){
			first = false;
			return value;
		}

		return value = update(value);
	};
}
exports.sequence = sequence;

function constantSequence (value){
	return function (){
		return value;
	};
}
exports.constantSequence = constantSequence;


function arithmeticSequence (amount, start){
	function next (value){ 
		return value + amount; 
	}

	return sequence(next, start);
}
exports.arithmeticSequence = arithmeticSequence;

function geometricSequence (ratio, start){
	function next (value){
		return value * ratio; 
	}

	return sequence(next(ratio), start);
}
exports.geometricSequence = geometricSequence;

function cyclicSequence (pattern){
	var length = pattern.length,
		index = 0;

	return function (){
		index = index % length;
		return pattern[index++];
	};
}
exports.cyclicSequence = cyclicSequence;

////////////////////
// Random sequences
var random = Math.random;

function randomSequence (){
	return random;
}
exports.randomSequence = randomSequence;

function randomWalkSequence (start){
	function next (current){
		var direction = (random() > 0.5) ? -1 : 1;
		return current += random() * direction;
	}

	return sequence(next, start);
}
exports.randomWalkSequence = randomWalkSequence;

/////////////////////////////
// Multi-sequence operations
function addSequences (sequences){
	return function (){
		var index = sequences.length;
		if(!index) return;

		var result = 0;

		while(index--) result += sequences[index]();
		
		return result;
	};
}
exports.addSequences = addSequences;

function subtractSequences (sequences){
	return function (){
		var length = sequences.length;
		if(!length) return;

		var	index = 1,
			result = sequences[0]();

		while(index < length) result -= sequences[index++]();
		
		return result;
	};
}
exports.subtractSequences = subtractSequences;

function multiplySequences (sequences){
	return function (){
		var length = sequences.length;
		if(!length) return;

		var	index = 1,
			result = sequences[0]();

		while(index < length) result *= sequences[index++]();
		
		return result;
	};
}
exports.multiplySequences = multiplySequences;

function divideSequences (sequences){
	return function (){
		var length = sequences.length;
		if(!length) return;

		var	index = 1,
			result = sequences[0]();

		while(index < length) result /= sequences[index++]();
		
		return result;
	};
}
exports.divideSequences = divideSequences;

function sequenceArray (sequences){
	return function (){
		var length = sequences.length;
		if(!length) return;
		
		var index = 0,
			result = new Array(length);

		while(index < length) result[index++] = sequences[index]();

		return result;
	};
}
exports.sequenceArray = sequenceArray;

function compose (outer, inner){
	return function (){
		return outer(inner());
	};
}
exports.compose = compose;

function arrayFromSequence (sequence, length){
	var array = new Array(length),
		index = 0;
	
	while(index < length) array[index++] = sequence();

	return array;
}
exports.arrayFromSequence = arrayFromSequence;
},{}],3:[function(_dereq_,module,exports){
var Serial = _dereq_('./Serial'),
	internal = _dereq_('./internal');

function createSerial (sequence){
	var serial = new Serial(sequence);
	return serial.api;
}

exports.constant = function(value){
	return createSerial(internal.constantSequence(value));
};

exports.arithmetic = function (amount, start){
	if (amount === undefined) amount = 1;
	if (start === undefined) start = 0;

	return createSerial(internal.arithmeticSequence(amount, start));
};

exports.geometric = function (ratio, start){
	if (ratio === undefined) ratio = 2;
	if (start === undefined) start = 1;

	return createSerial(internal.geometricSequence(ratio, start));
};

exports.cyclic = function (pattern){
	pattern = pattern || [0, 1];

	return createSerial(internal.cyclicSequence(pattern));
};

exports.randomWalk = function (start){
	if (start === undefined) start = 0;
	
	return createSerial(internal.randomWalkSequence(start));
};

exports.random = function (){
	return internal.randomSequence;
};

},{"./Serial":1,"./internal":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJjOlxcVXNlcnNcXG96YW5cXHdvcmtzcGFjZVxcc2VyaWFsLWxpYXJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9zZXJpYWwtbGlhci9zcmMvanMvU2VyaWFsLmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2Uvc2VyaWFsLWxpYXIvc3JjL2pzL2ludGVybmFsLmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2Uvc2VyaWFsLWxpYXIvc3JjL2pzL21vZHVsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBpbnRlcm5hbCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwnKSxcclxuXHRjb25zdGFudFNlcXVlbmNlID0gaW50ZXJuYWwuY29uc3RhbnRTZXF1ZW5jZSxcclxuXHRhZGRTZXF1ZW5jZXMgPSBpbnRlcm5hbC5hZGRTZXF1ZW5jZXMsXHJcblx0c3Vic3RyYWN0U2VxdWVuY2VzID0gaW50ZXJuYWwuc3Vic3RyYWN0U2VxdWVuY2VzLFxyXG5cdG11bHRpcGx5U2VxdWVuY2VzID0gaW50ZXJuYWwubXVsdGlwbHlTZXF1ZW5jZXMsXHJcblx0ZGl2aWRlU2VxdWVuY2VzID0gaW50ZXJuYWwuZGl2aWRlU2VxdWVuY2VzLFxyXG5cdGFycmF5RnJvbVNlcXVlbmNlID0gaW50ZXJuYWwuYXJyYXlGcm9tU2VxdWVuY2UsXHJcblx0Y29tcG9zZSA9IGludGVybmFsLmNvbXBvc2U7XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemUgKGFyZ3Mpe1xyXG5cdHZhciBzZXF1ZW5jZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKTtcclxuXHRyZXR1cm4gc2VxdWVuY2VzLm1hcChmdW5jdGlvbiAoc2VxdWVuY2Upe1xyXG5cdFx0aWYoIWlzTmFOKHNlcXVlbmNlKSl7XHJcblx0XHRcdHJldHVybiBjb25zdGFudFNlcXVlbmNlKHNlcXVlbmNlKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc2VxdWVuY2U7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBnZW5lcmF0ZUFwaSA9IGZ1bmN0aW9uIChzZXJpYWwpe1xyXG5cdHZhciBhcGkgPSBzZXJpYWwubmV4dC5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLmFkZCA9IHNlcmlhbC5hZGQuYmluZChzZXJpYWwpO1xyXG5cdGFwaS5zdWJ0cmFjdCA9IHNlcmlhbC5zdWJ0cmFjdC5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLnN1YiA9IGFwaS5zdWJ0cmFjdDtcclxuXHRhcGkubXVsdGlwbHkgPSBzZXJpYWwubXVsdGlwbHkuYmluZChzZXJpYWwpO1xyXG5cdGFwaS5tdWwgPSBhcGkubXVsdGlwbHk7XHJcblx0YXBpLmRpdmlkZSA9IHNlcmlhbC5kaXZpZGUuYmluZChzZXJpYWwpO1xyXG5cdGFwaS5kaXYgPSBhcGkuZGl2aWRlO1xyXG5cdGFwaS5uZXh0ID0gc2VyaWFsLm5leHQuYmluZChzZXJpYWwpO1xyXG5cdGFwaS5tYXAgPSBzZXJpYWwubWFwLmJpbmQoc2VyaWFsKTtcclxuXHJcblx0cmV0dXJuIGFwaTtcclxufTtcclxuXHJcbnZhciBTZXJpYWwgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXF1ZW5jZSl7XHJcblx0dGhpcy5zZXF1ZW5jZSA9IHNlcXVlbmNlO1xyXG5cdHRoaXMuYXBpID0gZ2VuZXJhdGVBcGkodGhpcyk7XHJcbn07XHJcblxyXG4vLyBUYWtlIGEgYnVuY2ggb2Ygc2VyaWFscyBhcmd1bWVudHMsIHNoaWZ0IHRoZSBjdXJyZW50IHNlcmlhbFxyXG4vLyB0byB0aGUgYmVnaW5uaW5nIGFuZCByZWR1Y2UgdGhlbSB0byBtYWtlIHRoZW0gdG8gdGhlIGN1cnJlbnRcclxuLy8gc2VxdWVuY2VcclxuU2VyaWFsLnByb3RvdHlwZS5fcmVkdWNlSGVscGVyID0gZnVuY3Rpb24gKHJlZHVjZXIsIHNlcXVlbmNlcyl7XHJcblx0c2VxdWVuY2VzID0gbm9ybWFsaXplKHNlcXVlbmNlcyk7XHJcblx0c2VxdWVuY2VzLnVuc2hpZnQodGhpcy5zZXF1ZW5jZSk7XHJcblx0dGhpcy5zZXF1ZW5jZSA9IHJlZHVjZXIoc2VxdWVuY2VzKTtcclxuXHRcclxuXHRyZXR1cm4gdGhpcy5hcGk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICgpe1xyXG5cdHJldHVybiB0aGlzLl9yZWR1Y2VIZWxwZXIoYWRkU2VxdWVuY2VzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxuU2VyaWFsLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uICgpe1xyXG5cdHJldHVybiB0aGlzLl9yZWR1Y2VIZWxwZXIoc3Vic3RyYWN0U2VxdWVuY2VzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxuU2VyaWFsLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICgpe1xyXG5cdHJldHVybiB0aGlzLl9yZWR1Y2VIZWxwZXIobXVsdGlwbHlTZXF1ZW5jZXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLmRpdmlkZSA9IGZ1bmN0aW9uICgpe1xyXG5cdHJldHVybiB0aGlzLl9yZWR1Y2VIZWxwZXIoZGl2aWRlU2VxdWVuY2VzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxuU2VyaWFsLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKGFtb3VudCl7XHJcblx0aWYoIWlzTmFOKGFtb3VudCkpe1xyXG5cdFx0cmV0dXJuIGFycmF5RnJvbVNlcXVlbmNlKHRoaXMuc2VxdWVuY2UsIGFtb3VudCk7XHRcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aGlzLnNlcXVlbmNlKCk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChtYXBwZXIpe1xyXG5cdHRoaXMuc2VxdWVuY2UgPSBjb21wb3NlKG1hcHBlciwgdGhpcy5zZXF1ZW5jZSk7XHJcblx0cmV0dXJuIHRoaXMuYXBpO1xyXG59O1xyXG5cclxuIiwiLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBTZXF1ZW5jZXNcclxuZnVuY3Rpb24gc2VxdWVuY2UgKHVwZGF0ZSwgdmFsdWUpe1xyXG5cdHZhciBmaXJzdCA9IHRydWU7XHJcblxyXG5cdHJldHVybiBmdW5jdGlvbiBzdGVwICgpe1xyXG5cdFx0Ly8gRmlyc3QgcmVxdWVzdCBzaG91bGQgcmVjaWV2ZSB0aGUgc3RhcnQgdmFsdWVcclxuXHRcdGlmIChmaXJzdCl7XHJcblx0XHRcdGZpcnN0ID0gZmFsc2U7XHJcblx0XHRcdHJldHVybiB2YWx1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdmFsdWUgPSB1cGRhdGUodmFsdWUpO1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5zZXF1ZW5jZSA9IHNlcXVlbmNlO1xyXG5cclxuZnVuY3Rpb24gY29uc3RhbnRTZXF1ZW5jZSAodmFsdWUpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHJldHVybiB2YWx1ZTtcclxuXHR9O1xyXG59XHJcbmV4cG9ydHMuY29uc3RhbnRTZXF1ZW5jZSA9IGNvbnN0YW50U2VxdWVuY2U7XHJcblxyXG5cclxuZnVuY3Rpb24gYXJpdGhtZXRpY1NlcXVlbmNlIChhbW91bnQsIHN0YXJ0KXtcclxuXHRmdW5jdGlvbiBuZXh0ICh2YWx1ZSl7IFxyXG5cdFx0cmV0dXJuIHZhbHVlICsgYW1vdW50OyBcclxuXHR9XHJcblxyXG5cdHJldHVybiBzZXF1ZW5jZShuZXh0LCBzdGFydCk7XHJcbn1cclxuZXhwb3J0cy5hcml0aG1ldGljU2VxdWVuY2UgPSBhcml0aG1ldGljU2VxdWVuY2U7XHJcblxyXG5mdW5jdGlvbiBnZW9tZXRyaWNTZXF1ZW5jZSAocmF0aW8sIHN0YXJ0KXtcclxuXHRmdW5jdGlvbiBuZXh0ICh2YWx1ZSl7XHJcblx0XHRyZXR1cm4gdmFsdWUgKiByYXRpbzsgXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gc2VxdWVuY2UobmV4dChyYXRpbyksIHN0YXJ0KTtcclxufVxyXG5leHBvcnRzLmdlb21ldHJpY1NlcXVlbmNlID0gZ2VvbWV0cmljU2VxdWVuY2U7XHJcblxyXG5mdW5jdGlvbiBjeWNsaWNTZXF1ZW5jZSAocGF0dGVybil7XHJcblx0dmFyIGxlbmd0aCA9IHBhdHRlcm4ubGVuZ3RoLFxyXG5cdFx0aW5kZXggPSAwO1xyXG5cclxuXHRyZXR1cm4gZnVuY3Rpb24gKCl7XHJcblx0XHRpbmRleCA9IGluZGV4ICUgbGVuZ3RoO1xyXG5cdFx0cmV0dXJuIHBhdHRlcm5baW5kZXgrK107XHJcblx0fTtcclxufVxyXG5leHBvcnRzLmN5Y2xpY1NlcXVlbmNlID0gY3ljbGljU2VxdWVuY2U7XHJcblxyXG4vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4vLyBSYW5kb20gc2VxdWVuY2VzXHJcbnZhciByYW5kb20gPSBNYXRoLnJhbmRvbTtcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbVNlcXVlbmNlICgpe1xyXG5cdHJldHVybiByYW5kb207XHJcbn1cclxuZXhwb3J0cy5yYW5kb21TZXF1ZW5jZSA9IHJhbmRvbVNlcXVlbmNlO1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tV2Fsa1NlcXVlbmNlIChzdGFydCl7XHJcblx0ZnVuY3Rpb24gbmV4dCAoY3VycmVudCl7XHJcblx0XHR2YXIgZGlyZWN0aW9uID0gKHJhbmRvbSgpID4gMC41KSA/IC0xIDogMTtcclxuXHRcdHJldHVybiBjdXJyZW50ICs9IHJhbmRvbSgpICogZGlyZWN0aW9uO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHNlcXVlbmNlKG5leHQsIHN0YXJ0KTtcclxufVxyXG5leHBvcnRzLnJhbmRvbVdhbGtTZXF1ZW5jZSA9IHJhbmRvbVdhbGtTZXF1ZW5jZTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIE11bHRpLXNlcXVlbmNlIG9wZXJhdGlvbnNcclxuZnVuY3Rpb24gYWRkU2VxdWVuY2VzIChzZXF1ZW5jZXMpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHZhciBpbmRleCA9IHNlcXVlbmNlcy5sZW5ndGg7XHJcblx0XHRpZighaW5kZXgpIHJldHVybjtcclxuXHJcblx0XHR2YXIgcmVzdWx0ID0gMDtcclxuXHJcblx0XHR3aGlsZShpbmRleC0tKSByZXN1bHQgKz0gc2VxdWVuY2VzW2luZGV4XSgpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5hZGRTZXF1ZW5jZXMgPSBhZGRTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBzdWJ0cmFjdFNlcXVlbmNlcyAoc2VxdWVuY2VzKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24gKCl7XHJcblx0XHR2YXIgbGVuZ3RoID0gc2VxdWVuY2VzLmxlbmd0aDtcclxuXHRcdGlmKCFsZW5ndGgpIHJldHVybjtcclxuXHJcblx0XHR2YXJcdGluZGV4ID0gMSxcclxuXHRcdFx0cmVzdWx0ID0gc2VxdWVuY2VzWzBdKCk7XHJcblxyXG5cdFx0d2hpbGUoaW5kZXggPCBsZW5ndGgpIHJlc3VsdCAtPSBzZXF1ZW5jZXNbaW5kZXgrK10oKTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9O1xyXG59XHJcbmV4cG9ydHMuc3VidHJhY3RTZXF1ZW5jZXMgPSBzdWJ0cmFjdFNlcXVlbmNlcztcclxuXHJcbmZ1bmN0aW9uIG11bHRpcGx5U2VxdWVuY2VzIChzZXF1ZW5jZXMpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHZhciBsZW5ndGggPSBzZXF1ZW5jZXMubGVuZ3RoO1xyXG5cdFx0aWYoIWxlbmd0aCkgcmV0dXJuO1xyXG5cclxuXHRcdHZhclx0aW5kZXggPSAxLFxyXG5cdFx0XHRyZXN1bHQgPSBzZXF1ZW5jZXNbMF0oKTtcclxuXHJcblx0XHR3aGlsZShpbmRleCA8IGxlbmd0aCkgcmVzdWx0ICo9IHNlcXVlbmNlc1tpbmRleCsrXSgpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5tdWx0aXBseVNlcXVlbmNlcyA9IG11bHRpcGx5U2VxdWVuY2VzO1xyXG5cclxuZnVuY3Rpb24gZGl2aWRlU2VxdWVuY2VzIChzZXF1ZW5jZXMpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHZhciBsZW5ndGggPSBzZXF1ZW5jZXMubGVuZ3RoO1xyXG5cdFx0aWYoIWxlbmd0aCkgcmV0dXJuO1xyXG5cclxuXHRcdHZhclx0aW5kZXggPSAxLFxyXG5cdFx0XHRyZXN1bHQgPSBzZXF1ZW5jZXNbMF0oKTtcclxuXHJcblx0XHR3aGlsZShpbmRleCA8IGxlbmd0aCkgcmVzdWx0IC89IHNlcXVlbmNlc1tpbmRleCsrXSgpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5kaXZpZGVTZXF1ZW5jZXMgPSBkaXZpZGVTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBzZXF1ZW5jZUFycmF5IChzZXF1ZW5jZXMpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHZhciBsZW5ndGggPSBzZXF1ZW5jZXMubGVuZ3RoO1xyXG5cdFx0aWYoIWxlbmd0aCkgcmV0dXJuO1xyXG5cdFx0XHJcblx0XHR2YXIgaW5kZXggPSAwLFxyXG5cdFx0XHRyZXN1bHQgPSBuZXcgQXJyYXkobGVuZ3RoKTtcclxuXHJcblx0XHR3aGlsZShpbmRleCA8IGxlbmd0aCkgcmVzdWx0W2luZGV4KytdID0gc2VxdWVuY2VzW2luZGV4XSgpO1xyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fTtcclxufVxyXG5leHBvcnRzLnNlcXVlbmNlQXJyYXkgPSBzZXF1ZW5jZUFycmF5O1xyXG5cclxuZnVuY3Rpb24gY29tcG9zZSAob3V0ZXIsIGlubmVyKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24gKCl7XHJcblx0XHRyZXR1cm4gb3V0ZXIoaW5uZXIoKSk7XHJcblx0fTtcclxufVxyXG5leHBvcnRzLmNvbXBvc2UgPSBjb21wb3NlO1xyXG5cclxuZnVuY3Rpb24gYXJyYXlGcm9tU2VxdWVuY2UgKHNlcXVlbmNlLCBsZW5ndGgpe1xyXG5cdHZhciBhcnJheSA9IG5ldyBBcnJheShsZW5ndGgpLFxyXG5cdFx0aW5kZXggPSAwO1xyXG5cdFxyXG5cdHdoaWxlKGluZGV4IDwgbGVuZ3RoKSBhcnJheVtpbmRleCsrXSA9IHNlcXVlbmNlKCk7XHJcblxyXG5cdHJldHVybiBhcnJheTtcclxufVxyXG5leHBvcnRzLmFycmF5RnJvbVNlcXVlbmNlID0gYXJyYXlGcm9tU2VxdWVuY2U7IiwidmFyIFNlcmlhbCA9IHJlcXVpcmUoJy4vU2VyaWFsJyksXHJcblx0aW50ZXJuYWwgPSByZXF1aXJlKCcuL2ludGVybmFsJyk7XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVTZXJpYWwgKHNlcXVlbmNlKXtcclxuXHR2YXIgc2VyaWFsID0gbmV3IFNlcmlhbChzZXF1ZW5jZSk7XHJcblx0cmV0dXJuIHNlcmlhbC5hcGk7XHJcbn1cclxuXHJcbmV4cG9ydHMuY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSl7XHJcblx0cmV0dXJuIGNyZWF0ZVNlcmlhbChpbnRlcm5hbC5jb25zdGFudFNlcXVlbmNlKHZhbHVlKSk7XHJcbn07XHJcblxyXG5leHBvcnRzLmFyaXRobWV0aWMgPSBmdW5jdGlvbiAoYW1vdW50LCBzdGFydCl7XHJcblx0aWYgKGFtb3VudCA9PT0gdW5kZWZpbmVkKSBhbW91bnQgPSAxO1xyXG5cdGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSBzdGFydCA9IDA7XHJcblxyXG5cdHJldHVybiBjcmVhdGVTZXJpYWwoaW50ZXJuYWwuYXJpdGhtZXRpY1NlcXVlbmNlKGFtb3VudCwgc3RhcnQpKTtcclxufTtcclxuXHJcbmV4cG9ydHMuZ2VvbWV0cmljID0gZnVuY3Rpb24gKHJhdGlvLCBzdGFydCl7XHJcblx0aWYgKHJhdGlvID09PSB1bmRlZmluZWQpIHJhdGlvID0gMjtcclxuXHRpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkgc3RhcnQgPSAxO1xyXG5cclxuXHRyZXR1cm4gY3JlYXRlU2VyaWFsKGludGVybmFsLmdlb21ldHJpY1NlcXVlbmNlKHJhdGlvLCBzdGFydCkpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5jeWNsaWMgPSBmdW5jdGlvbiAocGF0dGVybil7XHJcblx0cGF0dGVybiA9IHBhdHRlcm4gfHwgWzAsIDFdO1xyXG5cclxuXHRyZXR1cm4gY3JlYXRlU2VyaWFsKGludGVybmFsLmN5Y2xpY1NlcXVlbmNlKHBhdHRlcm4pKTtcclxufTtcclxuXHJcbmV4cG9ydHMucmFuZG9tV2FsayA9IGZ1bmN0aW9uIChzdGFydCl7XHJcblx0aWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHN0YXJ0ID0gMDtcclxuXHRcclxuXHRyZXR1cm4gY3JlYXRlU2VyaWFsKGludGVybmFsLnJhbmRvbVdhbGtTZXF1ZW5jZShzdGFydCkpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5yYW5kb20gPSBmdW5jdGlvbiAoKXtcclxuXHRyZXR1cm4gaW50ZXJuYWwucmFuZG9tU2VxdWVuY2U7XHJcbn07XHJcbiJdfQ==
(3)
});
;