var Observable = function () {
	// if this was preconfigured with listeners, such as by a subclass
	if (typeof this.listeners === 'object') {
		// store those
		var initialListeners = this.listeners;
	}

	// set the listeners hash
	this.listeners = {};

	// register initial listeners
	this.on(initialListeners);
};
Observable.prototype = {
	constructor : Observable,

	getSingleSignaturesFromMultiSignature : function (config) {
		var fn,
			options,
			defaultScope = config.scope,
			scope,
			signatures = [];

		for (var property in config) {
			if (property !== 'scope') {
				if (typeof config[property] === 'function') {
					fn = config[property];
				} else if (config[property].fn && typeof config[property].fn === 'function') {
					fn = config[property].fn;

					config[property].scope !== undefined && (scope = config[property].scope);

				} else {
					throw new TypeError('handler not found.');
				}

				// its not a config, so its an event name
				signatures.push([
					property,
					fn,
					scope || defaultScope
				]);
			}
		}
		return signatures;
	},

	hasListener : function (eventName,fn,scope) {
		var listeners = this.getListenersByEventName(eventName),
			listener,
			i = 0;

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			if (listener.fn === fn && listener.scope === scope) {
				return true;
			}
		}
	},

	handleMultipleSignature : function (args) {
		if (typeof args[0] === 'object' && args.length === 1) {
			var signatures = this.getSingleSignaturesFromMultiSignature(args[0]);
			for (var i = 0; i < signatures.length; i++) {
				args.callee.apply(this,signatures[i]);
			}
			return true;
		}
	},

	on : function (eventName,fn,scope) {
		// handle config signature
		if (this.handleMultipleSignature(arguments)) {
			return;
		}

		if (this.hasListener.apply(this,arguments)) {
			throw new Error('Trying to add an already added listener.');
		}
		
		// handle normal signature
		var listeners = this.getListenersByEventName(eventName);
		listeners.push({
			fn : fn,
			scope : scope
		});
	},

	un : function (eventName,fn,scope) {
		if (this.handleMultipleSignature(arguments)) {
			return;
		}

		var listeners = this.getListenersByEventName(eventName),
			i = 0,
			listener;

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			if (listener.fn === fn && listener.scope === scope) {
				// remove this listener
				listeners.splice(i,1);
				return;
			}
		}
	},

	getListenersByEventName : function (eventName) {
		return this.listeners.hasOwnProperty(eventName) ? this.listeners[eventName] : (this.listeners[eventName] = []);
	},
	
	slice : Array.prototype.slice,

	fireEvent : function (eventName) {
		var listeners = this.getListenersByEventName(eventName),
			i = 0,
			listener,
			payload = this.slice.call(arguments,1),
			self = this;

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			listener.fn.apply(listener.scope,payload);
		}
	}
};
