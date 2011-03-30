this['git://github.com/oatkiller/testingjs.git']();
var runner = new Runner();

var suite = new Suite({
	runner : runner,

	setUp : function () {
	},

	tearDown : function () {
	},

	'can create an instance of observable' : function () {
		Assert((new Observable()) instanceof Observable,'couldnt create an observable');
	},

	'if an initializer is passed in the constructor that has a listeners property, these listeners will be added' : function () {
		var initializer = {
			listeners : {}
		},
		onRan = {},
		onDidntRun = {};

		try {
			var TestObservable = Observable.subclass({
				on : function (stuff) {
					Assert(stuff === initializer.listeners,'passed listeners werent added');
					throw onRan;
				}
			});
			var observable = new TestObservable(initializer);
			throw onDidntRun;
		} catch (e) {
			if (e === onDidntRun) {
				Assert(false,'on method didnt run');
			} else if (e !== onRan) {
				throw e;
			}
		}
	},

	'on method can take an eventName, fn, scope and options. uses these to create an Observable.Listener' : function () {
		var fn = {},
			scope = {},
			options = {},
			ran = {},
			didntRun = {};

		try {
			TestObservable = Observable.subclass({
				Listener : function (passedFn,passedScope,passedOptions) {
					Assert(fn === passedFn && scope === passedScope && options === passedOptions,'passed stuff wasnt what was supposed to be...?');
					throw ran;
				}
			});

			var observable = new TestObservable();
			observable.on('arst',fn,scope,options);
			throw didntRun;

		} catch (e) {
			if (e === didntRun) {
				Assert(false,'Listener constructor wasnt run');
			} else if (e !== ran) {
				throw e;
			}
		}
	},

	'on adds a listener to a listeners collection' : function () {
		var eventName = 'arst',
			observable = new Observable();

		observable.on(eventName,function () {},{},{});
		Assert(observable.getListenerCollectionByEventName(eventName).length === 1,'listeners collection wasnt added');
		Assert(observable.getListenerCollectionByEventName(eventName)[0] instanceof observable.Listener,'non listener type was added to listeners collection');
	},

	'on can add multiple listeners when called with an object with event names as propertynames and fns as properties. a special scope property and options property will be respected' : function () {
		var scope = {},
			options = {},
			herpCount = 0,
			derpCount = 0,
			derp = function () {},
			herp = function () {},
			TestObservable = Observable.subclass({
				Listener : function (passedFn,passedScope,passedOptions) {
					// assert that scope and options are scope and options
					Assert(scope === passedScope && options === passedOptions,'passed scope or options is wrong');
					// if fn is herp, inc herpcount, if its derp, inc drep count
					if (passedFn === herp) {
						herpCount++;
					} else if (passedFn === derp) {
						derpCount++;
					} else {
						Assert(false,'wrong fn param');
					}
				}
			}),
			observable = new TestObservable();

		observable.on({
			derp : derp,
			herp : herp,
			scope : scope,
			options : options
		});

		// assert that a derp collection was added and assert that the first derp is a Listener
		Assert(observable.getListenerCollectionByEventName('derp')[0] instanceof observable.Listener,'the event wasnt added by eventName');

		// assert that a herp collection was added and assert that the first herp is a Listener
		Assert(observable.getListenerCollectionByEventName('herp')[0] instanceof observable.Listener,'the event wasnt added by eventName');

		// assert that herp count and derp count are 1 each
		Assert(herpCount === 1 && derpCount === 1,'each fn wasnt passed to Listener constructor');

		O = observable;
	},

	'on can add multiple listeners when called with an object with event names as propertynames and objects with properties fn, scope, options, as properties' : function () {
	},

	'listeners are called when their event is fired' : function () {
		/*
		var observable = new Observable({
			listeners : {
				derp : function () {
				},
				scope : scope
			}
		});
		*/
	}

});
suite.run();
