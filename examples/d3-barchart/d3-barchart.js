(function (window, _, Innertube, d3, $, undefined) {
  
  window.D3BarChartModel = Backbone.Model.extend({
    // Default attributes for the timeline.
  	defaults: {
  		date: null,
  		data: [],
  		highlight: null
  	}
  });

  window.D3BarChartView = Backbone.View.extend({
    // The view element referenced by `this.el` is created from
  	// the `tagName` and `className` properties.
  	//
  	// 	<div class="timeline-view">...
  	tagName: 'div',
  	className: 'chart',
	
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
  		  Innertube().send('highlight', highlightObject);
  		});
  	},
	
  	render: function () {
  	  var self = this;
	  
  	  self.renderD3(self.el, self.model.get('data'));
	  
  	  return self;
  	},
	
  	renderD3: function (el, data) {
  	  var self = this;
	  
  	  // Clear the contents of the element.
      d3.select(el).html(null);

      var maxValue = d3.max(data, function (d) { return d; })
        , minValue = d3.min(data, function (d) { return d; })
        , valueHeight = 160
        , barPadding = 20
        , legend = 'unit'
        , maxBarHeight = valueHeight - barPadding
        , fy = function (d) { return (d / maxValue) * maxBarHeight + barPadding; }
        , format    = d3.format('.2r')
        , chart     = d3.select(el)
        , table     = chart.append('table')
        , row       = table.append('tr')
        , yaxisCol  = row.append('td')
                            .classed('_yaxis', true)
                          .append('div')
                            .classed('_labels', true)
                            .style('height', valueHeight + 'px')
        , yaxisMax  = yaxisCol.append('div')
                            .classed('_max', true)
                          .text(format(maxValue))
        , yaxisMin  = yaxisCol.append('div')
                            .classed('_min', true)
                          .text(format(minValue))
        , yLegend   = yaxisCol.append('div')
                            .classed('_legend', true)
                          .text(legend)
        , columns   = row.selectAll('td._column')
                          .data(data)
                        .enter().append('td')
                          .classed('_column', true)
                          .on('click', function (d, index) {
                          
                            columns.classed('selected', false);
                            d3.select(this)
                              .classed('selected', true);
                            
                            self.model.set({
                              highlight: {
                                hour: index
                              }
                            });
                          
                          })
        , values    = columns.append('div')
                        .classed('_value', true)
                        .style('height', valueHeight + 'px')
        , bars      = values.append('div')
                        .classed('_bar', true)
                        .style('height', function (d) { return fy(d) + "px"; })
                        .text(function (d) { return format(d); })
        , axis      = columns.append('div')
                        .classed('_xaxis', true)
                        .text(function (d, index) {
                          var h = index % 12,
                              ampm = (index < 12) ? 'a' : 'p';
                        
                          if (h == 0) { h = 12; }
                        
                          return h + ampm;
                        });
                      
      // Make columns available to other methods of this object.
      self.columns = columns;
    
      // Highlight columns.
      var highlight = self.model.get('highlight');
      if (highlight != null) {
        self.highlight(highlight);
      }
    
      Innertube().send('height', $('body').outerHeight());
          
      return self;
  	},
	
  	highlight: function (highlightObject) {
  	  var self = this;
	  
  	  self.columns.classed(
        'selected', 
        function (d, index) {
          return index === highlightObject.hour;
        }
      );
    
  	  return self;
  	}

  });
  
} (window, _, Innertube, d3, jQuery));