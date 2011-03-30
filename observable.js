Observable = function (initializer) {
	this.listeners = {};
	typeof initializer !== 'undefined' && initializer.hasOwnProperty('listeners') && this.on(initializer.listeners);
};

Observable.prototype = {
	constructor : Observable,
	getListenerCollectionByEventName : function (eventName) {
		return this.listeners.hasOwnProperty(eventName) ? this.listeners[eventName] : (this.listeners[eventName] = []);
	},
	on : function (eventName,fn,scope,options) {
		// determine which signature is being called
		if (arguments.length === 1) {
			var initializer = eventName,
				scopeProperty = 'scope',
				optionsProperty = 'options',
				listeners = [],
				scope = initializer[scopeProperty],
				options = initializer[optionsProperty];
			
			for (var propertyName in initializer) {
				if (initializer.hasOwnProperty(propertyName) && propertyName !== scopeProperty && propertyName !== optionsProperty) {
					// treat as a listener
					listeners.push({
						eventName : propertyName,
						fn : initializer[propertyName]
					});
				}
			}

			for (var i = 0; i < listeners.length; i++) {
				var listener = listeners[i];
				this.on(listener.eventName,listener.fn,scope,options);
			}

		} else if (arguments.length >= 2 && arguments.length <= 4) {
			this.getListenerCollectionByEventName(eventName).push(new this.Listener(fn,scope,options));
		} else {
			throw new Error('Wrong number of arguments');
		}
	},
	un : function (listener) {
		throw new Error('not implemented');
	},
	purge : function (eventName) {
		throw new Error('not implemented');
	},
	fireEvent : function (payload) {
		var listeners = this.getListenerCollectionByEventName(eventName);
		var map = [];
		listeners.each(function (listener) {
			var result = listener.callback();
			if (listener.remove === true) {
				this.un(listener);
			}
			if (result === false) {
				return false;
			} else {
				map.push(result);
			}
		},this);

	},
	Listener : (function () {

		var Listener = function (fn,scope,options) {
			this.fn = fn;
			this.scope = scope;
			this.options = options;
		};

		Listener.prototype = {
			prototype : Listener,
			callback : function (payload) {
				if (this.options.single === true) {
					this.remove = true;
				}
				if (this.options.delay === true) {
					this.defer();
					return;
				}
				return this.fn.call(this.scope,payload);
			},
			defer : function () {
				this.callback.defer(0,this);
			}
		};

		return Listener;
	})()
};
