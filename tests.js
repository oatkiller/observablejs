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
	},

	'on has a multiple listener signature. options can be passed, including scope and single. options on top level are default' : function () {
		var o = new Observable(),
			firstEventCount = 0,
			secondEventCount = 0,
			thirdEventCount = 0,
			scope = {},
			secondScope = {},
			firstEventPayload = {},
			secondEventPayload = {},
			thirdEventPayload = {};

		o.on({
			firstEvent : function (payload) {
				Assert(this === scope,'first event called in wrong scope');
				Assert(payload === firstEventPayload,'first payload wrong');
				firstEventCount++;
			},
			secondEvent : {
				fn : function (payload) {
					Assert(this === secondScope,'second scope wrong');
					Assert(payload === secondEventPayload,'second payload wrong');
					secondEventCount++;
				},
				scope : secondScope
			},
			thirdEvent : {
				fn : function (payload) {
					Assert(this === scope,'third scope wrong');
					Assert(payload === thirdEventPayload,'third payload wrong');
					thirdEventCount++;
				},
				single : true
			},
			scope : scope
		});

		o.fireEvent('firstEvent',firstEventPayload);
		Assert(firstEventCount === 1,'first event count wrong');

		o.fireEvent('secondEvent',secondEventPayload);
		Assert(secondEventCount === 1,'second event count wrong');

		o.fireEvent('thirdEvent',thirdEventPayload);
		Assert(thirdEventCount === 1,'third event count wrong');

		// this one is a single
		o.fireEvent('thirdEvent',thirdEventPayload);
		Assert(thirdEventCount === 1,'third event count wrong second time');

	},

	'debounce works' : function () {
		var o = new Observable(),
			eventName = 'fire',
			scope = {},
			time = 30,
			callCount = 0,
			expectedPayload = {},
			timeout,
			cancel = function () {
				clearTimeout(timeout);
			}

		o.on(eventName,function (payload) {
			callCount++;
			Assert(this === scope);
			Assert(payload === expectedPayload);
		},scope,{
			debounce : time
		});

		o.fireEvent(eventName,expectedPayload);
		Assert(callCount === 0,'event fired regardless of debounce');

		timeout = setTimeout(function () {
			Assert(callCount === 0,'event fired regardless of debounce');
			o.fireEvent(eventName,expectedPayload);
			Assert(callCount === 0,'event fired regardless of debounce');
			timeout = setTimeout(function () {
				Assert(callCount === 0,'event fired regardless of debounce');
				timeout = setTimeout(function () {
					Assert(callCount === 1,'event didnt debounce when expected');
					timeout = setTimeout(function () {
						Assert(callCount === 1,'event debounced twice');
						Resume();
					},time);
				},20);
			},time - 10);
		},time - 10);

		Wait(cancel,200,'Debounce failed');
	},

	'docs' : function () {
		// Subclass or instantiate Observable
		var Door = Observable.subclass({
			open : function () {
				this.fireEvent('open');
			},
			close : function () {
				this.fireEvent('close');
			}
		});

		var door = new Door();

		// use 'on' to register to these events
		door.on('open',function () {
			console.log('Close the door! Its cold!');
		});

		door.on('close',function () {
			console.log('Open the door, its hot in here!');
		});

		// If you override the constructor, call the super constructor
		var Cat = Observable.subclass({
			constructor : function (color) {
				this.color = color;
				// call the Observable constructor
				this.uber(arguments);
			},
			sleep : function (howLong) {
				// pass any number of extra arguments to fireEvent
				this.fireEvent('sleep',howLong);
			},
			eat : function (food) {
				// pass any number of extra arguments to fireEvent
				this.fireEvent('eat',food);
			}
		});

		var cat = new Cat();

		var house = {
			address : '1234 Gumdrop Lane',
			cat : cat
		};

		// extra arguments are passed to handlers
		cat.on('sleep',function (howLong) {
			console.debug('Cat is sleeping for ' + howLong + ' hours at ' + this.address);
			// the third argument to 'on' is scope
			// 'this' will be house inside of the handler
		},house);


		// store the handler and scope in order to remove a listener
		var handler = function () {
			console.debug('Sleeping now');
		},
			scope = house;

		// add a listener
		cat.on('sleep',handler,scope);

		// call 'un' to remove it
		cat.un('sleep',handler,scope);
	}

});
suite.run();
