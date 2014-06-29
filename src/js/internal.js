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