/*!
 * Innertube Widgets API 0.1.0
 * http://ianli.github.com/innertube/
 * 
 * Copyright 2011 Ian Li (http://ianli.com)
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
;(function (window, undefined) {

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
}

window.Innertube = {
	RPC: RPC
}

})(window);