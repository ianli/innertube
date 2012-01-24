//     Innertube Widgets API Timeline Example
//     Copyright 2011, Ian Li (http://ianli.com)
//     This example may be freely distributed under the MIT license.

// A simple example using the Innertube Widgets API.
//
// Dependencies:
//
// * [Innertube Widgets API](http://ianli.github.com/innertube/)
// * [easyXDM](http://easyXDM.net) for cross-domain messaging
// * [jQuery](http://jquery.com) for DOM manipulation
// * [Underscore.js](http://documentcloud.github.com/underscore/) for utility functions
// * [Backbone.js](http://documentcloud.github.com/backbone/) for MVC pattern
// * [Date.js](http://www.datejs.com) for date parsing and formatting

// * The semicolon prevents potential errors when minifying code together.
// * The function sandboxes the code.
// * Pass local reference to window and jQuery for performance reasons.
// * Redefines undefined as it could have been tampered with.
;(function (window, $, undefined) {
	
	// TimelineModel
	// -------------
	
	// Model for the timeline.
	// It has the following attributes:
	//
	// * `data` - The data to visualize in the timeline.
	// * `range` - The range of data to show: `year`, `month`, `week`, or `day`.
	var TimelineModel = Backbone.Model.extend({
		
		// Default attributes for the timeline.
		defaults: {
			date: null,
			data: [],
			highlight: null
		}
		
	});
	
	// TimelineView
	// ------------
	
	// View for the timeline.
	var TimelineView = Backbone.View.extend({
		// The view element referenced by `this.el` is created from
		// the `tagName` and `className` properties.
		//
		// 	<div class="timeline-view">...
		tagName: 'div',
		className: 'timeline-view',
		
		// Template
		template: _.template('\
		  <table> \
		    <tr> \
    		  <td class="_yaxis"> \
    		    <div class="_labels">100%</div> \
    		  </td> \
  				<% for (var i = 0; i < columns_count; i++)  { %> \
  					<td class="_column"> \
  					  <div class="_value"> \
    						<div class="_bar"></div> \
  						</div> \
  						<div class="_x"></div> \
  					</td> \
  				<% } %> \
    		</tr> \
    	</table> \
		'),
		
		// Prepare the view.
		initialize: function () {
			// To avoid scope issues, use `self` instead of `this`
	        // to reference this object from internal events and functions.
			var self = this;
			
			_.bindAll(this, 'render', 'highlight');
			
			// When the `data` attribute of the model changes,
			// render the view again.
			self.model.bind('change:data', self.render);
			
			self.model.bind('change:highlight', function (model, highlightObject) {
			  self.highlight(highlightObject);
			});
		},
		
		// Render the view.
		render: function () {
			var self = this,
				$el = $(self.el),
				data = self.model.get('data'),
				range = self.model.get('range'),
				highlightObject = self.model.get('highlight'),
				columns_count = data.length,
				columns_width = (columns_count > 0) ? (100 / data.length) : 100;
			
			$el.html(self.template({ columns_count: columns_count }));
			
			var $columns = self.$('._column')
				.each(function (i) {
					$(this).data({
						value: i,
						range: range
					});
				})
				.click(function () {
					$columns.removeClass('selected');
					var $self = $(this);
					$self.addClass('selected');
					
					self.model.set({
					  highlight: {
					    hour: $self.data('value')
					  }
					});
				});
			
			var barHeight= self.$('._value').height();
			
			self.$('._bar').each(function (i, el) {
				var height = data[i].value * barHeight;
				$(this).height(height + 'px');
			});
			
			self.$('._x').each(function (i, el) {
				$(this).html(data[i].x);
			});
			
			self.highlight(highlightObject);
			
			return self;
		},
		
		highlight: function (object) {
		  if (_.isUndefined(object) || _.isNull(object)) {
		    return;
		  }
		  
			var self = this,
				  range = self.model.get('range');
				
			if (!_.isUndefined(object.hour) && !_.isNull(object.hour)) {
			  self.$('._column')
					.removeClass('selected')
					.each(function (i) {
						if (object.hour == i) {
							$(this).addClass('selected');
						}
					});
			}
			
			return self;
		}
	});
	
	// WidgetState
	// -----------
	
	var WidgetState = Backbone.Model.extend({
	});
	
	// FakeData
	// --------
	
	// Creates fake timeline data.
	var FakeData = (function () {
		var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
			'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		
		// Cache the data.
		var cache = {};
		
		// Returns data for the given range and date information.
		var get = function (range, year, month, day) {
			switch (range) {
				case 'year':
					return getYear(year);
				case 'month':
					return getMonth(year, month);
				case 'week':
					return getWeek(year, month, day);
				case 'day':
				default:
					return getDay(year, month, day);
			}
		};
		
		// Returns data for a given day.
		var getDay = function (year, month, day) {
			var id = new Date(year, month, day).toString('yyyy-MM-dd');
			
			if (cache[id]) {
				return cache[id];
			} else {
				var data = [];
				for (var i = 0; i < 24; i++) {
					var h = i % 12;
					h = (h == 0) ? 12 : h;
					h += (i < 12) ? 'a' : 'p';

					data.push({
						value: Math.random(),
						x: h,
					});
				}
				
				cache[id] = data;

				return data;
			}
		};

		// Returns data for a given week.
		var getWeek = function (year, month, day) {
			var date = new Date(year, month, day);
			var id = date.toString('yyyy-MM, ') + 'week ' + date.getWeekOfYear();
			
			if (cache[id]) {
				return cache[id];
			} else {
				var data = [];
				for (var i = 0; i < 7; i++) {
					data.push({
						value: Math.random(),
						x: DAY_NAMES[i],
					});
				}
				
				cache[id] = data;
				
				return data;
			}
		};
		
		// Returns data for a given month.
		var getMonth = function (year, month) {
			var id = new Date(year, month, 1).toString('yyyy-MM');
			
			if (cache[id]) {
				return cache[id];
			} else {
				// Compute the number of days in the month.
				var numDays = 28;
				for (var i = 29; i <= 31; i++) {
					if (new Date(year, month, i).getMonth() != month) {
						break;
					}
					numDays = i;
				}

				var data = [];
				for (var i = 0; i < numDays; i++) {
					data.push({
						value: Math.random(),
						x: i + 1,
					});
				}
				
				cache[id] = data;
				
				return data;
			}
		};
		
		// Returns data for a given year.
		var getYear = function (year) {
			var id = '' + year;
			
			if (cache[id]) {
				return cache[id];
			} else {
				var data = [];
				for (var i = 0; i < 12; i++) {
					data.push({
						value: Math.random(),
						x: MONTH_NAMES[i],
					});
				}
				
				cache[id] = data;

				return data;
			}
		};
		
		return {
			get: get
		};
	})();
	
	// Widget Setup
	// ------------
	
	var model = new TimelineModel();
	model.bind("change:highlight", function (model, highlight) {
	  rpc.dashboard('highlight', highlight);
	});
	
	var view = new TimelineView({ model: model }).render();
	$('#simple-view').append(view.el);
	
	var rpc = new Innertube.RPC(
		// Local methods
		{
			// When the RPC is ready, set the height of the widget
			// and get the current date to visualize.
			ready: function() {
				rpc.dashboard("date", {
					success: function (value) {
						var data = FakeData.get(value.range, value.year, value.month, value.day);
						model.set({ 
							data: data,
							range: value.range
						});
						
						rpc.dashboard("height", $('html').height());
					}
				});
				
				// Get the highlighted data from the dashboard.
				rpc.dashboard("highlight", {
					// Process the value returned.
					success: function(highlightObject) {
						model.set({
						  highlight: highlightObject
						});
					}
				});
			}
		},
		// Remote methods callable by the dashboard.
		{
			// Handles when the dashboard calls `date`.
			date: function (range, year, month, day) {
				var data = FakeData.get(range, year, month, day);
				model.set({ 
					data: data,
					range: range
				});
				
				rpc.dashboard("height", $('html').height());
			},
			
			highlight: function (value) {
				// If there is no hour value, then calculate it.
				if (value.minutes && !value.hour) {
					value.hour = Math.floor(value.minutes / 60);
				}
				
				model.set({
				  highlight: value
				});
			}
		}
	);
})(window, jQuery);
