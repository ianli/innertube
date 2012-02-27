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
// Pass local reference for performance reasons.
// Redefines undefined as it could have been tampered with.
;(function (window, _, easyXDM, undefined) {
  
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
    
      // A hash of functions when a message is received.
      , receiveCallbacks = {};
    
    
    // ===============
    // PREPARE OPTIONS
    // ===============
      
    if (typeof options === 'undefined' || options === null) {
      // There were no options passed or it was null, so assign it a value.
      options = {};
    } else {
      // Options were passed.
      // Clone it, so we can change it without affecting the passed object.
      options = _.clone(options);
    }
    
    // Set the defaults for options.
    _.defaults(options, {
      remote: null,
      container: null
    });
    
    
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
  		    message: function (method, args, successFn, errorFn) {
  		      handle.apply(self, [method].concat(args));
  		    }
  		  },
  		  
  		  remote: {
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
  			rpc.message(method, []);
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
  				rpc.message(method, args, success, error);
  			} else {
  				// Approach #2
  				rpc.message(method, args);	
  			}
  		}

  		return self;
  	};
  	
  	
  	// ==============
  	// PUBLIC METHODS
  	// ==============
  	
  	// Bind an event handler to the event when the easyXDM.Rpc is ready.
  	// If .ready() is called after easyXDM.Rpc is ready,
  	// the new handler passed in will be executed immediately.
  	//
  	// .ready( callback )
  	// ------------------
  	// @param callback  A function to execute after easyXDM.Rpc is ready.
  	self.ready = function(callback) {
  	  if (_.isFunction(callback)) {
  	    if (isReady) {
  	      // easyXDM.Rpc is ready, execute the handler immediately.
  	      callback.apply(self);
  	    } else {
  	      readyCallbacks.push(callback);
  	    }
  	  }
  	  return self;
  	};
  	
  	// Destroys the easyXDM.Rpc object.
  	//
  	// .destroy()
  	self.destroy = function () {
  	  rpc.destroy();
  	};
  	
  	// Sends a message.
  	//
  	// .send( methodName [, arguments] )
  	// -------------------------------
  	// @param methodName  The name of the method to call.
  	// @param arguments   Optional arguments to send with the message.
  	//
  	// Example
  	// -------
  	// Innertube().send('date', 2012, 0, 1);
  	self.send = function (methodName) {
  	  if (_.isString(methodName)) {
  	    message.apply(self, arguments);
  	  }
  	  return self;
  	};
  	
  	// Attach a handler to a received message.
  	//
  	// .receive( methodName, callback )
  	// --------------------------------
  	// @param methodName  The name of the method to which to attach a handler.
  	// @param callback    A function to execute each time a message is received.
  	//
  	// Example
  	// -------
  	// Innertube().receive('date', function (year, month, day) {
  	//   alert(year + '-' + month + '-' + day);
  	// });
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
	};
	
	
	var innertubeInstance;
  window.Innertube = function (options) {
    if (typeof options === 'undefined') {
      if (typeof innertubeInstance === 'undefined') {
        innertubeInstance = new Messaging();
      }
      return innertubeInstance;
    } else {
      return new Messaging(options);
    }
  };
  
}(window, _, easyXDM));