var Observable = function () {
	this.listeners = {};
};
Observable.prototype = {
	constructor : Observable,

	on : function (eventName,callback,scope) {
		var listeners = this.getListenersByEventName(eventName);
		listeners.push({
			callback : callback,
			scope : scope
		});
	},

	un : function (eventName,callback,scope) {
		var listeners = this.getListenersByEventName(eventName),
			i = 0,
			listener,
			newEventListeners = [];

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			if (listener.callback !== callback || listener.scope !== scope) {
				newEventListeners.push(listener);
			}
		}
		this.listeners[eventName] = newEventListeners;
	},
	
	getListenersByEventName : function (eventName) {
		return this.listeners.hasOwnProperty(eventName) ? this.listeners[eventName] : (this.listeners[eventName] = []);
	},
	
	slice : Array.prototype.slice,

	fireEvent : function (eventName) {
		var listeners = this.getListenersByEventName(eventName),
			i = 0,
			listener,
			payload = this.slice.call(arguments,1);

		for (; i < listeners.length; i++) {
			listener = listeners[i];
			listener.callback.apply(listener.scope,payload);
		}
	}

};
