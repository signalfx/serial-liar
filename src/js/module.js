var Serial = require('./Serial'),
	internal = require('./internal');

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
