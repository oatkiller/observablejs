(function () {

	var Listener = function (stuff) {
		this.eventName = stuff.eventName;
		this.fn = stuff.fn;
		this.scope = typeof stuff.scope === 'object' ? stuff.scope : null;
		this.once = !!stuff.once;
	};

	Listener.prototype = {
		constructor : Listener,
		compare : function (otherListener) {
			return this.eventName === otherListener.eventName && this.fn === otherListener.fn && this.scope === otherListener.scope && this.once === otherListener.once;
		}
	};

	/**
	 * @private
	 * @method
	 * Gets an array of listeners from args, used by on and un.
	 * @returns {Listener[]} listeners
	 */
	Listener.getFromConfig = function (args) {
		if (typeof args[0] === 'object' && args.length === 1) {
			return this.getMultipleListenersFromConfig(args[0]);
		} else {
			return [new Listener({
				eventName : args[0],
				fn : args[1],
				scope : args[2],
				once : args[3] && args[3].once
			})];
		}
	};

	/**
	 * Convert a config into multiple listeners
	 * @private
	 * @method
	 * @param {Object} config
	 * @returns {Listener[]} Listeners
	 */
	Listener.getMultipleListenersFromConfig = function (config) {
		var fn,
			options,
			defaultScope = config.scope,
			defaultOnce = config.once,
			scope,
			once,
			listeners = [];

		for (var property in config) {
			if (property !== 'scope' && property !== 'once') {
				if (typeof config[property] === 'function') {
					fn = config[property];
				} else if (config[property].fn && typeof config[property].fn === 'function') {
					fn = config[property].fn;

					config[property].scope !== undefined && (scope = config[property].scope);
					config[property].once !== undefined && (once = config[property].once);

				} else {
					throw new TypeError('handler not found.');
				}

				listeners.push(new Listener({
					eventName : property,
					fn : fn,
					scope : scope || defaultScope,
					once : once || defaultOnce
				}));

				scope = once = undefined;
			}
		}

		return listeners;
	};

	/**
	 * Inherit from this class to have .on, .un, and .fireEvent. Use .on to register to an event. Use .fireEvent to notify registred instances of an event.
	 * @class
	 */
	Observable = function () {
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

		/**
		 * Holds names of suspended events
		 * @private
		 * @property
		 * @type Object
		 */
		this.suspendedEvents = {};

		// register initial listeners
		initialListeners && this.on(initialListeners);
	};

	/** @lends Observable.prototype */
	Observable.prototype = {
		constructor : Observable,

		// reference to Listener constructor
		Listener : Listener,

		/**
		 * Used to determine if a listener is already added
		 * @param {String} eventName
		 * @param {Function} fn
		 * @param {Object} [scope]
		 * @param {Object} [options]
		 * @method
		 * @returns {Boolean} if a listener like this exists
		 */
		hasListener : function (listener) {
			if (!(listener instanceof this.Listener)) {
				return arguments.callee.call(this,this.Listener.getFromConfig(arguments)[0]);
				// TODO make this take a second signature where the first arg is a Listener instance
			}

			var listeners = this.getListenersByEventName(listener.eventName),
				i = 0;

			for (; i < listeners.length; i++) {
				if (listener.compare(listeners[i])) {
					return true;
				}
			}
			return false;
		},
		
		hasListeners : function (eventName) {
			return this.getListenersByEventName(eventName).length > 0;
		},

		/**
		 * Use this to register to events
		 * @param {String|Object} eventName If eventName is a config, it may have properties as eventNames and values as functions as well as a special scope property for default scope. In addition, values may be objects with fn properties as handlers and scope properties that override the default top-level scope.
		 * @see <a href="https://github.com/oatkiller/observablejs">docs</a>
		 * @param {Function} fn
		 * @param {Object} [scope=observable instance]
		 * @param {Object} [options={}]
		 * @param {Boolean} [options.once=false]
		 * @method
		 * @returns {Observable} for chaining
		 */
		on : function (eventName,fn,scope,optiosn) {
			var listeners = Listener.getFromConfig(arguments);

			for (var i = 0; i < listeners.length; i++) {
				this.addListener(listeners[i]);
			}

			return this;
		},

		/**
		 * @private
		 * @method
		 * @param {Listener} listener to add
		 */
		addListener : function (listener) {
			if (this.hasListener(listener)) {
				throw new Error('Trying to add an already added listener.');
			}
			
			// handle normal signature
			var listeners = this.getListenersByEventName(listener.eventName);
			listeners.push(listener);
		},

		/**
		 * Use this unregister from events
		 * @param {String|Object} eventName If eventName is a config, it may have properties as eventNames and values as functions as well as a special scope property for default scope. In addition, values may be objects with fn properties as handlers and scope properties that override the default top-level scope.
		 * @param {Function} fn
		 * @param {Object} [scope=observable instance]
		 * @method
		 * @returns {Observable} for chaining
		 */
		un : function () {
			// TODO refactor to single loop with collector
			var listenersToRemove = Listener.getFromConfig(arguments);

			// for each listener to remove
			for (var i = 0; i < listenersToRemove.length; i++) {
				this.removeListener(listenersToRemove[i]);
			}
		},

		/** 
		 * @private
		 * @method
		 * @param {Listener} listener to be removed
		 */
		removeListener : function (listener) {
			var listeners = this.getListenersByEventName(listener.eventName);
			for (var i = 0; i < listeners.length; i++) {
				if (listener.compare(listeners[i])) {
					listeners.splice(i,1);
					return;
				}
			}
		},

		/**
		 * Suspend events for eventName until resumeEvents is called
		 * @param {String} eventName
		 * @method
		 */
		suspendEvents : function (eventName) {
			this.suspendedEvents[eventName] = true;
		},

		/**
		 * Resume events that were suspeneded with suspendEvents
		 * @param {String} eventName
		 */
		resumeEvents : function (eventName) {
			delete this.suspendedEvents[eventName];
		},

		/**
		 * Remove all listeners for an event type
		 * @param {String} eventName remove listeners of eventName
		 * @method
		 */
		removeAllListenersForEvent : function (eventName) {
			this.getListenersByEventName(eventName).length = 0;
		},

		/**
		 * Remove all listeners
		 * @method
		 */
		removeAllListeners : function () {
			this.listeners = {};
		},

		/**
		 * Remove all listeners that point to a scope
		 * @param {Object} scope remove listeners that point to this scope
		 * @method
		 */
		removeAllListenersWithScope : function (scope) {
			for (var eventName in this.listeners) {
				if (hasOwnProperty.call(this.listeners,eventName)) {
					var eventListeners = this.listeners[eventName];
					for (var i = 0; i < eventListeners.length; i++) {
						if (eventListeners[i].scope === scope) {
							eventListeners.splice(i--,1);
						}
					}
				}
			}
		},

		/**
		 * Get listener data for an eventName
		 * @param {String} eventName
		 * @private
		 * @method
		 * @returns {Array} Listeners for this eventName
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
			// dont fire suspended events
			if (this.suspendedEvents.hasOwnProperty(eventName)) {
				return;
			}

			var listeners = this.getListenersByEventName(eventName),
				i = 0,
				listener,
				payload = this.slice.call(arguments,1),
				result,
				results;

			for (; i < listeners.length; i++) {
				listener = listeners[i];
				if ((result = listener.fn.apply(listener.scope || this,payload)) !== undefined) {
					results = results || [];
					results.push(result);
				}
				if (listener.once) {
					this.removeListener(listener);
				}
			}
			return results;
		}
	};

	if (typeof module !== 'undefined') {
		module.exports = Observable;
	}
})();
