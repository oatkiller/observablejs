this['git://github.com/oatkiller/testingjs.git']();
var runner = new Runner();

var suite = new Suite({
	runner : runner,

	setUp : function () {
	},

	tearDown : function () {
	},

	'a function added with on with scope to an event will be called with scope and passed payload when the associated event is fired' : function () {
		var o = new Observable(),
			scope = {},
			payload = {},
			payloadTwo = {},
			callCount = 0,
			eventName = 'eventName';

		o.on(eventName,function (passedPayload,passedPayloadTwo) {
			callCount++;
			Assert(this === scope && passedPayload === payload && passedPayloadTwo === payloadTwo,'fails');
		},scope);
		o.fireEvent(eventName,payload,payloadTwo);
		Assert(callCount === 1,'didnt call?');
	},

	'un takes the same params as on in the single fn signature, but removes the listener.' : function () {
		var o = new Observable(),
			callCount = 0,
			eventName = 'eventName',
			handler = function () {
				callCount++;
			},
			scope = {};

		o.on(eventName,handler,scope);

		o.un(eventName,handler,scope);

		o.fireEvent(eventName);

		Assert(callCount === 0,'un failed');
	}

});
suite.run();
