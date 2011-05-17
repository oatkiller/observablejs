var Observable = function () {
	this.listeners = {};
};
Observable.prototype = {
	constructor : Observable,

	getSingleSignaturesFromMultiSignature : function (config) {
		var fn,
			options,
			scope = config.scope,
			defaultOptions = {
				single : config.single,
				debounce : config.debounce
			},
			signatures = [];

		for (var property in config) {
			if (property !== 'single' && property !== 'scope' && property !== 'debounce') {
				if (typeof config[property] === 'function') {
					fn = config[property];
				} else if (config[property].fn && typeof config[property].fn === 'function') {
					fn = config[property].fn;

					options = {
						single : config[property].single !== undefined ? config[property].single : defaultOptions.single,
						debounce : config[property].debounce !== undefined ? config[property].debounce : defaultOptions.debounce,
						scope : config[property].scope !== undefined ? config[property].scope : scope
					};

				} else {
					throw new TypeError('handler not found.');
				}

				// its not a config, so its an event name
				signatures.push([
					property,
					fn,
					options && options.scope !== undefined ? options.scope : scope,
					options || defaultOptions
				]);
			}
		}
		return signatures;
	},

	on : function (eventName,fn,scope,options) {
		// handle config signature
		if (typeof eventName === 'object' && arguments.length === 1) {
			var signatures = this.getSingleSignaturesFromMultiSignature(eventName);
			for (var i = 0; i < signatures.length; i++) {
				arguments.callee.apply(this,signatures[i]);
			}
		} else {
			if (this.hasListener.apply(this,arguments)) {
				throw new Error('Trying to add an already added listener.');
			}
			
			// handle normal signature
			var listeners = this.getListenersByEventName(eventName);
			listeners.push({
				fn : fn,
				scope : scope,
				single : options ? options.single : undefined,
				debounce : options ? options.debounce : undefined
			});
		}
	},

	hasListener : function (eventName,fn,scope,options) {
		var listeners = this.getListenersByEventName(eventName),
			listener,
			i = 0;
		for (; i < listeners.length; i++) {
			listener = listeners[i];
			if (listener.fn === fn && listener.scope === scope && (listener.single === undefined || (options && listener.single === options.single)) && (listener.debounce === undefined || (options && listener.debounce === options.debounce))) {
				return true;
			}
		}
	},

	un : function (eventName,fn,scope,options) {
		if (typeof eventName === 'object' && arguments.length === 1) {
			var signatures = this.getSingleSignaturesFromMultiSignature(eventName);
			for (var i = 0; i < signatures.length; i++) {
				arguments.callee.apply(this,signatures[i]);
			}
		} else {
			var listeners = this.getListenersByEventName(eventName),
				i = 0,
				listener;

			for (; i < listeners.length; i++) {
				listener = listeners[i];
				if (listener.fn === fn && listener.scope === scope && (!options || options.single === listener.single) && (!options || options.debounce === listener.debounce)) {
					// remove this listener
					this.removeListener(eventName,listener,i);
					return;
				}
			}
		}
	},

	removeListener : function (eventName,listener,i) {
		var listeners = this.getListenersByEventName(eventName);
		if (i === undefined || listeners[i] !== listener) {
			for (var j = 0; j < listeners.length; j++) {
				if (listeners[j] === listener) {
					i = j;
					break;
				}
			}
			throw new Error('cant find listener.');
		}
		listener.debounceTimeout && clearTimeout(debounceTimeout);
		listeners.splice(i,1);
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
			if (listener.debounce !== undefined) {
				clearTimeout(listener.debounceTimeout);
				listener.debounceTimeout = setTimeout(function () {
					delete listener.debounceTimeout;
					listener.fn.apply(listener.scope,payload);
					listener.single && self.removeListener(eventName,listener,i);
				},listener.debounce);
			} else {
				listener.fn.apply(listener.scope,payload);
				listener.single && this.removeListener(eventName,listener,i);
			}
		}
	}
};
