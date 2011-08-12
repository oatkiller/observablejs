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

	'on has a multiple listener signature. default scope can be passed at top level.' : function () {
		var o = new Observable(),
			firstEventCount = 0,
			secondEventCount = 0,
			thirdEventCount = 0,
			scope = {},
			secondScope = {},
			firstEventPayload = {},
			secondEventPayload = {};

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
			scope : scope
		});

		o.fireEvent('firstEvent',firstEventPayload);
		Assert(firstEventCount === 1,'first event count wrong');

		o.fireEvent('secondEvent',secondEventPayload);
		Assert(secondEventCount === 1,'second event count wrong');

	},

	'initial listeners works' : function () {
		var scope = {},
			expectedPayload = {},
			expectedStopPayload = {},
			stopScope = {},
			startCount = 0,
			stopCount = 0;

		var Subclass = Observable.subclass({
			listeners : {
				start : function (payload) {
					startCount++;
					Assert(payload === expectedPayload,'payload was wrong');
					Assert(this === scope,'scope was wrong');
				},
				stop : {
					fn : function (payload) {
						stopCount++;
						Assert(payload === expectedStopPayload,'payload was wrong');
						Assert(this === stopScope,'scope was wrong');
					},
					scope : stopScope
				},
				scope : scope
			}
		});

		var subclass = new Subclass();
		subclass.fireEvent('start',expectedPayload);
		subclass.fireEvent('stop',expectedStopPayload);
		Assert(startCount === 1,'start didnt handle');
		Assert(stopCount === 1,'stop didnt handle');
	},

	'get the returns of all listeners' : function () {
		var o = new Observable();
		o.on('event',function () {
			return false;
		});
		o.on('event',function () {
			return true;
		});
		var results = o.fireEvent('event');
		Assert(results[0] === false);
		Assert(results[1] === true);
	},

	'removeAllListenersForEvent works' : function () {
		var o = new Observable();
		var herp = {},
			herpCount = 0,
			derp = {},
			derpCount = 0;

		o.on({
			herp : {
				fn : function (payload) {
					herpCount++;
					Assert(payload === herp);
					Assert(this === herp);
				},
				scope : herp
			},
			derp : {
				fn : function (payload) {
					derpCount++;
					Assert(payload === derp);
					Assert(this === derp);
				},
				scope : derp
			}
		});

		o.fireEvent('herp',herp);
		o.fireEvent('derp',derp);
		Assert(herpCount === 1);
		Assert(derpCount === 1);

		o.removeAllListenersForEvent('herp');

		o.fireEvent('herp',herp);
		o.fireEvent('derp',derp);
		Assert(herpCount === 1);
		Assert(derpCount === 2);
	},

	'removeAllListeners works' : function () {
		var o = new Observable();
		var herp = {},
			herpCount = 0,
			derp = {},
			derpCount = 0;

		o.on({
			herp : {
				fn : function (payload) {
					herpCount++;
					Assert(payload === herp);
					Assert(this === herp);
				},
				scope : herp
			},
			derp : {
				fn : function (payload) {
					derpCount++;
					Assert(payload === derp);
					Assert(this === derp);
				},
				scope : derp
			}
		});

		o.fireEvent('herp',herp);
		o.fireEvent('derp',derp);
		Assert(herpCount === 1);
		Assert(derpCount === 1);

		o.removeAllListeners();

		o.fireEvent('herp',herp);
		o.fireEvent('derp',derp);
		Assert(herpCount === 1);
		Assert(derpCount === 1);
	},

	'removeAllListenersWithScope works' : function () {
		var first = {},
			second = {},
			third = {},
			count = 0,
			observable = new Observable();

		observable.on('herp',function () {count++;},first);
		observable.on('herp',function () {count++;},second);
		observable.on('herp',function () {count++;},third);

		observable.on('derp',function () {count++;},first);
		observable.on('derp',function () {count++;},second);
		observable.on('derp',function () {count++;},third);

		observable.on('skirp',function () {count++;},first);
		observable.on('skirp',function () {count++;},second);
		observable.on('skirp',function () {count++;},third);

		observable.removeAllListenersWithScope(second);
		Assert(observable.getListenersByEventName('herp').length === 2);
		Assert(observable.getListenersByEventName('derp').length === 2);
		Assert(observable.getListenersByEventName('skirp').length === 2);

		observable.fireEvent('herp');
		observable.fireEvent('derp');
		observable.fireEvent('skirp');
		Assert(count === 6);
	},

	'register with default listeners' : function () {
		var scope = {},
			expectedPayload = {},
			count = 0;

		var o = new (Observable.subclass({
			listeners : {
				event : function (payload) {
					Assert(this === scope,'scope wasnt passed');
					Assert(payload === expectedPayload,'payload wasnt passed');
					count++;
				},
				scope : scope
			}
		}))();

		o.fireEvent('event',expectedPayload);
		Assert(count === 1,'event wanst handled');
	},

	'unregister with the mutli-signature' : function () {
		var o = new Observable(),
			expectedPayload = {},
			scope = {},
			expectedPayloadTwo = {},
			scopeTwo = {},
			count = 0,
			countTwo = 0,
			config = {
				event : function (payload) {
					Assert(this === scope,'scope wasnt passed');
					Assert(payload === expectedPayload,'payload wasnt passed');
					count++;
				},
				eventTwo : {
					fn : function (payload) {
						Assert(this === scopeTwo,'scope wasnt passed');
						Assert(payload === expectedPayloadTwo,'payload wasnt passed');
						countTwo++;
					},
					scope : scopeTwo
				},
				scope : scope
			};

		o.on(config);

		o.fireEvent('event',expectedPayload);
		o.fireEvent('eventTwo',expectedPayloadTwo);

		Assert(count === 1,'event wasnt handled');
		Assert(countTwo === 1,'second event wasnt handled');

		o.un(config);

		o.fireEvent('event',expectedPayload);
		o.fireEvent('eventTwo',expectedPayloadTwo);

		Assert(count === 1,'event was handled after being unregistered');
		Assert(countTwo === 1,'second event was handled after being unregistered.');
	},

	'suspendEvents works' : function () {
		var o = new Observable(),
			eventName = 'event',
			scope = {},
			count = 0;

		o.on(eventName,function () {
			count++;
		},scope);

		o.fireEvent(eventName);

		Assert(count === 1);

		o.suspendEvents(eventName);

		o.fireEvent(eventName);

		Assert(count === 1);
	},

	'hasListeners works' : function () {
		var o = new Observable(),
			eventName = 'eventName',
			handler = function () {};

		Assert(o.hasListeners(eventName) === false);

		o.on(eventName,handler);

		Assert(o.hasListeners(eventName) === true);

		o.un(eventName,handler);

		Assert(o.hasListeners(eventName) === false);
	},

	'test' : function () {
		var o = new Observable(),
			aScope = {},
			bScope = {},
			cScope = {},
			aCount = 0,
			bCount = 0,
			cCount = 0,
			expectedPayload = {};

		o.on({
			a : {
				fn : function () {
					aCount++;
				},
				scope : aScope
			},
			b : {
				fn : function () {
					bCount++;
				},
				scope : bScope
			},
			c : function (payload) {
				cCount++;
				Assert(payload === expectedPayload);
				Assert(this === cScope,'scope was not passed to handler');
			},
			scope : cScope
		});

		o.fireEvent('c',expectedPayload);

		Assert(cCount === 1);
		Assert(aCount === 0);
		Assert(bCount === 0);
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

		// Add multiple event handlers at once
		var car = new Observable(),
			emergencyBreak = {
				turnOn : function () {}
			},
			gas = 1;

		car.on({
			stop : {
				fn : function () {
					this.turnOn();
				},
				// override scope like this
				scope : emergencyBreak
			},
			start : function () {
				gas--;
			},
			// scope at the top level is default
			scope : car
		});

		// Add listeners in the prototype of a subclass
		var flowers = {
			bloom : function () {}
		},
		snow = {
			fall : function () {}
		},
		Seasons = Observable.subclass({
			listeners : {
				spring : {
					fn : function () {
						this.bloom();
					},
					scope : flowers
				},
				winter : snow.fall,
				scope : snow
			}
		});

		// pause event handling with suspendEvents
		var widget = new Observable();

		// when you set x,
		widget.setX = function (x) {
			this.x = x;
			// fire a moved event to let the view know to update
			this.fireEvent('moved',this.x,this.y);
		};

		// do the same for setting y
		widget.setY = function (y) {
			this.y = y;
			// fire a moved event to let the view know to update
			this.fireEvent('moved',this.x,this.y);
		};

		widget.setPosition = function (x,y) {
			// set both x and y
			// this will fire two events
			// so first, pause the event
			this.suspendEvents('moved');
			this.setX(x);
			this.setY(y);

			// now resume events,
			this.resumeEvents('moved');

			// and fire the event just once
			this.fireEvent('moved',this.x,this.y);

		};

		var timesUpdated = 0;

		widget.on('moved',function () {
			// update the view
			timesUpdated++;
		});

		widget.setPosition(1,2);

		Assert(timesUpdated === 1,'suspendEvents didnt work');

		// Get the results of all handlers for an event
		var LandMine = new Observable(),
			Player = Function.klass({
				constructor : function (config) {
					this.health = config.health;
					this.location = config.location;
				},
				handleExplosion : function (location) {
					if (location.x === this.location.x && location.y === this.location.y) {
						this.health--;
						// report this
						return this;
					}
				}
			}),
			playerA = new Player({
				health : 5,
				location : {
					x : 4,
					y : 4
				}
			}),
			playerB = new Player({
				health : 8,
				location : {
					x : 7,
					y : 1
				}
			});

		LandMine.on('explode',playerA.handleExplosion,playerA);
		LandMine.on('explode',playerB.handleExplosion,playerB);

		var damagedPlayers = LandMine.fireEvent('explode',{x : 7, y : 1});

		Assert(damagedPlayers[0] === playerB);

		// conditional event firing
		// you might have to do extra calculation to fire an event
		// avoid those calculations if there are no listeners

		var Person = Function.klass({
			setBirthday : function (date) {
				if (this.birthday && date.getTime() !== this.birthday.getTime()) {
					this.birthday = date;
					if (this.hasListeners('newage')) {
						// only calculate the new age if a listener is going to use it
						// this is an alternate to memoizing getAge and still allows all listeners to only require one calculation of getAge
						this.fireEvent('newage',this.getAge(),this);
					}
				}
			},
			// age in milliseconds.
			getAge : function () {
				var now = new Date().getTime();
				return new Date().getTime() - now;
			}
		});
	}
});
suite.run();
