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
		return sequences.reduce(function(prev, curr, index){
			if (index === 1) return prev() + curr();

			return prev + curr();
		});
	};
}
exports.addSequences = addSequences;

function subtractSequences (sequences){
	return function (){
		return sequences.reduce(function(prev, curr, index){
			if (index === 1) return prev() - curr();

			return prev - curr();
		});
	};
}
exports.subtractSequences = subtractSequences;

function multiplySequences (sequences){
	return function (){
		return sequences.reduce(function(prev, curr, index){
			if (index === 1) return prev() * curr();
			
			return prev * curr();
		});
	};
}
exports.multiplySequences = multiplySequences;

function divideSequences (sequences){
	return function (){
		return sequences.reduce(function(prev, curr, index){
			if (index === 1) return prev() / curr();
			
			return prev / curr();
		});
	};
}
exports.divideSequences = divideSequences;

function sequenceArray (sequences){
	return function (){
		return sequences.map(function(sequence){
			return sequence();
		});
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
	var array = new Array(length);
	
	for (var index = 0; index < length; index++){
		array[index] = sequence();
	}

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJjOlxcVXNlcnNcXG96YW5cXHdvcmtzcGFjZVxcc2VyaWFsLWxpYXJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9zZXJpYWwtbGlhci9zcmMvanMvU2VyaWFsLmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2Uvc2VyaWFsLWxpYXIvc3JjL2pzL2ludGVybmFsLmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2Uvc2VyaWFsLWxpYXIvc3JjL2pzL21vZHVsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGludGVybmFsID0gcmVxdWlyZSgnLi9pbnRlcm5hbCcpLFxyXG5cdGNvbnN0YW50U2VxdWVuY2UgPSBpbnRlcm5hbC5jb25zdGFudFNlcXVlbmNlLFxyXG5cdGFkZFNlcXVlbmNlcyA9IGludGVybmFsLmFkZFNlcXVlbmNlcyxcclxuXHRzdWJzdHJhY3RTZXF1ZW5jZXMgPSBpbnRlcm5hbC5zdWJzdHJhY3RTZXF1ZW5jZXMsXHJcblx0bXVsdGlwbHlTZXF1ZW5jZXMgPSBpbnRlcm5hbC5tdWx0aXBseVNlcXVlbmNlcyxcclxuXHRkaXZpZGVTZXF1ZW5jZXMgPSBpbnRlcm5hbC5kaXZpZGVTZXF1ZW5jZXMsXHJcblx0YXJyYXlGcm9tU2VxdWVuY2UgPSBpbnRlcm5hbC5hcnJheUZyb21TZXF1ZW5jZSxcclxuXHRjb21wb3NlID0gaW50ZXJuYWwuY29tcG9zZTtcclxuXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoYXJncyl7XHJcblx0dmFyIHNlcXVlbmNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpO1xyXG5cdHJldHVybiBzZXF1ZW5jZXMubWFwKGZ1bmN0aW9uIChzZXF1ZW5jZSl7XHJcblx0XHRpZighaXNOYU4oc2VxdWVuY2UpKXtcclxuXHRcdFx0cmV0dXJuIGNvbnN0YW50U2VxdWVuY2Uoc2VxdWVuY2UpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBzZXF1ZW5jZTtcclxuXHR9KTtcclxufVxyXG5cclxudmFyIGdlbmVyYXRlQXBpID0gZnVuY3Rpb24gKHNlcmlhbCl7XHJcblx0dmFyIGFwaSA9IHNlcmlhbC5uZXh0LmJpbmQoc2VyaWFsKTtcclxuXHRhcGkuYWRkID0gc2VyaWFsLmFkZC5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLnN1YnRyYWN0ID0gc2VyaWFsLnN1YnRyYWN0LmJpbmQoc2VyaWFsKTtcclxuXHRhcGkuc3ViID0gYXBpLnN1YnRyYWN0O1xyXG5cdGFwaS5tdWx0aXBseSA9IHNlcmlhbC5tdWx0aXBseS5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLm11bCA9IGFwaS5tdWx0aXBseTtcclxuXHRhcGkuZGl2aWRlID0gc2VyaWFsLmRpdmlkZS5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLmRpdiA9IGFwaS5kaXZpZGU7XHJcblx0YXBpLm5leHQgPSBzZXJpYWwubmV4dC5iaW5kKHNlcmlhbCk7XHJcblx0YXBpLm1hcCA9IHNlcmlhbC5tYXAuYmluZChzZXJpYWwpO1xyXG5cclxuXHRyZXR1cm4gYXBpO1xyXG59O1xyXG5cclxudmFyIFNlcmlhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcXVlbmNlKXtcclxuXHR0aGlzLnNlcXVlbmNlID0gc2VxdWVuY2U7XHJcblx0dGhpcy5hcGkgPSBnZW5lcmF0ZUFwaSh0aGlzKTtcclxufTtcclxuXHJcbi8vIFRha2UgYSBidW5jaCBvZiBzZXJpYWxzIGFyZ3VtZW50cywgc2hpZnQgdGhlIGN1cnJlbnQgc2VyaWFsXHJcbi8vIHRvIHRoZSBiZWdpbm5pbmcgYW5kIHJlZHVjZSB0aGVtIHRvIG1ha2UgdGhlbSB0byB0aGUgY3VycmVudFxyXG4vLyBzZXF1ZW5jZVxyXG5TZXJpYWwucHJvdG90eXBlLl9yZWR1Y2VIZWxwZXIgPSBmdW5jdGlvbiAocmVkdWNlciwgc2VxdWVuY2VzKXtcclxuXHRzZXF1ZW5jZXMgPSBub3JtYWxpemUoc2VxdWVuY2VzKTtcclxuXHRzZXF1ZW5jZXMudW5zaGlmdCh0aGlzLnNlcXVlbmNlKTtcclxuXHR0aGlzLnNlcXVlbmNlID0gcmVkdWNlcihzZXF1ZW5jZXMpO1xyXG5cdFxyXG5cdHJldHVybiB0aGlzLmFwaTtcclxufTtcclxuXHJcblNlcmlhbC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKCl7XHJcblx0cmV0dXJuIHRoaXMuX3JlZHVjZUhlbHBlcihhZGRTZXF1ZW5jZXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKCl7XHJcblx0cmV0dXJuIHRoaXMuX3JlZHVjZUhlbHBlcihzdWJzdHJhY3RTZXF1ZW5jZXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLm11bHRpcGx5ID0gZnVuY3Rpb24gKCl7XHJcblx0cmV0dXJuIHRoaXMuX3JlZHVjZUhlbHBlcihtdWx0aXBseVNlcXVlbmNlcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcblNlcmlhbC5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKCl7XHJcblx0cmV0dXJuIHRoaXMuX3JlZHVjZUhlbHBlcihkaXZpZGVTZXF1ZW5jZXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5TZXJpYWwucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoYW1vdW50KXtcclxuXHRpZighaXNOYU4oYW1vdW50KSl7XHJcblx0XHRyZXR1cm4gYXJyYXlGcm9tU2VxdWVuY2UodGhpcy5zZXF1ZW5jZSwgYW1vdW50KTtcdFxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXMuc2VxdWVuY2UoKTtcclxufTtcclxuXHJcblNlcmlhbC5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKG1hcHBlcil7XHJcblx0dGhpcy5zZXF1ZW5jZSA9IGNvbXBvc2UobWFwcGVyLCB0aGlzLnNlcXVlbmNlKTtcclxuXHRyZXR1cm4gdGhpcy5hcGk7XHJcbn07XHJcblxyXG4iLCIvLy8vLy8vLy8vLy8vLy8vXHJcbi8vIFNlcXVlbmNlc1xyXG5mdW5jdGlvbiBzZXF1ZW5jZSAodXBkYXRlLCB2YWx1ZSl7XHJcblx0dmFyIGZpcnN0ID0gdHJ1ZTtcclxuXHJcblx0cmV0dXJuIGZ1bmN0aW9uIHN0ZXAgKCl7XHJcblx0XHQvLyBGaXJzdCByZXF1ZXN0IHNob3VsZCByZWNpZXZlIHRoZSBzdGFydCB2YWx1ZVxyXG5cdFx0aWYgKGZpcnN0KXtcclxuXHRcdFx0Zmlyc3QgPSBmYWxzZTtcclxuXHRcdFx0cmV0dXJuIHZhbHVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB2YWx1ZSA9IHVwZGF0ZSh2YWx1ZSk7XHJcblx0fTtcclxufVxyXG5leHBvcnRzLnNlcXVlbmNlID0gc2VxdWVuY2U7XHJcblxyXG5mdW5jdGlvbiBjb25zdGFudFNlcXVlbmNlICh2YWx1ZSl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uICgpe1xyXG5cdFx0cmV0dXJuIHZhbHVlO1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5jb25zdGFudFNlcXVlbmNlID0gY29uc3RhbnRTZXF1ZW5jZTtcclxuXHJcblxyXG5mdW5jdGlvbiBhcml0aG1ldGljU2VxdWVuY2UgKGFtb3VudCwgc3RhcnQpe1xyXG5cdGZ1bmN0aW9uIG5leHQgKHZhbHVlKXsgXHJcblx0XHRyZXR1cm4gdmFsdWUgKyBhbW91bnQ7IFxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHNlcXVlbmNlKG5leHQsIHN0YXJ0KTtcclxufVxyXG5leHBvcnRzLmFyaXRobWV0aWNTZXF1ZW5jZSA9IGFyaXRobWV0aWNTZXF1ZW5jZTtcclxuXHJcbmZ1bmN0aW9uIGdlb21ldHJpY1NlcXVlbmNlIChyYXRpbywgc3RhcnQpe1xyXG5cdGZ1bmN0aW9uIG5leHQgKHZhbHVlKXtcclxuXHRcdHJldHVybiB2YWx1ZSAqIHJhdGlvOyBcclxuXHR9XHJcblxyXG5cdHJldHVybiBzZXF1ZW5jZShuZXh0KHJhdGlvKSwgc3RhcnQpO1xyXG59XHJcbmV4cG9ydHMuZ2VvbWV0cmljU2VxdWVuY2UgPSBnZW9tZXRyaWNTZXF1ZW5jZTtcclxuXHJcbmZ1bmN0aW9uIGN5Y2xpY1NlcXVlbmNlIChwYXR0ZXJuKXtcclxuXHR2YXIgbGVuZ3RoID0gcGF0dGVybi5sZW5ndGgsXHJcblx0XHRpbmRleCA9IDA7XHJcblxyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdGluZGV4ID0gaW5kZXggJSBsZW5ndGg7XHJcblx0XHRyZXR1cm4gcGF0dGVybltpbmRleCsrXTtcclxuXHR9O1xyXG59XHJcbmV4cG9ydHMuY3ljbGljU2VxdWVuY2UgPSBjeWNsaWNTZXF1ZW5jZTtcclxuXHJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vXHJcbi8vIFJhbmRvbSBzZXF1ZW5jZXNcclxudmFyIHJhbmRvbSA9IE1hdGgucmFuZG9tO1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tU2VxdWVuY2UgKCl7XHJcblx0cmV0dXJuIHJhbmRvbTtcclxufVxyXG5leHBvcnRzLnJhbmRvbVNlcXVlbmNlID0gcmFuZG9tU2VxdWVuY2U7XHJcblxyXG5mdW5jdGlvbiByYW5kb21XYWxrU2VxdWVuY2UgKHN0YXJ0KXtcclxuXHRmdW5jdGlvbiBuZXh0IChjdXJyZW50KXtcclxuXHRcdHZhciBkaXJlY3Rpb24gPSAocmFuZG9tKCkgPiAwLjUpID8gLTEgOiAxO1xyXG5cdFx0cmV0dXJuIGN1cnJlbnQgKz0gcmFuZG9tKCkgKiBkaXJlY3Rpb247XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gc2VxdWVuY2UobmV4dCwgc3RhcnQpO1xyXG59XHJcbmV4cG9ydHMucmFuZG9tV2Fsa1NlcXVlbmNlID0gcmFuZG9tV2Fsa1NlcXVlbmNlO1xyXG5cclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cclxuLy8gTXVsdGktc2VxdWVuY2Ugb3BlcmF0aW9uc1xyXG5mdW5jdGlvbiBhZGRTZXF1ZW5jZXMgKHNlcXVlbmNlcyl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uICgpe1xyXG5cdFx0cmV0dXJuIHNlcXVlbmNlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyciwgaW5kZXgpe1xyXG5cdFx0XHRpZiAoaW5kZXggPT09IDEpIHJldHVybiBwcmV2KCkgKyBjdXJyKCk7XHJcblxyXG5cdFx0XHRyZXR1cm4gcHJldiArIGN1cnIoKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5hZGRTZXF1ZW5jZXMgPSBhZGRTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBzdWJ0cmFjdFNlcXVlbmNlcyAoc2VxdWVuY2VzKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24gKCl7XHJcblx0XHRyZXR1cm4gc2VxdWVuY2VzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyLCBpbmRleCl7XHJcblx0XHRcdGlmIChpbmRleCA9PT0gMSkgcmV0dXJuIHByZXYoKSAtIGN1cnIoKTtcclxuXHJcblx0XHRcdHJldHVybiBwcmV2IC0gY3VycigpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxufVxyXG5leHBvcnRzLnN1YnRyYWN0U2VxdWVuY2VzID0gc3VidHJhY3RTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBtdWx0aXBseVNlcXVlbmNlcyAoc2VxdWVuY2VzKXtcclxuXHRyZXR1cm4gZnVuY3Rpb24gKCl7XHJcblx0XHRyZXR1cm4gc2VxdWVuY2VzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyLCBpbmRleCl7XHJcblx0XHRcdGlmIChpbmRleCA9PT0gMSkgcmV0dXJuIHByZXYoKSAqIGN1cnIoKTtcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBwcmV2ICogY3VycigpO1xyXG5cdFx0fSk7XHJcblx0fTtcclxufVxyXG5leHBvcnRzLm11bHRpcGx5U2VxdWVuY2VzID0gbXVsdGlwbHlTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBkaXZpZGVTZXF1ZW5jZXMgKHNlcXVlbmNlcyl7XHJcblx0cmV0dXJuIGZ1bmN0aW9uICgpe1xyXG5cdFx0cmV0dXJuIHNlcXVlbmNlcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyciwgaW5kZXgpe1xyXG5cdFx0XHRpZiAoaW5kZXggPT09IDEpIHJldHVybiBwcmV2KCkgLyBjdXJyKCk7XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gcHJldiAvIGN1cnIoKTtcclxuXHRcdH0pO1xyXG5cdH07XHJcbn1cclxuZXhwb3J0cy5kaXZpZGVTZXF1ZW5jZXMgPSBkaXZpZGVTZXF1ZW5jZXM7XHJcblxyXG5mdW5jdGlvbiBzZXF1ZW5jZUFycmF5IChzZXF1ZW5jZXMpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHJldHVybiBzZXF1ZW5jZXMubWFwKGZ1bmN0aW9uKHNlcXVlbmNlKXtcclxuXHRcdFx0cmV0dXJuIHNlcXVlbmNlKCk7XHJcblx0XHR9KTtcclxuXHR9O1xyXG59XHJcbmV4cG9ydHMuc2VxdWVuY2VBcnJheSA9IHNlcXVlbmNlQXJyYXk7XHJcblxyXG5mdW5jdGlvbiBjb21wb3NlIChvdXRlciwgaW5uZXIpe1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKXtcclxuXHRcdHJldHVybiBvdXRlcihpbm5lcigpKTtcclxuXHR9O1xyXG59XHJcbmV4cG9ydHMuY29tcG9zZSA9IGNvbXBvc2U7XHJcblxyXG5mdW5jdGlvbiBhcnJheUZyb21TZXF1ZW5jZSAoc2VxdWVuY2UsIGxlbmd0aCl7XHJcblx0dmFyIGFycmF5ID0gbmV3IEFycmF5KGxlbmd0aCk7XHJcblx0XHJcblx0Zm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKyl7XHJcblx0XHRhcnJheVtpbmRleF0gPSBzZXF1ZW5jZSgpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGFycmF5O1xyXG59XHJcbmV4cG9ydHMuYXJyYXlGcm9tU2VxdWVuY2UgPSBhcnJheUZyb21TZXF1ZW5jZTsiLCJ2YXIgU2VyaWFsID0gcmVxdWlyZSgnLi9TZXJpYWwnKSxcclxuXHRpbnRlcm5hbCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwnKTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVNlcmlhbCAoc2VxdWVuY2Upe1xyXG5cdHZhciBzZXJpYWwgPSBuZXcgU2VyaWFsKHNlcXVlbmNlKTtcclxuXHRyZXR1cm4gc2VyaWFsLmFwaTtcclxufVxyXG5cclxuZXhwb3J0cy5jb25zdGFudCA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRyZXR1cm4gY3JlYXRlU2VyaWFsKGludGVybmFsLmNvbnN0YW50U2VxdWVuY2UodmFsdWUpKTtcclxufTtcclxuXHJcbmV4cG9ydHMuYXJpdGhtZXRpYyA9IGZ1bmN0aW9uIChhbW91bnQsIHN0YXJ0KXtcclxuXHRpZiAoYW1vdW50ID09PSB1bmRlZmluZWQpIGFtb3VudCA9IDE7XHJcblx0aWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHN0YXJ0ID0gMDtcclxuXHJcblx0cmV0dXJuIGNyZWF0ZVNlcmlhbChpbnRlcm5hbC5hcml0aG1ldGljU2VxdWVuY2UoYW1vdW50LCBzdGFydCkpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5nZW9tZXRyaWMgPSBmdW5jdGlvbiAocmF0aW8sIHN0YXJ0KXtcclxuXHRpZiAocmF0aW8gPT09IHVuZGVmaW5lZCkgcmF0aW8gPSAyO1xyXG5cdGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSBzdGFydCA9IDE7XHJcblxyXG5cdHJldHVybiBjcmVhdGVTZXJpYWwoaW50ZXJuYWwuZ2VvbWV0cmljU2VxdWVuY2UocmF0aW8sIHN0YXJ0KSk7XHJcbn07XHJcblxyXG5leHBvcnRzLmN5Y2xpYyA9IGZ1bmN0aW9uIChwYXR0ZXJuKXtcclxuXHRwYXR0ZXJuID0gcGF0dGVybiB8fCBbMCwgMV07XHJcblxyXG5cdHJldHVybiBjcmVhdGVTZXJpYWwoaW50ZXJuYWwuY3ljbGljU2VxdWVuY2UocGF0dGVybikpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5yYW5kb21XYWxrID0gZnVuY3Rpb24gKHN0YXJ0KXtcclxuXHRpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkgc3RhcnQgPSAwO1xyXG5cdFxyXG5cdHJldHVybiBjcmVhdGVTZXJpYWwoaW50ZXJuYWwucmFuZG9tV2Fsa1NlcXVlbmNlKHN0YXJ0KSk7XHJcbn07XHJcblxyXG5leHBvcnRzLnJhbmRvbSA9IGZ1bmN0aW9uICgpe1xyXG5cdHJldHVybiBpbnRlcm5hbC5yYW5kb21TZXF1ZW5jZTtcclxufTtcclxuIl19
(3)
});
;