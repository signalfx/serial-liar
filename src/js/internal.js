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