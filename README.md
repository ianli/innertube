Innertube Widgets API
=====================

The Innertube Widgets API is used to create widgets of personal informatics visualizations for users to add to their [Innertube Dashboard](http://innertube.me).

Innertube Widgets API is dependent on these great open-source projects:

* [easyXDM](http://easyxdm.net/) for cross-domain messaging
* [Underscore.js](http://documentcloud.github.com/underscore/) for utility functions

To get started, visit http://ianli.github.com/innertube/!


About Innertube
---------------

Innertube is a platform that integrates multiple visualizations of self-tracking data into one interface. It is composed of several components, which I will discuss in further detail: *the Innertube Dashboard*, *the Innertube Widgets API*, *the Innertube Widgets Catalog*.

Innertube is different from other methods of integrating self-tracking data. Most systems have taken the approach of **data integration**, that is, they download self-tracking data from the different self-tracking tools. For example, Fitbit downloads weight data from Withings through the Withings API. Fitbit then creates visualizations that present the weight data to the user. 

Instead of data integration, Innertube takes the approach of *visualization integration*. Innertube supports different visualizations to be presented together in a dashboard. Visualizations are presented inside *widgets* and Innertube provides an API to coordinate what is viewed in the visualizations.

The visualization integration approach has several benefits:

* Innertube doesn't have to download self-tracking data from different sources. Self-tracking tools can create Innertube widgets without exposing their raw through an API.
* Self-tracking tools do not have to duplicate work on creating visualizations.


Dependencies
------------

Innertube is dependent on two Javascript libraries:

* [easyXDM](http://easyxdm.net/wp/) supports cross-domain messaging.
* [Underscore.js](http://documentcloud.github.com/underscore/) provides useful functional programming methods.


Usage
-----

To start using the Innertube Widgets API, copy this snippet into the widget you are building:

```html
<script src="http://ianli.github.com/innertube/javascripts/easyXDM-2.4.15.118/easyXDM.js"></script>
<script src="http://ianli.github.com/innertube/javascripts/underscore-1.2.2.js"></script>
<script src="http://ianli.github.com/innertube/0.1.0/innertube.js"></script>
```

Innertube.RPC
-------------

**Innertube.RPC** is the primary way that widgets communicate with the dashboard and vice versa. *RPC* stands for *remote procedure calls*.

### Setup

```javascript
var rpc = new Innertube.RPC(
  // Methods called by this RPC.
  {
    ready: function () {
        // Called when the RPC is ready.
    }
  },
  // Methods called by the dashboard.
  {
    date: function (range, year, month, day) {
        // Called by the dashboard with information on what date and range to show.
    },

    highlight: function (obj) {
        // Called by the dashboard; *obj* has information on what to highlight.
    }
  }
);

// Visualization code goes here...
```

### Handling messages from the dashboard

The Innertube Dashboard expects widgets to handle several methods. Widgets must declare these methods when creating a new instance of Innertube.RPC.

**date(range, year, month, day)**

The dashboard calls this method to set the date that the widget should show.

```javascript
date: function (range, year, month, day) {
  // Show the visualization for the specified range, year, month, and day.
}
```

**highlight(object)**

The dashboard calls this method to tell the widget what to highlight.

```javascript
highlight: function (object) {
  var minutes = object.minutes;
  if (minutes) {
      // Highlight the month.
  }
}
```

Sometimes the information in object cannot be highlighted in the visualization. In this case, the widget has two options: it can do nothing or it can show a message that it cannot highlight the information.

Sending messages to the dashboard
---------------------------------

Widgets can communicate with the dashboard using *Innertube.RPC*. The dashboard has the following methods.

**rpc.dashboard('reload')**

Reloads the widget.

**rpc.dashboard('height', height)**

Sets the height of the widget on the dashboard. The argument `height` is a number.

**rpc.dashboard('height', callbacks)**

Returns the current height of the widget. The argument `callbacks` is an object with attributes `success` and `error` which are functions.

```javascript
rpc.dashboard('height', {
  success: function (returnValue) {
    // Do something with the return value.
  },
  error: function () {
    // Do something with the error.
  }
}
```


Testing Your Widget
-------------------

To test your widget in the Innertube Dashboard, sign up for an account at [Innertube](http://innertube.me) and add your widget.


Versioning
----------

For transparency and insight into our release cycle, and for striving to maintain backwards compatibility, Bootstrap will be maintained under the Semantic Versioning guidelines as much as possible.

Releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on SemVer, please visit http://semver.org/.


Version History
---------------

**2011-10-27** - 0.1.0

* Initial release of Innertube.

Bug tracker
-----------

Have a bug? Please create an issue here on GitHub!

https://github.com/ianli/innertube/issues


Author
------

**Ian Li**

+ http://ianli.com
+ http://twitter.com/ianli
+ http://github.com/ianli


License
---------------------

Copyright 2011-2012 Ian Li, http://ianli.com

Licensed under the MIT License (http://www.opensource.org/licenses/mit-license.php).