var util = require('util');
var EventEmitter = require('events').EventEmitter;

function QBox(steps) {
	
	var isReady = false;
	var queue = [];
	var isStop = false;
	var startingCallback;

	var ticks;
	var countingSteps = null;

	if(typeof(steps) == 'number') {
		//used for steps in a number
		countingSteps = steps;
	} else {
		//used for steps as an array
		addTicks(); //copy steps into ticks
	}

	this.ready = function(callback) {
		if(isReady && !isStop) {
			callback();
		} else {
			queue.push(callback);
		}
	};
	
	/**
		Start the QBox and execute all the callbacks in the queue
		and clear the queue
	*/
	this.start = function() {
		if(!isStop) {
			isReady = true;
			queue.forEach(function(callback) {
				callback();
			});
			queue = [];
			if(startingCallback) startingCallback();
		}
	};

	/**
		Add a single callback to call each and every time 
		Qbox starting (mostely used with reset())
	*/
	this.onStart = function(callback) {
		startingCallback = callback;
	};
	
	this.tick = function(step) {
		
		if(countingSteps != null) {
			countingSteps--;
			if(countingSteps == 0) {
				this.start();
			}
		} else if(ticks && ticks instanceof Array) {
			
			var index = ticks.indexOf(step);
			if(index >= 0) {
				
				ticks.splice(index, 1);
				if(ticks.length == 0) {
					this.start();
				}
			} else {
				
				throw new Error("Invalid step: '" + step + "' provided");
			}
		} else {
			throw new Error("Cannot tick - no steps are provided");
		}
	};
	
	/**
	 * @param amount - no of millies fot timeout
	 * callback - function([]){} containing remaining steps
	 */
	this.timeout = function(amount, callback) {
		
		if(!isStop) {
			setTimeout(function() {
				if(!isReady && !isStop) {
					callback(ticks);
				}
			}, amount);
		}
	};
	
	this.stop = function() {
		isStop = true;
	};

	/**
		Reset the QBOX and make is available to start again
		And does not clean callbacks in the queue and onStart Callback
	*/
	this.reset = function() {
		isReady = false;
		isStop = false;
		addTicks();
		if(countingSteps != null) {
			countingSteps = steps;
		}
	};

	function addTicks() {
		if(steps && steps.length > 0) {
			ticks = [];
			steps.forEach(function(tick) {
				ticks.push(tick);
			});
		}
	}
};

exports.create = function(steps) {
	return new QBox(steps);
};
