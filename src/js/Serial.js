var internal = require('./internal'),
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

