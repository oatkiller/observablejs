/**
 * Inherit from this class to have .on, .un, and .fireEvent. Use .on to register to an event. Use .fireEvent to notify registred instances of an event.
 * @class
 */
var Observable = function () {
	// if this was preconfigured with listeners, such as by a subclass
	if (typeof this.listeners === 'object') {
		// store those
		var initialListeners = this.listeners;
	}

	/**
	 * Listeners hash
	 * @private
	 * @property
	 * @type Object
	 */
	this.listeners = {};

	// register initial listeners
	initialListeners && this.on(initialListeners);
};

/** @lends Observable.prototype */
Observable.prototype = {
	constructor : Observable,

	/**
	 * Convert a config into multiple calls
	 * @private
	 * @method
	 * @param {Object} config
	 * @returns {Array[]} Array of argument arrays that can be used to call .on or .un multiple times
	 */
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

	/**
	 * Used to determine if a listener is already added
	 * @param {String} eventName
	 * @param {Function} fn
	 * @param {Object} [scope]
	 * @method
	 * @returns {Boolean} if a listener like this exists
	 */
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

	/**
	 * Calculate multiple calls from a single multi-handler argument. Calls the callee
	 * @private
	 * @param {Object} arguments
	 * @method
	 * @type {Boolean} Whether this handled the config
	 */
	handleMultipleSignature : function (args) {
		if (typeof args[0] === 'object' && args.length === 1) {
			var signatures = this.getSingleSignaturesFromMultiSignature(args[0]);
			for (var i = 0; i < signatures.length; i++) {
				args.callee.apply(this,signatures[i]);
			}
			return true;
		}
	},

	/**
	 * Use this to register to events
	 * @param {String|Object} eventName If eventName is a config, it may have properties as eventNames and values as functions as well as a special scope property for default scope. In addition, values may be objects with fn properties as handlers and scope properties that override the default top-level scope.
	 * @see <a href="https://github.com/oatkiller/observablejs">docs</a>
	 * @param {Function} fn
	 * @param {Object} [scope=observable instance]
	 * @method
	 * @returns {Observable} for chaining
	 */
	on : function (eventName,fn,scope) {
		// handle config signature
		if (this.handleMultipleSignature(arguments)) {
			return this;
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

		return this;
	},

	/**
	 * Use this unregister from events
	 * @param {String|Object} eventName If eventName is a config, it may have properties as eventNames and values as functions as well as a special scope property for default scope. In addition, values may be objects with fn properties as handlers and scope properties that override the default top-level scope.
	 * @param {Function} fn
	 * @param {Object} [scope=observable instance]
	 * @method
	 * @returns {Observable} for chaining
	 */
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

	/**
	 * Remove all listeners
	 * @param {String} [eventName] Optional to remove listeners of just one eventName instaed of all listeners
	 * @method
	 * @returns {Observable} self for chaining.
	 */
	removeAllListeners : function (eventName) {
		if (eventName) {
			this.getListenersByEventName(eventName).length = 0;
		} else {
			this.listeners = {};
		}
	},

	/**
	 * Get listener data for an eventName
	 * @param {String} eventName
	 * @private
	 * @method
	 * @returns {Object} Listener data for use in other methods
	 */
	getListenersByEventName : function (eventName) {
		return this.listeners.hasOwnProperty(eventName) ? this.listeners[eventName] : (this.listeners[eventName] = []);
	},
	
	/**
	 * @private
	 * Slice, from Array.prototype
	 */
	slice : Array.prototype.slice,

	/**
	 * Fire an event.
	 * @param {String} eventName
	 * @param {Object} [payload] Any number of payload args may be passed. They may be of any type.
	 * @returns {Observable} Returns self for chaining
	 * @method
	 */
	fireEvent : function (eventName) {
		var listeners = this.getListenersByEventName(eventName),
			i = 0,
			listener,
			payload = this.slice.call(arguments,1),
			result;

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			if (listener.fn.apply(listener.scope || this,payload) === false) {
				return false;
			}
		}
	}
};
