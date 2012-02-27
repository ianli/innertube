/*!
 * Innertube Widgets API 1.0.0
 * http://ianli.github.com/innertube/
 * 
 * Copyright 2012 Ian Li (http://ianli.com)
 * Innertube Widgets API is freely distributable under the MIT license.
 *
 * Requires the following Javascript libraries:
 * - [easyXDM](http://easyxdm.net/) for cross-domain messaging
 * - [Underscore.js](http://documentcloud.github.com/underscore/) for utility functions
 */

// The semicolon prevents potential errors when minifying plugins together.
// The function sandboxes the code.
// Pass local reference to window for performance reasons.
// Redefines undefined as it could have been tampered with.
;(function (window, _, $, undefined) {
  
  // Innertube.RPC
  // ===============================================
  // Innertube.RPC is the interface between widgets and the dashboard.
  // `localProperties` include methods that are called by the local RPC instance;
  // they cannot be called by remote entities.
  // On the other hand, `remoteProperties` are methods that are called by remote entities.
  var RPC = function (localProperties, remoteProperties) {
  	// We use the variable self to represent this object
  	// and to reduce confusion regarding what `this` refers to.
  	var self = this,

  	// Make copies of the arguments, because we'll be modifying them.
  	localProps = _.clone(localProperties),
  	remoteProps = _.clone(remoteProperties);


  	// Assign default values to the local properties
  	// if left unassigned.
  	_.defaults(localProps, {
  		// Called when easyXDM.Rpc is ready.
  		// If left unassigned, do nothing.
  		ready: function() {},

  		// Called when a method doesn't exist.
  		// If left unassigned, do nothing.
  		methodMissing: function() {}
  	});

  	// Current version of the Innertube.RPC
  	RPC.VERSION = '0.1.0';

  	// Add a remote method that returns the version number of this RPC.
  	// We assign it here, so that it cannot be overridden.
  	remoteProps.version = function () {
  		return RPC.VERSION;
  	};

  	// We use easyXDM.Rpc as a way to communicate
  	// between the widget and the dashboard.
  	var rpc = new easyXDM.Rpc({
  			// This function is called when the RPC is ready.
  			onReady: function() {
  				if (_.isFunction(localProps.ready)) {
  					localProps.ready.apply(self);
  				}
  			}
  		},
  		// Interface Configuration
  		{
  			local: {
  				widget: function(method, args, successFn, errorFn) {												
  					if (_.isFunction(remoteProps[method])) {
  						var returnValue = remoteProps[method].apply(self, args);

  						if (!_.isUndefined(returnValue)) {
  							return returnValue;
  						}
  					} else {
  						// No method exists, call the `methodMissing` method.
  						if (_.isFunction(localProps.methodMissing)) {
  							localProps.methodMissing.apply(self);
  						} else {
  							// Otherwise, fail silently.
  						}
  					}
  				}
  			},
  			remote: {
  				// Invoke methods on the dashboard.
  				dashboard: {}
  			}
  		}
  	);

  	// Sends messages to the Innertube Dashboard.
  	// `method` is the method to call on the Innertube Dashboard.
  	// The remaining arguments are passed as arguments to the method
  	// in the Innertube Dashboard.
  	//
  	// There are multiple approaches to call methods on the dashboard.
  	// 1. Methods with no arguments.
  	// 		dashboard(method);
  	//
  	// 2. Methods with arguments.
  	//		dashboard(method, arg1, arg2, arg3, ...)
  	//
  	// 3. Methods with no arguments and returns a value.
  	//		dashboard(method, {
  	//			success: function(returnValue) {
  	//				...
  	//			}
  	//		});
  	//
  	// 4. Methods with arguments and returns a value.
  	//		dashboard(method, arg1, arg2, ..., {
  	//			success: function(returnValue) {
  	//				...
  	//			}	
  	//		});
  	self.dashboard = function (method) {
  		var args = Array.prototype.slice.call(arguments, 1);
  		if (args.length == 0) {
  			// Approach #1
  			// Must send an empty array as argument
  			// to match signature of dashboard(method, args)
  			rpc.dashboard(method, []);
  		} else {
  			// Check if the last argument is an object
  			// `success` and `error` functions.
  			var lastArg = args[args.length - 1];
  			if (lastArg.success || lastArg.error) {
  				// Remove the last element of the arguments list.
  				args.pop();

  				var success = lastArg.success || function () {};
  				var error = lastArg.error || function() {};

  				// Approach #3 and #4
  				rpc.dashboard(method, args, success, error);
  			} else {
  				// Approach #2
  				rpc.dashboard(method, args);	
  			}
  		}

  		return self;
  	};
  };

  var RPC2 = function (options) {
    // We use the variable self to represent this object
  	// and to reduce confusion regarding what `this` refers to.
    var self = this
    
      // Whether the RPC is ready.
      , isReady = false
    
      // Functions called when the RPC is ready.
      , readyCallbacks = []
    
      // A hash of functions when a message is received from the dashboard.
      , receiveCallbacks = {};
      
    if (typeof options === 'undefined' || options === null) {
      options = {};
    }
    
    _.defaults(options, {
      remote: null,
      container: null
    });
    
    var rpc = new RPC(
  		// Local methods
  		{
  		  remote: options['remote'],
  		  
  		  container: options.container,
  		  
  			// When the RPC is ready, set the height of the widget
  			// and get the current date to visualize.
  			ready: function() {
  			  isReady = true;
  			  for (var i = 0, n = readyCallbacks.length; i < n; i++) {
  			    readyCallbacks[i].apply(self);
  			  }
  			}
  		},
  		// Remote methods callable by the dashboard.
  		{
  			// Handles when the dashboard calls `date`.
  			date: function (range, year, month, day) {
  			  handle('date', {
            range: range,
            year: year, 
            month: month, 
            day: day     		    
  			  });
  			},
  			
  			height: function (height) {
  			  handle('height', height);
  			},

  			highlight: function (value) {
  			  handle('highlight', value);
  			}
  		}
  	);
  	
  	var handle = function(methodName) {
  	  var args = Array.prototype.slice.call(arguments, 1);
  	  if (_.has(receiveCallbacks, methodName)) {
  	    var callbacks = receiveCallbacks[methodName];
			  for (var i = 0, n = callbacks.length; i < n; i++) {
			    callbacks[i].apply(self, args);
			  }
  	  }
  	};
  	
  	
  	// ======
  	// PUBLIC
  	// ======
  	
  	self.ready = function(callback) {
  	  if (_.isFunction(callback)) {
  	    if (isReady) {
  	      callback.apply(self);
  	    } else {
  	      readyCallbacks.push(callback);
  	    }
  	  }
  	  return self;
  	};
  	
  	self.send = function (methodName) {
  	  rpc.dashboard.apply(rpc, arguments);
  	  return self;
  	};
  	
  	self.request = function (methodName) {
  	  var args = Array.prototype.slice.call(arguments, 0);
  	  args.push({
  	    success: function () {
  	      var args = Array.prototype.slice.call(arguments, 0);
  	      args = [methodName].concat(args);
  	      handle.apply(self, args);
  	    }
  	  });
  	  rpc.dashboard.apply(rpc, args);
  	  return self;
  	};
  	
  	self.receive = function (methodName, callback) {
  	  if (!_.isFunction(callback))
  	    return self;
  	  
  	  if (_.has(receiveCallbacks, methodName)) {
  	    receiveCallbacks[methodName].push(callback);
  	  } else {
  	    receiveCallbacks[methodName] = [callback];
  	  }
  	  
  	  return self;
  	};
	};
	
	
	var Messaging = function (options) {
    // We use the variable self to represent this object
  	// and to reduce confusion regarding what `this` refers to.
    var self = this
    
      // Whether the RPC is ready.
      , isReady = false
    
      // Functions called when the RPC is ready.
      , readyCallbacks = []
      
      // Functions called when a method is missing.
      , methodMissingCallbacks = []
    
      // A hash of functions when a message is received from the dashboard.
      , receiveCallbacks = {};
      
    if (typeof options === 'undefined' || options === null) {
      options = {};
    } else {
      options = _.clone(options)
    }
    
    _.defaults(options, {
      remote: null,
      container: null
    });
    
    //     var rpc = new RPC(
    //  // Local methods
    //  {
    //    remote: options.remote,
    //    
    //    container: options.container,
    //    
    //    // When the RPC is ready, set the height of the widget
    //    // and get the current date to visualize.
    //    ready: function() {
    //      isReady = true;
    //      for (var i = 0, n = readyCallbacks.length; i < n; i++) {
    //        readyCallbacks[i].apply(self);
    //      }
    //    }
    //  },
    //  // Remote methods callable by the dashboard.
    //  {
    //    // Handles when the dashboard calls `date`.
    //    date: function (range, year, month, day) {
    //      handle('date', {
    //             range: range,
    //             year: year, 
    //             month: month, 
    //             day: day             
    //      });
    //    },
    //    
    //    height: function (height) {
    //      handle('height', height);
    //    },
    // 
    //    highlight: function (value) {
    //      handle('highlight', value);
    //    }
    //  }
    // );
    
    
    // ===========
  	// EASYXDM RPC
  	// ===========
    
    // We use easyXDM.Rpc as a way to communicate
  	// between the widget and the dashboard.
  	var rpc = new easyXDM.Rpc(
  	  {
  	    remote: options.remote,
  	    
  	    container: options.container,
  	    
  			// This function is called when the RPC is ready.
  			onReady: function() {
  			  isReady = true;
  			  for (var i = 0, n = readyCallbacks.length; i < n; i++) {
  			    readyCallbacks[i].apply(self);
  			  }
  			},
  			
  			// Attributes of the IFrame created by this RPC.
				props: {
					// Don't allow scrolling on the IFrame.
					scrolling: 'no'
				}
  		},
  		
  		// easyXDM.Rpc Interface Configuration
  		{
  		  local: {
  		    dashboard: function (method, args, successFn, errorFn) {
  		      handle.apply(self, [method].concat(args));
  		    },
  		    
  		    widget: function (method, args, successFn, errorFn) {
  		      handle.apply(self, [method].concat(args));
  		    },
  		    
  		    message: function (method, args, successFn, errorFn) {
  		      handle.apply(self, [method].concat(args));
  		    }
  		  },
  		  
  		  remote: {
  		    dashboard: {},
  		    
  		    widget: {},
  		    
  		    message: {}
  		  }
  		}
  	);
  	
  	
  	// ===============
  	// PRIVATE METHODS
  	// ===============
    
  	var handle = function(methodName) {
  	  var args = Array.prototype.slice.call(arguments, 1);
  	  if (_.has(receiveCallbacks, methodName)) {
  	    var callbacks = receiveCallbacks[methodName];
			  for (var i = 0, n = callbacks.length; i < n; i++) {
			    callbacks[i].apply(self, args);
			  }
  	  } else {
				// No method exists, call the `methodMissing` method.
				for (var i = 0, n = methodMissingCallbacks.length; i < n; i++) {
			    methodMissingCallbacks[i].apply(self);
			  }
			}
  	};
  	
  	var message = function (method) {
  		var args = Array.prototype.slice.call(arguments, 1);
  		if (args.length == 0) {
  			// Approach #1
  			// Must send an empty array as argument
  			// to match signature of message(method, args)
  			rpc.dashboard(method, []);
  		} else {
  			// Check if the last argument is an object
  			// `success` and `error` functions.
  			var lastArg = args[args.length - 1];
  			if (lastArg.success || lastArg.error) {
  				// Remove the last element of the arguments list.
  				args.pop();

  				var success = lastArg.success || function () {};
  				var error = lastArg.error || function() {};

  				// Approach #3 and #4
  				rpc.dashboard(method, args, success, error);
  			} else {
  				// Approach #2
  				rpc.dashboard(method, args);	
  			}
  		}

  		return self;
  	};
  	
  	
  	// ==============
  	// PUBLIC METHODS
  	// ==============
  	
  	self.ready = function(callback) {
  	  if (_.isFunction(callback)) {
  	    if (isReady) {
  	      callback.apply(self);
  	    } else {
  	      readyCallbacks.push(callback);
  	    }
  	  }
  	  return self;
  	};
  	
  	self.send = function (methodName) {
  	  message.apply(self, arguments);
  	  return self;
  	};
  	
  	self.request = function (methodName) {
  	  var args = Array.prototype.slice.call(arguments, 0);
  	  args.push({
  	    success: function () {
  	      var args = Array.prototype.slice.call(arguments, 0);
  	      args = [methodName].concat(args);
  	      handle.apply(self, args);
  	    }
  	  });
  	  message.apply(self, args);
  	  return self;
  	};
  	
  	self.receive = function (methodName, callback) {
  	  if (!_.isFunction(callback))
  	    return self;
  	  
  	  if (_.has(receiveCallbacks, methodName)) {
  	    receiveCallbacks[methodName].push(callback);
  	  } else {
  	    receiveCallbacks[methodName] = [callback];
  	  }
  	  
  	  return self;
  	};
	};
	
	
	var innertubeInstance;
  window.Innertube = function (options) {
    if (typeof innertubeInstance === 'undefined') {
      innertubeInstance = new Messaging(options);
    }
    return innertubeInstance;
  };
  
}(window, _, jQuery));