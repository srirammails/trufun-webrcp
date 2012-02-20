/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Methods to get information about the JavaScript call stack.
 */
qx.Bootstrap.define("qx.dev.StackTrace",
{
  statics:
  {

    /**
     * Get a stack trace of the current position in the code.
     *
     * Browser compatibility:
     * <ul>
     *   <li> Mozilla combines the output of {@link #getStackTraceFromError}
     *        and {@link #getStackTraceFromCaller} and thus generates the richest trace.
     *   </li>
     *   <li> Internet Explorer and WebKit always use {@link #getStackTraceFromCaller}</li>
     *   <li> Opera is able to return file/class names and line numbers.</li>
     * </ul>
     *
     * @return {String[]} Stack trace of the current position in the code. Each line in the array
     *     represents one call in the stack trace.
     * @signature function()
     */
    getStackTrace : qx.core.Environment.select("engine.name",
    {
      "gecko" : function()
      {
        try
        {
          throw new Error();
        }
        catch(ex)
        {
          var errorTrace = this.getStackTraceFromError(ex);
          qx.lang.Array.removeAt(errorTrace, 0);
          var callerTrace = this.getStackTraceFromCaller(arguments);

          var trace = callerTrace.length > errorTrace.length ? callerTrace : errorTrace;
          for (var i=0; i<Math.min(callerTrace.length, errorTrace.length); i++)
          {
            var callerCall = callerTrace[i];
            if (callerCall.indexOf("anonymous") >= 0) {
              continue;
            }

            var callerArr = callerCall.split(":");
            if (callerArr.length != 2) {
              continue;
            }
            var callerClassName = callerArr[0];
            var methodName = callerArr[1];

            var errorCall = errorTrace[i];
            var errorArr = errorCall.split(":");
            var errorClassName = errorArr[0];
            var lineNumber = errorArr[1];

            if (qx.Class.getByName(errorClassName)) {
              var className = errorClassName;
            } else {
              className = callerClassName;
            }
            var line = className + ":";
            if (methodName) {
              line += methodName + ":";
            }
            line += lineNumber;
            trace[i] = line;
          }

          return trace;
        }
      },

      "mshtml|webkit" : function()
      {
        return this.getStackTraceFromCaller(arguments);
      },

      "opera" : function()
      {
        var foo;
        try {
          // force error
          foo.bar();
        }
        catch (ex)
        {
          var trace = this.getStackTraceFromError(ex);
          qx.lang.Array.removeAt(trace, 0)
          return trace;
        }
        return [];
      }
    }),


    /**
     * Get a stack trace from the arguments special variable using the
     * <code>caller</code> property. This is currently not supported
     * for Opera.
     *
     * This methods returns class/mixin and function names of each step
     * in the call stack.
     *
     * Recursion is not supported.
     *
     * @param args {arguments} arguments variable.
     * @return {String[]} Stack trace of caller of the function the arguments variable belongs to.
     *     Each line in the array represents one call in the stack trace.
     * @signature function(args)
     */
    getStackTraceFromCaller : qx.core.Environment.select("engine.name",
    {
      "opera" : function(args)
      {
        return [];
      },

      "default" : function(args)
      {
        var trace = [];
        var fcn = qx.lang.Function.getCaller(args);
        var knownFunction = {};
        while (fcn)
        {
          var fcnName = qx.lang.Function.getName(fcn);
          trace.push(fcnName);

          try {
            fcn = fcn.caller;
          } catch(ex) {
            break;
          }

          if (!fcn) {
            break;
          }

          // avoid infinite recursion
          var hash = qx.core.ObjectRegistry.toHashCode(fcn);
          if (knownFunction[hash]) {
            trace.push("...");
            break;
          }
          knownFunction[hash] = fcn;
        }
        return trace;
      }
    }),


    /**
     * Try to get a stack trace from an Error object. Mozilla sets the field
     * <code>stack</code> for Error objects thrown using <code>throw new Error()</code>.
     * From this field it is possible to get a stack trace from the position
     * the exception was thrown at.
     *
     * This will get the JavaScript file names and the line numbers of each call.
     * The file names are converted into qooxdoo class names if possible.
     *
     * This works reliably in Gecko-based browsers. Later Opera versions and
     * Chrome also provide an useful stack trace. For Safari, only the class or
     * file name and line number where the error occurred are returned.
     * IE 6/7/8 does not attach any stack information to error objects so an
     * empty array is returned.
     *
     * @param error {Error} Error exception instance.
     * @return {String[]} Stack trace of the exception. Each line in the array
     *     represents one call in the stack trace.
     * @signature function(error)
     */
    getStackTraceFromError : qx.core.Environment.select("engine.name",
    {
      "gecko" : function(error)
      {
        if (!error.stack) {
          return [];
        }
        // e.g. "()@http://localhost:8080/webcomponent-test-SNAPSHOT/webcomponent/js/com/ptvag/webcomponent/common/log/Logger:253"
        var lineRe = /@(.+):(\d+)$/gm;
        var hit;
        var trace = [];


        while ((hit = lineRe.exec(error.stack)) != null)
        {
          var url = hit[1];
          var lineNumber = hit[2];

          var className = this.__fileNameToClassName(url);
          trace.push(className + ":" + lineNumber);
        }

        return trace;
      },

      "webkit" : function(error)
      {
        if (error.stack) {
          /*
           * Chrome trace info comes in two flavors:
           * at [jsObject].function (fileUrl:line:char)
           * at fileUrl:line:char
           */
          var lineRe = /at (.*)/gm;
          var fileReParens = /\((.*?)(:[^\/].*)\)/;
          var fileRe = /(.*?)(:[^\/].*)/;
          var hit;
          var trace = [];
          while ((hit = lineRe.exec(error.stack)) != null) {
            var fileMatch = fileReParens.exec(hit[1]);
            if (!fileMatch) {
              fileMatch = fileRe.exec(hit[1]);
            }

            if (fileMatch) {
              var className = this.__fileNameToClassName(fileMatch[1]);
              trace.push(className + fileMatch[2]);
            } else {
                trace.push(hit[1]);
            }
          }

          return trace;
        }
        else if (error.sourceURL && error.line) {
          return [this.__fileNameToClassName(error.sourceURL) + ":" + error.line];
        }
        else {
          return [];
        }
      },

      // Check "Exceptions Have Stacktrace" in opera:config, Section User Prefs
      "opera" : function(error)
      {
        if (error.stacktrace) {
          var stacktrace = error.stacktrace;
          if (stacktrace.indexOf("Error created at") >= 0) {
            stacktrace = stacktrace.split("Error created at")[0];
          }
          // older Opera style
          if (stacktrace.indexOf("of linked script") >= 0) {
            var lineRe = /Line\ (\d+?)\ of\ linked\ script\ (.*?)$/gm;
            var hit;
            var trace = [];
            while ((hit = lineRe.exec(stacktrace)) != null) {
              var lineNumber = hit[1];
              var url = hit[2];
              var className = this.__fileNameToClassName(url);
              trace.push(className + ":" + lineNumber);
            }
          }
          // new Opera style (10.6+)
          else {
            var lineRe = /line\ (\d+?),\ column\ (\d+?)\ in\ (?:.*?)\ in\ (.*?):[^\/]/gm;
            var hit;
            var trace = [];
            while ((hit = lineRe.exec(stacktrace)) != null) {
              var lineNumber = hit[1];
              var columnNumber = hit[2];
              var url = hit[3];
              var className = this.__fileNameToClassName(url);
              trace.push(className + ":" + lineNumber + ":" + columnNumber);
            }
          }
          return trace;
        } else if (error.message.indexOf("Backtrace:") >= 0) {
          var trace = [];
          var traceString = qx.lang.String.trim(error.message.split("Backtrace:")[1]);
          var lines = traceString.split("\n");
          for (var i=0; i<lines.length; i++)
          {
            var reResult = lines[i].match(/\s*Line ([0-9]+) of.* (\S.*)/);
            if (reResult && reResult.length >= 2) {
              var lineNumber = reResult[1];
              var fileName = this.__fileNameToClassName(reResult[2]);
              trace.push(fileName + ":" + lineNumber);
            }
          }
          return trace;
        } else {
          return [];
        }
      },

      "default": function() {
        return [];
      }
    }),


    /**
     * Convert an URL of a JavaScript class into a class name if the file is named using
     * the qooxdoo naming conventions.
     *
     * @param fileName {String} URL of the JavaScript file
     * @return {String} class name of the file if conversion was possible. Otherwise the
     *     fileName is returned unmodified.
     */
    __fileNameToClassName : function(fileName)
    {
      var scriptDir = "/source/class/";
      var jsPos = fileName.indexOf(scriptDir);
      var paramPos = fileName.indexOf("?");
      if (paramPos >= 0) {
        fileName = fileName.substring(0, paramPos);
      }
      var className = (jsPos == -1) ? fileName : fileName.substring(jsPos + scriptDir.length).replace(/\//g, ".").replace(/\.js$/, "");
      return className;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * This class is used to define mixins (similar to mixins in Ruby).
 *
 * Mixins are collections of code and variables, which can be merged into
 * other classes. They are similar to classes but don't support inheritance.
 *
 * See the description of the {@link #define} method how a mixin is defined.
 */
qx.Bootstrap.define("qx.Mixin",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Define a new mixin.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Mixin.define("name",
     * {
     *   includes: [SuperMixins],
     *
     *   properties: {
     *     tabIndex: {type: "number", init: -1}
     *   },
     *
     *   members:
     *   {
     *     prop1: "foo",
     *     meth1: function() {},
     *     meth2: function() {}
     *   }
     * });
     * </pre>
     *
     * @param name {String} name of the mixin
     * @param config {Map ? null} Mixin definition structure. The configuration map has the following keys:
     *   <table>
     *     <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *     <tr><th>construct</th><td>Function</td><td>An optional mixin constructor. It is called on instantiation each
     *         class including this mixin. The constructor takes no parameters.</td></tr>
     *     <tr><th>destruct</th><td>Function</td><td>An optional mixin destructor.</td></tr>
     *     <tr><th>include</th><td>Mixin[]</td><td>Array of mixins, which will be merged into the mixin.</td></tr>
     *     <tr><th>statics</th><td>Map</td><td>
     *         Map of statics of the mixin. The statics will not get copied into the target class. They remain
     *         accessible from the mixin. This is the same behaviour as statics in interfaces ({@link qx.Interface#define}).
     *     </td></tr>
     *     <tr><th>members</th><td>Map</td><td>Map of members of the mixin.</td></tr>
     *     <tr><th>properties</th><td>Map</td><td>Map of property definitions. For a description of the format of a property definition see
     *           {@link qx.core.Property}.</td></tr>
     *     <tr><th>events</th><td>Map</td><td>
     *         Map of events the mixin fires. The keys are the names of the events and the values are
     *         corresponding event type classes.
     *     </td></tr>
     *   </table>
     */
    define : function(name, config)
    {
      if (config)
      {
        // Normalize include
        if (config.include && !(config.include instanceof Array)) {
          config.include = [config.include];
        }

        // Validate incoming data
        if (qx.core.Environment.get("qx.debug")) {
          this.__validateConfig(name, config);
        }

        // Create Interface from statics
        var mixin = config.statics ? config.statics : {};
        qx.Bootstrap.setDisplayNames(mixin, name);

        for(var key in mixin) {
          if (mixin[key] instanceof Function)
          {
            mixin[key].$$mixin = mixin;
          }
        }

        // Attach configuration
        if (config.construct)
        {
          mixin.$$constructor = config.construct;
          qx.Bootstrap.setDisplayName(config.construct, name, "constructor");
        }

        if (config.include) {
          mixin.$$includes = config.include;
        }

        if (config.properties) {
          mixin.$$properties = config.properties;
        }

        if (config.members)
        {
          mixin.$$members = config.members;
          qx.Bootstrap.setDisplayNames(config.members, name + ".prototype");
        }

        for(var key in mixin.$$members)
        {
          if (mixin.$$members[key] instanceof Function) {
            mixin.$$members[key].$$mixin = mixin;
          }
        }

        if (config.events) {
          mixin.$$events = config.events;
        }

        if (config.destruct)
        {
          mixin.$$destructor = config.destruct;
          qx.Bootstrap.setDisplayName(config.destruct, name, "destruct");
        }
      }
      else
      {
        var mixin = {};
      }

      // Add basics
      mixin.$$type = "Mixin";
      mixin.name = name;

      // Attach toString
      mixin.toString = this.genericToString;

      // Assign to namespace
      mixin.basename = qx.Bootstrap.createNamespace(name, mixin);

      // Store class reference in global mixin registry
      this.$$registry[name] = mixin;

      // Return final mixin
      return mixin;
    },


    /**
     * Check compatibility between mixins (including their includes)
     *
     * @param mixins {Mixin[]} an array of mixins
     * @throws an exception when there is a conflict between the mixins
     */
    checkCompatibility : function(mixins)
    {
      var list = this.flatten(mixins);
      var len = list.length;

      if (len < 2) {
        return true;
      }

      var properties = {};
      var members = {};
      var events = {};
      var mixin;

      for (var i=0; i<len; i++)
      {
        mixin = list[i];

        for (var key in mixin.events)
        {
          if(events[key]) {
            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + events[key] + '" in member "' + key + '"!');
          }

          events[key] = mixin.name;
        }

        for (var key in mixin.properties)
        {
          if(properties[key]) {
            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + properties[key] + '" in property "' + key + '"!');
          }

          properties[key] = mixin.name;
        }

        for (var key in mixin.members)
        {
          if(members[key]) {
            throw new Error('Conflict between mixin "' + mixin.name + '" and "' + members[key] + '" in member "' + key + '"!');
          }

          members[key] = mixin.name;
        }
      }

      return true;
    },


    /**
     * Checks if a class is compatible to the given mixin (no conflicts)
     *
     * @param mixin {Mixin} mixin to check
     * @param clazz {Class} class to check
     * @throws an exception when the given mixin is incompatible to the class
     * @return {Boolean} true if the mixin is compatible to the given class
     */
    isCompatible : function(mixin, clazz)
    {
      var list = qx.Bootstrap.getMixins(clazz);
      list.push(mixin);
      return qx.Mixin.checkCompatibility(list);
    },


    /**
     * Returns a mixin by name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name) {
      return this.$$registry[name];
    },


    /**
     * Determine if mixin exists
     *
     * @name isDefined
     * @param name {String} mixin name to check
     * @return {Boolean} true if mixin exists
     */
    isDefined : function(name) {
      return this.getByName(name) !== undefined;
    },


    /**
     * Determine the number of mixins which are defined
     *
     * @return {Number} the number of classes
     */
    getTotalNumber : function() {
      return qx.Bootstrap.objectGetLength(this.$$registry);
    },


    /**
     * Generates a list of all mixins given plus all the
     * mixins these includes plus... (deep)
     *
     * @param mixins {Mixin[] ? []} List of mixins
     * @return {Array} List of all mixins
     */
    flatten : function(mixins)
    {
      if (!mixins) {
        return [];
      }

      // we need to create a copy and not to modify the existing array
      var list = mixins.concat();

      for (var i=0, l=mixins.length; i<l; i++)
      {
        if (mixins[i].$$includes) {
          list.push.apply(list, this.flatten(mixins[i].$$includes));
        }
      }

      return list;
    },





    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL API
    ---------------------------------------------------------------------------
    */

    /**
     * This method will be attached to all mixins to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The mixin identifier
     */
    genericToString : function() {
      return "[Mixin " + this.name + "]";
    },


    /** Registers all defined mixins */
    $$registry : {},


    /** {Map} allowed keys in mixin definition */
    __allowedKeys : qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "include"    : "object",   // Mixin | Mixin[]
        "statics"    : "object",   // Map
        "members"    : "object",   // Map
        "properties" : "object",   // Map
        "events"     : "object",   // Map
        "destruct"   : "function", // Function
        "construct"  : "function"  // Function
      },

      "default" : null
    }),


    /**
     * Validates incoming configuration and checks keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     */
    __validateConfig : qx.core.Environment.select("qx.debug",
    {
      "true": function(name, config)
      {
        // Validate keys
        var allowed = this.__allowedKeys;
        for (var key in config)
        {
          if (!allowed[key]) {
            throw new Error('The configuration key "' + key + '" in mixin "' + name + '" is not allowed!');
          }

          if (config[key] == null) {
            throw new Error('Invalid key "' + key + '" in mixin "' + name + '"! The value is undefined/null!');
          }

          if (allowed[key] !== null && typeof config[key] !== allowed[key]) {
            throw new Error('Invalid type of key "' + key + '" in mixin "' + name + '"! The type of the key must be "' + allowed[key] + '"!');
          }
        }

        // Validate maps
        var maps = [ "statics", "members", "properties", "events" ];
        for (var i=0, l=maps.length; i<l; i++)
        {
          var key = maps[i];

          if (config[key] !== undefined && (config[key] instanceof Array || config[key] instanceof RegExp || config[key] instanceof Date || config[key].classname !== undefined)) {
            throw new Error('Invalid key "' + key + '" in mixin "' + name + '"! The value needs to be a map!');
          }
        }

        // Validate includes
        if (config.include)
        {
          for (var i=0, a=config.include, l=a.length; i<l; i++)
          {
            if (a[i] == null) {
              throw new Error("Includes of mixins must be mixins. The include number '" + (i+1) + "' in mixin '" + name + "'is undefined/null!");
            }

            if (a[i].$$type !== "Mixin") {
              throw new Error("Includes of mixins must be mixins. The include number '" + (i+1) + "' in mixin '" + name + "'is not a mixin!");
            }
          }

          this.checkCompatibility(config.include);
        }
      },

      "default" : function() {}
    })
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */
/* ************************************************************************

#require(qx.core.Environment)

************************************************************************ */

/**
 * Manage settings for framework/application wide initial setup routines.
 *
 * *Background information*
 *
 * One of the major problem of JavaScript frameworks is that you, as the
 * user of such a framework, cannot easily control one of the initial
 * settings. For example the framework may have defaults which only can
 * be changed after the framework is loaded, but not before. Most of the
 * time this restriction is not problematic. Many stuff is just then
 * interesting when the application main gets processed. But there are
 * exceptions like things which must be configured at load-time and not
 * after that.
 *
 * *What are settings?*
 *
 * This is where qooxdoo's new sophisticated settings system comes in.
 * And the best is that this feature is directly built into the core of
 * qooxdoo. This means that many initial settings are easily controllable
 * using a simple hash map structure or using simple generator flags.
 *
 * For example you can control the following things in qooxdoo:
 *
 * * All type of themes (colors, icons, widgets, appearance)
 * * Debug log level of certain areas (dispose and property)
 * * Resource-URLs of standard qooxdoo icons and widgets images
 * * Timeout of the image preloader
 * * The init component (graphical or non-graphical)
 * * Different debugging options for json, remote io, etc.
 *
 * You can find <a href="http://manual.qooxdoo.org/1.4/pages/core/settings.html#predefined-settings">predefined settings here</a>.
 *
 * This list shows you some of your possibilities.
 *
 * *Usage*
 *
 * A setting generally should only store simple primitive types
 * like strings. Settings are not update-able. They do not fire events
 * and they do not inform depending objects. The best way to work with
 * settings is to "compile" them into the application code. This is easily
 * possible using the corresponding flags of the qooxdoo build system.
 *
 * At initialization of this class all settings defined in the global
 * map <code>qxsettings</code> are imported. This map can also created
 * by hand and should be defined before loading qooxdoo. After the import
 * the settings system deletes the map.
 *
 * @deprecated since 1.4: Please use qx.core.Environment instead.
 */
qx.Bootstrap.define("qx.core.Setting",
{
  statics :
  {
    /** {Map} Internal storage */
    __settings : {},


    /**
     * Define a new setting
     *
     * @param key {String} The key to store the value under
     * @param defaultValue {String|Boolean|Number} Primitive default value for the new setting
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     *
     * @throws an exception if the setting is already defined (overwriting is not allowed at all)
     */
    define : function(key, defaultValue)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.Bootstrap.warn(
          "The method 'qx.core.Setting.define' is deprecated: " +
          "Please use qx.core.Environment.add() instead."
        );
      }

      this.defineDeprecated(key, defaultValue);
    },


    /**
     * Special method for deprecation the settings.
     *
     * @param key {String} The key to store the value under
     * @param defaultValue {String|Boolean|Number} Primitive default value for the new setting
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     *
     * @throws an exception if the setting is already defined (overwriting is not allowed at all)
     */
    defineDeprecated : function(key, defaultValue)
    {
      if (defaultValue === undefined) {
        throw new Error('Default value of setting "' + key + '" must be defined!');
      }

      if (!this.__settings[key]) {
        this.__settings[key] = {};
      } else if (this.__settings[key].defaultValue !== undefined) {
        throw new Error('Setting "' + key + '" is already defined!');
      }

      this.__settings[key].defaultValue = defaultValue;
    },


    /**
     * Get the value of a previously defined setting
     *
     * @param key {String} The key where the data is stored under
     * @return {String|Boolean|Number} The primitive value stored for the given setting
     * @throws an exception is the setting does not exist or the default value was not assigned
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     */
    get : function(key)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.Bootstrap.warn(
          "The method 'qx.core.Setting.get' is deprecated: " +
          "Please use qx.core.Environment.get() instead."
        );
      }
      var cache = this.__settings[key];

      if (cache === undefined) {
        throw new Error('Setting "' + key + '" is not defined.');
      }

      if (cache.value !== undefined) {
        return cache.value;
      }

      return cache.defaultValue;
    },


    /**
     * Set a settings value
     *
     * @internal Only to be used in unit tests.
     * @param key {String} The setting name
     * @param value {var} The new setting's value
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     */
     set : function(key, value) {
       if (qx.core.Environment.get("qx.debug")) {
         qx.Bootstrap.warn(
           "The method 'qx.core.Setting.set' is deprecated: " +
           "Please use qx.core.Environment.add() instead."
         );
       }

       this.setDeprecated(key, value);
     },


    /**
     * Set a settings value
     *
     * @internal Only to be used in unit tests.
     * @param key {String} The setting name
     * @param value {var} The new setting's value
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     */
    setDeprecated : function(key, value)
    {
      if ((key.split(".")).length < 2) {
        throw new Error('Malformed settings key "' + key + '". Must be following the schema "namespace.key".');
      }

      if (!this.__settings[key]) {
        this.__settings[key] = {};
      }

      this.__settings[key].value = value;
    },


    /**
     * Import settings from global qxsettings into current environment
     *
     * @return {void}
     * @throws an exception if a setting definition is in a wrong format
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     */
    __init : function()
    {
      if (window.qxsettings)
      {
        for (var key in window.qxsettings) {
          this.setDeprecated(key, window.qxsettings[key]);
        }

        window.qxsettings = undefined;

        try {
          delete window.qxsettings;
        } catch(ex) {};

        this.__loadUrlSettings();
      }
    },


    /**
     * Load settings from URL parameters if the setting <code>"qx.allowUrlSettings"</code>
     * is set to true.
     *
     * @deprecated since 1.4: Please use qx.core.Environment instead.
     */
    __loadUrlSettings : function()
    {
      if (qx.core.Environment.get("qx.allowUrlSettings") != true) {
        return
      }

      var urlSettings = document.location.search.slice(1).split("&");

      for (var i=0; i<urlSettings.length; i++)
      {
        var setting = urlSettings[i].split(":");
        if (setting.length != 3 || setting[0] != "qxsetting") {
          continue;
        }

        if (qx.core.Environment.get("qx.debug")) {
          qx.Bootstrap.warn(
            "URL settings are deprecated. Please use URL environment " +
            "variables instead. (qxsetting --> qxenv)"
          );
        }
        this.set(setting[1], decodeURIComponent(setting[2]));
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    statics.defineDeprecated("qx.allowUrlSettings", false);
    statics.defineDeprecated("qx.allowUrlVariants", false);
    statics.defineDeprecated("qx.propertyDebugLevel", 0);

    statics.__init();
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Basis for Aspect Oriented features in qooxdoo.
 *
 * This class makes it possible to attach functions (aspects) before or
 * after each function call of any function defined in {@link qx.Class#define}.
 *
 * Classes, which define own aspects must add an explicit require to this class
 * in the header comment using the following code:
 *
 * <pre>
 * &#35;require(qx.core.Aspect)
 * &#35;ignore(auto-require)
 * </pre>
 *
 * One example for a qooxdoo aspect is profiling ({@link qx.dev.Profile}).
 */
qx.Bootstrap.define("qx.core.Aspect",
{
  statics :
  {
    /** {Array} Registry for all known aspect wishes */
    __registry : [],


    /**
     * This function is used by {@link qx.Class#define} to wrap all statics, members and
     * constructors.
     *
     * @param fullName {String} Full name of the function including the class name.
     * @param fcn {Function} function to wrap.
     * @param type {String} Type of the wrapped function. One of "member", "static",
     *          "constructor", "destructor" or "property".
     *
     * @return {Function} wrapped function
     */
    wrap : function(fullName, fcn, type)
    {
      var before = [];
      var after = [];
      var reg = this.__registry;
      var entry;

      for (var i=0; i<reg.length; i++)
      {
        entry = reg[i];

        if ((entry.type == null || type == entry.type || entry.type == "*") && (entry.name == null || fullName.match(entry.name))) {
          entry.pos == -1 ? before.push(entry.fcn) : after.push(entry.fcn);
        }
      }

      if (before.length === 0 && after.length === 0) {
        return fcn;
      }

      var wrapper = function()
      {
        for (var i=0; i<before.length; i++) {
          before[i].call(this, fullName, fcn, type, arguments);
        }

        var ret = fcn.apply(this, arguments);

        for (var i=0; i<after.length; i++) {
          after[i].call(this, fullName, fcn, type, arguments, ret);
        }

        return ret;
      }

      if (type !== "static")
      {
        wrapper.self = fcn.self;
        wrapper.base = fcn.base;
      }

      fcn.wrapper = wrapper
      wrapper.original = fcn;

      return wrapper;
    },


    /**
     * Register a function to be called just before or after each time
     * one of the selected functions is called.
     *
     * @param fcn {Function} Function to be called just before or after any of the
     *     selected functions is called. If position is "before" the functions
     *     supports the same signature as {@link qx.dev.Profile#profileBefore}. If
     *     position is "after" it supports the same signature as
     *     {@link qx.dev.Profile#profileAfter}.
     * @param position {String?"after"} One of "before" or "after". Whether the function
     *     should be called before or after the wrapped function.
     * @param type {String?null} Type of the wrapped function. One of "member",
     *     "static", "constructor", "destructor", "property" or "*". <code>null</code>
     *     is handled identical to "*".
     * @param name {String|RegExp?null} Each function, with a full name matching
     *     this pattern (using <code>fullName.match(name)</code>) will be
     *     wrapped.
     */
    addAdvice : function(fcn, position, type, name)
    {
      this.__registry.push(
      {
        fcn: fcn,
        pos: position === "before" ? -1 : 1,
        type: type,
        name: name
      });
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The intention of this class is to add features to native JavaScript
 * objects so that all browsers operate on a common JavaScript language level
 * (particularly JavaScript 1.6).
 *
 * The methods defined in this class contain implementations of methods, which
 * are not supported by all browsers. If a method is supported it points to
 * the native implementation, otherwise it contains an emulation function.
 *
 * For reference:
 *
 * * http://www.ecma-international.org/publications/standards/Ecma-262.htm
 * * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference
 * * http://developer.mozilla.org/en/docs/New_in_JavaScript_1.6
 *
 * The following methods are added if they are not supported natively:
 *
 * * Error.toString()
 * * Array.indexOf()
 * * Array.lastIndexOf()
 * * Array.forEach()
 * * Array.filter()
 * * Array.map()
 * * Array.some()
 * * Array.every()
 * * String.quote()
 */
qx.Bootstrap.define("qx.lang.Core",
{
  statics :
  {
    /**
     * Some browsers (e.g. Internet Explorer) do not support to stringify
     * error objects like other browsers usually do. This feature is added to
     * those browsers.
     *
     * @signature function()
     * @return {String} Error message
     */
    errorToString :
      {
        "native" : Error.prototype.toString,

        "emulated" : function() {
          return this.message;
        }
      }
    [(!Error.prototype.toString || Error.prototype.toString() == "[object Error]") ? "emulated" : "native"],


    /**
     * Returns the first index at which a given element can be found in the array,
     * or <code>-1</code> if it is not present. It compares <code>searchElement</code> to elements of the Array
     * using strict equality (the same method used by the <code>===</code>, or
     * triple-equals, operator).
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:indexOf
     *
     * @signature function(searchElement, fromIndex)
     * @param searchElement {var} Element to locate in the array.
     * @param fromIndex {Integer} The index at which to begin the search. Defaults to 0, i.e. the whole
     *         array will be searched. If the index is greater than or equal to the length of the array,
     *         <code>-1</code> is returned, i.e. the array will not be searched. If negative, it is taken as the
     *         offset from the end of the array. Note that even when the index is negative, the array is still
     *         searched from front to back. If the calculated index is less than 0, the whole array will be searched.
     * @return {Integer} Returns the first index at which a given element can
     *    be found in the array, or <code>-1</code> if it is not present.
     */
    arrayIndexOf :
    {
      "native" : Array.prototype.indexOf,

      "emulated" : function(searchElement, fromIndex)
      {
        if (fromIndex == null) {
          fromIndex = 0;
        } else if (fromIndex < 0) {
          fromIndex = Math.max(0, this.length + fromIndex);
        }

        for (var i=fromIndex; i<this.length; i++)
        {
          if (this[i] === searchElement) {
            return i;
          }
        }

        return -1;
      }
    }[Array.prototype.indexOf ? "native" : "emulated"],


    /**
     * Returns the last index at which a given element can be found in the array, or <code>-1</code>
     * if it is not present. The array is searched backwards, starting at <code>fromIndex</code>.
     * It compares <code>searchElement</code> to elements of the Array using strict equality
     * (the same method used by the <code>===</code>, or triple-equals, operator).
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
     *
     * @signature function(searchElement, fromIndex)
     * @param searchElement {var} Element to locate in the array.
     * @param fromIndex {Integer} The index at which to start searching backwards.
     *         Defaults to the array's length, i.e. the whole array will be searched. If
     *         the index is greater than or equal to the length of the array, the whole array
     *         will be searched. If negative, it is taken as the offset from the end of the
     *         array. Note that even when the index is negative, the array is still searched
     *         from back to front. If the calculated index is less than 0, -1 is returned,
     *         i.e. the array will not be searched.
     * @return {Integer} Returns the last index at which a given element can be
     *    found in the array, or <code>-1</code> if it is not present.
     */
    arrayLastIndexOf :
    {
      "native" : Array.prototype.lastIndexOf,

      "emulated" : function(searchElement, fromIndex)
      {
        if (fromIndex == null) {
          fromIndex = this.length - 1;
        } else if (fromIndex < 0) {
          fromIndex = Math.max(0, this.length + fromIndex);
        }

        for (var i=fromIndex; i>=0; i--)
        {
          if (this[i] === searchElement) {
            return i;
          }
        }

        return -1;
      }
    }[Array.prototype.lastIndexOf ? "native" : "emulated"],


    /**
     * Executes a provided function once per array element.
     *
     * <code>forEach</code> executes the provided function (<code>callback</code>) once for each
     * element present in the array.  <code>callback</code> is invoked only for indexes of the array
     * which have assigned values; it is not invoked for indexes which have been deleted or which
     * have never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index
     * of the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>forEach</code>, it will be used
     * as the <code>this</code> for each invocation of the <code>callback</code>.  If it is not
     * provided, or is <code>null</code>, the global object associated with <code>callback</code>
     * is used instead.
     *
     * <code>forEach</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>forEach</code> is set before the first invocation of
     * <code>callback</code>.  Elements which are appended to the array after the call to
     * <code>forEach</code> begins will not be visited by <code>callback</code>. If existing elements
     * of the array are changed, or deleted, their value as passed to <code>callback</code> will be
     * the value at the time <code>forEach</code> visits them; elements that are deleted are not visited.
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:forEach
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to execute for each element.
     * @param obj {Object} Object to use as this when executing callback.
     * @return {void}
     */
    arrayForEach :
    {
      "native" : Array.prototype.forEach,

      "emulated" : function(callback, obj)
      {
        var l = this.length;
        for (var i=0; i<l; i++)
        {
          var value = this[i];
          if (value !== undefined)  {
            callback.call(obj || window, value, i, this);
          }
        }
      }
    }[Array.prototype.forEach ? "native" : "emulated"],


    /**
     * Creates a new array with all elements that pass the test implemented by the provided
     * function.
     *
     * <code>filter</code> calls a provided <code>callback</code> function once for each
     * element in an array, and constructs a new array of all the values for which
     * <code>callback</code> returns a true value.  <code>callback</code> is invoked only
     * for indexes of the array which have assigned values; it is not invoked for indexes
     * which have been deleted or which have never been assigned values.  Array elements which
     * do not pass the <code>callback</code> test are simply skipped, and are not included
     * in the new array.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the
     * index of the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>filter</code>, it will
     * be used as the <code>this</code> for each invocation of the <code>callback</code>.
     * If it is not provided, or is <code>null</code>, the global object associated with
     * <code>callback</code> is used instead.
     *
     * <code>filter</code> does not mutate the array on which it is called. The range of
     * elements processed by <code>filter</code> is set before the first invocation of
     * <code>callback</code>. Elements which are appended to the array after the call to
     * <code>filter</code> begins will not be visited by <code>callback</code>. If existing
     * elements of the array are changed, or deleted, their value as passed to <code>callback</code>
     * will be the value at the time <code>filter</code> visits them; elements that are deleted
     * are not visited.
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:filter
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to test each element of the array.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Array} Returns a new array with all elements that pass the test
     *    implemented by the provided function.
     */
    arrayFilter :
    {
      "native" : Array.prototype.filter,

      "emulated" : function(callback, obj)
      {
        var res = [];

        var l = this.length;
        for (var i=0; i<l; i++)
        {
          var value = this[i];
          if (value !== undefined)
          {
            if (callback.call(obj || window, value, i, this)) {
              res.push(this[i]);
            }
          }
        }

        return res;
      }
    }[Array.prototype.filter ? "native" : "emulated"],


    /**
     * Creates a new array with the results of calling a provided function on every element in this array.
     *
     * <code>map</code> calls a provided <code>callback</code> function once for each element in an array,
     * in order, and constructs a new array from the results.  <code>callback</code> is invoked only for
     * indexes of the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of the
     * element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>map</code>, it will be used as the
     * <code>this</code> for each invocation of the <code>callback</code>. If it is not provided, or is
     * <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>map</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>map</code> is set before the first invocation of
     * <code>callback</code>. Elements which are appended to the array after the call to <code>map</code>
     * begins will not be visited by <code>callback</code>.  If existing elements of the array are changed,
     * or deleted, their value as passed to <code>callback</code> will be the value at the time
     * <code>map</code> visits them; elements that are deleted are not visited.
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:map
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function produce an element of the new Array from an element of the current one.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Array} Returns a new array with the results of calling a provided
     *    function on every element in this array.
     */
    arrayMap :
    {
      "native" : Array.prototype.map,

      "emulated" : function(callback, obj)
      {
        var res = [];

        var l = this.length;
        for (var i=0; i<l; i++)
        {
          var value = this[i];
          if (value !== undefined) {
            res[i] = callback.call(obj || window, value, i, this);
          }
        }

        return res;
      }
    }[Array.prototype.map ? "native" : "emulated"],


    /**
     * Tests whether some element in the array passes the test implemented by the provided function.
     *
     * <code>some</code> executes the <code>callback</code> function once for each element present in
     * the array until it finds one where <code>callback</code> returns a true value. If such an element
     * is found, <code>some</code> immediately returns <code>true</code>. Otherwise, <code>some</code>
     * returns <code>false</code>. <code>callback</code> is invoked only for indexes of the array which
     * have assigned values; it is not invoked for indexes which have been deleted or which have never
     * been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of the
     * element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>some</code>, it will be used as the
     * <code>this</code> for each invocation of the <code>callback</code>. If it is not provided, or is
     * <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>some</code> does not mutate the array on which it is called.
     *
     * The range of elements processed by <code>some</code> is set before the first invocation of
     * <code>callback</code>.  Elements that are appended to the array after the call to <code>some</code>
     * begins will not be visited by <code>callback</code>. If an existing, unvisited element of the array
     * is changed by <code>callback</code>, its value passed to the visiting <code>callback</code> will
     * be the value at the time that <code>some</code> visits that element's index; elements that are
     * deleted are not visited.
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:some
     *
     * @param callback {Function} Function to test for each element.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Boolean} Returns <code>true</code> whether some element in the
     *    array passes the test implemented by the provided function,
     *    <code>false</code> otherwise.
     */
    arraySome :
    {
      "native" : Array.prototype.some,

      "emulated" : function(callback, obj)
      {
        var l = this.length;
        for (var i=0; i<l; i++)
        {
          var value = this[i];
          if (value !== undefined)
          {
            if (callback.call(obj || window, value, i, this)) {
              return true;
            }
          }
        }

        return false;
      }
    }[Array.prototype.some ? "native" : "emulated"],


    /**
     * Tests whether all elements in the array pass the test implemented by the provided function.
     *
     * <code>every</code> executes the provided <code>callback</code> function once for each element
     * present in the array until it finds one where <code>callback</code> returns a false value. If
     * such an element is found, the <code>every</code> method immediately returns <code>false</code>.
     * Otherwise, if <code>callback</code> returned a true value for all elements, <code>every</code>
     * will return <code>true</code>.  <code>callback</code> is invoked only for indexes of the array
     * which have assigned values; it is not invoked for indexes which have been deleted or which have
     * never been assigned values.
     *
     * <code>callback</code> is invoked with three arguments: the value of the element, the index of
     * the element, and the Array object being traversed.
     *
     * If a <code>obj</code> parameter is provided to <code>every</code>, it will be used as
     * the <code>this</code> for each invocation of the <code>callback</code>. If it is not provided,
     * or is <code>null</code>, the global object associated with <code>callback</code> is used instead.
     *
     * <code>every</code> does not mutate the array on which it is called. The range of elements processed
     * by <code>every</code> is set before the first invocation of <code>callback</code>. Elements which
     * are appended to the array after the call to <code>every</code> begins will not be visited by
     * <code>callback</code>.  If existing elements of the array are changed, their value as passed
     * to <code>callback</code> will be the value at the time <code>every</code> visits them; elements
     * that are deleted are not visited.
     *
     * Natively supported in Gecko since version 1.8.
     * http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:every
     *
     * @signature function(callback, obj)
     * @param callback {Function} Function to test for each element.
     * @param obj {Object} Object to use as <code>this</code> when executing <code>callback</code>.
     * @return {Boolean} Returns <code>false</code> whether all elements in the
     *    array pass the test implemented by the provided function,
     *    <code>false</code> otherwise.
     */
    arrayEvery :
    {
      "native" : Array.prototype.every,

      "emulated" : function(callback, obj)
      {
        var l = this.length;
        for (var i=0; i<l; i++)
        {
          var value = this[i];
          if (value !== undefined)
          {
            if (!callback.call(obj || window, value, i, this)) {
              return false;
            }
          }
        }

        return true;
      }
    }[Array.prototype.every ? "native" :"emulated"],


    /**
     * Surrounds the string with double quotes and escapes all double quotes
     * and backslashes within the string.
     *
     * Note: Not part of ECMAScript Language Specification ECMA-262
     *       3rd edition (December 1999), but implemented by Gecko:
     *       http://lxr.mozilla.org/seamonkey/source/js/src/jsstr.c
     *
     * @signature function()
     * @return {String} Returns a string with double quotes and escapes all
     *    double quotes and backslashes within the string.
     */
    stringQuote :
    {
      "native" : String.prototype.quote,

      "emulated" : function() {
        return '"' + this.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"") + '"';
      }
    }[String.prototype.quote ? "native" : "emulated"]
  }
});

/*
---------------------------------------------------------------------------
  FEATURE EXTENSION OF NATIVE ERROR OBJECT
---------------------------------------------------------------------------
*/

Error.prototype.toString = qx.lang.Core.errorToString;


/*
---------------------------------------------------------------------------
  FEATURE EXTENSION OF NATIVE ARRAY OBJECT
---------------------------------------------------------------------------
*/

Array.prototype.indexOf = qx.lang.Core.arrayIndexOf;
Array.prototype.lastIndexOf = qx.lang.Core.arrayLastIndexOf;
Array.prototype.forEach = qx.lang.Core.arrayForEach;
Array.prototype.filter = qx.lang.Core.arrayFilter;
Array.prototype.map = qx.lang.Core.arrayMap;
Array.prototype.some = qx.lang.Core.arraySome;
Array.prototype.every = qx.lang.Core.arrayEvery;


/*
---------------------------------------------------------------------------
  FEATURE EXTENSION OF NATIVE STRING OBJECT
---------------------------------------------------------------------------
*/

String.prototype.quote = qx.lang.Core.stringQuote;

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/* ************************************************************************

#optional(qx.Interface)
#use(qx.event.type.Data)
#use(qx.event.dispatch.Direct)

************************************************************************ */

/**
 * Internal class for handling of dynamic properties. Should only be used
 * through the methods provided by {@link qx.Class}.
 *
 * For a complete documentation of properties take a look at
 * http://manual.qooxdoo.org/1.4/pages/core.html#properties.
 *
 *
 * *Normal properties*
 *
 * The <code>properties</code> key in the class definition map of {@link qx.Class#define}
 * is used to generate the properties.
 *
 * Valid keys of a property definition are:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>check</th><td>Array, String, Function</td><td>
 *     The check is used to check the type the incoming value of a property. This will only
 *     be executed in the source version. The build version will not contain the checks.
 *     The check can be:
 *     <ul>
 *       <li>a custom check function. The function takes the incoming value as a parameter and must
 *           return a boolean value to indicate whether the values is valid.
 *       </li>
 *       <li>inline check code as a string e.g. <code>"value &gt; 0 && value &lt; 100"</code></li>
 *       <li>a class name e.g. <code>qx.ui.form.Button</code></li>
 *       <li>a name of an interface the value must implement</li>
 *       <li>an array of all valid values</li>
 *       <li>one of the predefined checks: Boolean, String, Number, Integer, Float, Double,
 *           Object, Array, Map, Class, Mixin, Interface, Theme, Error, RegExp, Function,
 *           Date, Node, Element, Document, Window, Event
 *       </li>
 *     <ul>
 *   </td></tr>
 *   <tr><th>init</th><td>var</td><td>
 *     Sets the default/initial value of the property. If no property value is set or the property
 *     gets reset, the getter will return the <code>init</code> value.
 *   </td></tr>
 *   <tr><th>apply</th><td>String</td><td>
 *     On change of the property value the method of the specified name will be called. The signature of
 *     the method is <code>function(newValue, oldValue, propertyName)</code>. It is conventional to name
 *     the callback <code>_apply</code> + <i>PropertyName</i>, with the property name camel-cased (e.g.
 *     "<i>_applyFooBar</i>" for a property <i>fooBar</i>).
 *   </td></tr>
 *   <tr><th>event</th><td>String</td><td>
 *     On change of the property value an event with the given name will be dispatched. The event type is
 *     {@link qx.event.type.Data}.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 *   <tr><th>inheritable</th><td>Boolean</td><td>
 *     Whether the property value should be inheritable. If the property does not have an user defined or an
 *     init value, the property will try to get the value from the parent of the current object.
 *   </td></tr>
 *   <tr><th>nullable</th><td>Boolean</td><td>
 *     Whether <code>null</code> is an allowed value of the property. This is complementary to the check
 *     defined using the <code>check</code> key.
 *   </td></tr>
 *   <tr><th>refine</th><td>Boolean</td><td>
 *     Whether the property definition is a refinement of a property in one of the super classes of the class.
 *     Only the <code>init</code> value can be changed using refine.
 *   </td></tr>
 *   <tr><th>transform</th><td>String</td><td>
 *     On setting of the property value the method of the specified name will
 *     be called. The signature of the method is <code>function(value)</code>.
 *     The parameter <code>value</code> is the value passed to the setter.
 *     The function must return the modified or unmodified value.
 *     Transformation occurs before the check function, so both may be
 *     specified if desired.  Alternatively, the transform function may throw
 *     an error if the value passed to it is invalid.
 *   </td></tr>
 *   <tr><th>validate</th><td>Function, String</td><td>
 *     On setting of the property value the method of the specified name will
 *     be called. The signature of the method is <code>function(value)</code>.
 *     The parameter <code>value</code> is the value passed to the setter.
 *     If the validation fails, an <code>qx.core.ValidationError</code> should
 *     be thrown by the validation function. Otherwise, just do nothing in the
 *     function.<br>
 *     If a string is given, the string should hold a reference to a member
 *     method.<br>
 *     <code>"<i>methodname</i>"</code> for example
 *     <code>"this.__validateProperty"</code><br>
 *     There are some default validators in the {@link qx.util.Validate} class.
 *     See this documentation for usage examples.
 *   </td></tr>
 *   <tr><th>dereference</th><td>Boolean</td><td>
 *     By default, the references to the values (current, init, ...) of the
 *     property will be stored as references on the object. When disposing
 *     this object, the references will not be deleted. Setting the
 *     dereference key to true tells the property system to delete all
 *     connections made by this property on dispose. This can be necessary for
 *     disconnecting DOM objects to allow the garbage collector to work
 *     properly.
 *   </td></tr>
 * </table>
 *
 * *Property groups*
 *
 * Property groups are defined in a similar way but support a different set of keys:
 *
 * <table>
 *   <tr><th>Name</th><th>Type</th><th>Description</th></tr>
 *   <tr><th>group</th><td>String[]</td><td>
 *     A list of property names which should be set using the property group.
 *   </td></tr>
 *   <tr><th>mode</th><td>String</td><td>
 *     If mode is set to <code>"shorthand"</code>, the properties can be set using a CSS like shorthand mode.
 *   </td></tr>
 *   <tr><th>themeable</th><td>Boolean</td><td>
 *     Whether this property can be set using themes.
 *   </td></tr>
 * </table>
 *
 * @internal
 */
qx.Bootstrap.define("qx.core.Property",
{
  statics :
  {
    /**
     * Built-in checks
     * The keys could be used in the check of the properties
     */
    __checks :
    {
      "Boolean"   : 'qx.core.Assert.assertBoolean(value, msg) || true',
      "String"    : 'qx.core.Assert.assertString(value, msg) || true',

      "Number"    : 'qx.core.Assert.assertNumber(value, msg) || true',
      "Integer"   : 'qx.core.Assert.assertInteger(value, msg) || true',
      "PositiveNumber" : 'qx.core.Assert.assertPositiveNumber(value, msg) || true',
      "PositiveInteger" : 'qx.core.Assert.assertPositiveInteger(value, msg) || true',

      "Error"     : 'qx.core.Assert.assertInstance(value, Error, msg) || true',
      "RegExp"    : 'qx.core.Assert.assertInstance(value, RegExp, msg) || true',

      "Object"    : 'qx.core.Assert.assertObject(value, msg) || true',
      "Array"     : 'qx.core.Assert.assertArray(value, msg) || true',
      "Map"       : 'qx.core.Assert.assertMap(value, msg) || true',

      "Function"  : 'qx.core.Assert.assertFunction(value, msg) || true',
      "Date"      : 'qx.core.Assert.assertInstance(value, Date, msg) || true',
      "Node"      : 'value !== null && value.nodeType !== undefined',
      "Element"   : 'value !== null && value.nodeType === 1 && value.attributes',
      "Document"  : 'value !== null && value.nodeType === 9 && value.documentElement',
      "Window"    : 'value !== null && value.document',
      "Event"     : 'value !== null && value.type !== undefined',

      "Class"     : 'value !== null && value.$$type === "Class"',
      "Mixin"     : 'value !== null && value.$$type === "Mixin"',
      "Interface" : 'value !== null && value.$$type === "Interface"',
      "Theme"     : 'value !== null && value.$$type === "Theme"',

      "Color"     : 'qx.lang.Type.isString(value) && qx.util.ColorUtil.isValidPropertyValue(value)',
      "Decorator" : 'value !== null && qx.theme.manager.Decoration.getInstance().isValidPropertyValue(value)',
      "Font"      : 'value !== null && qx.theme.manager.Font.getInstance().isDynamic(value)'
    },


    /**
     * Contains types from {@link #__checks} list which need to be dereferenced
     */
    __dereference :
    {
      "Node"      : true,
      "Element"   : true,
      "Document"  : true,
      "Window"    : true,
      "Event"     : true
    },


    /**
     * Inherit value, used to override defaults etc. to force inheritance
     * even if property value is not undefined (through multi-values)
     *
     * @internal
     */
    $$inherit : "inherit",


    /**
     * Caching field names for each property created
     *
     * @internal
     */
    $$store :
    {
      runtime : {},
      user    : {},
      theme   : {},
      inherit : {},
      init    : {},
      useinit : {}
    },


    /**
     * Caching function names for each property created
     *
     * @internal
     */
    $$method :
    {
      get          : {},
      set          : {},
      reset        : {},
      init         : {},
      refresh      : {},
      setRuntime   : {},
      resetRuntime : {},
      setThemed    : {},
      resetThemed  : {}
    },


    /**
     * Supported keys for property defintions
     *
     * @internal
     */
    $$allowedKeys :
    {
      name         : "string",   // String
      dereference  : "boolean",  // Boolean
      inheritable  : "boolean",  // Boolean
      nullable     : "boolean",  // Boolean
      themeable    : "boolean",  // Boolean
      refine       : "boolean",  // Boolean
      init         : null,       // var
      apply        : "string",   // String
      event        : "string",   // String
      check        : null,       // Array, String, Function
      transform    : "string",   // String
      deferredInit : "boolean",  // Boolean
      validate     : null        // String, Function
    },


    /**
     * Supported keys for property group definitions
     *
     * @internal
     */
    $$allowedGroupKeys :
    {
      name      : "string",   // String
      group     : "object",   // Array
      mode      : "string",   // String
      themeable : "boolean"   // Boolean
    },


    /** Contains names of inheritable properties, filled by {@link qx.Class.define} */
    $$inheritable : {},


    /**
     * Generate optimized refresh method and  attach it to the class' prototype
     *
     * @param clazz {Clazz} clazz to which the refresher should be added
     */
    __executeOptimizedRefresh : function(clazz)
    {
      var inheritables = this.__getInheritablesOfClass(clazz);

      if (!inheritables.length) {
        var refresher = function () {};
      } else {
        refresher = this.__createRefresher(inheritables);
      }

      clazz.prototype.$$refreshInheritables = refresher;
    },


    /**
     * Get the names of all inheritable properties of the given class
     *
     * @param clazz {Clazz} class to get the inheritable properties of
     * @return {String[]} List of property names
     */
    __getInheritablesOfClass : function(clazz)
    {
      var inheritable = [];

      while(clazz)
      {
        var properties = clazz.$$properties;

        if (properties)
        {
          for (var name in this.$$inheritable)
          {
            // Whether the property is available in this class
            // and whether it is inheritable in this class as well
            if (properties[name] && properties[name].inheritable)
            {
              inheritable.push(name);
            }
          }
        }

        clazz = clazz.superclass;
      }

      return inheritable;
    },


    /**
     * Assemble the refresher code and return the generated function
     *
     * @param inheritables {String[]} list of inheritable properties
     */
    __createRefresher : function(inheritables)
    {
      var inherit = this.$$store.inherit;
      var init = this.$$store.init;
      var refresh = this.$$method.refresh;

      var code = [
        "var parent = this.getLayoutParent();",
        "if (!parent) return;"
      ];

      for (var i=0, l=inheritables.length; i<l; i++)
      {
        var name = inheritables[i];
        code.push(
          "var value = parent.", inherit[name],";",
          "if (value===undefined) value = parent.", init[name], ";",
          "this.", refresh[name], "(value);"
        );
      }

      return new Function(code.join(""));
    },


    /**
     * Attach $$refreshInheritables method stub to the given class
     *
     * @param clazz {Clazz} clazz to which the refresher should be added
     */
    attachRefreshInheritables : function(clazz)
    {
      clazz.prototype.$$refreshInheritables = function()
      {
        qx.core.Property.__executeOptimizedRefresh(clazz);
        return this.$$refreshInheritables();
      }
    },


    /**
     * Attach one property to class
     *
     * @param clazz {Class} Class to attach properties to
     * @param name {String} Name of property
     * @param config {Map} Configuration map of property
     * @return {void}
     */
    attachMethods : function(clazz, name, config)
    {
      // Divide groups from "normal" properties
      config.group ?
        this.__attachGroupMethods(clazz, config, name) :
        this.__attachPropertyMethods(clazz, config, name);
    },


    /**
     * Attach group methods
     *
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @param name {String} Name of the property
     * @return {void}
     */
    __attachGroupMethods : function(clazz, config, name)
    {
      var upname = qx.Bootstrap.firstUp(name);
      var members = clazz.prototype;
      var themeable = config.themeable === true;

      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.core.Environment.get("qx.propertyDebugLevel") > 1) {
          qx.Bootstrap.debug("Generating property group: " + name);
        }
      }

      var setter = [];
      var resetter = [];

      if (themeable)
      {
        var styler = [];
        var unstyler = [];
      }

      var argHandler = "var a=arguments[0] instanceof Array?arguments[0]:arguments;";

      setter.push(argHandler);

      if (themeable) {
        styler.push(argHandler);
      }

      if (config.mode == "shorthand")
      {
        var shorthand = "a=qx.lang.Array.fromShortHand(qx.lang.Array.fromArguments(a));";
        setter.push(shorthand);

        if (themeable) {
          styler.push(shorthand);
        }
      }

      for (var i=0, a=config.group, l=a.length; i<l; i++)
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          if (!this.$$method.set[a[i]]||!this.$$method.reset[a[i]]) {
            throw new Error("Cannot create property group '" + name + "' including non-existing property '" + a[i] + "'!");
          }
        }

        setter.push("this.", this.$$method.set[a[i]], "(a[", i, "]);");
        resetter.push("this.", this.$$method.reset[a[i]], "();");

        if (themeable)
        {
          if (qx.core.Environment.get("qx.debug"))
          {
            if (!this.$$method.setThemed[a[i]]) {
              throw new Error("Cannot add the non themable property '" + a[i] + "' to the themable property group '"+ name +"'");
            }
          }

          styler.push("this.", this.$$method.setThemed[a[i]], "(a[", i, "]);");
          unstyler.push("this.", this.$$method.resetThemed[a[i]], "();");
        }
      }

      // Attach setter
      this.$$method.set[name] = "set" + upname;
      members[this.$$method.set[name]] = new Function(setter.join(""));

      // Attach resetter
      this.$$method.reset[name] = "reset" + upname;
      members[this.$$method.reset[name]] = new Function(resetter.join(""));

      if (themeable)
      {
        // Attach styler
        this.$$method.setThemed[name] = "setThemed" + upname;
        members[this.$$method.setThemed[name]] = new Function(styler.join(""));

        // Attach unstyler
        this.$$method.resetThemed[name] = "resetThemed" + upname;
        members[this.$$method.resetThemed[name]] = new Function(unstyler.join(""));
      }
    },


    /**
     * Attach property methods
     *
     * @param clazz {Class} Class to attach properties to
     * @param config {Map} Property configuration
     * @param name {String} Name of the property
     * @return {void}
     */
    __attachPropertyMethods : function(clazz, config, name)
    {
      var upname = qx.Bootstrap.firstUp(name);
      var members = clazz.prototype;

      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.core.Environment.get("qx.propertyDebugLevel") > 1) {
          qx.Bootstrap.debug("Generating property wrappers: " + name);
        }
      }

      // Fill dispose value
      if (config.dereference === undefined && typeof config.check === "string") {
        config.dereference = this.__shouldBeDereferenced(config.check);
      }

      var method = this.$$method;
      var store = this.$$store;

      store.runtime[name] = "$$runtime_" + name;
      store.user[name] = "$$user_" + name;
      store.theme[name] = "$$theme_" + name;
      store.init[name] = "$$init_" + name;
      store.inherit[name] = "$$inherit_" + name;
      store.useinit[name] = "$$useinit_" + name;

      method.get[name] = "get" + upname;
      members[method.get[name]] = function() {
        return qx.core.Property.executeOptimizedGetter(this, clazz, name, "get");
      }

      method.set[name] = "set" + upname;
      members[method.set[name]] = function(value) {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "set", arguments);
      }

      method.reset[name] = "reset" + upname;
      members[method.reset[name]] = function() {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "reset");
      }

      if (config.inheritable || config.apply || config.event || config.deferredInit)
      {
        method.init[name] = "init" + upname;
        members[method.init[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "init", arguments);
        }
      }

      if (config.inheritable)
      {
        method.refresh[name] = "refresh" + upname;
        members[method.refresh[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "refresh", arguments);
        }
      }

      method.setRuntime[name] = "setRuntime" + upname;
      members[method.setRuntime[name]] = function(value) {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "setRuntime", arguments);
      }

      method.resetRuntime[name] = "resetRuntime" + upname;
      members[method.resetRuntime[name]] = function() {
        return qx.core.Property.executeOptimizedSetter(this, clazz, name, "resetRuntime");
      }

      if (config.themeable)
      {
        method.setThemed[name] = "setThemed" + upname;
        members[method.setThemed[name]] = function(value) {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "setThemed", arguments);
        }

        method.resetThemed[name] = "resetThemed" + upname;
        members[method.resetThemed[name]] = function() {
          return qx.core.Property.executeOptimizedSetter(this, clazz, name, "resetThemed");
        }
      }

      if (config.check === "Boolean")
      {
        members["toggle" + upname] = new Function("return this." + method.set[name] + "(!this." + method.get[name] + "())");
        members["is" + upname] = new Function("return this." + method.get[name] + "()");
      }
    },


    /**
     * Returns if the reference for the given property check should be removed
     * on dispose.
     *
     * @param check {var} The check of the property definition.
     * @return {Boolean} If the dereference key should be set.
     */
    __shouldBeDereferenced :  function(check) {
      return !!this.__dereference[check];
    },


    /**
     * Special function for IE6 and FF2 which returns if the reference for
     * the given property check should be removed on dispose.
     * As IE6 and FF2 seem to have bad garbage collection behaviors, we should
     * additionally remove all references between qooxdoo objects and
     * interfaces.
     *
     * @param check {var} The check of the property definition.
     * @return {Boolean} If the dereference key should be set.
     */
    __shouldBeDereferencedOld : function(check)
    {
      return this.__dereference[check] ||
      qx.Bootstrap.classIsDefined(check) ||
      (qx.Interface && qx.Interface.isDefined(check));
    },


    /** {Map} Internal data field for error messages used by {@link #error} */
    __errors :
    {
      0 : 'Could not change or apply init value after constructing phase!',
      1 : 'Requires exactly one argument!',
      2 : 'Undefined value is not allowed!',
      3 : 'Does not allow any arguments!',
      4 : 'Null value is not allowed!',
      5 : 'Is invalid!'
    },


    /**
     * Error method used by the property system to report errors.
     *
     * @param obj {qx.core.Object} Any qooxdoo object
     * @param id {Integer} Numeric error identifier
     * @param property {String} Name of the property
     * @param variant {String} Name of the method variant e.g. "set", "reset", ...
     * @param value {var} Incoming value
     */
    error : function(obj, id, property, variant, value)
    {
      var classname = obj.constructor.classname;
      var msg = "Error in property " + property + " of class " + classname +
        " in method " + this.$$method[variant][property] + " with incoming value '" + value + "': ";

      throw new Error(msg + (this.__errors[id] || "Unknown reason: " + id));
    },


    /**
     * Compiles a string builder object to a function, executes the function and
     * returns the return value.
     *
     * @param instance {Object} Instance which have called the original method
     * @param members {Object} Prototype members map where the new function should be stored
     * @param name {String} Name of the property
     * @param variant {String} Function variant e.g. get, set, reset, ...
     * @param code {Array} Array which contains the code
     * @param args {arguments} Incoming arguments of wrapper method
     * @return {var} Return value of the generated function
     */
    __unwrapFunctionFromCode : function(instance, members, name, variant, code, args)
    {
      var store = this.$$method[variant][name];

      // Output generate code
      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.core.Environment.get("qx.propertyDebugLevel") > 1) {
          qx.Bootstrap.debug("Code[" + this.$$method[variant][name] + "]: " + code.join(""));
        }

        // Overriding temporary wrapper
        try{
          members[store] =  new Function("value", code.join(""));
        } catch(ex) {
          throw new Error("Malformed generated code to unwrap method: " + this.$$method[variant][name] + "\n" + code.join(""));
        }
      }
      else
      {
        members[store] =  new Function("value", code.join(""));
      }

      // Enable profiling code
      if (qx.core.Environment.get("qx.aspects")) {
        members[store] = qx.core.Aspect.wrap(instance.classname + "." + store, members[store], "property");
      }

      qx.Bootstrap.setDisplayName(members[store], instance.classname + ".prototype", store)

      // Executing new function
      if (args === undefined) {
        return instance[store]();
      } else if (qx.core.Environment.get("qx.debug")) {
        return instance[store].apply(instance, args);
      } else {
        return instance[store](args[0]);
      }
    },


    /**
     * Generates the optimized getter
     * Supported variants: get
     *
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedGetter : function(instance, clazz, name, variant)
    {
      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var code = [];
      var store = this.$$store;

      code.push('if(this.', store.runtime[name], '!==undefined)');
      code.push('return this.', store.runtime[name], ';');

      if (config.inheritable)
      {
        code.push('else if(this.', store.inherit[name], '!==undefined)');
        code.push('return this.', store.inherit[name], ';');
        code.push('else ');
      }

      code.push('if(this.', store.user[name], '!==undefined)');
      code.push('return this.', store.user[name], ';');

      if (config.themeable)
      {
        code.push('else if(this.', store.theme[name], '!==undefined)');
        code.push('return this.', store.theme[name], ';');
      }

      if (config.deferredInit && config.init === undefined)
      {
        code.push('else if(this.', store.init[name], '!==undefined)');
        code.push('return this.', store.init[name], ';');
      }

      code.push('else ');

      if (config.init !== undefined)
      {
        if (config.inheritable)
        {
          code.push('var init=this.', store.init[name], ';');

          if (config.nullable) {
            code.push('if(init==qx.core.Property.$$inherit)init=null;');
          } else if (config.init !== undefined) {
            code.push('return this.', store.init[name], ';');
          } else {
            code.push('if(init==qx.core.Property.$$inherit)throw new Error("Inheritable property ', name, ' of an instance of ', clazz.classname, ' is not (yet) ready!");');
          }

          code.push('return init;');
        }
        else
        {
          code.push('return this.', store.init[name], ';');
        }
      }
      else if (config.inheritable || config.nullable) {
        code.push('return null;');
      } else {
        code.push('throw new Error("Property ', name, ' of an instance of ', clazz.classname, ' is not (yet) ready!");');
      }

      return this.__unwrapFunctionFromCode(instance, members, name, variant, code);
    },


    /**
     * Generates the optimized setter
     * Supported variants: set, reset, init, refresh, style, unstyle
     *
     * @param instance {Object} the instance which calls the method
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param args {arguments} Incoming arguments of wrapper method
     * @return {var} Execute return value of apply generated function, generally the incoming value
     */
    executeOptimizedSetter : function(instance, clazz, name, variant, args)
    {
      var config = clazz.$$properties[name];
      var members = clazz.prototype;
      var code = [];

      var incomingValue = variant === "set" || variant === "setThemed" || variant === "setRuntime" || (variant === "init" && config.init === undefined);
      var hasCallback = config.apply || config.event || config.inheritable;


      var store = this.__getStore(variant, name);

      this.__emitSetterPreConditions(code, config, name, variant, incomingValue);

      if (incomingValue) {
        this.__emitIncomingValueTransformation(code, clazz, config, name);
      }

      if (hasCallback) {
        this.__emitOldNewComparison(code, incomingValue, store, variant);
      }

      if (config.inheritable) {
        code.push('var inherit=prop.$$inherit;');
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        if (incomingValue) {
          this.__emitIncomingValueValidation(code, config, clazz, name, variant);
        }
      }

      if (!hasCallback) {
        this.__emitStoreValue(code, name, variant, incomingValue);
      } else {
        this.__emitStoreComputedAndOldValue(code, config, name, variant, incomingValue);
      }

      if (config.inheritable) {
        this.__emitStoreInheritedPropertyValue(code, config, name, variant);
      } else if (hasCallback) {
        this.__emitNormalizeUndefinedValues(code, config, name, variant)
      }

      if (hasCallback)
      {
        this.__emitCallCallback(code, config, name);

        // Refresh children
        // Requires the parent/children interface
        if (config.inheritable && members._getChildren) {
          this.__emitRefreshChildrenValue(code, name);
        }
      }

      // Return value
      if (incomingValue) {
        code.push('return value;');
      }

      return this.__unwrapFunctionFromCode(instance, members, name, variant, code, args);
    },


    /**
     * Get the object to store the value for the given variant
     *
     * @param variant {String} Method variant.
     * @param name {String} name of the property
     *
     * @return {Object} the value store
     */
    __getStore : function(variant, name)
    {
      if (variant === "setRuntime" || variant === "resetRuntime") {
        var store = this.$$store.runtime[name];
      } else if (variant === "setThemed" || variant === "resetThemed") {
        store = this.$$store.theme[name];
      } else if (variant === "init") {
        store = this.$$store.init[name];
      } else {
        store = this.$$store.user[name];
      }

      return store;
    },


    /**
     * Emit code to check the arguments pre-conditions
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitSetterPreConditions : function(code, config, name, variant, incomingValue)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        code.push('var prop=qx.core.Property;');

        if (variant === "init") {
          code.push('if(this.$$initialized)prop.error(this,0,"', name, '","', variant, '",value);');
        }

        if (variant === "refresh")
        {
          // do nothing
          // refresh() is internal => no arguments test
          // also note that refresh() supports "undefined" values
        }
        else if (incomingValue)
        {
          // Check argument length
          code.push('if(arguments.length!==1)prop.error(this,1,"', name, '","', variant, '",value);');

          // Undefined check
          code.push('if(value===undefined)prop.error(this,2,"', name, '","', variant, '",value);');
        }
        else
        {
          // Check argument length
          code.push('if(arguments.length!==0)prop.error(this,3,"', name, '","', variant, '",value);');
        }
      }
      else
      {
        if (!config.nullable || config.check || config.inheritable) {
          code.push('var prop=qx.core.Property;');
        }

        // Undefined check
        if (variant === "set") {
          code.push('if(value===undefined)prop.error(this,2,"', name, '","', variant, '",value);');
        }
      }
    },


    /**
     * Emit code to apply the "validate" and "transform" config keys.
     *
     * @param code {String[]} String array to append the code to
     * @param clazz {Class} the class which originally defined the property
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     */
    __emitIncomingValueTransformation : function(code, clazz, config, name)
    {
      // Call user-provided transform method, if one is provided.  Transform
      // method should either throw an error or return the new value.
      if (config.transform) {
        code.push('value=this.', config.transform, '(value);');
      }

      // Call user-provided validate method, if one is provided.  Validate
      // method should either throw an error or do nothing.
      if (config.validate) {
        // if it is a string
        if (typeof config.validate === "string") {
          code.push('this.', config.validate, '(value);');
        // if its a function otherwise
        } else if (config.validate instanceof Function) {
          code.push(clazz.classname, '.$$properties.', name);
          code.push('.validate.call(this, value);');
        }
      }
    },


    /**
     * Emit code, which returns if the incoming value equals the current value.
     *
     * @param code {String[]} String array to append the code to
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     * @param store {Object} The data store to use for the incoming value
     * @param variant {String} Method variant.
     */
    __emitOldNewComparison : function(code, incomingValue, store, variant)
    {
      var resetValue = (
        variant === "reset" ||
        variant === "resetThemed" ||
        variant === "resetRuntime"
      );

      if (incomingValue) {
        code.push('if(this.', store, '===value)return value;');
      } else if (resetValue) {
        code.push('if(this.', store, '===undefined)return;');
      }
    },


    /**
     * Emit code, which performs validation of the incoming value according to
     * the "nullable", "check" and "inheritable" config keys.
     *
     * @signature function(code, config, clazz, name, variant)
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param clazz {Class} the class which originally defined the property
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitIncomingValueValidation : qx.core.Environment.select("qx.debug",
    {
      "true" : function(code, config, clazz, name, variant)
      {
        // Null check
        if (!config.nullable) {
          code.push('if(value===null)prop.error(this,4,"', name, '","', variant, '",value);');
        }

        // Processing check definition
        if (config.check !== undefined)
        {
          code.push('var msg = "Invalid incoming value for property \''+name+'\' of class \'' + clazz.classname + '\'";');

          // Accept "null"
          if (config.nullable) {
            code.push('if(value!==null)');
          }

          // Inheritable properties always accept "inherit" as value
          if (config.inheritable) {
            code.push('if(value!==inherit)');
          }

          code.push('if(');

          if (this.__checks[config.check] !== undefined)
          {
            code.push('!(', this.__checks[config.check], ')');
          }
          else if (qx.Class.isDefined(config.check))
          {
            code.push('qx.core.Assert.assertInstance(value, qx.Class.getByName("', config.check, '"), msg)');
          }
          else if (qx.Interface && qx.Interface.isDefined(config.check))
          {
            code.push('qx.core.Assert.assertInterface(value, qx.Interface.getByName("', config.check, '"), msg)');
          }
          else if (typeof config.check === "function")
          {
            code.push('!', clazz.classname, '.$$properties.', name);
            code.push('.check.call(this, value)');
          }
          else if (typeof config.check === "string")
          {
            code.push('!(', config.check, ')');
          }
          else if (config.check instanceof Array)
          {
            code.push('qx.core.Assert.assertInArray(value, ', clazz.classname, '.$$properties.', name, '.check, msg)');
          }
          else
          {
            throw new Error("Could not add check to property " + name + " of class " + clazz.classname);
          }

          code.push(')prop.error(this,5,"', name, '","', variant, '",value);');
        }
      },

      "false" : undefined
    }),


    /**
     * Emit code to store the incoming value
     *
     * @param code {String[]} String array to append the code to
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitStoreValue : function(code, name, variant, incomingValue)
    {
      if (variant === "setRuntime")
      {
        code.push('this.', this.$$store.runtime[name], '=value;');
      }
      else if (variant === "resetRuntime")
      {
        code.push('if(this.', this.$$store.runtime[name], '!==undefined)');
        code.push('delete this.', this.$$store.runtime[name], ';');
      }
      else if (variant === "set")
      {
        code.push('this.', this.$$store.user[name], '=value;');
      }
      else if (variant === "reset")
      {
        code.push('if(this.', this.$$store.user[name], '!==undefined)');
        code.push('delete this.', this.$$store.user[name], ';');
      }
      else if (variant === "setThemed")
      {
        code.push('this.', this.$$store.theme[name], '=value;');
      }
      else if (variant === "resetThemed")
      {
        code.push('if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('delete this.', this.$$store.theme[name], ';');
      }
      else if (variant === "init" && incomingValue)
      {
        code.push('this.', this.$$store.init[name], '=value;');
      }
    },


    /**
     * Emit code to store the incoming value and compute the "old" and "computed"
     * values.
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     * @param incomingValue {Boolean} Whether the setter has an incoming value
     */
    __emitStoreComputedAndOldValue : function(code, config, name, variant, incomingValue)
    {
      if (config.inheritable) {
        code.push('var computed, old=this.', this.$$store.inherit[name], ';');
      } else {
        code.push('var computed, old;');
      }


      // OLD = RUNTIME VALUE
      code.push('if(this.', this.$$store.runtime[name], '!==undefined){');

      if (variant === "setRuntime")
      {
        // Replace it with new value
        code.push('computed=this.', this.$$store.runtime[name], '=value;');
      }
      else if (variant === "resetRuntime")
      {
        // Delete field
        code.push('delete this.', this.$$store.runtime[name], ';');

        // Complex compution of new value
        code.push('if(this.', this.$$store.user[name], '!==undefined)')
        code.push('computed=this.', this.$$store.user[name], ';');
        code.push('else if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('computed=this.', this.$$store.theme[name], ';');
        code.push('else if(this.', this.$$store.init[name], '!==undefined){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('this.', this.$$store.useinit[name], '=true;');
        code.push('}');
      }
      else
      {
        // Use runtime value as it has higher priority
        code.push('old=computed=this.', this.$$store.runtime[name], ';');

        // Store incoming value
        if (variant === "set")
        {
          code.push('this.', this.$$store.user[name], '=value;');
        }
        else if (variant === "reset")
        {
          code.push('delete this.', this.$$store.user[name], ';');
        }
        else if (variant === "setThemed")
        {
          code.push('this.', this.$$store.theme[name], '=value;');
        }
        else if (variant === "resetThemed")
        {
          code.push('delete this.', this.$$store.theme[name], ';');
        }
        else if (variant === "init" && incomingValue)
        {
          code.push('this.', this.$$store.init[name], '=value;');
        }
      }

      code.push('}');


      // OLD = USER VALUE
      code.push('else if(this.', this.$$store.user[name], '!==undefined){');

      if (variant === "set")
      {
        if (!config.inheritable)
        {
          // Remember old value
          code.push('old=this.', this.$$store.user[name], ';');
        }

        // Replace it with new value
        code.push('computed=this.', this.$$store.user[name], '=value;');
      }
      else if (variant === "reset")
      {
        if (!config.inheritable)
        {
          // Remember old value
          code.push('old=this.', this.$$store.user[name], ';');
        }

        // Delete field
        code.push('delete this.', this.$$store.user[name], ';');

        // Complex compution of new value
        code.push('if(this.', this.$$store.runtime[name], '!==undefined)')
        code.push('computed=this.', this.$$store.runtime[name], ';');
        code.push('if(this.', this.$$store.theme[name], '!==undefined)');
        code.push('computed=this.', this.$$store.theme[name], ';');
        code.push('else if(this.', this.$$store.init[name], '!==undefined){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('this.', this.$$store.useinit[name], '=true;');
        code.push('}');
      }
      else
      {
        if (variant === "setRuntime")
        {
          // Use runtime value where it has higher priority
          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        }
        else if (config.inheritable)
        {
          // Use user value where it has higher priority
          code.push('computed=this.', this.$$store.user[name], ';');
        }
        else
        {
          // Use user value where it has higher priority
          code.push('old=computed=this.', this.$$store.user[name], ';');
        }

        // Store incoming value
        if (variant === "setThemed")
        {
          code.push('this.', this.$$store.theme[name], '=value;');
        }
        else if (variant === "resetThemed")
        {
          code.push('delete this.', this.$$store.theme[name], ';');
        }
        else if (variant === "init" && incomingValue)
        {
          code.push('this.', this.$$store.init[name], '=value;');
        }
      }

      code.push('}');


      // OLD = THEMED VALUE
      if (config.themeable)
      {
        code.push('else if(this.', this.$$store.theme[name], '!==undefined){');

        if (!config.inheritable)
        {
          code.push('old=this.', this.$$store.theme[name], ';');
        }

        if (variant === "setRuntime")
        {
          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        }

        else if (variant === "set")
        {
          code.push('computed=this.', this.$$store.user[name], '=value;');
        }

        // reset() is impossible, because the user has higher priority than
        // the themed value, so the themed value has no chance to ever get used,
        // when there is an user value, too.

        else if (variant === "setThemed")
        {
          code.push('computed=this.', this.$$store.theme[name], '=value;');
        }
        else if (variant === "resetThemed")
        {
          // Delete entry
          code.push('delete this.', this.$$store.theme[name], ';');

          // Fallback to init value
          code.push('if(this.', this.$$store.init[name], '!==undefined){');
            code.push('computed=this.', this.$$store.init[name], ';');
            code.push('this.', this.$$store.useinit[name], '=true;');
          code.push('}');
        }
        else if (variant === "init")
        {
          if (incomingValue) {
            code.push('this.', this.$$store.init[name], '=value;');
          }

          code.push('computed=this.', this.$$store.theme[name], ';');
        }
        else if (variant === "refresh")
        {
          code.push('computed=this.', this.$$store.theme[name], ';');
        }

        code.push('}');
      }


      // OLD = INIT VALUE
      code.push('else if(this.', this.$$store.useinit[name], '){');

      if (!config.inheritable) {
        code.push('old=this.', this.$$store.init[name], ';');
      }

      if (variant === "init")
      {
        if (incomingValue) {
          code.push('computed=this.', this.$$store.init[name], '=value;');
        } else {
          code.push('computed=this.', this.$$store.init[name], ';');
        }

        // useinit flag is already initialized
      }

      // reset(), resetRuntime() and resetStyle() are impossible, because the user and themed values have a
      // higher priority than the init value, so the init value has no chance to ever get used,
      // when there is an user or themed value, too.

      else if (variant === "set" || variant === "setRuntime" || variant === "setThemed" || variant === "refresh")
      {
        code.push('delete this.', this.$$store.useinit[name], ';');

        if (variant === "setRuntime") {
          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        } else if (variant === "set") {
          code.push('computed=this.', this.$$store.user[name], '=value;');
        } else if (variant === "setThemed") {
          code.push('computed=this.', this.$$store.theme[name], '=value;');
        } else if (variant === "refresh") {
          code.push('computed=this.', this.$$store.init[name], ';');
        }
      }

      code.push('}');


      // OLD = NONE

      // reset(), resetRuntime() and resetStyle() are impossible because otherwise there
      // is already an old value
      if (variant === "set" || variant === "setRuntime" || variant === "setThemed" || variant === "init")
      {
        code.push('else{');

        if (variant === "setRuntime")
        {
          code.push('computed=this.', this.$$store.runtime[name], '=value;');
        }

        else if (variant === "set")
        {
          code.push('computed=this.', this.$$store.user[name], '=value;');
        }

        else if (variant === "setThemed")
        {
          code.push('computed=this.', this.$$store.theme[name], '=value;');
        }

        else if (variant === "init")
        {
          if (incomingValue) {
            code.push('computed=this.', this.$$store.init[name], '=value;');
          } else {
            code.push('computed=this.', this.$$store.init[name], ';');
          }

          code.push('this.', this.$$store.useinit[name], '=true;');
        }

        // refresh() will work with the undefined value, later
        code.push('}');
      }
    },


    /**
     * Emit code to store the value of an inheritable property
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitStoreInheritedPropertyValue : function(code, config, name, variant)
    {
      code.push('if(computed===undefined||computed===inherit){');

      if (variant === "refresh") {
        code.push('computed=value;');
      } else {
        code.push('var pa=this.getLayoutParent();if(pa)computed=pa.', this.$$store.inherit[name], ';');
      }

      // Fallback to init value if inheritance was unsuccessful
      code.push('if((computed===undefined||computed===inherit)&&');
      code.push('this.', this.$$store.init[name], '!==undefined&&');
      code.push('this.', this.$$store.init[name], '!==inherit){');
        code.push('computed=this.', this.$$store.init[name], ';');
        code.push('this.', this.$$store.useinit[name], '=true;');
      code.push('}else{');
      code.push('delete this.', this.$$store.useinit[name], ';}');

      code.push('}');

      // Compare old/new computed value
      code.push('if(old===computed)return value;');

      // Note: At this point computed can be "inherit" or "undefined".

      // Normalize "inherit" to undefined and delete inherited value
      code.push('if(computed===inherit){');
      code.push('computed=undefined;delete this.', this.$$store.inherit[name], ';');
      code.push('}');

      // Only delete inherited value
      code.push('else if(computed===undefined)');
      code.push('delete this.', this.$$store.inherit[name], ';');

      // Store inherited value
      code.push('else this.', this.$$store.inherit[name], '=computed;');

      // Protect against normalization
      code.push('var backup=computed;');

      // After storage finally normalize computed and old value
      if (config.init !== undefined && variant !== "init") {
        code.push('if(old===undefined)old=this.', this.$$store.init[name], ";");
      } else {
        code.push('if(old===undefined)old=null;');
      }
      code.push('if(computed===undefined||computed==inherit)computed=null;');
    },


    /**
     * Emit code to normalize the old and incoming values from undefined to
     * <code>null</code>.
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     * @param variant {String} Method variant.
     */
    __emitNormalizeUndefinedValues : function(code, config, name, variant)
    {
      // Properties which are not inheritable have no possibility to get
      // undefined at this position. (Hint: set(), setRuntime() and setThemed() only allow non undefined values)
      if (variant !== "set" && variant !== "setRuntime" && variant !== "setThemed") {
        code.push('if(computed===undefined)computed=null;');
      }

      // Compare old/new computed value
      code.push('if(old===computed)return value;');

      // Normalize old value
      if (config.init !== undefined && variant !== "init") {
        code.push('if(old===undefined)old=this.', this.$$store.init[name], ";");
      } else {
        code.push('if(old===undefined)old=null;');
      }
    },


    /**
     * Emit code to call the apply method and fire the change event
     *
     * @param code {String[]} String array to append the code to
     * @param config {Object} The property configuration map
     * @param name {String} name of the property
     */
    __emitCallCallback : function(code, config, name)
    {
      // Execute user configured setter
      if (config.apply) {
        code.push('this.', config.apply, '(computed, old, "', name, '");');
      }

      // Fire event
      if (config.event) {
        code.push(
          "var reg=qx.event.Registration;",
          "if(reg.hasListener(this, '", config.event, "')){",
          "reg.fireEvent(this, '", config.event, "', qx.event.type.Data, [computed, old]", ")}"
        );
      }
    },


    /**
     * Emit code to update the inherited values of child objects
     *
     * @param code {String[]} String array to append the code to
     * @param name {String} name of the property
     */
    __emitRefreshChildrenValue : function(code, name)
    {
      code.push('var a=this._getChildren();if(a)for(var i=0,l=a.length;i<l;i++){');
      code.push('if(a[i].', this.$$method.refresh[name], ')a[i].', this.$$method.refresh[name], '(backup);');
      code.push('}');
    }
  },



  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    var ie6 = navigator.userAgent.indexOf("MSIE 6.0") != -1;
    var ff2 = navigator.userAgent.indexOf("rv:1.8.1") != -1;

    // keep the old dereference behavior for IE6 and FF2
    if (ie6 || ff2) {
      statics.__shouldBeDereferenced = statics.__shouldBeDereferencedOld;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/* ************************************************************************

#require(qx.Interface)
#require(qx.Mixin)
#require(qx.core.Property)
#require(qx.lang.Core)

#require(qx.core.Setting)

#use(qx.lang.Generics)

************************************************************************ */

/**
 * This class is one of the most important parts of qooxdoo's
 * object-oriented features.
 *
 * Its {@link #define} method is used to create qooxdoo classes.
 *
 * Each instance of a class defined by {@link #define} has
 * the following keys attached to the constructor and the prototype:
 *
 * <table>
 * <tr><th><code>classname</code></th><td>The fully-qualified name of the class (e.g. <code>"qx.ui.core.Widget"</code>).</td></tr>
 * <tr><th><code>basename</code></th><td>The namespace part of the class name (e.g. <code>"qx.ui.core"</code>).</td></tr>
 * <tr><th><code>constructor</code></th><td>A reference to the constructor of the class.</td></tr>
 * <tr><th><code>superclass</code></th><td>A reference to the constructor of the super class.</td></tr>
 * </table>
 *
 * Each method may access static members of the same class by using
 * <code>this.self(arguments)</code> ({@link qx.core.Object#self}):
 * <pre class='javascript'>
 * statics : { FOO : "bar" },
 * members: {
 *   baz: function(x) {
 *     this.self(arguments).FOO;
 *     ...
 *   }
 * }
 * </pre>
 *
 * Each overriding method may call the overridden method by using
 * <code>this.base(arguments [, ...])</code> ({@link qx.core.Object#base}). This is also true for calling
 * the constructor of the superclass.
 * <pre class='javascript'>
 * members: {
 *   foo: function(x) {
 *     this.base(arguments, x);
 *     ...
 *   }
 * }
 * </pre>
 */
qx.Bootstrap.define("qx.Class",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
       PUBLIC METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Define a new class using the qooxdoo class system. This sets up the
     * namespace for the class and generates the class from the definition map.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Class.define("name",
     * {
     *   extend : Object, // superclass
     *   implement : [Interfaces],
     *   include : [Mixins],
     *
     *   statics:
     *   {
     *     CONSTANT : 3.141,
     *
     *     publicMethod: function() {},
     *     _protectedMethod: function() {},
     *     __privateMethod: function() {}
     *   },
     *
     *   properties:
     *   {
     *     "tabIndex": { check: "Number", init : -1 }
     *   },
     *
     *   members:
     *   {
     *     publicField: "foo",
     *     publicMethod: function() {},
     *
     *     _protectedField: "bar",
     *     _protectedMethod: function() {},
     *
     *     __privateField: "baz",
     *     __privateMethod: function() {}
     *   }
     * });
     * </pre>
     *
     * @param name {String} Name of the class
     * @param config {Map ? null} Class definition structure. The configuration map has the following keys:
     *     <table>
     *       <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *       <tr><th>type</th><td>String</td><td>
     *           Type of the class. Valid types are "abstract", "static" and "singleton".
     *           If unset it defaults to a regular non-static class.
     *       </td></tr>
     *       <tr><th>extend</th><td>Class</td><td>The super class the current class inherits from.</td></tr>
     *       <tr><th>implement</th><td>Interface | Interface[]</td><td>Single interface or array of interfaces the class implements.</td></tr>
     *       <tr><th>include</th><td>Mixin | Mixin[]</td><td>Single mixin or array of mixins, which will be merged into the class.</td></tr>
     *       <tr><th>construct</th><td>Function</td><td>The constructor of the class.</td></tr>
     *       <tr><th>statics</th><td>Map</td><td>Map of static members of the class.</td></tr>
     *       <tr><th>properties</th><td>Map</td><td>Map of property definitions. For a description of the format of a property definition see
     *           {@link qx.core.Property}.</td></tr>
     *       <tr><th>members</th><td>Map</td><td>Map of instance members of the class.</td></tr>
     *       <tr><th>environment</th><td>Map</td><td>Map of environment settings for this class. For a description of the format of a setting see
     *           {@link qx.core.Environment}.</td></tr>
     *       <tr><th>settings</th><td>Map</td><td>Map of settings for this class. For a description of the format of a setting see
     *           {@link qx.core.Setting}. This is deprecated since 1.4.</td></tr>
     *       <tr><th>variants</th><td>Map</td><td>Map of settings for this class. For a description of the format of a setting see
     *           {@link qx.core.Variant} This is deprecated since 1.4.</td></tr>
     *       <tr><th>events</th><td>Map</td><td>
     *           Map of events the class fires. The keys are the names of the events and the values are the
     *           corresponding event type class names.
     *       </td></tr>
     *       <tr><th>defer</th><td>Function</td><td>Function that is called at the end of processing the class declaration. It allows access to the declared statics, members and properties.</td></tr>
     *       <tr><th>destruct</th><td>Function</td><td>The destructor of the class.</td></tr>
     *     </table>
     * @return {Class} The defined class
     */
    define : function(name, config)
    {
      if (!config) {
        var config = {};
      }

      // Normalize include to array
      if (config.include && !(config.include instanceof Array)) {
        config.include = [config.include];
      }

      // Normalize implement to array
      if (config.implement && !(config.implement instanceof Array)) {
        config.implement = [config.implement];
      }

      // Normalize type
      var implicitType = false;
      if (!config.hasOwnProperty("extend") && !config.type) {
        config.type = "static";
        implicitType = true;
      }

      // Validate incoming data
      if (qx.core.Environment.get("qx.debug")) {
        try {
          this.__validateConfig(name, config);
        } catch(ex) {
          if (implicitType) {
            ex.message = 'Assumed static class because no "extend" key was found. ' + ex.message;
          }
          throw ex;
        }
      }

      // Create the class
      var clazz = this.__createClass(name, config.type, config.extend, config.statics, config.construct, config.destruct, config.include);

      // Members, properties, events and mixins are only allowed for non-static classes
      if (config.extend)
      {
        // Attach properties
        if (config.properties) {
          this.__addProperties(clazz, config.properties, true);
        }

        // Attach members
        if (config.members) {
          this.__addMembers(clazz, config.members, true, true, false);
        }

        // Process events
        if (config.events) {
          this.__addEvents(clazz, config.events, true);
        }

        // Include mixins
        // Must be the last here to detect conflicts
        if (config.include)
        {
          for (var i=0, l=config.include.length; i<l; i++) {
            this.__addMixin(clazz, config.include[i], false);
          }
        }
      }

      // Process environment
      if (config.environment)
      {
        for (var key in config.environment) {
          qx.core.Environment.add(key, config.environment[key]);
        }

        // @deprecated since 1.4 (also put the environment into the settings)
        for (var key in config.environment) {
          qx.core.Setting.defineDeprecated(key, config.environment[key]);
        }
      }

      // @deprecated since 1.4 (settings are now environment)
      // Process settings
      if (config.settings)
      {
        if (qx.core.Environment.get("qx.debug")) {
          qx.Bootstrap.warn("The usage of settings in class '" + name +
            "'is deprecated. Please use the 'environment' key instead");
        }
        for (var key in config.settings) {
          qx.core.Setting.define(key, config.settings[key]);
        }
      }

      // Process variants
      if (config.variants)
      {
        if (qx.core.Environment.get("qx.debug")) {
          qx.Bootstrap.warn("The usage of variants in class '" + name +
            "'is deprecated. Please use the 'environment' key instead");
        }
        for (var key in config.variants) {
          qx.core.Variant.define(key, config.variants[key].allowedValues, config.variants[key].defaultValue);
        }
      }

      // Interface support for non-static classes
      if (config.implement)
      {
        for (var i=0, l=config.implement.length; i<l; i++) {
          this.__addInterface(clazz, config.implement[i]);
        }
      }


      if (qx.core.Environment.get("qx.debug")) {
        this.__validateAbstractInterfaces(clazz);
      }


      // Process defer
      if (config.defer)
      {
        config.defer.self = clazz;
        config.defer(clazz, clazz.prototype,
        {
          add : function(name, config)
          {
            // build pseudo properties map
            var properties = {};
            properties[name] = config;

            // execute generic property handler
            qx.Class.__addProperties(clazz, properties, true);
          }
        });
      }

      return clazz;
    },


    /**
     * Removes a class from qooxdoo defined by {@link #define}
     *
     * @param name {String} Name of the class
     */
    undefine : function(name)
    {
      // first, delete the class from the registry
      delete this.$$registry[name];
      // delete the class reference from the namespaces and all empty namespaces
      var ns = name.split(".");
      // build up an array containing all namespace objects including window
      var objects = [window];
      for (var i = 0; i < ns.length; i++) {
        objects.push(objects[i][ns[i]]);
      }

      // go through all objects and check for the constructor or empty namespaces
      for (var i = objects.length - 1; i >= 1; i--) {
        var last = objects[i];
        var parent = objects[i - 1];
        if (qx.Bootstrap.isFunction(last) || qx.Bootstrap.objectGetLength(last) === 0) {
          delete parent[ns[i - 1]];
        } else {
          break;
        }
      };
    },


    /**
     * Whether the given class exists
     *
     * @signature function(name)
     * @param name {String} class name to check
     * @return {Boolean} true if class exists
     */
    isDefined : qx.Bootstrap.classIsDefined,


    /**
     * Determine the total number of classes
     *
     * @return {Number} the total number of classes
     */
    getTotalNumber : function() {
      return qx.Bootstrap.objectGetLength(this.$$registry);
    },


    /**
     * Find a class by its name
     *
     * @signature function(name)
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : qx.Bootstrap.getByName,


    /**
     * Include all features of the given mixin into the class. The mixin must
     * not include any methods or properties that are already available in the
     * class. This would only be possible using the {@link #patch} method.
     *
     * @param clazz {Class} An existing class which should be augmented by including a mixin.
     * @param mixin {Mixin} The mixin to be included.
     */
    include : function(clazz, mixin)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!mixin) {
          throw new Error("The mixin to include into class '" + clazz.classname + "' is undefined/null!");
        }

        qx.Mixin.isCompatible(mixin, clazz);
      }

      qx.Class.__addMixin(clazz, mixin, false);
    },


    /**
     * Include all features of the given mixin into the class. The mixin may
     * include features, which are already defined in the target class. Existing
     * features of equal name will be overwritten.
     * Please keep in mind that this functionality is not intended for regular
     * use, but as a formalized way (and a last resort) in order to patch
     * existing classes.
     *
     * <b>WARNING</b>: You may break working classes and features.
     *
     * @param clazz {Class} An existing class which should be modified by including a mixin.
     * @param mixin {Mixin} The mixin to be included.
     */
    patch : function(clazz, mixin)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!mixin) {
          throw new Error("The mixin to patch class '" + clazz.classname + "' is undefined/null!");
        }

        qx.Mixin.isCompatible(mixin, clazz);
      }

      qx.Class.__addMixin(clazz, mixin, true);
    },


    /**
     * Whether a class is a direct or indirect sub class of another class,
     * or both classes coincide.
     *
     * @param clazz {Class} the class to check.
     * @param superClass {Class} the potential super class
     * @return {Boolean} whether clazz is a sub class of superClass.
     */
    isSubClassOf : function(clazz, superClass)
    {
      if (!clazz) {
        return false;
      }

      if (clazz == superClass) {
        return true;
      }

      if (clazz.prototype instanceof superClass) {
        return true;
      }

      return false;
    },


    /**
     * Returns the definition of the given property. Returns null
     * if the property does not exist.
     *
     * TODO: Correctly support refined properties?
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Map|null} whether the object support the given event.
     */
    getPropertyDefinition : qx.Bootstrap.getPropertyDefinition,


    /**
     * Returns a list of all properties supported by the given class
     *
     * @param clazz {Class} Class to query
     * @return {String[]} List of all property names
     */
    getProperties : function(clazz)
    {
      var list = [];

      while (clazz)
      {
        if (clazz.$$properties) {
          list.push.apply(list, qx.Bootstrap.getKeys(clazz.$$properties));
        }

        clazz = clazz.superclass;
      }

      return list;
    },


    /**
     * Returns the class or one of its superclasses which contains the
     * declaration for the given property in its class definition. Returns null
     * if the property is not specified anywhere.
     *
     * @param clazz {Class} class to look for the property
     * @param name {String} name of the property
     * @return {Class | null} The class which includes the property
     */
    getByProperty : function(clazz, name)
    {
      while (clazz)
      {
        if (clazz.$$properties && clazz.$$properties[name]) {
          return clazz;
        }

        clazz = clazz.superclass;
      }

      return null;
    },


    /**
     * Whether a class has the given property
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the property to check for
     * @return {Boolean} whether the class includes the given property.
     */
    hasProperty : qx.Bootstrap.hasProperty,


    /**
     * Returns the event type of the given event. Returns null if
     * the event does not exist.
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the event
     * @return {String|null} Event type of the given event.
     */
    getEventType : qx.Bootstrap.getEventType,


    /**
     * Whether a class supports the given event type
     *
     * @signature function(clazz, name)
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Boolean} whether the class supports the given event.
     */
    supportsEvent : qx.Bootstrap.supportsEvent,


    /**
     * Whether a class directly includes a mixin.
     *
     * @param clazz {Class} class to check
     * @param mixin {Mixin} the mixin to check for
     * @return {Boolean} whether the class includes the mixin directly.
     */
    hasOwnMixin : function(clazz, mixin) {
      return clazz.$$includes && clazz.$$includes.indexOf(mixin) !== -1;
    },


    /**
     * Returns the class or one of its superclasses which contains the
     * declaration for the given mixin. Returns null if the mixin is not
     * specified anywhere.
     *
     * @param clazz {Class} class to look for the mixin
     * @param mixin {Mixin} mixin to look for
     * @return {Class | null} The class which directly includes the given mixin
     */
    getByMixin : function(clazz, mixin)
    {
      var list, i, l;

      while (clazz)
      {
        if (clazz.$$includes)
        {
          list = clazz.$$flatIncludes;

          for (i=0, l=list.length; i<l; i++)
          {
            if (list[i] === mixin) {
              return clazz;
            }
          }
        }

        clazz = clazz.superclass;
      }

      return null;
    },


    /**
     * Returns a list of all mixins available in a given class.
     *
     * @signature function(clazz)
     * @param clazz {Class} class which should be inspected
     * @return {Mixin[]} array of mixins this class uses
     */
    getMixins : qx.Bootstrap.getMixins,


    /**
     * Whether a given class or any of its superclasses includes a given mixin.
     *
     * @param clazz {Class} class to check
     * @param mixin {Mixin} the mixin to check for
     * @return {Boolean} whether the class includes the mixin.
     */
    hasMixin: function(clazz, mixin) {
      return !!this.getByMixin(clazz, mixin);
    },


    /**
     * Whether a given class directly includes an interface.
     *
     * This function will only return "true" if the interface was defined
     * in the class declaration ({@link qx.Class#define}) using the "implement"
     * key.
     *
     * @param clazz {Class} class or instance to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the mixin directly.
     */
    hasOwnInterface : function(clazz, iface) {
      return clazz.$$implements && clazz.$$implements.indexOf(iface) !== -1;
    },


    /**
     * Returns the class or one of its super classes which contains the
     * declaration of the given interface. Returns null if the interface is not
     * specified anywhere.
     *
     * @signature function(clazz, iface)
     * @param clazz {Class} class to look for the interface
     * @param iface {Interface} interface to look for
     * @return {Class | null} the class which directly implements the given interface
     */
    getByInterface : qx.Bootstrap.getByInterface,


    /**
     * Returns a list of all mixins available in a class.
     *
     * @param clazz {Class} class which should be inspected
     * @return {Mixin[]} array of mixins this class uses
     */
    getInterfaces : function(clazz)
    {
      var list = [];

      while (clazz)
      {
        if (clazz.$$implements) {
          list.push.apply(list, clazz.$$flatImplements);
        }

        clazz = clazz.superclass;
      }

      return list;
    },


    /**
     * Whether a given class or any of its super classes includes a given interface.
     *
     * This function will return "true" if the interface was defined
     * in the class declaration ({@link qx.Class#define}) of the class
     * or any of its super classes using the "implement"
     * key.
     *
     * @signature function(clazz, iface)
     * @param clazz {Class} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the interface.
     */
    hasInterface : qx.Bootstrap.hasInterface,


    /**
     * Whether a given class to an interface.
     *
     * Checks whether all methods defined in the interface are
     * implemented. The class does not need to implement
     * the interface explicitly in the <code>extend</code> key.
     *
     * @param obj {Object} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class conforms to the interface.
     */
    implementsInterface : function(obj, iface)
    {
      var clazz = obj.constructor;

      if (this.hasInterface(clazz, iface)) {
        return true;
      }

      try
      {
        qx.Interface.assertObject(obj, iface);
        return true;
      }
      catch(ex) {}

      try
      {
        qx.Interface.assert(clazz, iface, false);
        return true;
      }
      catch(ex) {}

      return false;
    },


    /**
     * Helper method to handle singletons
     *
     * @internal
     */
    getInstance : function()
    {
      if (!this.$$instance)
      {
        this.$$allowconstruct = true;
        this.$$instance = new this;
        delete this.$$allowconstruct;
      }

      return this.$$instance;
    },





    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL BASICS
    ---------------------------------------------------------------------------
    */

    /**
     * This method will be attached to all classes to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The class identifier
     */
    genericToString : function() {
      return "[Class " + this.classname + "]";
    },


    /** Stores all defined classes */
    $$registry : qx.Bootstrap.$$registry,


    /** {Map} allowed keys in non-static class definition */
    __allowedKeys : qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "type"       : "string",    // String
        "extend"     : "function",  // Function
        "implement"  : "object",    // Interface[]
        "include"    : "object",    // Mixin[]
        "construct"  : "function",  // Function
        "statics"    : "object",    // Map
        "properties" : "object",    // Map
        "members"    : "object",    // Map
        "settings"   : "object",    // Map @deprecated since 1.4
        "environment"   : "object", // Map
        "variants"   : "object",    // Map
        "events"     : "object",    // Map
        "defer"      : "function",  // Function
        "destruct"   : "function"   // Function
      },

      "default" : null
    }),


    /** {Map} allowed keys in static class definition */
    __staticAllowedKeys : qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "type"        : "string",    // String
        "statics"     : "object",    // Map
        "settings"    : "object",    // Map @deprecated since 1.4
        "environment" : "object",    // Map
        "variants"    : "object",    // Map
        "defer"       : "function"   // Function
      },

      "default" : null
    }),


    /**
     * Validates an incoming configuration and checks for proper keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     */
    __validateConfig : qx.core.Environment.select("qx.debug",
    {
      "true": function(name, config)
      {
        // Validate type
        if (config.type && !(config.type === "static" || config.type === "abstract" || config.type === "singleton")) {
          throw new Error('Invalid type "' + config.type + '" definition for class "' + name + '"!');
        }

        // Validate non-static class on the "extend" key
        if (config.type && config.type !== "static" && !config.extend) {
          throw new Error('Invalid config in class "' + name + '"! Every non-static class has to extend at least the "qx.core.Object" class.');
        }

        // Validate keys
        var allowed = config.type === "static" ? this.__staticAllowedKeys : this.__allowedKeys;
        for (var key in config)
        {
          if (!allowed[key]) {
            throw new Error('The configuration key "' + key + '" in class "' + name + '" is not allowed!');
          }

          if (config[key] == null) {
            throw new Error('Invalid key "' + key + '" in class "' + name + '"! The value is undefined/null!');
          }

          if (typeof config[key] !== allowed[key]) {
            throw new Error('Invalid type of key "' + key + '" in class "' + name + '"! The type of the key must be "' + allowed[key] + '"!');
          }
        }

        // Validate maps
        var maps = [ "statics", "properties", "members", "environment", "settings", "variants", "events" ];
        for (var i=0, l=maps.length; i<l; i++)
        {
          var key = maps[i];

          if (config[key] !== undefined && (
            config[key].$$hash !== undefined || !qx.Bootstrap.isObject(config[key])
          )) {
            throw new Error('Invalid key "' + key + '" in class "' + name + '"! The value needs to be a map!');
          }
        }

        // Validate include definition
        if (config.include)
        {
          if (config.include instanceof Array)
          {
            for (var i=0, a=config.include, l=a.length; i<l; i++)
            {
              if (a[i] == null || a[i].$$type !== "Mixin") {
                throw new Error('The include definition in class "' + name + '" contains an invalid mixin at position ' + i + ': ' + a[i]);
              }
            }
          }
          else
          {
            throw new Error('Invalid include definition in class "' + name + '"! Only mixins and arrays of mixins are allowed!');
          }
        }

        // Validate implement definition
        if (config.implement)
        {
          if (config.implement instanceof Array)
          {
            for (var i=0, a=config.implement, l=a.length; i<l; i++)
            {
              if (a[i] == null || a[i].$$type !== "Interface") {
                throw new Error('The implement definition in class "' + name + '" contains an invalid interface at position ' + i + ': ' + a[i]);
              }
            }
          }
          else
          {
            throw new Error('Invalid implement definition in class "' + name + '"! Only interfaces and arrays of interfaces are allowed!');
          }
        }

        // Check mixin compatibility
        if (config.include)
        {
          try {
            qx.Mixin.checkCompatibility(config.include);
          } catch(ex) {
            throw new Error('Error in include definition of class "' + name + '"! ' + ex.message);
          }
        }

        // Validate environment
        if (config.environment)
        {
          for (var key in config.environment)
          {
            if (key.substr(0, key.indexOf(".")) != name.substr(0, name.indexOf("."))) {
              throw new Error('Forbidden environment setting "' + key +
                '" found in "' + name + '". It is forbidden to define a ' +
                'environment setting for an external namespace!');
            }
          }
        }

        // Validate settings
        if (config.settings)
        {
          for (var key in config.settings)
          {
            if (key.substr(0, key.indexOf(".")) != name.substr(0, name.indexOf("."))) {
              throw new Error('Forbidden setting "' + key + '" found in "' + name + '". It is forbidden to define a default setting for an external namespace!');
            }
          }
        }

        // Validate variants
        if (config.variants)
        {
          for (var key in config.variants)
          {
            if (key.substr(0, key.indexOf(".")) != name.substr(0, name.indexOf("."))) {
              throw new Error('Forbidden variant "' + key + '" found in "' + name + '". It is forbidden to define a variant for an external namespace!');
            }
          }
        }
      },

      "default" : function() {}
    }),


    /**
     * Validates the interfaces required by abstract base classes
     *
     * @signature function(clazz)
     * @param clazz {Class} The configured class.
     */
    __validateAbstractInterfaces : qx.core.Environment.select("qx.debug",
    {
      "true": function(clazz)
      {
        var superclass = clazz.superclass;
        while (superclass)
        {
          if (superclass.$$classtype !== "abstract") {
            break;
          }

          var interfaces = superclass.$$implements;
          if (interfaces)
          {
            for (var i=0; i<interfaces.length; i++) {
              qx.Interface.assert(clazz, interfaces[i], true);
            }
          }
          superclass = superclass.superclass;
        }
      },

      "default" : function() {}
    }),


    /**
     * Creates a class by type. Supports modern inheritance etc.
     *
     * @param name {String} Full name of the class
     * @param type {String} type of the class, i.e. "static", "abstract" or "singleton"
     * @param extend {Class} Superclass to inherit from
     * @param statics {Map} Static methods or fields
     * @param construct {Function} Constructor of the class
     * @param destruct {Function} Destructor of the class
     * @param mixins {Mixin[]} array of mixins of the class
     * @return {Class} The generated class
     */
    __createClass : function(name, type, extend, statics, construct, destruct, mixins)
    {
      var clazz;

      if (!extend && qx.core.Environment.get("qx.aspects") == false)
      {
        // Create empty/non-empty class
        clazz = statics || {};
        qx.Bootstrap.setDisplayNames(clazz, name);
      }
      else
      {
        var clazz = {};

        if (extend)
        {
          // Create default constructor
          if (!construct) {
            construct = this.__createDefaultConstructor();
          }

          if (this.__needsConstructorWrapper(extend, mixins)) {
            clazz = this.__wrapConstructor(construct, name, type);
          } else {
            clazz = construct;
          }

          // Add singleton getInstance()
          if (type === "singleton") {
            clazz.getInstance = this.getInstance;
          }

          qx.Bootstrap.setDisplayName(construct, name, "constructor");
        }

        // Copy statics
        if (statics)
        {
          qx.Bootstrap.setDisplayNames(statics, name);

          var key;

          for (var i=0, a=qx.Bootstrap.getKeys(statics), l=a.length; i<l; i++)
          {
            key = a[i];
            var staticValue = statics[key];

            if (qx.core.Environment.get("qx.aspects"))
            {

              if (staticValue instanceof Function) {
                staticValue = qx.core.Aspect.wrap(name + "." + key, staticValue, "static");
              }

              clazz[key] = staticValue;
            }
            else
            {
              clazz[key] = staticValue;
            }
          }
        }
      }

      // Create namespace
      var basename = qx.Bootstrap.createNamespace(name, clazz);

      // Store names in constructor/object
      clazz.name = clazz.classname = name;
      clazz.basename = basename;

      // Store type info
      clazz.$$type = "Class";
      if (type) {
        clazz.$$classtype = type;
      }

      // Attach toString
      if (!clazz.hasOwnProperty("toString")) {
        clazz.toString = this.genericToString;
      }

      if (extend)
      {
        qx.Bootstrap.extendClass(clazz, construct, extend, name, basename);

        // Store destruct onto class
        if (destruct)
        {
          if (qx.core.Environment.get("qx.aspects")) {
            destruct = qx.core.Aspect.wrap(name, destruct, "destructor");
          }

          clazz.$$destructor = destruct;
          qx.Bootstrap.setDisplayName(destruct, name, "destruct");
        }
      }

      // Store class reference in global class registry
      this.$$registry[name] = clazz;

      // Return final class object
      return clazz;
    },






    /*
    ---------------------------------------------------------------------------
       PRIVATE ADD HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Attach events to the class
     *
     * @param clazz {Class} class to add the events to
     * @param events {Map} map of event names the class fires.
     * @param patch {Boolean ? false} Enable redefinition of event type?
     */
    __addEvents : function(clazz, events, patch)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (typeof events !== "object" || events instanceof Array) {
          throw new Error(clazz.classname + ": the events must be defined as map!");
        }

        for (var key in events)
        {
          if (typeof events[key] !== "string") {
            throw new Error(clazz.classname + "/" + key + ": the event value needs to be a string with the class name of the event object which will be fired.");
          }
        }

        // Compare old and new event type/value if patching is disabled
        if (clazz.$$events && patch !== true)
        {
          for (var key in events)
          {
            if (clazz.$$events[key] !== undefined && clazz.$$events[key] !== events[key]) {
              throw new Error(clazz.classname + "/" + key + ": the event value/type cannot be changed from " + clazz.$$events[key] + " to " + events[key]);
            }
          }
        }
      }

      if (clazz.$$events)
      {
        for (var key in events) {
          clazz.$$events[key] = events[key];
        }
      }
      else
      {
        clazz.$$events = events;
      }
    },


    /**
     * Attach properties to classes
     *
     * @param clazz {Class} class to add the properties to
     * @param properties {Map} map of properties
     * @param patch {Boolean ? false} Overwrite property with the limitations of a property
               which means you are able to refine but not to replace (esp. for new properties)
     */
    __addProperties : function(clazz, properties, patch)
    {
      var config;

      if (patch === undefined) {
        patch = false;
      }

      var proto = clazz.prototype;

      for (var name in properties)
      {
        config = properties[name];

        // Check incoming configuration
        if (qx.core.Environment.get("qx.debug")) {
          this.__validateProperty(clazz, name, config, patch);
        }

        // Store name into configuration
        config.name = name;

        // Add config to local registry
        if (!config.refine)
        {
          if (clazz.$$properties === undefined) {
            clazz.$$properties = {};
          }

          clazz.$$properties[name] = config;
        }

        // Store init value to prototype. This makes it possible to
        // overwrite this value in derived classes.
        if (config.init !== undefined) {
          clazz.prototype["$$init_" + name] = config.init;
        }

        // register event name
        if (config.event !== undefined) {
          var event = {}
          event[config.event] = "qx.event.type.Data";
          this.__addEvents(clazz, event, patch);
        }

        // Remember inheritable properties
        if (config.inheritable)
        {
          qx.core.Property.$$inheritable[name] = true;
          if (!proto.$$refreshInheritables) {
            qx.core.Property.attachRefreshInheritables(clazz);
          }
        }

        if (!config.refine) {
          qx.core.Property.attachMethods(clazz, name, config);
        }
      }
    },

    /**
     * Validates the given property
     *
     * @signature function(clazz, name, config, patch)
     * @param clazz {Class} class to add property to
     * @param name {String} name of the property
     * @param config {Map} configuration map
     * @param patch {Boolean ? false} enable refine/patch?
     */
    __validateProperty : qx.core.Environment.select("qx.debug",
    {
      "true": function(clazz, name, config, patch)
      {
        var has = this.hasProperty(clazz, name);

        if (has)
        {
          var existingProperty = this.getPropertyDefinition(clazz, name);

          if (config.refine && existingProperty.init === undefined) {
            throw new Error("Could not refine an init value if there was previously no init value defined. Property '" + name + "' of class '" + clazz.classname + "'.");
          }
        }

        if (!has && config.refine) {
          throw new Error("Could not refine non-existent property: '" + name + "' of class: '" + clazz.classname + "'!");
        }

        if (has && !patch) {
          throw new Error("Class " + clazz.classname + " already has a property: " + name + "!");
        }

        if (has && patch)
        {
          if (!config.refine) {
            throw new Error('Could not refine property "' + name + '" without a "refine" flag in the property definition! This class: ' + clazz.classname + ', original class: ' + this.getByProperty(clazz, name).classname + '.');
          }

          for (var key in config)
          {
            if (key !== "init" && key !== "refine") {
              throw new Error("Class " + clazz.classname + " could not refine property: " + name + "! Key: " + key + " could not be refined!");
            }
          }
        }

        // Check 0.7 keys
        var allowed = config.group ? qx.core.Property.$$allowedGroupKeys : qx.core.Property.$$allowedKeys;
        for (var key in config)
        {
          if (allowed[key] === undefined) {
            throw new Error('The configuration key "' + key + '" of property "' + name + '" in class "' + clazz.classname + '" is not allowed!');
          }

          if (config[key] === undefined) {
            throw new Error('Invalid key "' + key + '" of property "' + name + '" in class "' + clazz.classname + '"! The value is undefined: ' + config[key]);
          }

          if (allowed[key] !== null && typeof config[key] !== allowed[key]) {
            throw new Error('Invalid type of key "' + key + '" of property "' + name + '" in class "' + clazz.classname + '"! The type of the key must be "' + allowed[key] + '"!');
          }
        }

        if (config.transform != null)
        {
          if (!(typeof config.transform == "string")) {
            throw new Error('Invalid transform definition of property "' + name + '" in class "' + clazz.classname + '"! Needs to be a String.');
          }
        }

        if (config.check != null)
        {
          if (
            !qx.Bootstrap.isString(config.check) &&
            !qx.Bootstrap.isArray(config.check) &&
            !qx.Bootstrap.isFunction(config.check)
          ) {
            throw new Error('Invalid check definition of property "' + name + '" in class "' + clazz.classname + '"! Needs to be a String, Array or Function.');
          }
        }
      },

      "default" : null
    }),


    /**
     * Attach members to a class
     *
     * @param clazz {Class} clazz to add members to
     * @param members {Map} The map of members to attach
     * @param patch {Boolean ? false} Enable patching of
     * @param base (Boolean ? true) Attach base flag to mark function as members
     *     of this class
     * @param wrap {Boolean ? false} Whether the member method should be wrapped.
     *     this is needed to allow base calls in patched mixin members.
     */
    __addMembers : function(clazz, members, patch, base, wrap)
    {
      var proto = clazz.prototype;
      var key, member;

      qx.Bootstrap.setDisplayNames(members, clazz.classname + ".prototype");

      for (var i=0, a=qx.Bootstrap.getKeys(members), l=a.length; i<l; i++)
      {
        key = a[i];
        member = members[key];

        if (qx.core.Environment.get("qx.debug"))
        {
          if (proto[key] !== undefined && key.charAt(0) == "_" && key.charAt(1) == "_") {
            throw new Error('Overwriting private member "' + key + '" of Class "' + clazz.classname + '" is not allowed!');
          }

          if (patch !== true && proto.hasOwnProperty(key)) {
            throw new Error('Overwriting member "' + key + '" of Class "' + clazz.classname + '" is not allowed!');
          }
        }

        // Added helper stuff to functions
        // Hint: Could not use typeof function because RegExp objects are functions, too
        // Protect to apply base property and aspect support on special attributes e.g.
        // classes which are function like as well.
        if (base !== false && member instanceof Function && member.$$type == null)
        {
          if (wrap == true)
          {
            // wrap "patched" mixin member
            member = this.__mixinMemberWrapper(member, proto[key]);
          }
          else
          {
            // Configure extend (named base here)
            // Hint: proto[key] is not yet overwritten here
            if (proto[key]) {
              member.base = proto[key];
            }
            member.self = clazz;
          }

          if (qx.core.Environment.get("qx.aspects")) {
            member = qx.core.Aspect.wrap(clazz.classname + "." + key, member, "member");
          }
        }

        // Attach member
        proto[key] = member;
      }
    },


    /**
     * Wraps a member function of a mixin, which is included using "patch". This
     * allows "base" calls in the mixin member function.
     *
     * @param member {Function} The mixin method to wrap
     * @param base {Function} The overwritten method
     * @return {Function} the wrapped mixin member
     */
    __mixinMemberWrapper : function(member, base)
    {
      if (base)
      {
        return function()
        {
          var oldBase = member.base;
          member.base = base;
          var retval = member.apply(this, arguments);
          member.base = oldBase;
          return retval;
        }
      }
      else
      {
        return member;
      }
    },


    /**
     * Add a single interface to a class
     *
     * @param clazz {Class} class to add interface to
     * @param iface {Interface} the Interface to add
     */
    __addInterface : function(clazz, iface)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!clazz || !iface) {
          throw new Error("Incomplete parameters!")
        }

        // This differs from mixins, we only check if the interface is already
        // directly used by this class. It is allowed however, to have an interface
        // included multiple times by extends in the interfaces etc.
        if (this.hasOwnInterface(clazz, iface)) {
          throw new Error('Interface "' + iface.name + '" is already used by Class "' + clazz.classname + '!');
        }

        // Check interface and wrap members
        if (clazz.$$classtype !== "abstract") {
          qx.Interface.assert(clazz, iface, true);
        }
      }

      // Store interface reference
      var list = qx.Interface.flatten([iface]);
      if (clazz.$$implements)
      {
        clazz.$$implements.push(iface);
        clazz.$$flatImplements.push.apply(clazz.$$flatImplements, list);
      }
      else
      {
        clazz.$$implements = [iface];
        clazz.$$flatImplements = list;
      }
    },


    /**
     * Wrap the constructor of an already existing clazz. This function will
     * replace all references to the existing constructor with the new wrapped
     * constructor.
     *
     * @param clazz {Class} The class to wrap
     */
    __retrospectWrapConstruct : function(clazz)
    {
      var name = clazz.classname
      var wrapper = this.__wrapConstructor(clazz, name, clazz.$$classtype);

      // copy all keys from the wrapped constructor to the wrapper
      for (var i=0, a=qx.Bootstrap.getKeys(clazz), l=a.length; i<l; i++)
      {
        key = a[i];
        wrapper[key] = clazz[key];
      }

      // fix prototype
      wrapper.prototype = clazz.prototype;

      // fix self references in members
      var members = clazz.prototype;
      for (var i=0, a=qx.Bootstrap.getKeys(members), l=a.length; i<l; i++)
      {
        key = a[i];
        var method = members[key];

        // check if method is available because null values can be stored as
        // init values on classes e.g. [BUG #3709]
        if (method && method.self == clazz) {
          method.self = wrapper;
        }
      }

      // fix base and superclass references in all defined classes
      for(var key in this.$$registry)
      {
        var construct = this.$$registry[key];
        if (!construct) {
          continue;
        }

        if (construct.base == clazz) {
          construct.base = wrapper;
        }
        if (construct.superclass == clazz) {
          construct.superclass = wrapper;
        }

        if (construct.$$original)
        {
          if (construct.$$original.base == clazz) {
            construct.$$original.base = wrapper;
          }
          if (construct.$$original.superclass == clazz) {
            construct.$$original.superclass = wrapper;
          }
        }
      }
      qx.Bootstrap.createNamespace(name, wrapper);
      this.$$registry[name] = wrapper;

      return wrapper;
    },


    /**
     * Include all features of the mixin into the given class, recursively.
     *
     * @param clazz {Class} The class onto which the mixin should be attached.
     * @param mixin {Mixin} Include all features of this mixin
     * @param patch {Boolean} Overwrite existing fields, functions and properties
     */
    __addMixin : function(clazz, mixin, patch)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!clazz || !mixin) {
          throw new Error("Incomplete parameters!")
        }
      }

      if (this.hasMixin(clazz, mixin)) {
        return;
      }

      var isConstructorWrapped = clazz.$$original;
      if (mixin.$$constructor && !isConstructorWrapped) {
        clazz = this.__retrospectWrapConstruct(clazz);
      }

      // Attach content
      var list = qx.Mixin.flatten([mixin]);
      var entry;

      for (var i=0, l=list.length; i<l; i++)
      {
        entry = list[i];

        // Attach events
        if (entry.$$events) {
          this.__addEvents(clazz, entry.$$events, patch);
        }

        // Attach properties (Properties are already readonly themselves, no patch handling needed)
        if (entry.$$properties) {
          this.__addProperties(clazz, entry.$$properties, patch);
        }

        // Attach members (Respect patch setting, but dont apply base variables)
        if (entry.$$members) {
          this.__addMembers(clazz, entry.$$members, patch, patch, patch);
        }
      }

      // Store mixin reference
      if (clazz.$$includes)
      {
        clazz.$$includes.push(mixin);
        clazz.$$flatIncludes.push.apply(clazz.$$flatIncludes, list);
      }
      else
      {
        clazz.$$includes = [mixin];
        clazz.$$flatIncludes = list;
      }
    },





    /*
    ---------------------------------------------------------------------------
       PRIVATE FUNCTION HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the default constructor.
     * This constructor just calls the constructor of the base class.
     *
     * @return {Function} The default constructor.
     */
    __createDefaultConstructor : function()
    {
      function defaultConstructor() {
        defaultConstructor.base.apply(this, arguments);
      };

      return defaultConstructor;
    },


    /**
     * Returns an empty function. This is needed to get an empty function with an empty closure.
     *
     * @return {Function} empty function
     */
    __createEmptyFunction : function() {
      return function() {};
    },


    /**
     * Checks if the constructor needs to be wrapped.
     *
     * @param base {Class} The base class.
     * @param mixins {Mixin[]} All mixins which should be included.
     * @return {Boolean} true, if the constructor needs to be wrapped.
     */
    __needsConstructorWrapper : function(base, mixins)
    {
      if (qx.core.Environment.get("qx.debug")) {
        return true;
      }

      // Check for base class mixin constructors
      if (base && base.$$includes)
      {
        var baseMixins=base.$$flatIncludes;
        for (var i=0, l=baseMixins.length; i<l; i++)
        {
          if (baseMixins[i].$$constructor) {
            return true;
          }
        }
      }

      // check for direct mixin constructors
      if (mixins)
      {
        var flatMixins = qx.Mixin.flatten(mixins);
        for (var i=0, l=flatMixins.length; i<l; i++)
        {
          if (flatMixins[i].$$constructor) {
            return true;
          }
        }
      }

      return false;
    },


    /**
     * Generate a wrapper of the original class constructor in order to enable
     * some of the advanced OO features (e.g. abstract class, singleton, mixins)
     *
     * @param construct {Function} the original constructor
     * @param name {String} name of the class
     * @param type {String} the user specified class type
     */
    __wrapConstructor : function(construct, name, type)
    {
      var wrapper = function()
      {
        var clazz = wrapper;

        if (qx.core.Environment.get("qx.debug"))
        {
          // new keyword check
          if (!(this instanceof clazz)) {
            throw new Error("Please initialize '" + name + "' objects using the new keyword!");
          }

          // add abstract and singleton checks
          if (type === "abstract")
          {
            if (this.classname===name) {
              throw new Error("The class '," + name + "' is abstract! It is not possible to instantiate it.");
            }
          }
          else if (type === "singleton")
          {
            if (!clazz.$$allowconstruct) {
              throw new Error("The class '" + name + "' is a singleton! It is not possible to instantiate it directly. Use the static getInstance() method instead.");
            }
          }
        }

        // Execute default constructor
        var retval=clazz.$$original.apply(this,arguments);

        // Initialize local mixins
        if (clazz.$$includes)
        {
          var mixins=clazz.$$flatIncludes;
          for (var i=0, l=mixins.length; i<l; i++)
          {
            if (mixins[i].$$constructor) {
              mixins[i].$$constructor.apply(this,arguments);
            }
          }
        }

        if (qx.core.Environment.get("qx.debug")) {
          // Mark instance as initialized
          if (this.classname === name) {
            this.$$initialized = true;
          }
        }

        // Return optional return value
        return retval;
      };

      if (qx.core.Environment.get("qx.aspects"))
      {
        var aspectWrapper = qx.core.Aspect.wrap(name, wrapper, "constructor");
        wrapper.$$original = construct;
        wrapper.constructor = aspectWrapper;
        wrapper = aspectWrapper;
      }

      // Store original constructor
      wrapper.$$original = construct;

      // Store wrapper into constructor (needed for base calls etc.)
      construct.wrapper = wrapper;

      // Return generated wrapper
      return wrapper;
    }
  },

  defer : function()
  {
    // Binding of already loaded bootstrap classes
    if (qx.core.Environment.get("qx.aspects"))
    {
      for (var classname in qx.Bootstrap.$$registry)
      {
        var statics = qx.Bootstrap.$$registry[classname];

        for (var key in statics)
        {
          // only functions, no regexps
          if (statics[key] instanceof Function) {
            statics[key] = qx.core.Aspect.wrap(classname + "." + key, statics[key], "static");
          }
        }
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Andreas Ecker (ecker)
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#require(qx.core.Environment)

/* ************************************************************************ */

/**
 * Manage variants of source code. May it be for different debug options,
 * browsers or other environment flags.
 *
 * Variants enable the selection and removal of code from the build version.
 * A variant consists of a collection of states from which exactly one is active
 * at load time of the framework. The global map <code>qxvariants</code> can be
 * used to select a variant before the Framework is loaded.
 *
 * Depending on the selected variant a specific code
 * path can be chosen using the <code>select</code> method. The generator is
 * able to set a variant and remove all code paths which are
 * not selected by the variant.
 *
 * Variants are used to implement browser optimized builds and to remove
 * debugging code from the build version. It is very similar to conditional
 * compilation in C/C++.
 *
 * Here is a list of pre-defined variant names, the possible values they take,
 * and their system default:
 * <table>
 *  <tr>
 *  <th>Variant name</th><th>Possible values</th><th>System default</th>
 *  </tr><tr>
 *  <td>qx.client          <td>[ "gecko", "mshtml", "opera", "webkit" ]   <td>&lt;auto-detected&gt;
 *  </tr><tr>
 *  <td>qx.debug                   <td>[ "on", "off" ]                    <td>"on"
 *  </tr><tr>
 *  <td>qx.aspects                 <td>[ "on", "off" ]                    <td>"off"
 *  </tr><tr>
 *  <td>qx.dynlocale     <td>[ "on", "off" ]                    <td>"on"
 *  </tr><tr>
 *  <td>qx.mobile.emulatetouch     <td>[ "on", "off" ]                    <td>"off"
 *  </tr><tr>
 *  <td>qx.mobile.nativescroll     <td>[ "on", "off" ]                    <td>"off"
 *  </tr>
 * </table>
 *
 * @deprecated since 1.4: Please use qx.core.Environment instead.
 */
qx.Bootstrap.define("qx.core.Variant",
{
  statics :
  {
    /** {Map} stored variants */
    __variants : {},


    /** {Map} cached results */
    __cache : {},


    /**
     * Pseudo function as replacement for isSet() which will only be handled by the optimizer
     *
     * @internal
     * @return {Boolean}
     */
    compilerIsSet : function() {
      return true;
    },


    /**
     * Define a variant
     *
     * @param key {String} An Unique key for the variant. The key must be prefixed with a
     *   namespace identifier (e.g. <code>"qx.debug"</code>)
     * @param allowedValues {String[]} An array of all allowed values for this variant.
     * @param defaultValue {String} Default value for the variant. Must be one of the values
     *   defined in <code>defaultValues</code>.
     *
     * @deprecated since 1.4: Please use qx.core.Environment.add() instead.
     */
    define : function(key, allowedValues, defaultValue)
    {
      if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        qx.Bootstrap.warn(
          "The method 'qx.core.Variant.define('" + key + "')' is deprecated: " +
          "Please use qx.core.Environment.add('" + key + "') instead."
        );
      }

      this.defineDeprecated(key, allowedValues, defaultValue);
    },

    /**
     * Define a variant without the deprecation warning.
     *
     * @param key {String} An Unique key for the variant. The key must be prefixed with a
     *   namespace identifier (e.g. <code>"qx.debug"</code>)
     * @param allowedValues {String[]} An array of all allowed values for this variant.
     * @param defaultValue {String} Default value for the variant. Must be one of the values
     *   defined in <code>defaultValues</code>.
     * @internal
     */
    defineDeprecated : function(key, allowedValues, defaultValue)
    {
      if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        if (!this.__isValidArray(allowedValues)) {
          throw new Error('Allowed values of variant "' + key + '" must be defined!');
        }

        if (defaultValue === undefined) {
          throw new Error('Default value of variant "' + key + '" must be defined!');
        }
      }

      if (!this.__variants[key])
      {
        this.__variants[key] = {};
      }
      else if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        if (this.__variants[key].defaultValue !== undefined) {
          throw new Error('Variant "' + key + '" is already defined!');
        }
      }

      this.__variants[key].allowedValues = allowedValues;
      this.__variants[key].defaultValue = defaultValue;
    },


    /**
     * Get the current value of a variant.
     *
     * @param key {String} name of the variant
     * @return {String} current value of the variant
     *
     * @deprecated since 1.4: Please use qx.core.Environment.get() instead.
     */
    get : function(key)
    {
      var data = this.__variants[key];

      if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        qx.Bootstrap.warn(
          "The method 'qx.core.Variant.get('" + key + "')' is deprecated: " +
          "Please use qx.core.Environment.get('" + key + "') instead."
        );

        if (data === undefined) {
          throw new Error('Variant "' + key + '" is not defined.');
        }
      }

      if (data.value !== undefined) {
        return data.value;
      }

      return data.defaultValue;
    },


    /**
     * Import settings from global qxvariants into current environment
     *
     * @lint ignoreUndefined(qxvariants)
     */
    __init : function()
    {
      if (window.qxvariants)
      {
        for (var key in qxvariants)
        {
          if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
          {
            if ((key.split(".")).length < 2) {
              throw new Error('Malformed settings key "' + key + '". Must be following the schema "namespace.key".');
            }
          }

          if (!this.__variants[key]) {
            this.__variants[key] = {};
          }

          this.__variants[key].value = qxvariants[key];
        }

        window.qxvariants = undefined;

        try {
          delete window.qxvariants;
        } catch(ex) {};

        this.__loadUrlVariants(this.__variants);
      }
    },


    /**
     * Load variants from URL parameters if the setting <code>"qx.allowUrlSettings"</code>
     * is set to true.
     *
     * The url scheme for variants is: <code>qxvariant:VARIANT_NAME:VARIANT_VALUE</code>.
     */
    __loadUrlVariants : function()
    {
      if (qx.core.Environment.get("qx.allowUrlVariants") != true) {
        return;
      }

      var urlVariants = document.location.search.slice(1).split("&");

      for (var i=0; i<urlVariants.length; i++)
      {
        var variant = urlVariants[i].split(":");
        if (variant.length != 3 || variant[0] != "qxvariant") {
          continue;
        }

        var key = variant[1];
        if (!this.__variants[key]) {
          this.__variants[key] = {};
        }

        if (qx.core.Variant.compilerIsSet("qx.debug", "on")) {
          qx.Bootstrap.warn(
            "URL variants are deprecated. Please use URL environment " +
            "variables instead. (qxvariant --> qxenv)"
          );
        }
        this.__variants[key].value = decodeURIComponent(variant[2]);
      }
    },


    /**
     * Select a function depending on the value of the variant.
     *
     * Example:
     *
     * <pre class='javascript'>
     * var f = qx.core.Environment.select("engine.name", {
     *   "gecko": function() { ... },
     *   "mshtml|opera": function() { ... },
     *   "default": function() { ... }
     * });
     * </pre>
     *
     * Depending on the value of the <code>"qx.client"</code> variant whit will select the
     * corresponding function. The first case is selected if the variant is "gecko", the second
     * is selected if the variant is "mshtml" or "opera" and the third function is selected if
     * none of the other keys match the variant. "default" is the default case.
     *
     * @param key {String} name of the variant. To enable the generator to optimize
     *   this selection, the key must be a string literal.
     * @param variantFunctionMap {Map} map with variant names as keys and functions as values.
     * @return {Function} The selected function from the map.
     *
     * @deprecated since 1.4: Please use qx.core.Environment.select() instead.
     */
    select : function(key, variantFunctionMap)
    {
      if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        qx.Bootstrap.warn(
          "The method 'qx.core.Variant.select('" + key + "')' is deprecated: " +
          "Please use qx.core.Environment.select('" + key + "') instead."
        );

        // WARINING: all changes to this function must be duplicated in the generator!!
        // modules/variantoptimizer.py (processVariantSelect)
        if (!this.__isValidObject(this.__variants[key])) {
          throw new Error("Variant \"" + key + "\" is not defined");
        }

        if (!this.__isValidObject(variantFunctionMap)) {
          throw new Error("the second parameter must be a map!");
        }
      }

      for (var variant in variantFunctionMap)
      {
        if (this.isSet(key, variant)) {
          return variantFunctionMap[variant];
        }
      }

      if (variantFunctionMap["default"] !== undefined) {
        return variantFunctionMap["default"];
      }

      if (qx.core.Variant.compilerIsSet("qx.debug", "on"))
      {
        throw new Error('No match for variant "' + key +
          '" in variants [' + qx.Bootstrap.getKeysAsString(variantFunctionMap) +
          '] found, and no default ("default") given');
      }
    },


    /**
     * Check whether a variant is set to a given value. To enable the generator to optimize
     * this selection, both parameters must be string literals.
     *
     * This method is meant to be used in if statements to select code paths. If the condition of
     * an if statement is only this method, the generator is able to optimize the if
     * statement.
     *
     * Example:
     *
     * <pre class='javascript'>
     * if ((qx.core.Environment.get("engine.name") == "mshtml")) {
     *   // some Internet Explorer specific code
     * } else if((qx.core.Environment.get("engine.name") == "opera")){
     *   // Opera specific code
     * } else {
     *   // common code for all other browsers
     * }
     * </pre>
     *
     * @param key {String} name of the variant
     * @param variants {String} value to check for. Several values can be "or"-combined by separating
     *   them with a "|" character. A value of "mshtml|opera" would for example check if the variant is
     *   set to "mshtml" or "opera"
     * @return {Boolean} whether the variant is set to the given value
     *
     * @deprecated since 1.4: Please use 'qx.core.Environment.get() == ' instead.
     */
    isSet : function(key, variants)
    {
      if (qx.core.Variant.compilerIsSet("qx.debug", "on")) {
        qx.Bootstrap.warn(
          "The method 'qx.core.Variant.isSet('" + key + "')' is deprecated: " +
          "Please use 'qx.core.Environment.get('" + key + "') ==' instead. "
        );
      }
      var access = key + "$" + variants;
      if (this.__cache[access] !== undefined) {
        return this.__cache[access];
      }

      var retval = false;

      // fast path
      if (variants.indexOf("|") < 0)
      {
        retval = this.get(key) === variants;
      }
      else
      {
        var keyParts = variants.split("|");

        for (var i=0, l=keyParts.length; i<l; i++)
        {
          if (this.get(key) === keyParts[i])
          {
            retval = true;
            break;
          }
        }
      }

      this.__cache[access] = retval;
      return retval;
    },


    /**
     * Whether a value is a valid array. Valid arrays are:
     *
     * * type is object
     * * instance is Array
     *
     * @name __isValidArray
     * @param v {var} the value to validate.
     * @return {Boolean} whether the variable is valid
     */
    __isValidArray : function(v) {
      return typeof v === "object" && v !== null && v instanceof Array;
    },


    /**
     * Whether a value is a valid object. Valid object are:
     *
     * * type is object
     * * instance != Array
     *
     * @name __isValidObject
     * @param v {var} the value to validate.
     * @return {Boolean} whether the variable is valid
     */
    __isValidObject : function(v) {
      return typeof v === "object" && v !== null && !(v instanceof Array);
    },


    /**
     * Whether the array contains the given element
     *
     * @name __arrayContains
     * @param arr {Array} the array
     * @param obj {var} object to look for
     * @return {Boolean} whether the array contains the element
     */
    __arrayContains : function(arr, obj)
    {
      for (var i=0, l=arr.length; i<l; i++)
      {
        if (arr[i] == obj) {
          return true;
        }
      }

      return false;
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics)
  {
    statics.defineDeprecated(
      "qx.client",
      [ "gecko", "mshtml", "opera", "webkit" ],
      qx.bom.client.Engine.getName()
    );
    statics.defineDeprecated("qx.debug", [ "on", "off" ], "on");
    statics.defineDeprecated("qx.aspects", [ "on", "off" ], "off");
    statics.defineDeprecated("qx.dynlocale", [ "on", "off" ], "on");
    statics.defineDeprecated("qx.mobile.emulatetouch", [ "on", "off" ], "off");
    statics.defineDeprecated("qx.mobile.nativescroll", [ "on", "off" ], "off");

    statics.__init();
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

   ======================================================================

   This class contains code based on the following work:

   * jQuery
     http://jquery.com
     Version 1.3.1

     Copyright:
       2009 John Resig

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/**
 * Static helper functions for arrays with a lot of often used convenience
 * methods like <code>remove</code> or <code>contains</code>.
 *
 * The native JavaScript Array is not modified by this class. However,
 * there are modifications to the native Array in {@link qx.lang.Core} for
 * browsers that do not support certain JavaScript 1.6 features natively .
 *
 * The string/array generics introduced in JavaScript 1.6 are supported by
 * {@link qx.lang.Generics}.
 */
qx.Class.define("qx.lang.Array",
{
  statics :
  {
    /**
     * Converts array like constructions like the <code>argument</code> object,
     * node collections like the ones returned by <code>getElementsByTagName</code>
     * or extended array objects like <code>qx.type.BaseArray</code> to an
     * native Array instance.
     *
     * @param object {var} any array like object
     * @param offset {Integer?0} position to start from
     * @return {Array} New array with the content of the incoming object
     */
    toArray : function(object, offset) {
      return this.cast(object, Array, offset);
    },


    /**
     * Converts an array like object to any other array like
     * object.
     *
     * Attention: The returned array may be same
     * instance as the incoming one if the constructor is identical!
     *
     * @param object {var} any array-like object
     * @param constructor {Function} constructor of the new instance
     * @param offset {Integer?0} position to start from
     * @return {Array} the converted array
     */
    cast : function(object, constructor, offset)
    {
      if (object.constructor === constructor) {
        return object;
      }

      if (qx.Class.hasInterface(object, qx.data.IListData)) {
        var object = object.toArray();
      }

      // Create from given constructor
      var ret = new constructor;

      // Some collections in mshtml are not able to be sliced.
      // These lines are a special workaround for this client.
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        if (object.item)
        {
          for (var i=offset||0, l=object.length; i<l; i++) {
            ret.push(object[i]);
          }

          return ret;
        }
      }

      // Copy over items
      if (Object.prototype.toString.call(object) === "[object Array]" && offset == null) {
        ret.push.apply(ret, object);
      } else {
        ret.push.apply(ret, Array.prototype.slice.call(object, offset||0));
      }

      return ret;
    },


    /**
     * Convert an arguments object into an array
     *
     * @param args {arguments} arguments object
     * @param offset {Integer?0} position to start from
     * @return {Array} a newly created array (copy) with the content of the arguments object.
     */
    fromArguments : function(args, offset) {
      return Array.prototype.slice.call(args, offset||0);
    },


    /**
     * Convert a (node) collection into an array
     *
     * @param coll {var} node collection
     * @return {Array} a newly created array (copy) with the content of the node collection.
     */
    fromCollection : function(coll)
    {
      // Some collection is mshtml are not able to be sliced.
      // This lines are a special workaround for this client.
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        if (coll.item)
        {
          var arr = [];
          for (var i=0, l=coll.length; i<l; i++) {
            arr[i] = coll[i];
          }

          return arr;
        }
      }

      return Array.prototype.slice.call(coll, 0);
    },


    /**
     * Expand shorthand definition to a four element list.
     * This is an utility function for padding/margin and all other shorthand handling.
     *
     * @param input {Array} arr with one to four elements
     * @return {Array} an arr with four elements
     */
    fromShortHand : function(input)
    {
      var len = input.length;
      var result = qx.lang.Array.clone(input);

      // Copy Values (according to the length)
      switch(len)
      {
        case 1:
          result[1] = result[2] = result[3] = result[0];
          break;

        case 2:
          result[2] = result[0];
          // no break here

        case 3:
          result[3] = result[1];
      }

      // Return list with 4 items
      return result;
    },


    /**
     * Return a copy of the given array
     *
     * @param arr {Array} the array to copy
     * @return {Array} copy of the array
     */
    clone : function(arr) {
      return arr.concat();
    },


    /**
     * Insert an element at a given position into the array
     *
     * @param arr {Array} the array
     * @param obj {var} the element to insert
     * @param i {Integer} position where to insert the element into the array
     * @return {Array} the array
     */
    insertAt : function(arr, obj, i)
    {
      arr.splice(i, 0, obj);

      return arr;
    },


    /**
     * Insert an element into the array before a given second element
     *
     * @param arr {Array} the array
     * @param obj {var} object to be inserted
     * @param obj2 {var} insert obj1 before this object
     * @return {Array} the array
     */
    insertBefore : function(arr, obj, obj2)
    {
      var i = arr.indexOf(obj2);

      if (i == -1) {
        arr.push(obj);
      } else {
        arr.splice(i, 0, obj);
      }

      return arr;
    },


    /**
     * Insert an element into the array after a given second element
     *
     * @param arr {Array} the array
     * @param obj {var} object to be inserted
     * @param obj2 {var} insert obj1 after this object
     * @return {Array} the array
     */
    insertAfter : function(arr, obj, obj2)
    {
      var i = arr.indexOf(obj2);

      if (i == -1 || i == (arr.length - 1)) {
        arr.push(obj);
      } else {
        arr.splice(i + 1, 0, obj);
      }

      return arr;
    },


    /**
     * Remove an element from the array at the given index
     *
     * @param arr {Array} the array
     * @param i {Integer} index of the element to be removed
     * @return {var} The removed element.
     */
    removeAt : function(arr, i) {
      return arr.splice(i, 1)[0];
    },


    /**
     * Remove all elements from the array
     *
     * @param arr {Array} the array
     * @return {Array} empty array
     */
    removeAll : function(arr)
    {
      arr.length = 0;
      return this;
    },


    /**
     * Append the elements of an array to the array
     *
     * @param arr1 {Array} the array
     * @param arr2 {Array} the elements of this array will be appended to other one
     * @return {Array} The modified array.
     * @throws an exception if one of the arguments is not an array
     */
    append : function(arr1, arr2)
    {
      // this check is important because opera throws an uncatchable error if apply is called without
      // an arr as second argument.
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.core.Assert && qx.core.Assert.assertArray(arr1, "The first parameter must be an array.");
        qx.core.Assert && qx.core.Assert.assertArray(arr2, "The second parameter must be an array.");
      }

      Array.prototype.push.apply(arr1, arr2);
      return arr1;
    },


    /**
     * Modifies the first array as it removes all elements
     * which are listed in the second array as well.
     *
     * @param arr1 {Array} the array
     * @param arr2 {Array} the elements of this array will be excluded from the other one
     * @return {Array} The modified array.
     * @throws an exception if one of the arguments is not an array
     */
    exclude : function(arr1, arr2)
    {
      // this check is important because opera throws an uncatchable error if apply is called without
      // an arr as second argument.
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.core.Assert && qx.core.Assert.assertArray(arr1, "The first parameter must be an array.");
        qx.core.Assert && qx.core.Assert.assertArray(arr2, "The second parameter must be an array.");
      }

      for (var i=0, il=arr2.length, index; i<il; i++)
      {
        index = arr1.indexOf(arr2[i]);
        if (index != -1) {
          arr1.splice(index, 1);
        }
      }

      return arr1;
    },


    /**
     * Remove an element from the array
     *
     * @param arr {Array} the array
     * @param obj {var} element to be removed from the array
     * @return {var} the removed element
     */
    remove : function(arr, obj)
    {
      var i = arr.indexOf(obj);

      if (i != -1)
      {
        arr.splice(i, 1);
        return obj;
      }
    },


    /**
     * Whether the array contains the given element
     *
     * @param arr {Array} the array
     * @param obj {var} object to look for
     * @return {Boolean} whether the arr contains the element
     */
    contains : function(arr, obj) {
      return arr.indexOf(obj) !== -1;
    },


    /**
     * Check whether the two arrays have the same content. Checks only the
     * equality of the arrays' content.
     *
     * @param arr1 {Array} first array
     * @param arr2 {Array} second array
     * @return {Boolean} Whether the two arrays are equal
     */
    equals : function(arr1, arr2)
    {
      var length = arr1.length;

      if (length !== arr2.length) {
        return false;
      }

      for (var i=0; i<length; i++)
      {
        if (arr1[i] !== arr2[i]) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the given array. Supports
     * numeric values only.
     *
     * @param arr {Number[]} Array to process
     * @return {Number} The sum of all values.
     */
    sum : function(arr)
    {
      var result = 0;
      for (var i=0, l=arr.length; i<l; i++) {
        result += arr[i];
      }

      return result;
    },


    /**
     * Returns the highest value in the given array. Supports
     * numeric values only.
     *
     * @param arr {Number[]} Array to process
     * @return {Number | null} The highest of all values or undefined if array is empty.
     */
    max : function(arr)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert && qx.core.Assert.assertArray(arr, "Parameter must be an array.");
      }

      var i, len=arr.length, result = arr[0];

      for (i = 1; i < len; i++)
      {
        if (arr[i] > result) {
          result = arr[i];
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the given array. Supports
     * numeric values only.
     *
     * @param arr {Number[]} Array to process
     * @return {Number | null} The lowest of all values or undefined if array is empty.
     */
    min : function(arr)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert && qx.core.Assert.assertArray(arr, "Parameter must be an array.");
      }

      var i, len=arr.length, result = arr[0];

      for (i = 1; i < len; i++)
      {
        if (arr[i] < result) {
          result = arr[i];
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Recreates an array which is free of all duplicate elements from the original.
     *
     * This method do not modifies the original array!
     *
     * Keep in mind that this methods deletes undefined indexes.
     *
     * @param arr {Array} Incoming array
     * @return {Array} Returns a copy with no duplicates or the original array if no duplicates were found
     */
    unique: function(arr)
    {
      var ret=[], doneStrings={}, doneNumbers={}, doneObjects={};
      var value, count=0;
      var key = "qx" + qx.lang.Date.now();
      var hasNull=false, hasFalse=false, hasTrue=false;

      // Rebuild array and omit duplicates
      for (var i=0, len=arr.length; i<len; i++)
      {
        value = arr[i];

        // Differ between null, primitives and reference types
        if (value === null)
        {
          if (!hasNull)
          {
            hasNull = true;
            ret.push(value);
          }
        }
        else if (value === undefined)
        {
          // pass
        }
        else if (value === false)
        {
          if (!hasFalse)
          {
            hasFalse = true;
            ret.push(value);
          }
        }
        else if (value === true)
        {
          if (!hasTrue)
          {
            hasTrue = true;
            ret.push(value);
          }
        }
        else if (typeof value === "string")
        {
          if (!doneStrings[value])
          {
            doneStrings[value] = 1;
            ret.push(value);
          }
        }
        else if (typeof value === "number")
        {
          if (!doneNumbers[value])
          {
            doneNumbers[value] = 1;
            ret.push(value);
          }
        }
        else
        {
          hash = value[key]

          if (hash == null) {
            hash = value[key] = count++;
          }

          if (!doneObjects[hash])
          {
            doneObjects[hash] = value;
            ret.push(value);
          }
        }
      }

      // Clear object hashs
      for (var hash in doneObjects)
      {
        try
        {
          // TODO: The following delete seems to fail in IE7
          delete doneObjects[hash][key];
        }
        catch(ex)
        {
          try
          {
            doneObjects[hash][key] = null;
          }
          catch(ex)
          {
            throw new Error("Cannot clean-up map entry doneObjects[" + hash + "][" + key + "]");
          }
        }
      }

      return ret;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data binding package is still under development so there will be changes
 * to the API. This Features is for texting purpose only.
 */
qx.Mixin.define("qx.data.MBinding",
{
  members :
  {

    /**
     * The bind method delegates the call to the
     * {@link qx.data.SingleValueBinding#bind} function. As source, the current
     * object (this) will be used.
     *
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetProperty {String} The property name of the target object.
     * @param options {Map} A map containing the options. See
     *   {@link qx.data.SingleValueBinding#bind} for more
     *   information.
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index.
     *
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for object and property (source and
     *   target).
     */
    bind : function(sourcePropertyChain, targetObject, targetProperty, options)
    {
      return qx.data.SingleValueBinding.bind(
        this, sourcePropertyChain, targetObject, targetProperty, options
      );
    },


    /**
     * Removes the binding with the given id from the current object. The
     * id hast to be the id returned by any of the bind functions.
     *
     * @param id {var} The id of the binding.
     * @throws {Error} If the binding could not be found.
     */
    removeBinding: function(id){
      qx.data.SingleValueBinding.removeBindingFromObject(this, id);
    },


    /**
     * Removes all bindings from the object.
     *
     * @throws {qx.core.AssertionError} If the object is not in the internal
     *   registry of the bindings.
     * @throws {Error} If one of the bindings listed internally can not be
     *   removed.
     */
    removeAllBindings: function() {
      qx.data.SingleValueBinding.removeAllBindingsForObject(this);
    },


    /**
     * Returns an array which lists all bindings for the object.
     *
     * @return {Array} An array of binding informations. Every binding
     *   information is an array itself containing id, sourceObject, sourceEvent,
     *   targetObject and targetProperty in that order.
     */
    getBindings: function() {
      return qx.data.SingleValueBinding.getAllBindingsForObject(this);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Basic node creation and type detection
 */
qx.Class.define("qx.dom.Node",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /*
    ---------------------------------------------------------------------------
      NODE TYPES
    ---------------------------------------------------------------------------
    */

    /**
     * {Map} Node type:
     *
     * * ELEMENT
     * * ATTRIBUTE
     * * TEXT
     * * CDATA_SECTION
     * * ENTITY_REFERENCE
     * * ENTITY
     * * PROCESSING_INSTRUCTION
     * * COMMENT
     * * DOCUMENT
     * * DOCUMENT_TYPE
     * * DOCUMENT_FRAGMENT
     * * NOTATION
     */
    ELEMENT                : 1,
    ATTRIBUTE              : 2,
    TEXT                   : 3,
    CDATA_SECTION          : 4,
    ENTITY_REFERENCE       : 5,
    ENTITY                 : 6,
    PROCESSING_INSTRUCTION : 7,
    COMMENT                : 8,
    DOCUMENT               : 9,
    DOCUMENT_TYPE          : 10,
    DOCUMENT_FRAGMENT      : 11,
    NOTATION               : 12,






    /*
    ---------------------------------------------------------------------------
      DOCUMENT ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Returns the owner document of the given node
     *
     * @param node {Node|Document|Window} the node which should be tested
     * @return {Document|null} The document of the given DOM node
     */
    getDocument : function(node)
    {
      return node.nodeType === this.DOCUMENT ? node : // is document already
        node.ownerDocument || // is DOM node
        node.document; // is window
    },


    /**
     * Returns the DOM2 <code>defaultView</code> (window).
     *
     * @signature function(node)
     * @param node {Node|Document|Window} node to inspect
     * @return {Window} the <code>defaultView</code> of the given node
     */
    getWindow : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(node)
      {
        // is a window already
        if (node.nodeType == null) {
          return node;
        }

        // jump to document
        if (node.nodeType !== this.DOCUMENT) {
          node = node.ownerDocument;
        }

        // jump to window
        return node.parentWindow;
      },

      "default" : function(node)
      {
        // is a window already
        if (node.nodeType == null) {
          return node;
        }

        // jump to document
        if (node.nodeType !== this.DOCUMENT) {
          node = node.ownerDocument;
        }

        // jump to window
        return node.defaultView;
      }
    }),


    /**
     * Returns the document element. (Logical root node)
     *
     * This is a convenience attribute that allows direct access to the child
     * node that is the root element of the document. For HTML documents,
     * this is the element with the tagName "HTML".
     *
     * @param node {Node|Document|Window} node to inspect
     * @return {Element} document element of the given node
     */
    getDocumentElement : function(node) {
      return this.getDocument(node).documentElement;
    },


    /**
     * Returns the body element. (Visual root node)
     *
     * This normally only makes sense for HTML documents. It returns
     * the content area of the HTML document.
     *
     * @param node {Node|Document|Window} node to inspect
     * @return {Element} document body of the given node
     */
    getBodyElement : function(node) {
      return this.getDocument(node).body;
    },






    /*
    ---------------------------------------------------------------------------
      TYPE TESTS
    ---------------------------------------------------------------------------
    */

    /**
     * Whether the given object is a DOM node
     *
     * @param node {Node} the node which should be tested
     * @return {Boolean} true if the node is a DOM node
     */
    isNode : function(node) {
      return !!(node && node.nodeType != null);
    },


    /**
     * Whether the given object is a DOM element node
     *
     * @param node {Node} the node which should be tested
     * @return {Boolean} true if the node is a DOM element
     */
    isElement : function(node) {
      return !!(node && node.nodeType === this.ELEMENT);
    },


    /**
     * Whether the given object is a DOM document node
     *
     * @param node {Node} the node which should be tested
     * @return {Boolean} true when the node is a DOM document
     */
    isDocument : function(node) {
      return !!(node && node.nodeType === this.DOCUMENT);
    },


    /**
     * Whether the given object is a DOM text node
     *
     * @param node {Node} the node which should be tested
     * @return {Boolean} true if the node is a DOM text node
     */
    isText : function(node) {
      return !!(node && node.nodeType === this.TEXT);
    },


    /**
     * Check whether the given object is a browser window object.
     *
     * @param obj {Object} the object which should be tested
     * @return {Boolean} true if the object is a window object
     */
    isWindow : function(obj) {
      return !!(obj && obj.history && obj.location && obj.document);
    },


    /**
     * Whether the node has the given node name
     *
     * @param node {Node} the node
     * @param nodeName {String} the node name to check for
     * @return {Boolean} Whether the node has the given node name
     */
    isNodeName : function (node, nodeName)
    {
      if(!nodeName || !node || !node.nodeName) {
        return false;
      }

      return nodeName.toLowerCase() == qx.dom.Node.getName(node);
    },



    /*
    ---------------------------------------------------------------------------
      UTILITIES
    ---------------------------------------------------------------------------
    */


    /**
     * Get the node name as lower case string
     *
     * @param node {Node} the node
     * @return {String} the node name
     */
    getName : function (node)
    {
      if(!node || !node.nodeName) {
        return null;
      }

      return node.nodeName.toLowerCase();
    },


    /**
     * Returns the text content of an node where the node may be of node type
     * NODE_ELEMENT, NODE_ATTRIBUTE, NODE_TEXT or NODE_CDATA
     *
     * @param node {Node} the node from where the search should start.
     *     If the node has subnodes the text contents are recursively retreived and joined.
     * @return {String} the joined text content of the given node or null if not appropriate.
     * @signature function(node)
     */
    getText : function(node)
    {
      if(!node || !node.nodeType) {
        return null;
      }

      switch(node.nodeType)
      {
        case 1: // NODE_ELEMENT
          var i, a=[], nodes=node.childNodes, length=nodes.length;
          for (i=0; i<length; i++) {
            a[i] = this.getText(nodes[i]);
          };

          return a.join("");

        case 2: // NODE_ATTRIBUTE
        case 3: // NODE_TEXT
        case 4: // CDATA
          return node.nodeValue;
      }

      return null;
    },


    /**
     * Checks if the given node is a block node
     *
     * @param node {Node} Node
     * @return {Boolean} whether it is a block node
     */
    isBlockNode : function(node)
    {
      if (!qx.dom.Node.isElement(node)) {
       return false;
      }

      node = qx.dom.Node.getName(node);

      return /^(body|form|textarea|fieldset|ul|ol|dl|dt|dd|li|div|hr|p|h[1-6]|quote|pre|table|thead|tbody|tfoot|tr|td|th|iframe|address|blockquote)$/.test(node);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

   ======================================================================

   This class contains code based on the following work:

   * Mootools
     http://mootools.net
     Version 1.1.1

     Copyright:
       2007 Valerio Proietti

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/* ************************************************************************

#require(qx.lang.Array)

************************************************************************ */

/**
 * Collection of helper methods operating on functions.
 */
qx.Class.define("qx.lang.Function",
{
  statics :
  {
    /**
     * Extract the caller of a function from the arguments variable.
     * This will not work in Opera.
     *
     * @param args {arguments} The local arguments variable
     * @return {Function} A reference to the calling function or "undefined" if caller is not supported.
     */
    getCaller : function(args) {
      return args.caller ? args.caller.callee : args.callee.caller;
    },


    /**
     * Try to get a sensible textual description of a function object.
     * This may be the class/mixin and method name of a function
     * or at least the signature of the function.
     *
     * @param fcn {Function} function the get the name for.
     * @return {String} Name of the function.
     */
    getName : function(fcn)
    {
      if (fcn.displayName) {
        return fcn.displayName;
      }

      if (fcn.$$original || fcn.wrapper || fcn.classname) {
        return fcn.classname + ".constructor()";
      }

      if (fcn.$$mixin)
      {
        //members
        for(var key in fcn.$$mixin.$$members)
        {
          if (fcn.$$mixin.$$members[key] == fcn) {
            return fcn.$$mixin.name + ".prototype." + key + "()";
          }
        }

        // statics
        for(var key in fcn.$$mixin)
        {
          if (fcn.$$mixin[key] == fcn) {
            return fcn.$$mixin.name + "." + key + "()";
          }
        }
      }

      if (fcn.self)
      {
        var clazz = fcn.self.constructor;
        if (clazz)
        {
          // members
          for(var key in clazz.prototype)
          {
            if (clazz.prototype[key] == fcn) {
              return clazz.classname + ".prototype." + key + "()";
            }
          }
          // statics
          for(var key in clazz)
          {
            if (clazz[key] == fcn) {
              return clazz.classname + "." + key + "()";
            }
          }
        }
      }

      var fcnReResult = fcn.toString().match(/function\s*(\w*)\s*\(.*/);
      if (fcnReResult && fcnReResult.length >= 1 && fcnReResult[1]) {
        return fcnReResult[1] + "()";
      }

      return 'anonymous()';
    },


    /**
     * Evaluates JavaScript code globally
     *
     * @lint ignoreDeprecated(eval)
     *
     * @param data {String} JavaScript commands
     * @return {var} Result of the execution
     */
    globalEval : function(data)
    {
      if (window.execScript) {
        return window.execScript(data);
      } else {
        return eval.call(window, data);
      }
    },


    /**
     * empty function
     */
    empty : function() {},


    /**
     * Simply return true.
     *
     * @return {Boolean} Always returns true.
     */
    returnTrue : function() {
      return true;
    },


    /**
     * Simply return false.
     *
     * @return {Boolean} Always returns false.
     */
    returnFalse : function() {
      return false;
    },


    /**
     * Simply return null.
     *
     * @return {var} Always returns null.
     */
    returnNull : function() {
      return null;
    },


    /**
     * Return "this".
     *
     * @return {Object} Always returns "this".
     */
    returnThis : function() {
      return this;
    },


    /**
     * Simply return 0.
     *
     * @return {Number} Always returns 0.
     */
    returnZero : function() {
      return 0;
    },


    /**
     * Base function for creating functional closures which is used by most other methods here.
     *
     * *Syntax*
     *
     * <pre class='javascript'>var createdFunction = qx.lang.Function.create(myFunction, [options]);</pre>
     *
     * @param func {Function} Original function to wrap
     * @param options? {Map} Map of options
     * <ul>
     * <li><strong>self</strong>: The object that the "this" of the function will refer to. Default is the same as the wrapper function is called.</li>
     * <li><strong>args</strong>: An array of arguments that will be passed as arguments to the function when called.
     *     Default is no custom arguments; the function will receive the standard arguments when called.</li>
     * <li><strong>delay</strong>: If set, the returned function will delay the actual execution by this amount of milliseconds and return a timer handle when called.
     *     Default is no delay.</li>
     * <li><strong>periodical</strong>: If set the returned function will periodically perform the actual execution with this specified interval
     *      and return a timer handle when called. Default is no periodical execution.</li>
     * <li><strong>attempt</strong>: If set to true, the returned function will try to execute and return either the results or false on error. Default is false.</li>
     * </ul>
     *
     * @return {Function} Wrapped function
     */
    create : function(func, options)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert && qx.core.Assert.assertFunction(func, "Invalid parameter 'func'.");
      }

      // Nothing to be done when there are no options.
      if (!options) {
        return func;
      }

      // Check for at least one attribute.
      if (!(options.self || options.args || options.delay != null || options.periodical != null || options.attempt)) {
        return func;
      }

      return function(event)
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          if (options.self instanceof qx.core.Object)
          {
            qx.core.Assert && qx.core.Assert.assertFalse(
              options.self.isDisposed(),
              "Trying to call a bound function with a disposed object as context: " + options.self.toString() + " :: " + qx.lang.Function.getName(func)
            );
          }
        }

        // Convert (and copy) incoming arguments
        var args = qx.lang.Array.fromArguments(arguments);

        // Prepend static arguments
        if (options.args) {
          args = options.args.concat(args);
        }

        if (options.delay || options.periodical)
        {
          var returns = qx.event.GlobalError.observeMethod(function() {
            return func.apply(options.self||this, args);
          });

          if (options.delay) {
            return window.setTimeout(returns, options.delay);
          }

          if (options.periodical) {
            return window.setInterval(returns, options.periodical);
          }
        }
        else if (options.attempt)
        {
          var ret = false;

          try {
            ret = func.apply(options.self||this, args);
          } catch(ex) {}

          return ret;
        }
        else
        {
          return func.apply(options.self||this, args);
        }
      };
    },


    /**
     * Returns a function whose "this" is altered.
     *
     * *Syntax*
     *
     * <pre class='javascript'>qx.lang.Function.bind(myFunction, [self, [varargs...]]);</pre>
     *
     * *Example*
     *
     * <pre class='javascript'>
     * function myFunction()
     * {
     *   this.setStyle('color', 'red');
     *   // note that 'this' here refers to myFunction, not an element
     *   // we'll need to bind this function to the element we want to alter
     * };
     *
     * var myBoundFunction = qx.lang.Function.bind(myFunction, myElement);
     * myBoundFunction(); // this will make the element myElement red.
     * </pre>
     *
     * If you find yourself using this static method a lot, you may be
     * interested in the bindTo() method in the mixin qx.core.MBindTo.
     *
     * @see qx.core.MBindTo
     *
     * @param func {Function} Original function to wrap
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {Function} The bound function.
     */
    bind : function(func, self, varargs)
    {
      return this.create(func,
      {
        self  : self,
        args  : arguments.length > 2 ? qx.lang.Array.fromArguments(arguments, 2) : null
      });
    },


    /**
     * Returns a function whose arguments are pre-configured.
     *
     * *Syntax*
     *
     * <pre class='javascript'>qx.lang.Function.curry(myFunction, [varargs...]);</pre>
     *
     * *Example*
     *
     * <pre class='javascript'>
     * function myFunction(elem) {
     *   elem.setStyle('color', 'red');
     * };
     *
     * var myBoundFunction = qx.lang.Function.curry(myFunction, myElement);
     * myBoundFunction(); // this will make the element myElement red.
     * </pre>
     *
     * @param func {Function} Original function to wrap
     * @param varargs {arguments} The arguments to pass to the function.
     * @return {var} The pre-configured function.
     */
    curry : function(func, varargs)
    {
      return this.create(func, {
        args  : arguments.length > 1 ? qx.lang.Array.fromArguments(arguments, 1) : null
      });
    },


    /**
     * Returns a function which could be used as a listener for a native event callback.
     *
     * *Syntax*
     *
     * <pre class='javascript'>qx.lang.Function.listener(myFunction, [self, [varargs...]]);</pre>
     *
     * @param func {Function} Original function to wrap
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {var} The bound function.
     */
    listener : function(func, self, varargs)
    {
      if (arguments.length < 3)
      {
        return function(event)
        {
          // Directly execute, but force first parameter to be the event object.
          return func.call(self||this, event||window.event);
        }
      }
      else
      {
        var optargs = qx.lang.Array.fromArguments(arguments, 2);

        return function(event)
        {
          var args = [event||window.event];

          // Append static arguments
          args.push.apply(args, optargs);

          // Finally execute original method
          func.apply(self||this, args);
        };
      }
    },


    /**
     * Tries to execute the function.
     *
     * *Syntax*
     *
     * <pre class='javascript'>var result = qx.lang.Function.attempt(myFunction, [self, [varargs...]]);</pre>
     *
     * *Example*
     *
     * <pre class='javascript'>
     * var myObject = {
     *   'cow': 'moo!'
     * };
     *
     * var myFunction = function()
     * {
     *   for(var i = 0; i < arguments.length; i++) {
     *     if(!this[arguments[i]]) throw('doh!');
     *   }
     * };
     *
     * var result = qx.lang.Function.attempt(myFunction, myObject, 'pig', 'cow'); // false
     * </pre>
     *
     * @param func {Function} Original function to wrap
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {Boolean|var} <code>false</code> if an exception is thrown, else the function's return.
     */
    attempt : function(func, self, varargs)
    {
      return this.create(func,
      {
        self    : self,
        attempt : true,
        args    : arguments.length > 2 ? qx.lang.Array.fromArguments(arguments, 2) : null
      })();
    },


    /**
     * Delays the execution of a function by a specified duration.
     *
     * *Syntax*
     *
     * <pre class='javascript'>var timeoutID = qx.lang.Function.delay(myFunction, [delay, [self, [varargs...]]]);</pre>
     *
     * *Example*
     *
     * <pre class='javascript'>
     * var myFunction = function(){ alert('moo! Element id is: ' + this.id); };
     * //wait 50 milliseconds, then call myFunction and bind myElement to it
     * qx.lang.Function.delay(myFunction, 50, myElement); // alerts: 'moo! Element id is: ... '
     *
     * // An anonymous function, example
     * qx.lang.Function.delay(function(){ alert('one second later...'); }, 1000); //wait a second and alert
     * </pre>
     *
     * @param func {Function} Original function to wrap
     * @param delay {Integer} The duration to wait (in milliseconds).
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {Integer} The JavaScript Timeout ID (useful for clearing delays).
     */
    delay : function(func, delay, self, varargs)
    {
      return this.create(func,
      {
        delay : delay,
        self  : self,
        args  : arguments.length > 3 ? qx.lang.Array.fromArguments(arguments, 3) : null
      })();
    },


    /**
     * Executes a function in the specified intervals of time
     *
     * *Syntax*
     *
     * <pre class='javascript'>var intervalID = qx.lang.Function.periodical(myFunction, [period, [self, [varargs...]]]);</pre>
     *
     * *Example*
     *
     * <pre class='javascript'>
     * var Site = { counter: 0 };
     * var addCount = function(){ this.counter++; };
     * qx.lang.Function.periodical(addCount, 1000, Site); // will add the number of seconds at the Site
     * </pre>
     *
     * @param func {Function} Original function to wrap
     * @param interval {Integer} The duration of the intervals between executions.
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {Integer} The Interval ID (useful for clearing a periodical).
     */
    periodical : function(func, interval, self, varargs)
    {
      return this.create(func,
      {
        periodical : interval,
        self       : self,
        args       : arguments.length > 3 ? qx.lang.Array.fromArguments(arguments, 3) : null
      })();
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)
     * Alexander Steitz (aback)
     * Christian Hagendorn (chris_schmidt)

   ======================================================================

   This class contains code based on the following work:

   * Juriy Zaytsev
     http://thinkweb2.com/projects/prototype/detecting-event-support-without-browser-sniffing/

     Copyright (c) 2009 Juriy Zaytsev

     Licence:
       BSD: http://github.com/kangax/iseventsupported/blob/master/LICENSE

     ----------------------------------------------------------------------

     http://github.com/kangax/iseventsupported/blob/master/LICENSE

     Copyright (c) 2009 Juriy Zaytsev

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without
     restriction, including without limitation the rights to use,
     copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the
     Software is furnished to do so, subject to the following
     conditions:

     The above copyright notice and this permission notice shall be
     included in all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
     OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
     OTHER DEALINGS IN THE SOFTWARE.

************************************************************************ */

/**
 * Wrapper around native event management capabilities of the browser.
 * This class should not be used directly normally. It's better
 * to use {@link qx.event.Registration} instead.
 */
qx.Class.define("qx.bom.Event",
{
  statics :
  {
    /**
     * Use the low level browser functionality to attach event listeners
     * to DOM nodes.
     *
     * Use this with caution. This is only thought for event handlers and
     * qualified developers. These are not mem-leak protected!
     *
     * @param target {Object} Any valid native event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the function to assign
     * @param useCapture {Boolean ? false} A Boolean value that specifies the event phase to add
     *    the event handler for the capturing phase or the bubbling phase.
     */
    addNativeListener : function(target, type, listener, useCapture)
    {
      if (target.addEventListener) {
        target.addEventListener(type, listener, !!useCapture);
      } else if (target.attachEvent) {
        target.attachEvent("on" + type, listener);
      }
    },


    /**
     * Use the low level browser functionality to remove event listeners
     * from DOM nodes.
     *
     * @param target {Object} Any valid native event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the function to assign
     * @param useCapture {Boolean ? false} A Boolean value that specifies the event phase to remove
     *    the event handler for the capturing phase or the bubbling phase.
     */
    removeNativeListener : function(target, type, listener, useCapture)
    {
      if (target.removeEventListener)
      {
        target.removeEventListener(type, listener, !!useCapture);
      }
      else if (target.detachEvent)
      {
        try {
          target.detachEvent("on" + type, listener);
        }
        catch(e)
        {
          // IE7 sometimes dispatches "unload" events on protected windows
          // Ignore the "permission denied" errors.
          if(e.number !== -2146828218) {
            throw e;
          };
        }
      }
    },


    /**
     * Returns the target of the event.
     *
     * @param e {Event} Native event object
     * @return {Object} Any valid native event target
     */
    getTarget : function(e) {
      return e.target || e.srcElement;
    },


    /**
     * Computes the related target from the native DOM event
     *
     * @param e {Event} Native DOM event object
     * @return {Element} The related target
     */
    getRelatedTarget : function(e)
    {
      if (e.relatedTarget !== undefined)
      {
        // In Firefox the related target of mouse events is sometimes an
        // anonymous div inside of a text area, which raises an exception if
        // the nodeType is read. This is why the try/catch block is needed.
        if ((qx.core.Environment.get("engine.name") == "gecko"))
        {
          try {
            e.relatedTarget && e.relatedTarget.nodeType;
          } catch (e) {
            return null;
          }
        }

        return e.relatedTarget;
      }
      else if (e.fromElement !== undefined && e.type === "mouseover") {
        return e.fromElement;
      } else if (e.toElement !== undefined) {
        return e.toElement;
      } else {
        return null;
      }
    },


    /**
     * Prevent the native default of the event to be processed.
     *
     * This is useful to stop native keybindings, native selection
     * and other native functionality behind events.
     *
     * @param e {Event} Native event object
     */
    preventDefault : function(e)
    {
      if (e.preventDefault)
      {
        // Firefox 3 does not fire a "contextmenu" event if the mousedown
        // called "preventDefault" => don't prevent the default behavior for
        // right clicks.
        if ((qx.core.Environment.get("engine.name") == "gecko") &&
            parseFloat(qx.core.Environment.get("engine.version")) >= 1.9 &&
            e.type == "mousedown" &&
            e.button == 2) {
          return;
        }

        e.preventDefault();

        // not working in firefox 3 and above
        if ((qx.core.Environment.get("engine.name") == "gecko") &&
            parseFloat(qx.core.Environment.get("engine.version")) < 1.9)
        {
          try
          {
            // this allows us to prevent some key press events in Firefox.
            // See bug #1049
            e.keyCode = 0;
          } catch(ex) {}
        }
      }
      else
      {
        try
        {
          // this allows us to prevent some key press events in IE.
          // See bug #1049
          e.keyCode = 0;
        } catch(ex) {}

        e.returnValue = false;
      }
    },


    /**
     * Stops the propagation of the given event to the parent element.
     *
     * Only useful for events which bubble e.g. mousedown.
     *
     * @param e {Event} Native event object
     */
    stopPropagation : function(e)
    {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    },


    /**
     * Fires a synthetic native event on the given element.
     *
     * @param target {Element} DOM element to fire event on
     * @param type {String} Name of the event to fire
     * @return {Boolean} A value that indicates whether any of the event handlers called {@link #preventDefault}.
     *  <code>true</code> The default action is permitted, <code>false</code> the caller should prevent the default action.
     */
    fire : function(target, type)
    {
      // dispatch for standard first
      if (document.createEvent)
      {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(type, true, true);

        return !target.dispatchEvent(evt);
      }

      // dispatch for IE
      else
      {
        var evt = document.createEventObject();
        return target.fireEvent("on" + type, evt);
      }
    },


    /**
     * Whether the given target supports the given event type.
     *
     * Useful for testing for support of new features like
     * touch events, gesture events, orientation change, on/offline, etc.
     *
     * @signature function(target, type)
     * @param target {var} Any valid target e.g. window, dom node, etc.
     * @param type {String} Type of the event e.g. click, mousedown
     * @return {Boolean} Whether the given event is supported
     */
    supportsEvent : qx.core.Environment.select("engine.name",
    {
      "webkit" : function(target, type) {
        return target.hasOwnProperty("on" + type);
      },

      "default" : function(target, type)
      {
        var eventName = "on" + type;

        var supportsEvent = (eventName in target);

        if (!supportsEvent)
        {
          supportsEvent = typeof target[eventName] == "function";

          if (!supportsEvent && target.setAttribute)
          {
            target.setAttribute(eventName, "return;");
            supportsEvent = typeof target[eventName] == "function";

            target.removeAttribute(eventName);
          }
        }

        return supportsEvent;
      }
    })
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/* ************************************************************************

#require(qx.bom.Event)

************************************************************************ */

/**
 * Wrapper for browser DOM event handling for each browser window/frame.
 */
qx.Class.define("qx.event.Manager",
{
  extend : Object,

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Creates a new instance of the event handler.
   *
   * @param win {Window} The DOM window this manager handles the events for
   * @param registration {qx.event.Registration} The event registration to use
   */
  construct : function(win, registration)
  {
    // Assign window object
    this.__window = win;
    this.__windowId = qx.core.ObjectRegistry.toHashCode(win);
    this.__registration = registration;

    // Register to the page unload event.
    // Only for iframes and other secondary documents.
    if (win.qx !== qx)
    {
      var self = this;
      qx.bom.Event.addNativeListener(win, "unload", qx.event.GlobalError.observeMethod(function()
      {
        qx.bom.Event.removeNativeListener(win, "unload", arguments.callee);
        self.dispose();
      }));
    }

    // Registry for event listeners
    this.__listeners = {};

    // The handler and dispatcher instances
    this.__handlers = {};
    this.__dispatchers = {};

    this.__handlerCache = {};
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} Last used ID for an event */
    __lastUnique : 0,


    /**
     * Returns an unique ID which may be used in combination with a target and
     * a type to identify an event entry.
     *
     * @return {String} The next free identifier (auto-incremented)
     */
    getNextUniqueId : function() {
      return (this.__lastUnique++) + "";
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __registration : null,
    __listeners : null,

    __dispatchers : null,
    __disposeWrapper : null,

    __handlers : null,
    __handlerCache : null,
    __window : null,
    __windowId : null,


    /*
    ---------------------------------------------------------------------------
      HELPERS
    ---------------------------------------------------------------------------
    */


    /**
     * Get the window instance the event manager is responsible for
     *
     * @return {Window} DOM window instance
     */
    getWindow : function() {
      return this.__window;
    },


    /**
     * Get the hashcode of the manager's window
     *
     * @return {String} The window's hashcode
     */
    getWindowId : function() {
      return this.__windowId;
    },


    /**
     * Returns an instance of the given handler class for this manager(window).
     *
     * @param clazz {Class} Any class which implements {@link qx.event.IEventHandler}
     * @return {Object} The instance used by this manager
     */
    getHandler : function(clazz)
    {
      var handler = this.__handlers[clazz.classname];

      if (handler) {
        return handler;
      }

      return this.__handlers[clazz.classname] = new clazz(this);
    },


    /**
     * Returns an instance of the given dispatcher class for this manager(window).
     *
     * @param clazz {Class} Any class which implements {@link qx.event.IEventHandler}
     * @return {Object} The instance used by this manager
     */
    getDispatcher : function(clazz)
    {
      var dispatcher = this.__dispatchers[clazz.classname];

      if (dispatcher) {
        return dispatcher;
      }

      return this.__dispatchers[clazz.classname] = new clazz(this, this.__registration);
    },



    /*
    ---------------------------------------------------------------------------
      EVENT LISTENER MANAGEMENT
    ---------------------------------------------------------------------------
    */

    /**
     * Get a copy of all event listeners for the given combination
     * of target, event type and phase.
     *
     * This method is especially useful and for event handlers to
     * to query the listeners registered in the manager.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type
     * @param capture {Boolean ? false} Whether the listener is for the
     *       capturing phase of the bubbling phase.
     * @return {Array | null} Array of registered event handlers. May return
     *       null when no listener were found.
     */
    getListeners : function(target, type, capture)
    {
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (!targetMap) {
        return null;
      }

      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];

      return entryList ? entryList.concat() : null;
    },


    /**
     * Returns a serialized array of all events attached on the given target.
     *
     * @param target {Object} Any valid event target
     * @return {Map[]} Array of maps where everyone contains the keys:
     *   <code>handler</code>, <code>self</code>, <code>type</code> and <code>capture</code>.
     */
    serializeListeners : function(target)
    {
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      var result = [];

      if (targetMap)
      {
        var indexOf, type, capture, entryList, entry;
        for (var entryKey in targetMap)
        {
          indexOf = entryKey.indexOf("|");
          type = entryKey.substring(0, indexOf);
          capture = entryKey.charAt(indexOf+1) == "c";
          entryList = targetMap[entryKey];

          for (var i=0, l=entryList.length; i<l; i++)
          {
            entry = entryList[i];
            result.push(
            {
              self: entry.context,
              handler: entry.handler,
              type: type,
              capture: capture
            });
          }
        }
      }

      return result;
    },


    /**
     * This method might be used to temporally remove all events
     * directly attached to the given target. This do not work
     * have any effect on bubbling events normally.
     *
     * This is mainly thought for detaching events in IE, before
     * cloning them. It also removes all leak scenarios
     * when unloading a document and may be used here as well.
     *
     * @internal
     * @param target {Object} Any valid event target
     * @param enable {Boolean} Whether to enable or disable the events
     */
    toggleAttachedEvents : function(target, enable)
    {
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (targetMap)
      {
        var indexOf, type, capture, entryList;
        for (var entryKey in targetMap)
        {
          indexOf = entryKey.indexOf("|");
          type = entryKey.substring(0, indexOf);
          capture = entryKey.charCodeAt(indexOf+1) === 99; // checking for character "c".
          entryList = targetMap[entryKey];

          if (enable) {
            this.__registerAtHandler(target, type, capture);
          } else {
            this.__unregisterAtHandler(target, type, capture);
          }
        }
      }
    },


    /**
     * Check whether there are one or more listeners for an event type
     * registered at the target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} The event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the target has event listeners of the given type.
     */
    hasListener : function(target, type, capture)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (target == null)
        {
          qx.log.Logger.trace(this);
          throw new Error("Invalid object: " + target);
        }
      }

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (!targetMap) {
        return false;
      }

      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];

      return !!(entryList && entryList.length > 0);
    },


    /**
     * Imports a list of event listeners at once. This only
     * works for newly created elements as it replaces
     * all existing data structures.
     *
     * Works with a map of data. Each entry in this map should be a
     * map again with the keys <code>type</code>, <code>listener</code>,
     * <code>self</code>, <code>capture</code> and an optional <code>unique</code>.
     *
     * The values are identical to the parameters of {@link #addListener}.
     * For details please have a look there.
     *
     * @param target {Object} Any valid event target
     * @param list {Map} A map where every listener has an unique key.
     * @return {void}
     */
    importListeners : function(target, list)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (target == null)
        {
          qx.log.Logger.trace(this);
          throw new Error("Invalid object: " + target);
        }
      }

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey] = {};
      var clazz = qx.event.Manager;

      for (var listKey in list)
      {
        var item = list[listKey];

        var entryKey = item.type + (item.capture ? "|capture" : "|bubble");
        var entryList = targetMap[entryKey];

        if (!entryList)
        {
          entryList = targetMap[entryKey] = [];

          // This is the first event listener for this type and target
          // Inform the event handler about the new event
          // they perform the event registration at DOM level if needed
          this.__registerAtHandler(target, item.type, item.capture);
        }

        // Append listener to list
        entryList.push(
        {
          handler : item.listener,
          context : item.self,
          unique : item.unique || (clazz.__lastUnique++) + ""
        });
      }
    },


    /**
     * Add an event listener to any valid target. The event listener is passed an
     * instance of {@link qx.event.type.Event} containing all relevant information
     * about the event as parameter.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event e.g. "click", "keydown", ...
     * @param listener {Function} Event listener function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque ID, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     * @throws an error if the parameters are wrong
     */
    addListener : function(target, type, listener, self, capture)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Failed to add event listener for type '"+ type +"'" +
          " to the target '" + target.classname + "': ";

        qx.core.Assert.assertObject(target, msg + "Invalid Target.");
        qx.core.Assert.assertString(type, msg + "Invalid event type.");
        qx.core.Assert.assertFunction(listener, msg + "Invalid callback function");

        if (capture !== undefined) {
          qx.core.Assert.assertBoolean(capture, "Invalid capture flag.");
        }
      }

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (!targetMap) {
        targetMap = this.__listeners[targetKey] = {};
      }

      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];

      if (!entryList) {
        entryList = targetMap[entryKey] = [];
      }

      // This is the first event listener for this type and target
      // Inform the event handler about the new event
      // they perform the event registration at DOM level if needed
      if (entryList.length === 0) {
        this.__registerAtHandler(target, type, capture);
      }

      // Append listener to list
      var unique = (qx.event.Manager.__lastUnique++) + "";
      var entry =
      {
        handler : listener,
        context : self,
        unique : unique
      };

      entryList.push(entry);

      return entryKey + "|" + unique;
    },


    /**
     * Get the event handler class matching the given event target and type
     *
     * @param target {var} The event target
     * @param type {String} The event type
     * @return {qx.event.IEventHandler|null} The best matching event handler or
     *     <code>null</code>.
     */
    findHandler : function(target, type)
    {
      var isDomNode=false, isWindow=false, isObject=false, isDocument = false;
      var key;

      if (target.nodeType === 1)
      {
        isDomNode = true;
        key = "DOM_" + target.tagName.toLowerCase() + "_" + type;
      } else if (target.nodeType === 9) {
        isDocument = true;
        key = "DOCUMENT_" + type;
      }

      // Please note:
      // Identical operator does not work in IE (as of version 7) because
      // document.parentWindow is not identical to window. Crazy stuff.
      else if (target == this.__window)
      {
        isWindow = true;
        key = "WIN_" + type;
      }
      else if (target.classname)
      {
        isObject = true;
        key = "QX_" + target.classname + "_" + type;
      }
      else
      {
        key = "UNKNOWN_" + target + "_" + type;
      }


      var cache = this.__handlerCache;
      if (cache[key]) {
        return cache[key];
      }


      var classes = this.__registration.getHandlers();
      var IEventHandler = qx.event.IEventHandler;
      var clazz, instance, supportedTypes, targetCheck;

      for (var i=0, l=classes.length; i<l; i++)
      {
        clazz = classes[i];

        // shortcut type check
        supportedTypes = clazz.SUPPORTED_TYPES;
        if (supportedTypes && !supportedTypes[type]) {
          continue;
        }

        // shortcut target check
        targetCheck = clazz.TARGET_CHECK;
        if (targetCheck)
        {
          // use bitwise & to compare for the bitmask!
          var found = false;
          if (isDomNode && ((targetCheck & IEventHandler.TARGET_DOMNODE) != 0)) {
            found = true;
          } else if (isWindow && ((targetCheck & IEventHandler.TARGET_WINDOW) != 0)) {
            found = true;
          } else if (isObject && ((targetCheck & IEventHandler.TARGET_OBJECT) != 0)) {
            found = true;
          } else if (isDocument && ((targetCheck & IEventHandler.TARGET_DOCUMENT) != 0)) {
            found = true;
          }

          if (!found) {
            continue;
          }
        }

        instance = this.getHandler(classes[i]);
        if (clazz.IGNORE_CAN_HANDLE || instance.canHandleEvent(target, type))
        {
          cache[key] = instance;
          return instance;
        }
      }

      return null;
    },


    /**
     * This method is called each time an event listener for one of the
     * supported events is added using {qx.event.Manager#addListener}.
     *
     * @param target {Object} Any valid event target
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     * @throws an error if there is no handler for the event
     */
    __registerAtHandler : function(target, type, capture)
    {
      var handler = this.findHandler(target, type);

      if (handler)
      {
        handler.registerEvent(target, type, capture);
        return;
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.warn(
          this,
          "There is no event handler for the event '" + type +
          "' on target '" + target + "'!"
        );
      }
    },


    /**
     * Remove an event listener from an event target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the event listener
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener.
     * @param capture {Boolean ? false} Whether to remove the event listener of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed successfully (was existend)
     * @throws an error if the parameters are wrong
     */
    removeListener : function(target, type, listener, self, capture)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Failed to remove event listener for type '" + type + "'" +
          " from the target '" + target.classname + "': ";

        qx.core.Assert.assertObject(target, msg + "Invalid Target.");
        qx.core.Assert.assertString(type, msg + "Invalid event type.");
        qx.core.Assert.assertFunction(listener, msg + "Invalid callback function");

        if (self !== undefined) {
          qx.core.Assert.assertObject(self, "Invalid context for callback.")
        }

        if (capture !== undefined) {
          qx.core.Assert.assertBoolean(capture, "Invalid capture flag.");
        }
      }

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (!targetMap) {
        return false;
      }

      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];

      if (!entryList) {
        return false;
      }

      var entry;
      for (var i=0, l=entryList.length; i<l; i++)
      {
        entry = entryList[i];

        if (entry.handler === listener && entry.context === self)
        {
          qx.lang.Array.removeAt(entryList, i);

          if (entryList.length == 0) {
            this.__unregisterAtHandler(target, type, capture);
          }

          return true;
        }
      }

      return false;
    },


    /**
     * Removes an event listener from an event target by an ID returned by
     * {@link #addListener}.
     *
     * @param target {Object} The event target
     * @param id {String} The ID returned by {@link #addListener}
     */
    removeListenerById : function(target, id)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Failed to remove event listener for id '" + id + "'" +
          " from the target '" + target.classname + "': ";

        qx.core.Assert.assertObject(target, msg + "Invalid Target.");
        qx.core.Assert.assertString(id, msg + "Invalid id type.");
      }

      var split = id.split("|");
      var type = split[0];
      var capture = split[1].charCodeAt(0) == 99; // detect leading "c"
      var unique = split[2];

      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];

      if (!targetMap) {
        return false;
      }

      var entryKey = type + (capture ? "|capture" : "|bubble");
      var entryList = targetMap[entryKey];

      if (!entryList) {
        return false;
      }

      var entry;
      for (var i=0, l=entryList.length; i<l; i++)
      {
        entry = entryList[i];

        if (entry.unique === unique)
        {
          qx.lang.Array.removeAt(entryList, i);

          if (entryList.length == 0) {
            this.__unregisterAtHandler(target, type, capture);
          }

          return true;
        }
      }

      return false;
    },


    /**
     * Remove all event listeners, which are attached to the given event target.
     *
     * @param target {Object} The event target to remove all event listeners from.
     * @return {Boolean} Whether the events were existend and were removed successfully.
     */
    removeAllListeners : function(target)
    {
      var targetKey = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var targetMap = this.__listeners[targetKey];
      if (!targetMap) {
        return false;
      }

      // Deregister from event handlers
      var split, type, capture;
      for (var entryKey in targetMap)
      {
        if (targetMap[entryKey].length > 0)
        {
          // This is quite expensive, see bug #1283
          split = entryKey.split("|");

          type = split[0];
          capture = split[1] === "capture";

          this.__unregisterAtHandler(target, type, capture);
        }
      }

      delete this.__listeners[targetKey];
      return true;
    },


    /**
     * Internal helper for deleting the internal listener  data structure for
     * the given targetKey.
     *
     * @param targetKey {String} Hash code for the object to delete its
     *   listeners.
     *
     * @internal
     */
    deleteAllListeners : function(targetKey) {
      delete this.__listeners[targetKey];
    },


    /**
     * This method is called each time the an event listener for one of the
     * supported events is removed by using {qx.event.Manager#removeListener}
     * and no other event listener is listening on this type.
     *
     * @param target {Object} Any valid event target
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     * @throws an error if there is no handler for the event
     */
    __unregisterAtHandler : function(target, type, capture)
    {
      var handler = this.findHandler(target, type);

      if (handler)
      {
        handler.unregisterEvent(target, type, capture);
        return;
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        qx.log.Logger.warn(
          this,
          "There is no event handler for the event '" + type +
          "' on target '" + target + "'!"
        );
      }
    },




    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCH
    ---------------------------------------------------------------------------
    */

    /**
     * Dispatches an event object using the qooxdoo event handler system. The
     * event will only be visible in event listeners attached using
     * {@link #addListener}. After dispatching the event object will be pooled
     * for later reuse or disposed.
     *
     * @param target {Object} Any valid event target
     * @param event {qx.event.type.Event} The event object to dispatch. The event
     *     object must be obtained using {@link qx.event.Registration#createEvent}
     *     and initialized using {@link qx.event.type.Event#init}.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @throws an error if there is no dispatcher for the event
     */
    dispatchEvent : function(target, event)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var msg = "Could not dispatch event '" + event + "' on target '" + target.classname +"': ";

        qx.core.Assert.assertNotUndefined(target, msg + "Invalid event target.")
        qx.core.Assert.assertNotNull(target, msg + "Invalid event target.")
        qx.core.Assert.assertInstance(event, qx.event.type.Event, msg + "Invalid event object.");
      }

      // Preparations
      var type = event.getType();

      if (!event.getBubbles() && !this.hasListener(target, type))
      {
        qx.event.Pool.getInstance().poolObject(event);
        return true;
      }

      if (!event.getTarget()) {
        event.setTarget(target);
      }

      // Interation data
      var classes = this.__registration.getDispatchers();
      var instance;

      // Loop through the dispatchers
      var dispatched = false;

      for (var i=0, l=classes.length; i<l; i++)
      {
        instance = this.getDispatcher(classes[i]);

        // Ask if the dispatcher can handle this event
        if (instance.canDispatchEvent(target, event, type))
        {
          instance.dispatchEvent(target, event, type);
          dispatched = true;
          break;
        }
      }

      if (!dispatched)
      {
        if (qx.core.Environment.get("qx.debug")) {
          qx.log.Logger.error(this, "No dispatcher can handle event of type " + type + " on " + target);
        }
        return true;
      }

      // check whether "preventDefault" has been called
      var preventDefault = event.getDefaultPrevented();

      // Release the event instance to the event pool
      qx.event.Pool.getInstance().poolObject(event);

      return !preventDefault;
    },


    /**
     * Dispose the event manager
     */
    dispose : function()
    {
      // Remove from manager list
      this.__registration.removeManager(this);

      qx.util.DisposeUtil.disposeMap(this, "__handlers");
      qx.util.DisposeUtil.disposeMap(this, "__dispatchers");

      // Dispose data fields
      this.__listeners = this.__window = this.__disposeWrapper = null;
      this.__registration = this.__handlerCache = null;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/* ************************************************************************

#require(qx.event.Manager)
#require(qx.dom.Node)
#require(qx.lang.Function)

************************************************************************ */

/**
 * Wrapper for browser generic event handling.
 *
 * Supported events differ from target to target. Generally the handlers
 * in {@link qx.event.handler} defines the available features.
 *
 */
qx.Class.define("qx.event.Registration",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Static list of all instantiated event managers. The key is the qooxdoo
     * hash value of the corresponding window
     */
    __managers : {},


    /**
     * Get an instance of the event manager, which can handle events for the
     * given target.
     *
     * @param target {Object} Any valid event target
     * @return {qx.event.Manager} The event manger for the target.
     */
    getManager : function(target)
    {
      if (target == null)
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          qx.log.Logger.error("qx.event.Registration.getManager(null) was called!");
          qx.log.Logger.trace(this);
        }

        target = window;
      }
      else if (target.nodeType)
      {
        target = qx.dom.Node.getWindow(target);
      }
      else if (!qx.dom.Node.isWindow(target))
      {
        target = window;
      }

      var hash = target.$$hash || qx.core.ObjectRegistry.toHashCode(target);
      var manager = this.__managers[hash];

      if (!manager)
      {
        manager = new qx.event.Manager(target, this);
        this.__managers[hash] = manager;
      }

      return manager;
    },


    /**
     * Removes a manager for a specific window from the list.
     *
     * Normally only used when the manager gets disposed through
     * an unload event of the attached window.
     *
     * @param mgr {qx.event.Manager} The manager to remove
     * @return {void}
     */
    removeManager : function(mgr)
    {
      var id = mgr.getWindowId();
      delete this.__managers[id];
    },


    /**
     * Add an event listener to a DOM target. The event listener is passed an
     * instance of {@link qx.event.type.Event} containing all relevant information
     * about the event as parameter.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Name of the event e.g. "click", "keydown", ...
     * @param listener {Function} Event listener function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {var} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListener : function(target, type, listener, self, capture) {
      return this.getManager(target).addListener(target, type, listener, self, capture);
    },


    /**
     * Remove an event listener from an event target.
     *
     * Note: All registered event listeners will automatically at page unload
     *   so it is not necessary to detach events in the destructor.
     *
     * @param target {Object} The event target
     * @param type {String} Name of the event
     * @param listener {Function} The pointer to the event listener
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener.
     * @param capture {Boolean} Whether to remove the event listener of
     *    the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed. Return <code>false</code> if
     *    the event was already removed before.
     */
    removeListener : function(target, type, listener, self, capture) {
      return this.getManager(target).removeListener(target, type, listener, self, capture);
    },


    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param target {Object} The event target
     * @param id {var} The id returned by {@link #addListener}
     * @return {Boolean} Whether the event was removed. Return <code>false</code> if
     *    the event was already removed before.
     */
    removeListenerById : function(target, id) {
      return this.getManager(target).removeListenerById(target, id);
    },


    /**
     * Remove all event listeners, which are attached to the given event target.
     *
     * @param target {Object} The event target to remove all event listeners from.
     * @return {Boolean} Whether the events were existend and were removed successfully.
     */
    removeAllListeners : function(target) {
      return this.getManager(target).removeAllListeners(target);
    },


    /**
     * Internal helper for deleting the listeners map used during shutdown.
     *
     * @param target {Object} The event target to delete the internal map for
     *    all event listeners.
     *
     * @internal
     */
    deleteAllListeners : function(target) {
      var targetKey = target.$$hash;
      if (targetKey) {
        this.getManager(target).deleteAllListeners(targetKey);
      }
    },


    /**
     * Check whether there are one or more listeners for an event type
     * registered at the target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} The event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the target has event listeners of the given type.
     */
    hasListener : function(target, type, capture) {
      return this.getManager(target).hasListener(target, type, capture);
    },


    /**
     * Returns a serialized array of all events attached on the given target.
     *
     * @param target {Object} Any valid event target
     * @return {Map[]} Array of maps where everyone contains the keys:
     *   <code>handler</code>, <code>self</code>, <code>type</code> and <code>capture</code>.
     */
    serializeListeners : function(target) {
      return this.getManager(target).serializeListeners(target);
    },


    /**
     * Get an event instance of the given class, which can be dispatched using
     * an event manager. The created events must be initialized using
     * {@link qx.event.type.Event#init}.
     *
     * @param type {String} The type of the event to create
     * @param clazz {Object?qx.event.type.Event} The event class to use
     * @param args {Array?null} Array which will be passed to
     *       the event's init method.
     * @return {qx.event.type.Event} An instance of the given class.
     */
    createEvent : function(type, clazz, args)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (arguments.length > 1 && clazz === undefined) {
          throw new Error("Create event of type " + type + " with undefined class. Please use null to explicit fallback to default event type!");
        }
      }

      // Fallback to default
      if (clazz == null) {
        clazz = qx.event.type.Event;
      }

      var obj = qx.event.Pool.getInstance().getObject(clazz);

      // Initialize with given arguments
      args ? obj.init.apply(obj, args) : obj.init();

      // Setup the type
      // Note: Native event may setup this later or using init() above
      // using the native information.
      if (type) {
        obj.setType(type);
      }

      return obj;
    },


    /**
     * Dispatch an event object on the given target.
     *
     * It is normally better to use {@link #fireEvent} because it uses
     * the event pooling and is quite handy otherwise as well. After dispatching
     * the event object will be pooled for later reuse or disposed.
     *
     * @param target {Object} Any valid event target
     * @param event {qx.event.type.Event} The event object to dispatch. The event
     *       object must be obtained using {@link #createEvent} and initialized
     *       using {@link qx.event.type.Event#init}.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    dispatchEvent : function(target, event) {
      return this.getManager(target).dispatchEvent(target, event);
    },


    /**
     * Create an event object and dispatch it on the given target.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @see #createEvent
     */
    fireEvent : function(target, type, clazz, args)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (arguments.length > 2 && clazz === undefined && args !== undefined) {
          throw new Error("Create event of type " + type + " with undefined class. Please use null to explicit fallback to default event type!");
        }

        var msg = "Could not fire event '" + type + "' on target '" + (target ? target.classname : "undefined") +"': ";

        qx.core.Assert.assertNotUndefined(target, msg + "Invalid event target.")
        qx.core.Assert.assertNotNull(target, msg + "Invalid event target.")
      }

      var evt = this.createEvent(type, clazz||null, args);
      return this.getManager(target).dispatchEvent(target, evt);
    },


    /**
     * Create an event object and dispatch it on the given target.
     * The event dispatched with this method does never bubble! Use only if you
     * are sure that bubbling is not required.
     *
     * @param target {Object} Any valid event target
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     * @see #createEvent
     */
    fireNonBubblingEvent : function(target, type, clazz, args)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (arguments.length > 2 && clazz === undefined && args !== undefined) {
          throw new Error("Create event of type " + type + " with undefined class. Please use null to explicit fallback to default event type!");
        }
      }

      var mgr = this.getManager(target);
      if (!mgr.hasListener(target, type, false)) {
        return true;
      }

      var evt = this.createEvent(type, clazz||null, args);
      return mgr.dispatchEvent(target, evt);
    },




    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER/DISPATCHER PRIORITY
    ---------------------------------------------------------------------------
    */

    /** {Integer} Highest priority. Used by handlers and dispatchers. */
    PRIORITY_FIRST : -32000,

    /** {Integer} Default priority. Used by handlers and dispatchers. */
    PRIORITY_NORMAL : 0,

    /** {Integer} Lowest priority. Used by handlers and dispatchers. */
    PRIORITY_LAST : 32000,




    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER REGISTRATION
    ---------------------------------------------------------------------------
    */

    /** {Array} Contains all known event handlers */
    __handlers : [],


    /**
     * Register an event handler.
     *
     * @param handler {qx.event.handler.AbstractEventHandler} Event handler to add
     * @return {void}
     * @throws an error if the handler does not have the IEventHandler interface.
     */
    addHandler : function(handler)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInterface(handler, qx.event.IEventHandler, "Invalid event handler.");
      }

      // Append to list
      this.__handlers.push(handler);

      // Re-sort list
      this.__handlers.sort(function(a, b) {
        return a.PRIORITY - b.PRIORITY;
      });
    },


    /**
     * Get a list of registered event handlers.
     *
     * @return {qx.event.handler.AbstractEventHandler[]} registered event handlers
     */
    getHandlers : function() {
      return this.__handlers;
    },




    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCHER REGISTRATION
    ---------------------------------------------------------------------------
    */

    /** {Array} Contains all known event dispatchers */
    __dispatchers : [],


    /**
     * Register an event dispatcher.
     *
     * @param dispatcher {qx.event.dispatch.IEventDispatch} Event dispatcher to add
     * @param priority {Integer} One of
     * {@link qx.event.Registration#PRIORITY_FIRST},
     * {@link qx.event.Registration#PRIORITY_NORMAL}
     *       or {@link qx.event.Registration#PRIORITY_LAST}.
     * @return {void}
     * @throws an error if the dispatcher does not have the IEventHandler interface.
     */
    addDispatcher : function(dispatcher, priority)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInterface(dispatcher, qx.event.IEventDispatcher, "Invalid event dispatcher!");
      }

      // Append to list
      this.__dispatchers.push(dispatcher);

      // Re-sort list
      this.__dispatchers.sort(function(a, b) {
        return a.PRIORITY - b.PRIORITY;
      });
    },


    /**
     * Get a list of registered event dispatchers.
     *
     * @return {qx.event.dispatch.IEventDispatch[]} all registered event dispatcher
     */
    getDispatchers : function() {
      return this.__dispatchers;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

   ======================================================================

   This class contains code based on the following work:

   * Mootools
     http://mootools.net/
     Version 1.1.1

     Copyright:
       (c) 2007 Valerio Proietti

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/**
 * String helper functions
 *
 * The native JavaScript String is not modified by this class. However,
 * there are modifications to the native String in {@link qx.lang.Core} for
 * browsers that do not support certain features.
 *
 * The string/array generics introduced in JavaScript 1.6 are supported by
 * {@link qx.lang.Generics}.
 */
qx.Class.define("qx.lang.String",
{
  statics :
  {
    /**
     * Converts a hyphenated string (separated by '-') to camel case.
     *
     * Example:
     * <pre class='javascript'>qx.lang.String.camelCase("I-like-cookies"); //returns "ILikeCookies"</pre>
     *
     * @param str {String} hyphenated string
     * @return {String} camelcase string
     */
    camelCase : function(str)
    {
      return str.replace(/\-([a-z])/g, function(match, chr) {
        return chr.toUpperCase();
      });
    },


    /**
     * Converts a camelcased string to a hyphenated (separated by '-') string.
     *
     * Example:
     * <pre class='javascript'>qx.lang.String.camelCase("ILikeCookies"); //returns "I-like-cookies"</pre>
     *
     * @param str {String} camelcased string
     * @return {String} hyphenated string
     */
    hyphenate: function(str)
    {
      return str.replace(/[A-Z]/g, function(match){
        return ('-' + match.charAt(0).toLowerCase());
      });
    },


    /**
     * Converts a string to camel case.
     *
     * Example:
     * <pre class='javascript'>qx.lang.String.camelCase("i like cookies"); //returns "I Like Cookies"</pre>
     *
     * @param str {String} any string
     * @return {String} capitalized string
     */
    capitalize: function(str){
      return str.replace(/\b[a-z]/g, function(match) {
        return match.toUpperCase();
      });
    },


    /**
     * Removes all extraneous whitespace from a string and trims it
     *
     * Example:
     *
     * <code>
     * qx.lang.String.clean(" i      like     cookies      \n\n");
     * </code>
     *
     * Returns "i like cookies"
     *
     * @param str {String} the string to clean up
     * @return {String} Cleaned up string
     */
    clean: function(str){
      return this.trim(str.replace(/\s+/g, ' '));
    },


    /**
     * removes white space from the left side of a string
     *
     * @param str {String} the string to trim
     * @return {String} the trimmed string
     */
    trimLeft : function(str) {
      return str.replace(/^\s+/, "");
    },


    /**
     * removes white space from the right side of a string
     *
     * @param str {String} the string to trim
     * @return {String} the trimmed string
     */
    trimRight : function(str) {
      return str.replace(/\s+$/, "");
    },


    /**
     * removes white space from the left and the right side of a string
     *
     * @param str {String} the string to trim
     * @return {String} the trimmed string
     */
    trim : function(str) {
      return str.replace(/^\s+|\s+$/g, "");
    },


    /**
     * Check whether the string starts with the given substring
     *
     * @param fullstr {String} the string to search in
     * @param substr {String} the substring to look for
     * @return {Boolean} whether the string starts with the given substring
     */
    startsWith : function(fullstr, substr) {
      return fullstr.indexOf(substr) === 0;
    },


    /**
     * Check whether the string ends with the given substring
     *
     * @param fullstr {String} the string to search in
     * @param substr {String} the substring to look for
     * @return {Boolean} whether the string ends with the given substring
     */
    endsWith : function(fullstr, substr) {
      return fullstr.substring(fullstr.length - substr.length, fullstr.length) === substr;
    },


    /**
     * Returns a string, which repeats a string 'length' times
     *
     * @param str {String} string used to repeat
     * @param times {Integer} the number of repetitions
     * @return {String} repeated string
     */
    repeat : function(str, times) {
      return str.length > 0 ? new Array(times + 1).join(str) : "";
    },


    /**
     * Pad a string up to a given length. Padding characters are added to the left of the string.
     *
     * @param str {String} the string to pad
     * @param length {Integer} the final length of the string
     * @param ch {String} character used to fill up the string
     * @return {String} padded string
     */
    pad : function(str, length, ch)
    {
      var padLength = length - str.length;
      if (padLength > 0)
      {
        if (typeof ch === "undefined") {
          ch = "0";
        }
        return this.repeat(ch, padLength) + str;
      }
      else
      {
        return str;
      }
    },


    /**
     * Convert the first character of the string to upper case.
     *
     * @signature function(str)
     * @param str {String} the string
     * @return {String} the string with an upper case first character
     */
    firstUp : qx.Bootstrap.firstUp,


    /**
     * Convert the first character of the string to lower case.
     *
     * @signature function(str)
     * @param str {String} the string
     * @return {String} the string with a lower case first character
     */
    firstLow : qx.Bootstrap.firstLow,


    /**
     * Check whether the string contains a given substring
     *
     * @param str {String} the string
     * @param substring {String} substring to search for
     * @return {Boolean} whether the string contains the substring
     */
    contains : function(str, substring) {
      return str.indexOf(substring) != -1;
    },


    /**
     * Print a list of arguments using a format string
     * In the format string occurrences of %n are replaced by the n'th element of the args list.
     * Example:
     * <pre class='javascript'>qx.lang.String.format("Hello %1, my name is %2", ["Egon", "Franz"]) == "Hello Egon, my name is Franz"</pre>
     *
     * @param pattern {String} format string
     * @param args {Array} array of arguments to insert into the format string
     * @return {String} the formatted string
     */
    format : function(pattern, args)
    {
      var str = pattern;

      for (var i=0; i<args.length; i++) {
        // be sure to always use a string for replacement.
        str = str.replace(new RegExp("%" + (i + 1), "g"), args[i] + "");
      }

      return str;
    },


    /**
     * Escapes all chars that have a special meaning in regular expressions
     *
     * @param str {String} the string where to escape the chars.
     * @return {String} the string with the escaped chars.
     */
    escapeRegexpChars : function(str) {
      return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
    },


    /**
     * Converts a string to an array of characters.
     * <pre>"hello" => [ "h", "e", "l", "l", "o" ];</pre>
     *
     * @param str {String} the string which should be split
     * @return {Array} the result array of characters
     */
    toArray : function(str) {
      return str.split(/\B|\b/g);
    },


    /**
     * Remove HTML/XML tags from a string
     * Example:
     * <pre class='javascript'>qx.lang.String.stripTags("&lt;h1>Hello&lt;/h1>") == "Hello"</pre>
     *
     * @param str {String} string containing tags
     * @return {String} the string with stripped tags
     */
    stripTags : function(str) {
      return str.replace(/<\/?[^>]+>/gi, "");
    },


    /**
     * Strips <script> tags including its content from the given string.
     *
     * @param str {String} string containing tags
     * @param exec {Boolean?false} Whether the filtered code should be executed
     * @return {String} The filtered string
     */
    stripScripts: function(str, exec)
    {
      var scripts = "";
      var text = str.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function()
      {
        scripts += arguments[1] + '\n';
        return "";
      });

      if (exec === true) {
        qx.lang.Function.globalEval(scripts);
      }

      return text;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Carsten Lergenmueller (carstenl)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * An memory container which stores arbitrary data up to a maximum number of
 * entries. When new entries come in an the maximum is reached, the oldest
 * entries are deleted.
 *
 * A mark feature also exists which can be used to remember a point in time.
 * When retrieving entriues, it is possible to get only those entries
 * after the marked time. This is useful if data from the buffer is extracted
 * and processed. Whenever this happens, a mark() call can be used so that the
 * next extraction will only get new data.
 */
qx.Class.define("qx.lang.RingBuffer",
{
  extend : Object,

  /**
   * Constructor.
   *
   * @param maxEntries {Integer ? 50} Maximum number of entries in the buffer
   */
  construct : function(maxEntries)
  {
    this.setMaxEntries(maxEntries || 50);
  },


  members :
  {
    //Next slot in ringbuffer to use
    __nextIndexToStoreTo : 0,

    //Number of elements in ring buffer
    __entriesStored : 0,

    //Was a mark set?
    __isMarkActive: false,

    //How many elements were stored since setting of mark?
    __entriesStoredSinceMark : 0,

    //ring buffer
    __entries : null,

    //Maximum number of messages to store. Could be converted to a qx property.
    __maxEntries : null,


    /**
     * Set the maximum number of messages to hold. If null the number of
     * messages is not limited.
     *
     * Warning: Changing this property will clear the events logged so far.
     *
     * @param maxEntries {Integer} the maximum number of messages to hold
     */
    setMaxEntries : function(maxEntries)
    {
      this.__maxEntries = maxEntries;
      this.clear();
    },


    /**
     * Get the maximum number of entries to hold
     *
     * @return {Integer}
     */
    getMaxEntries : function() {
      return this.__maxEntries;
    },


    /**
     * Adds a single entry
     *
     * @param entry {var} The data to store
     */
    addEntry : function(entry)
    {
      this.__entries[this.__nextIndexToStoreTo] = entry;

      this.__nextIndexToStoreTo = this.__addToIndex(this.__nextIndexToStoreTo, 1);

      //Count # of stored entries
      var max = this.getMaxEntries();
      if (this.__entriesStored < max){
        this.__entriesStored++;
      }

      //Count # of stored elements since last mark call
      if (this.__isMarkActive && (this.__entriesStoredSinceMark < max)){
        this.__entriesStoredSinceMark++;
      }
    },


    /**
     * Remembers the current position in the ring buffer
     *
     */
    mark : function(){
      this.__isMarkActive = true;
      this.__entriesStoredSinceMark = 0;
    },


    /**
     * Removes the current mark position
     */
    clearMark : function(){
      this.__isMarkActive = false;
    },


    /**
     * Returns all stored entries. Mark is ignored.
     *
     * @return {Array} array of stored entries
     */
    getAllEntries : function() {
      return this.getEntries(this.getMaxEntries(), false);
    },


    /**
     * Returns entries which have been added previously.
     *
     * @param count {Integer} The number of entries to retrieve. If there are
     *    more entries than the given count, the oldest ones will not be returned.
     *
     * @param startingFromMark {Boolean ? false} If true, only entries since
     *   the last call to mark() will be returned
     * @return {Array} array of stored entries
     */
    getEntries : function(count, startingFromMark)
    {
      //Trim count so it does not exceed ringbuffer size
      if (count > this.__entriesStored) {
        count = this.__entriesStored;
      }

      // Trim count so it does not exceed last call to mark (if mark was called
      // and startingFromMark was true)
      if (
        startingFromMark &&
        this.__isMarkActive &&
        (count > this.__entriesStoredSinceMark)
      ) {
        count = this.__entriesStoredSinceMark;
      }

      if (count > 0){

        var indexOfYoungestElementInHistory = this.__addToIndex(this.__nextIndexToStoreTo,  -1);
        var startIndex = this.__addToIndex(indexOfYoungestElementInHistory, - count + 1);

        var result;

        if (startIndex <= indexOfYoungestElementInHistory) {
          //Requested segment not wrapping around ringbuffer boundary, get in one run
          result = this.__entries.slice(startIndex, indexOfYoungestElementInHistory + 1);
        } else {
          //Requested segment wrapping around ringbuffer boundary, get two parts & concat
          result = this.__entries.slice(startIndex, this.__entriesStored).concat(this.__entries.slice(0, indexOfYoungestElementInHistory + 1));
        }
      } else {
        result = [];
      }

      return result;
    },


    /**
     * Clears all entries
     */
    clear : function()
    {
      this.__entries = new Array(this.getMaxEntries());
      this.__entriesStored = 0;
      this.__entriesStoredSinceMark = 0;
      this.__nextIndexToStoreTo = 0;
    },


    /**
     * Adds a number to an ringbuffer index. Does a modulus calculation,
     * i. e. if the index leaves the ringbuffer space it will wrap around to
     * the other end of the ringbuffer.
     *
     * @param idx {Number} The current index.
     * @param addMe {Number} The number to add.
     */
    __addToIndex : function (idx, addMe){
      var max = this.getMaxEntries();
      var result = (idx + addMe) % max;

      //If negative, wrap up into the ringbuffer space
      if (result < 0){
        result += max;
      }
      return result;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de
     2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Carsten Lergenmueller (carstenl)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * An appender that writes all messages to a memory container. The messages
 * can be retrieved later, f. i. when an error dialog pops up and the question
 * arises what actions have caused the error.
 *
 * A mark feature also exists which can be used to remember a point in time.
 * When retrieving log events, it is possible to get only those events
 * after the marked time. This is useful if data from the buffer is extracted
 * and f. i. sent to a logging system. Whenever this happens, a mark() call
 * can be used so that the next extraction will only get new data.
 */
qx.Class.define("qx.log.appender.RingBuffer",
{
  extend : qx.lang.RingBuffer,

  /**
   * @param maxMessages {Integer?50} Maximum number of messages in the buffer
   */
  construct : function(maxMessages) {
    this.setMaxMessages(maxMessages || 50);
  },


  members :
  {

    /**
     * Set the maximum number of messages to hold. If null the number of
     * messages is not limited.
     *
     * Warning: Changing this property will clear the events logged so far.
     *
     * @param maxMessages {Integer} the maximum number of messages to hold
     */
    setMaxMessages : function(maxMessages) {
      this.setMaxEntries(maxMessages);
    },


    /**
     * Get the maximum number of messages to hold
     *
     * @return {Integer} the maximum number of messages
     */
    getMaxMessages : function() {
      return this.getMaxEntries();
    },


    /**
     * Processes a single log entry
     *
     * @param entry {Map} The entry to process
     */
    process : function(entry) {
      this.addEntry(entry);
    },


    /**
     * Returns all stored log events
     *
     * @return {Array} array of stored log events
     */
    getAllLogEvents : function() {
      return this.getAllEntries();
    },


    /**
     * Returns log events which have been logged previously.
     *
     * @param count {Integer} The number of events to retrieve. If there are
     *    more events than the given count, the oldest ones will not be returned.
     *
     * @param startingFromMark {Boolean ? false} If true, only entries since the last call to mark()
     *                                           will be returned
     * @return {Array} array of stored log events
     */
    retrieveLogEvents : function(count, startingFromMark) {
      return this.getEntries(count, startingFromMark);
    },


    /**
     * Clears the log history
     */
    clearHistory : function() {
      this.clear();
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Main qooxdoo logging class.
 *
 * Used as central logging feature by qx.core.Object.
 *
 * Extremely modular and lightweight to support logging at bootstrap and
 * at shutdown as well.
 *
 * * Supports dynamic appenders to push the output to the user
 * * Supports buffering of the last 50 messages (configurable)
 * * Supports different debug levels ("debug", "info", "warn" or "error")
 * * Simple data serialization for incoming messages
 */
/*
 #require(qx.dev.StackTrace)
 */
qx.Class.define("qx.log.Logger",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
      CONFIGURATION
    ---------------------------------------------------------------------------
    */

    __level : "debug",


    /**
     * Configures the minimum log level required for new messages.
     *
     * @param value {String} One of "debug", "info", "warn" or "error".
     * @return {void}
     */
    setLevel : function(value) {
      this.__level = value;
    },


    /**
     * Returns the currently configured minimum log level required for new
     * messages.
     *
     * @return {Integer} Debug level
     */
    getLevel : function() {
      return this.__level;
    },


    /**
     * Configures the number of messages to be kept in the buffer.
     *
     * @param value {Integer} Any positive integer
     * @return {void}
     */
    setTreshold : function(value) {
      this.__buffer.setMaxMessages(value);
    },


    /**
     * Returns the currently configured number of messages to be kept in the
     * buffer.
     *
     * @return {Integer} Treshold value
     */
    getTreshold : function() {
      return this.__buffer.getMaxMessages();
    },





    /*
    ---------------------------------------------------------------------------
      APPENDER MANAGEMENT
    ---------------------------------------------------------------------------
    */

    /** {Map} Map of all known appenders by ID */
    __appender : {},


    /** {Integer} Last free appender ID */
    __id : 0,


    /**
     * Registers the given appender and inserts the last cached messages.
     *
     * @param appender {Class} A static appender class supporting at
     *   least a <code>process()</code> method to handle incoming messages.
     * @return {void}
     */
    register : function(appender)
    {
      if (appender.$$id) {
        return;
      }

      // Register appender
      var id = this.__id++;
      this.__appender[id] = appender;
      appender.$$id = id;
      var levels = this.__levels;

      // Insert previous messages
      var entries = this.__buffer.getAllLogEvents();
      for (var i=0, l=entries.length; i<l; i++) {
        if (levels[entries[i].level] >= levels[this.__level]) {
          appender.process(entries[i]);
        }
      }
    },


    /**
     * Unregisters the given appender
     *
     * @param appender {Class} A static appender class
     * @return {void}
     */
    unregister : function(appender)
    {
      var id = appender.$$id;
      if (id == null) {
        return;
      }

      delete this.__appender[id];
      delete appender.$$id;
    },





    /*
    ---------------------------------------------------------------------------
      USER METHODS
    ---------------------------------------------------------------------------
    */

    /**
     * Sending a message at level "debug" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    debug : function(object, message) {
      qx.log.Logger.__log("debug", arguments);
    },


    /**
     * Sending a message at level "info" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    info : function(object, message) {
      qx.log.Logger.__log("info", arguments);
    },


    /**
     * Sending a message at level "warn" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    warn : function(object, message) {
      qx.log.Logger.__log("warn", arguments);
    },


    /**
     * Sending a message at level "error" to the logger.
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @param message {var} Any number of arguments supported. An argument may
     *   have any JavaScript data type. All data is serialized immediately and
     *   does not keep references to other objects.
     * @return {void}
     */
    error : function(object, message) {
      qx.log.Logger.__log("error", arguments);
    },


    /**
     * Prints the current stack trace at level "info"
     *
     * @param object {Object} Contextual object (either instance or static class)
     * @return {void}
     */
    trace : function(object) {
      qx.log.Logger.__log("info", [object, qx.dev.StackTrace.getStackTrace().join("\n")]);
    },


    /**
     * Prints a method deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>on</code>.
     *
     * @param fcn {Function} reference to the deprecated function. This is
     *     arguments.callee if the calling method is to be deprecated.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedMethodWarning : function(fcn, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var functionName = qx.lang.Function.getName(fcn);
        this.warn(
          "The method '"+ functionName + "' is deprecated: " +
          (msg || "Please consult the API documentation of this method for alternatives.")
        );
        this.trace();
      }
    },


    /**
     * Prints a class deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>on</code>.
     *
     * @param clazz {Class} reference to the deprecated class.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedClassWarning : function(clazz, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var className = clazz.classname || "unknown";
        this.warn(
          "The class '"+className+"' is deprecated: " +
          (msg || "Please consult the API documentation of this class for alternatives.")
        );
        this.trace();
      }
    },


    /**
     * Prints an event deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>on</code>.
     *
     * @param clazz {Class} reference to the deprecated class.
     * @param event {String} deprecated event name.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedEventWarning : function(clazz, event, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var className = clazz.self ? clazz.self.classname : "unknown";
        this.warn(
          "The event '"+(event || "unknown")+"' from class '"+className+"' is deprecated: " +
          (msg || "Please consult the API documentation of this class for alternatives.")
        );
        this.trace();
      }
    },


    /**
     * Prints a mixin deprecation warning and a stack trace if the setting
     * <code>qx.debug</code> is set to <code>on</code>.
     *
     * @param clazz {Class} reference to the deprecated mixin.
     * @param msg {String?} Optional message to be printed.
     */
    deprecatedMixinWarning : function(clazz, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var mixinName = clazz ? clazz.name : "unknown";
        this.warn(
          "The mixin '"+mixinName+"' is deprecated: " +
          (msg || "Please consult the API documentation of this class for alternatives.")
        );
        this.trace();
      }
    },


    /**
     * Prints a constant deprecation warning and a stacktrace if the setting
     * <code>qx.debug</code> is set to <code>on</code> AND the browser supports
     * __defineGetter__!
     *
     * @param clazz {Class} The class the constant is attached to.
     * @param constant {String} The name of the constant as string.
     * @param msg {String} Optional message to be printed.
     */
    deprecatedConstantWarning : function(clazz, constant, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        // check if __defineGetter__ is available
        if (clazz.__defineGetter__) {
          var self = this;
          var constantValue = clazz[constant];
          clazz.__defineGetter__(constant, function() {
            self.warn(
              "The constant '"+ constant + "' is deprecated: " +
              (msg || "Please consult the API documentation for alternatives.")
            );
            self.trace();
            return constantValue;
          });
        }
      }
    },


    /**
     * Prints a deprecation waring and a stacktrace when a subclass overrides
     * the passed method name. The deprecation is only printed if the setting
     * <code>qx.debug</code> is set to <code>on</code>.
     *
     *
     * @param object {qx.core.Object} Instance to check for overriding.
     * @param baseclass {Class} The baseclass as starting point.
     * @param methodName {String} The method name which is deprecated for overriding.
     * @param msg {String|?} Optional message to be printed.
     */
    deprecateMethodOverriding : function(object, baseclass, methodName, msg)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        var clazz = object.constructor;

        while(clazz.classname !== baseclass.classname)
        {
          if (clazz.prototype.hasOwnProperty(methodName))
          {
            this.warn(
              "The method '" + qx.lang.Function.getName(object[methodName]) +
              "' overrides a deprecated method: " +
              (msg || "Please consult the API documentation for alternatives.")
            );
            this.trace();
            break;
          }
          clazz = clazz.superclass;
        }
      }
    },


    /**
     * Deletes the current buffer. Does not influence message handling of the
     * connected appenders.
     *
     * @return {void}
     */
    clear : function() {
      this.__buffer.clearHistory();
    },




    /*
    ---------------------------------------------------------------------------
      INTERNAL LOGGING IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    /** {qx.log.appender.RingBuffer} Message buffer of previously fired messages. */
    __buffer : new qx.log.appender.RingBuffer(50),


    /** {Map} Numeric translation of log levels */
    __levels :
    {
      debug : 0,
      info : 1,
      warn : 2,
      error : 3
    },


    /**
     * Internal logging main routine.
     *
     * @param level {String} One of "debug", "info", "warn" or "error"
     * @param args {Array} List of other arguments, where the first is
     *   taken as the context object.
     * @return {void}
     */
    __log : function(level, args)
    {
      // Filter according to level
      var levels = this.__levels;
      if (levels[level] < levels[this.__level]) {
        return;
      }

      // Serialize and cache
      var object = args.length < 2 ? null : args[0];
      var start = object ? 1 : 0;
      var items = [];
      for (var i=start, l=args.length; i<l; i++) {
        items.push(this.__serialize(args[i], true));
      }

      // Build entry
      var time = new Date;
      var entry =
      {
        time : time,
        offset : time-qx.Bootstrap.LOADSTART,
        level: level,
        items: items,
        // store window to allow cross frame logging
        win: window
      };

      // Add relation fields
      if (object)
      {
        // Do not explicitly check for instanceof qx.core.Object, in order not
        // to introduce an unwanted load-time dependency
        if (object.$$hash !== undefined) {
          entry.object = object.$$hash;
        } else if (object.$$type) {
          entry.clazz = object;
        }
      }

      this.__buffer.process(entry);

      // Send to appenders
      var appender = this.__appender;
      for (var id in appender) {
        appender[id].process(entry);
      }
    },


    /**
     * Detects the type of the variable given.
     *
     * @param value {var} Incoming value
     * @return {String} Type of the incoming value. Possible values:
     *   "undefined", "null", "boolean", "number", "string",
     *   "function", "array", "error", "map",
     *   "class", "instance", "node", "stringify", "unknown"
     */
    __detect : function(value)
    {
      if (value === undefined) {
        return "undefined";
      } else if (value === null) {
        return "null";
      }

      if (value.$$type) {
        return "class";
      }

      var type = typeof value;

      if (type === "function" || type == "string" || type === "number" || type === "boolean") {
        return type;
      }

      else if (type === "object")
      {
        if (value.nodeType) {
          return "node";
        } else if (value.classname) {
          return "instance";
        } else if (value instanceof Array) {
          return "array";
        } else if (value instanceof Error) {
          return "error";
        } else if (value instanceof Date) {
          return "date";
        } else {
          return "map";
        }
      }

      if (value.toString) {
        return "stringify";
      }

      return "unknown";
    },


    /**
     * Serializes the incoming value. If it is a singular value, the result is
     * a simple string. For an array or a map the result can also be a
     * serialized string of a limited number of individual items.
     *
     * @param value {var} Incoming value
     * @param deep {Boolean?false} Whether arrays and maps should be
     *    serialized for a limited number of items
     * @return {Map} Contains the keys <code>type</code>, <code>text</code> and
     * <code>trace</code>.
     */
    __serialize : function(value, deep)
    {
      var type = this.__detect(value);
      var text = "unknown";
      var trace = [];

      switch(type)
      {
        case "null":
        case "undefined":
          text = type;
          break;

        case "string":
        case "number":
        case "boolean":
        case "date":
          text = value;
          break;

        case "node":
          if (value.nodeType === 9)
          {
            text = "document";
          }
          else if (value.nodeType === 3)
          {
            text = "text[" + value.nodeValue + "]";
          }
          else if (value.nodeType === 1)
          {
            text = value.nodeName.toLowerCase();
            if (value.id) {
              text += "#" + value.id;
            }
          }
          else
          {
            text = "node";
          }
          break;

        case "function":
          text = qx.lang.Function.getName(value) || type;
          break;

        case "instance":
          text = value.basename + "[" + value.$$hash + "]";
          break;

        case "class":
        case "stringify":
          text = value.toString();
          break;

        case "error":
          trace = qx.dev.StackTrace.getStackTraceFromError(value);
          text = value.toString();
          break;

        case "array":
          if (deep)
          {
            text = [];
            for (var i=0, l=value.length; i<l; i++)
            {
              if (text.length > 20)
              {
                text.push("...(+" + (l-i) + ")");
                break;
              }

              text.push(this.__serialize(value[i], false));
            }
          }
          else
          {
            text = "[...(" + value.length + ")]";
          }
          break;

        case "map":
          if (deep)
          {
            var temp;

            // Produce sorted key list
            var sorted = [];
            for (var key in value) {
              sorted.push(key);
            }
            sorted.sort();

            // Temporary text list
            text = [];
            for (var i=0, l=sorted.length; i<l; i++)
            {
              if (text.length > 20)
              {
                text.push("...(+" + (l-i) + ")");
                break;
              }

              // Additional storage of hash-key
              key = sorted[i];
              temp = this.__serialize(value[key], false);
              temp.key = key;
              text.push(temp);
            }
          }
          else
          {
            var number=0;
            for (var key in value) {
              number++;
            }
            text = "{...(" + number + ")}";
          }
          break;
      }

      return {
        type : type,
        text : text,
        trace : trace
      };
    }
  },


  defer : function(statics)
  {
    var logs = qx.Bootstrap.$$logs;
    for (var i=0; i<logs.length; i++) {
      statics.__log(logs[i][0], logs[i][1]);
    }

    qx.Bootstrap.debug = statics.debug;
    qx.Bootstrap.info = statics.info;
    qx.Bootstrap.warn = statics.warn;
    qx.Bootstrap.error = statics.error;
    qx.Bootstrap.trace = statics.trace;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (swerner)

************************************************************************ */

/**
 * Registration for all instances of qooxdoo classes. Mainly
 * used to manage them for the final shutdown sequence and to
 * use weak references when connecting widgets to DOM nodes etc.
 */
qx.Class.define("qx.core.ObjectRegistry",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Boolean} Whether the application is in the shutdown phase */
    inShutDown : false,

    /** {Map} Internal data structure to store objects */
    __registry : {},

    /** {Integer} Next new hash code. */
    __nextHash : 0,

    /** {Array} List of all free hash codes */
    __freeHashes : [],


    /**
     * Registers an object into the database. This adds a hashcode
     * to the object (if not already done before) and stores it under
     * this hashcode. You can access this object later using the hashcode
     * by calling {@link #fromHashCode}.
     *
     * All registered objects are automatically disposed on application
     * shutdown. Each registered object must at least have a method
     * called <code>dispose</code>.
     *
     * @param obj {Object} Any object with a dispose() method
     * @return {void}
     */
    register : function(obj)
    {
      var registry = this.__registry;
      if (!registry) {
        return;
      }

      var hash = obj.$$hash;
      if (hash == null)
      {
        // Create new hash code
        var cache = this.__freeHashes;
        if (cache.length > 0) {
          hash = cache.pop();
        } else {
          hash = (this.__nextHash++) + "";
        }

        // Store hash code
        obj.$$hash = hash;
      }

      if (qx.core.Environment.get("qx.debug"))
      {
        if (!obj.dispose) {
          throw new Error("Invalid object: " + obj);
        }
      }

      registry[hash] = obj;
    },


    /**
     * Removes the given object from the database.
     *
     * @param obj {Object} Any previously registered object
     * @return {void}
     */
    unregister : function(obj)
    {
      var hash = obj.$$hash;
      if (hash == null) {
        return;
      }

      var registry = this.__registry;
      if (registry && registry[hash])
      {
        delete registry[hash];
        this.__freeHashes.push(hash);
      }

      // Delete the hash code
      try
      {
        delete obj.$$hash
      }
      catch(ex)
      {
        // IE has trouble directly removing the hash
        // but it's ok with using removeAttribute
        if (obj.removeAttribute) {
          obj.removeAttribute("$$hash");
        }
      }
    },


    /**
     * Returns an unique identifier for the given object. If such an identifier
     * does not yet exist, create it.
     *
     * @param obj {Object} the object to get the hashcode for
     * @return {String} unique identifier for the given object
     */
    toHashCode : function(obj)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (obj == null) {
          throw new Error("Invalid object: " + obj);
        }
      }

      var hash = obj.$$hash;
      if (hash != null) {
        return hash;
      }

      // Create new hash code
      var cache = this.__freeHashes;
      if (cache.length > 0) {
        hash = cache.pop();
      } else {
        hash = (this.__nextHash++) + "";
      }

      // Store
      return obj.$$hash = hash;
    },


    /**
     * Clears the unique identifier on the given object.
     *
     * @param obj {Object} the object to clear the hashcode for
     */
    clearHashCode : function(obj)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (obj == null) {
          throw new Error("Invalid object: " + obj);
        }
      }

      var hash = obj.$$hash;
      if (hash != null)
      {
        this.__freeHashes.push(hash);

        // Delete the hash code
        try
        {
          delete obj.$$hash
        }
        catch(ex)
        {
          // IE has trouble directly removing the hash
          // but it's ok with using removeAttribute
          if (obj.removeAttribute) {
            obj.removeAttribute("$$hash");
          }
        }
      }
    },


    /**
     * Get an object instance by its hash code as returned by {@link #toHashCode}.
     * If the object is already disposed or the hashCode is invalid,
     * <code>null</code> is returned.
     *
     * @param hash {String} The object's hash code.
     * @return {qx.core.Object} The corresponding object or <code>null</code>.
     */
    fromHashCode : function(hash) {
      return this.__registry[hash] || null;
    },


    /**
     * Disposing all registered object and cleaning up registry. This is
     * automatically executed at application shutdown.
     *
     * @return {void}
     */
    shutdown : function()
    {
      this.inShutDown = true;

      var registry = this.__registry;
      var hashes = [];

      for (var hash in registry) {
        hashes.push(hash);
      }

      // sort the objects! Remove the objecs created at startup
      // as late as possible
      hashes.sort(function(a, b) {
        return parseInt(b, 10)-parseInt(a, 10);
      });

      var obj, i=0, l=hashes.length;
      while(true)
      {
        try
        {
          for (; i<l; i++)
          {
            hash = hashes[i];
            obj = registry[hash];

            if (obj && obj.dispose) {
              obj.dispose();
            }
          }
        }
        catch(ex)
        {
          qx.Bootstrap.error(this, "Could not dispose object " + obj.toString() + ": " + ex);

          if (i !== l)
          {
            i++;
            continue;
          }
        }

        break;
      }

      qx.Bootstrap.debug(this, "Disposed " + l + " objects");

      delete this.__registry;
    },


    /**
     * Returns the object registry.
     *
     * @return {Object} The registry
     */
    getRegistry : function() {
      return this.__registry;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Utility class with type check for all native JavaScript data types.
 */
qx.Class.define("qx.lang.Type",
{
  statics :
  {
    /**
     * Get the internal class of the value. See
     * http://thinkweb2.com/projects/prototype/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
     * for details.
     *
     * @signature function(value)
     * @param value {var} value to get the class for
     * @return {String} the internal class of the value
     */
    getClass : qx.Bootstrap.getClass,


    /**
     * Whether the value is a string.
     *
     * @signature function(value)
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a string.
     */
    isString : qx.Bootstrap.isString,


    /**
     * Whether the value is an array.
     *
     * @signature function(value)
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an array.
     */
    isArray : qx.Bootstrap.isArray,


    /**
     * Whether the value is an object. Note that built-in types like Window are
     * not reported to be objects.
     *
     * @signature function(value)
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an object.
     */
     isObject : qx.Bootstrap.isObject,


    /**
     * Whether the value is a function.
     *
     * @signature function(value)
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a function.
     */
    isFunction : qx.Bootstrap.isFunction,


    /**
    * Whether the value is a regular expression.
    *
    * @param value {var} Value to check.
    * @return {Boolean} Whether the value is a regular expression.
    */
    isRegExp : function(value) {
      return this.getClass(value) == "RegExp";
    },


    /**
    * Whether the value is a number.
    *
    * @param value {var} Value to check.
    * @return {Boolean} Whether the value is a number.
    */
    isNumber : function(value) {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        this.getClass(value) == "Number" ||
        value instanceof Number)
      );
    },


    /**
    * Whether the value is a boolean.
    *
    * @param value {var} Value to check.
    * @return {Boolean} Whether the value is a boolean.
    */
    isBoolean : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        this.getClass(value) == "Boolean" ||
        value instanceof Boolean)
      );
    },


    /**
     * Whether the value is a date.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a date.
     */
    isDate : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        this.getClass(value) == "Date" ||
        value instanceof Date)
      );
    },


    /**
     * Whether the value is a Error.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a Error.
     */
    isError : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Error" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        this.getClass(value) == "Error" ||
        value instanceof Error)
      );
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#optional(qx.util.ColorUtil)
#optional(qx.ui.core.Widget)
#require(qx.lang.Type)

************************************************************************ */

/**
 * A collection of assertions.
 *
 * These methods can be used to assert incoming parameters, return values, ...
 * If an assertion fails an {@link AssertionError} is thrown.
 *
 * Assertions are used in unit tests as well.
 */
qx.Class.define("qx.core.Assert",
{
  statics :
  {
    __logError : true,

    /**
     * Assert that the condition evaluates to <code>true</code>. An
     * {@link AssertionError} is thrown if otherwise.
     *
     * @param comment {String} Message to be shown if the assertion fails. This
     *    message is provided by the user.
     * @param msgvarargs {var} any number of parts of a message to show if assertion
     *                         triggers. Each will be converted to a string and all
     *                         parts will be concatenated. E. g. instead of
     *                         "Got invalid value " + this.__toString(val) + "!!!!!"
     *                         use
     *                         "Got invalid value ", val, "!!!!!"
     *                         (much better performance)
     *
     */
    __fail : function(comment, msgvarargs)
    {
      // Build up message from message varargs. It's not really important
      // how long this takes as it is done only when assertion is triggered
      var msg = "";
      for (var i=1, l=arguments.length; i<l; i++)
      {
        msg = msg + this.__toString(arguments[i]);
      }

      var fullComment = "";
      if (msg) {
        fullComment = comment + ": " + msg;
      } else {
        fullComment = comment;
      }
      var errorMsg = "Assertion error! " + fullComment;

      if (this.__logError) {
        qx.Bootstrap.error(errorMsg);
      }
      if (qx.Class.isDefined("qx.core.AssertionError"))
      {
        var err = new qx.core.AssertionError(comment, msg);
        if (this.__logError) {
          qx.Bootstrap.error("Stack trace: \n" + err.getStackTrace());
        }
        throw err;
      } else {
        throw new Error(errorMsg);
      }
    },


    /**
     * Convert an unknown value to a string to display in error messages
     *
     * @param value {var} any value
     * @return {String} a string representation of the value
     */
    __toString : function(value)
    {
      var stringValue;

      if (value === null)
      {
        stringValue = "null";
      }
      else if (qx.lang.Type.isArray(value) && value.length > 10)
      {
        stringValue = "Array[" + value.length + "]";
      } else if ((value instanceof Object) && (value.toString == null))
      {
        stringValue = qx.lang.Json.stringify(value, null, 2);
      } else
      {
        try {
          stringValue = value.toString();
        } catch(e) {
          stringValue = "";
        }
      }
      return stringValue;
    },


    /**
     * Assert that the condition evaluates to <code>true</code>.
     *
     * @param condition {var} Condition to check for. Must evaluate to
     *    <code>true</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assert : function(condition, msg) {
      condition == true || this.__fail(msg || "", "Called assert with 'false'");
    },


    /**
     * Raise an {@link AssertionError}.
     *
     * @param msg {String} Message to be shown if the assertion fails.
     * @param compact {Boolean} Show less verbose message. Default: false.
     */
    fail : function(msg, compact) {
      var msgvarargs = compact ? "" : "Called fail().";
      this.__fail(msg || "", msgvarargs);
    },


    /**
     * Assert that the value is <code>true</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>true</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertTrue : function(value, msg) {
      (value === true) || this.__fail(msg || "", "Called assertTrue with '", value, "'");
    },


    /**
     * Assert that the value is <code>false</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>false</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFalse : function(value, msg) {
      (value === false) || this.__fail(msg || "", "Called assertFalse with '", value, "'");
    },


    /**
     * Assert that both values are equal. (Uses the equality operator
     * <code>==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertEquals : function(expected, found, msg)
    {
      expected == found || this.__fail(
        msg || "",
        "Expected '", expected,
        "' but found '", found, "'!"
      );
    },

    /**
     * Assert that both values are not equal. (Uses the not equality operator
     * <code>!=</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotEquals : function(expected, found, msg)
    {
        expected != found || this.__fail(
        msg || "",
        "Expected '",expected,
        "' to be not equal with '", found, "'!"
      );
    },

    /**
     * Assert that both values are identical. (Uses the identity operator
     * <code>===</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertIdentical : function(expected, found, msg)
    {
      expected === found || this.__fail(
        msg || "",
        "Expected '", expected,
        "' (identical) but found '", found, "'!"
      );
    },


    /**
     * Assert that both values are not identical. (Uses the not identity operator
     * <code>!==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotIdentical : function(expected, found, msg)
    {
      expected !== found || this.__fail(
        msg || "",
        "Expected '", expected,
        "' to be not identical with '", found, "'!"
      );
    },


    /**
     * Assert that the value is not <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotUndefined : function(value, msg)
    {
      value !== undefined || this.__fail(
        msg || "",
        "Expected value not to be undefined but found undefined!"
      );
    },


    /**
     * Assert that the value is <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertUndefined : function(value, msg)
    {
      value === undefined || this.__fail(
        msg || "",
        "Expected value to be undefined but found ", value, "!"
      );
    },


    /**
     * Assert that the value is not <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotNull : function(value, msg)
    {
      value !== null || this.__fail(
        msg || "",
        "Expected value not to be null but found null!"
      );
    },


    /**
     * Assert that the value is <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNull : function(value, msg)
    {
      value === null || this.__fail(
        msg || "",
        "Expected value to be null but found ", value, "!"
      );
    },


    /**
     * Assert that the first two arguments are equal, when serialized into
     * JSON.
     *
     * @param expected {var} The the expected value
     * @param found {var} The found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertJsonEquals : function(expected, found, msg) {
      this.assertEquals(
        qx.lang.Json.stringify(expected),
        qx.lang.Json.stringify(found),
        msg
      );
    },


    /**
     * Assert that the given string matches the regular expression
     *
     * @param str {String} String, which should match the regular expression
     * @param re {String|RegExp} Regular expression to match
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMatch : function(str, re, msg)
    {
      this.assertString(str);
      this.assert(
        qx.lang.Type.isRegExp(re) || qx.lang.Type.isString(re),
        "The parameter 're' must be a string or a regular expression."
      );
      str.search(re) >= 0 || this.__fail(
        msg || "",
        "The String '", str, "' does not match the regular expression '", re.toString(), "'!"
      );
    },


    /**
     * Assert that the number of arguments is within the given range
     *
     * @param args {arguments} The <code>arguments<code> variable of a function
     * @param minCount {Integer} Minimal number of arguments
     * @param maxCount {Integer} Maximum number of arguments
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArgumentsCount : function(args, minCount, maxCount, msg)
    {
      var argCount = args.length;
      (argCount >= minCount && argCount <= maxCount) || this.__fail(
        msg || "",
        "Wrong number of arguments given. Expected '", minCount, "' to '",
        maxCount, "' arguments but found '", arguments.length, "' arguments."
      )
    },


    /**
     * Assert that an event is fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   fires the event.
     * @param listenerFunc {Function?null} The function which will be invoked in the
     *   listener. The function has one parameter called e which is the event.
     * @param msg {String?""} Message to be shows if the assertion fails.
     */
    assertEventFired : function(obj, event, invokeFunc, listenerFunc, msg)
    {
      var called = false;
      var listener = function(e)
      {
        if (listenerFunc) {
          listenerFunc.call(obj, e);
        }
        called = true;
      };

      var id;
      try {
        id = obj.addListener(event, listener, obj);
        invokeFunc.call();
      } catch (ex) {
        throw ex;
      } finally {
        try {
          obj.removeListenerById(id);
        } catch (ex) { /* ignore */ }
      }

      called === true || this.__fail(msg || "", "Event (", event, ") not fired.");
    },


    /**
     * Assert that an event is not fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   should not fire the event.
     * @param msg {String} Message to be shows if the assertion fails.
     */
    assertEventNotFired : function(obj, event, invokeFunc, msg)
    {
      var called = false;
      var listener = function(e) {
        called = true;
      };
      var id = obj.addListener(event, listener, obj);

      invokeFunc.call();
      called === false || this.__fail(msg || "", "Event (", event, ") was fired.");

      obj.removeListenerById(id);
    },


    /**
     * Asserts that the callback raises a matching exception.
     *
     * @param callback {Function} function to check
     * @param exception {Error?Error} Expected constructor of the exception.
     *   The assertion fails if the raised exception is not an instance of the
     *   parameter.
     * @param re {String|RegExp} The assertion fails if the error message does
     *   not match this parameter
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertException : function(callback, exception, re, msg)
    {
      var exception = exception || Error;
      var error;

      try {
        this.__logError = false;
        callback();
      } catch(ex) {
        error = ex;
      } finally {
        this.__logError = true;
      }

      if (error == null) {
        this.__fail(msg || "", "The function did not raise an exception!");
      }

      error instanceof exception || this.__fail(msg || "",
        "The raised exception does not have the expected type! ",
        exception , " != ", error);

      if (re) {
        this.assertMatch(error.toString(), re, msg);
      }
    },


    /**
     * Assert that the value is an item in the given array.
     *
     * @param value {var} Value to check
     * @param array {Array} List of valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInArray : function(value, array, msg)
    {
      array.indexOf(value) !== -1 || this.__fail(
        msg || "",
        "The value '", value,
        "' must have any of the values defined in the array '",
        array, "'"
      );
    },


    /**
     * Assert that both array have identical array items.
     *
     * @param expected {Array} The expected array
     * @param found {Array} The found array
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArrayEquals : function(expected, found, msg)
    {
      this.assertArray(expected, msg);
      this.assertArray(found, msg);

      msg = msg ||
        "Expected [" + expected.join(", ") +
        "], but found [" + found.join(", ") + "]";

      if (expected.length !== found.length) {
        this.fail(msg, true);
      }

      for (var i=0; i<expected.length; i++) {
        if (expected[i] !== found[i]) {
          this.fail(msg, true);
        }
      }
    },


    /**
     * Assert that the value is a key in the given map.
     *
     * @param value {var} Value to check
     * @param map {map} Map, where the keys represent the valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertKeyInMap : function(value, map, msg)
    {
      map[value] !== undefined || this.__fail(
        msg || "",
        "The value '", value, "' must must be a key of the map '",
        map, "'"
      );
    },


    /**
     * Assert that the value is a function.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFunction : function(value, msg)
    {
      qx.lang.Type.isFunction(value) || this.__fail(
        msg || "",
        "Expected value to be typeof function but found ", value, "!"
      );
    },


    /**
     * Assert that the value is a string.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertString : function(value, msg) {
      qx.lang.Type.isString(value) || this.__fail(
        msg || "",
        "Expected value to be a string but found ", value, "!"
      );
    },


    /**
     * Assert that the value is a boolean.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertBoolean : function(value, msg)
    {
      qx.lang.Type.isBoolean(value) || this.__fail(
        msg || "",
        "Expected value to be a boolean but found ", value, "!"
      );
    },


    /**
     * Assert that the value is a number.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNumber : function(value, msg)
    {
      (qx.lang.Type.isNumber(value) && isFinite(value)) || this.__fail(
        msg || "",
        "Expected value to be a number but found ", value, "!"
      );
    },


    /**
     * Assert that the value is a number >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveNumber : function(value, msg)
    {
      (qx.lang.Type.isNumber(value) && isFinite(value) && value >= 0) || this.__fail(
        msg || "",
        "Expected value to be a number >= 0 but found ", value, "!"
      );
    },


    /**
     * Assert that the value is an integer.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInteger : function(value, msg)
    {
      (qx.lang.Type.isNumber(value) && isFinite(value) && value % 1 === 0) || this.__fail(
        msg || "",
        "Expected value to be an integer but found ", value, "!"
      );
    },


    /**
     * Assert that the value is an integer >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveInteger : function(value, msg)
    {
      var condition = (
        qx.lang.Type.isNumber(value) &&
        isFinite(value) &&
        value % 1 === 0 &&
        value >= 0
      );
      condition || this.__fail(
        msg || "",
        "Expected value to be an integer >= 0 but found ", value, "!"
      );
    },


    /**
     * Assert that the value is inside the given range.
     *
     * @param value {var} Value to check
     * @param min {Number} lower bound
     * @param max {Number} upper bound
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInRange : function(value, min, max, msg)
    {
      (value >= min && value <= max) || this.__fail(
        msg || "",
        qx.lang.String.format("Expected value '%1' to be in the range '%2'..'%3'!", [value, min, max])
      );
    },


    /**
     * Assert that the value is an object.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertObject : function(value, msg)
    {
      var condition = value !== null &&
        (qx.lang.Type.isObject(value) || typeof value === "object");
      condition || this.__fail(
        msg || "",
        "Expected value to be typeof object but found ", (value), "!"
      );
    },


    /**
     * Assert that the value is an array.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArray : function(value, msg)
    {
      qx.lang.Type.isArray(value) || this.__fail(
        msg || "",
        "Expected value to be an array but found ", value, "!"
      );
    },


    /**
     * Assert that the value is a map either created using <code>new Object</code>
     * or by using the object literal notation <code>{ ... }</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMap : function(value, msg)
    {
      qx.lang.Type.isObject(value) || this.__fail(
        msg || "",
        "Expected value to be a map but found ", value, "!"
      );
    },


    /**
    * Assert that the value is a regular expression.
    *
    * @param value {var} Value to check
    * @param msg {String} Message to be shown if the assertion fails.
    */
   assertRegExp : function(value, msg)
   {
     qx.lang.Type.isRegExp(value) || this.__fail(
       msg || "",
       "Expected value to be a regular expression but found ", value, "!"
     );
   },


    /**
     * Assert that the value has the given type using the <code>typeof</code>
     * operator. Because the type is not always what it is supposed to be it is
     * better to use more explicit checks like {@link #assertString} or
     * {@link #assertArray}.
     *
     * @param value {var} Value to check
     * @param type {String} expected type of the value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertType : function(value, type, msg)
    {
      this.assertString(type, "Invalid argument 'type'");

      typeof(value) === type || this.__fail(
        msg || "",
        "Expected value to be typeof '", type, "' but found ", value, "!"
      );
    },


    /**
     * Assert that the value is an instance of the given class.
     *
     * @param value {var} Value to check
     * @param clazz {Class} The value must be an instance of this class
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInstance : function(value, clazz, msg)
    {
      var className = clazz.classname || clazz + "";

      value instanceof clazz || this.__fail(
        msg || "",
        "Expected value to be instanceof '", className, "' but found ", value, "!"
      );
    },


    /**
     * Assert that the value implements the given interface.
     *
     * @param value {var} Value to check
     * @param iface {Class} The value must implement this interface
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInterface : function(value, iface, msg) {
      qx.Class.implementsInterface(value, iface) || this.__fail(
        msg || "",
        "Expected object '", value, "' to implement the interface '", iface, "'!"
      );
    },


    /**
     * Assert that the value represents the given CSS color value. This method
     * parses the color strings and compares the RGB values. It is able to
     * parse values supported by {@link qx.util.ColorUtil#stringToRgb}.
     *
     *  @param expected {String} The expected color
     *  @param value {String} The value to check
     *  @param msg {String} Message to be shown if the assertion fails.
     */
    assertCssColor : function(expected, value, msg)
    {
      var ColorUtil = qx.Class.getByName("qx.util.ColorUtil");
      if (!ColorUtil) {
        throw new Error("qx.util.ColorUtil not available! Your code must have a dependency on 'qx.util.ColorUtil'");
      }

      var expectedRgb = ColorUtil.stringToRgb(expected);
      try
      {
        var valueRgb = ColorUtil.stringToRgb(value);
      }
      catch (ex)
      {
        this.__fail(
          msg || "",
          "Expected value to be the CSS color '", expected,
          "' (rgb(", expectedRgb.join(","),
          ")), but found value '", value, "', which cannot be converted to a CSS color!"
        );
      }

      var condition = expectedRgb[0] == valueRgb[0] && expectedRgb[1] == valueRgb[1] && expectedRgb[2] == valueRgb[2];
      condition || this.__fail(
        msg || "",
          "Expected value to be the CSS color '", expectedRgb,
          "' (rgb(", expectedRgb.join(","),
          ")), but found value '", value,
          "' (rgb(", valueRgb.join(","), "))!"
      );
    },


    /**
     * Assert that the value is a DOM element.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertElement : function(value, msg)
    {
      // see qx.dom.Node.isElement
      !!(value && value.nodeType === 1) || this.__fail(
        msg || "",
        "Expected value to be a DOM element but found  '", value, "'!"
      );
    },


    /**
     * Assert that the value is an instance of {@link qx.core.Object}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxObject : function(value, msg)
    {
      this.__isQxInstance(value, "qx.core.Object") || this.__fail(
        msg || "",
        "Expected value to be a qooxdoo object but found ", value, "!"
      );
    },


    /**
     * Assert that the value is an instance of {@link qx.ui.core.Widget}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxWidget : function(value, msg)
    {
      this.__isQxInstance(value, "qx.ui.core.Widget") || this.__fail(
        msg || "",
        "Expected value to be a qooxdoo widget but found ", value, "!"
      );
    },


    /**
     * Internal helper for checking the instance of a qooxdoo object using the
     * classname.
     *
     * @param object {var} The object to check.
     * @param classname {String} The classname of the class as string.
     */
    __isQxInstance : function(object, classname)
    {
      if (!object) {
        return false;
      }
      var clazz = object.constructor;
      while(clazz) {
        if (clazz.classname === classname) {
          return true;
        }
        clazz = clazz.superclass;
      }
      return false;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#require(qx.core.Assert)

************************************************************************ */

/**
 * This mixin includes all assertions from {@link qx.core.Assert} to conveniently
 * call assertions. It is included into {@link qx.core.Object} if debugging code
 * is enabled. It is further included into all unit tests
 * {@link qx.dev.unit.TestCase}.
 */
qx.Mixin.define("qx.core.MAssert",
{
  members :
  {
  /**
   * Assert that the condition evaluates to <code>true</code>.
   *
   * @param condition {var} Condition to check for. Must evaluate to
   *    <code>true</code>.
   * @param msg {String} Message to be shown if the assertion fails.
   */
    assert : function(condition, msg) {
      qx.core.Assert.assert(condition, msg);
    },


    /**
     * Raise an {@link AssertionError}
     *
     * @param msg {String} Message to be shown if the assertion fails.
     * @param compact {Boolean} Show less verbose message. Default: false.
     */
    fail : function(msg, compact) {
      qx.core.Assert.fail(msg, compact);
    },


    /**
     * Assert that the value is <code>true</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>true</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertTrue : function(value, msg) {
      qx.core.Assert.assertTrue(value, msg);
    },


    /**
     * Assert that the value is <code>false</code> (Identity check).
     *
     * @param value {Boolean} Condition to check for. Must be identical to
     *    <code>false</code>.
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFalse : function(value, msg) {
      qx.core.Assert.assertFalse(value, msg);
    },


    /**
     * Assert that both values are equal. (Uses the equality operator
     * <code>==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertEquals : function(expected, found, msg) {
      qx.core.Assert.assertEquals(expected, found, msg);
    },

    /**
     * Assert that both values are not equal. (Uses the not equality operator
     * <code>!=</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotEquals : function(expected, found, msg) {
      qx.core.Assert.assertNotEquals(expected, found, msg);
    },

    /**
     * Assert that both values are identical. (Uses the identity operator
     * <code>===</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertIdentical : function(expected, found, msg) {
      qx.core.Assert.assertIdentical(expected, found, msg);
    },


    /**
     * Assert that both values are not identical. (Uses the not identity operator
     * <code>!==</code>.)
     *
     * @param expected {var} Reference value
     * @param found {var} found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotIdentical : function(expected, found, msg) {
      qx.core.Assert.assertNotIdentical(expected, found, msg);
    },


    /**
     * Assert that the value is not <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotUndefined : function(value, msg) {
      qx.core.Assert.assertNotUndefined(value, msg);
    },


    /**
     * Assert that the value is <code>undefined</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertUndefined : function(value, msg) {
      qx.core.Assert.assertUndefined(value, msg);
    },


    /**
     * Assert that the value is not <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNotNull : function(value, msg) {
      qx.core.Assert.assertNotNull(value, msg);
    },


    /**
     * Assert that the value is <code>null</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNull : function(value, msg) {
      qx.core.Assert.assertNull(value, msg);
    },


    /**
     * Assert that the first two arguments are equal, when serialized into
     * JSON.
     *
     * @param expected {var} The expected value
     * @param found {var} The found value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertJsonEquals : function(expected, found, msg) {
      qx.core.Assert.assertJsonEquals(expected, found, msg);
    },


    /**
     * Assert that the given string matches the regular expression
     *
     * @param str {String} String, which should match the regular expression
     * @param re {RegExp} Regular expression to match
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMatch : function(str, re, msg) {
      qx.core.Assert.assertMatch(str, re, msg);
    },


    /**
     * Assert that the number of arguments is within the given range
     *
     * @param args {arguments} The <code>arguments<code> variable of a function
     * @param minCount {Integer} Minimal number of arguments
     * @param maxCount {Integer} Maximum number of arguments
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArgumentsCount : function(args, minCount, maxCount, msg) {
      qx.core.Assert.assertArgumentsCount(args, minCount, maxCount, msg);
    },


    /**
     * Assert that an event is fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   fires the event.
     * @param listener {Function?null} The function which will be invoked in the
     *   listener. The function has one parameter called e which is the event.
     * @param msg {String?""} Message to be shows if the assertion fails.
     */
    assertEventFired : function(obj, event, invokeFunc, listener, msg) {
      qx.core.Assert.assertEventFired(obj, event, invokeFunc, listener, msg);
    },


    /**
     * Assert that an event is not fired.
     *
     * @param obj {Object} The object on which the event should be fired.
     * @param event {String} The event which should be fired.
     * @param invokeFunc {Function} The function which will be invoked and which
     *   should not fire the event.
     * @param msg {String} Message to be shows if the assertion fails.
     */
    assertEventNotFired : function(obj, event, invokeFunc, msg) {
      qx.core.Assert.assertEventNotFired(obj, event, invokeFunc, msg);
    },


    /**
     * Asserts that the callback raises a matching exception.
     *
     * @param callback {Function} function to check
     * @param exception {Error?Error} Expected constructor of the exception.
     *   The assertion fails if the raised exception is not an instance of the
     *   parameter.
     * @param re {String|RegExp} The assertion fails if the error message does
     *   not match this parameter
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertException : function(callback, exception, re, msg) {
      qx.core.Assert.assertException(callback, exception, re, msg);
    },


    /**
     * Assert that the value is an item in the given array.
     *
     * @param value {var} Value to check
     * @param array {Array} List of valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInArray : function(value, array, msg) {
      qx.core.Assert.assertInArray(value, array, msg);
    },


    /**
     * Assert that both array have identical array items.
     *
     * @param expected {Array} The expected array
     * @param found {Array} The found array
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArrayEquals : function(expected, found, msg) {
      qx.core.Assert.assertArrayEquals(expected, found, msg);
    },


    /**
     * Assert that the value is a key in the given map.
     *
     * @param value {var} Value to check
     * @param map {map} Map, where the keys represent the valid values
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertKeyInMap : function(value, map, msg) {
      qx.core.Assert.assertKeyInMap(value, map, msg);
    } ,


    /**
     * Assert that the value is a function.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertFunction : function(value, msg) {
      qx.core.Assert.assertFunction(value, msg);
    },


    /**
     * Assert that the value is a string.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertString : function(value, msg) {
      qx.core.Assert.assertString(value, msg);
    },


    /**
     * Assert that the value is a boolean.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertBoolean : function(value, msg) {
      qx.core.Assert.assertBoolean(value, msg);
    },


    /**
     * Assert that the value is a number.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertNumber : function(value, msg) {
      qx.core.Assert.assertNumber(value, msg);
    },


    /**
     * Assert that the value is a number >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveNumber : function(value, msg) {
      qx.core.Assert.assertPositiveNumber(value, msg);
    },


    /**
     * Assert that the value is an integer.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInteger : function(value, msg) {
      qx.core.Assert.assertInteger(value, msg);
    },


    /**
     * Assert that the value is an integer >= 0.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertPositiveInteger : function(value, msg) {
      qx.core.Assert.assertPositiveInteger(value, msg);
    },


    /**
     * Assert that the value is inside the given range.
     *
     * @param value {var} Value to check
     * @param min {Number} lower bound
     * @param max {Number} upper bound
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInRange : function(value, min, max, msg) {
      qx.core.Assert.assertInRange(value, min, max, msg);
    },


    /**
     * Assert that the value is an object.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertObject : function(value, msg) {
      qx.core.Assert.assertObject(value, msg);
    },


    /**
     * Assert that the value is an array.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertArray : function(value, msg) {
      qx.core.Assert.assertArray(value, msg);
    },


    /**
     * Assert that the value is a map either created using <code>new Object</code>
     * or by using the object literal notation <code>{ ... }</code>.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertMap : function(value, msg) {
      qx.core.Assert.assertMap(value, msg);
    },


    /**
     * Assert that the value is a regular expression.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertRegExp : function(value, msg) {
       qx.core.Assert.assertRegExp(value, msg);
    },


    /**
     * Assert that the value has the given type using the <code>typeof</code>
     * operator. Because the type is not always what it is supposed to be it is
     * better to use more explicit checks like {@link #assertString} or
     * {@link #assertArray}.
     *
     * @param value {var} Value to check
     * @param type {String} expected type of the value
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertType : function(value, type, msg) {
      qx.core.Assert.assertType(value, type, msg);
    },


    /**
     * Assert that the value is an instance of the given class.
     *
     * @param value {var} Value to check
     * @param clazz {Class} The value must be an instance of this class
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInstance : function(value, clazz, msg) {
      qx.core.Assert.assertInstance(value, clazz, msg);
    },


    /**
     * Assert that the value implements the given interface.
     *
     * @param value {var} Value to check
     * @param iface {Class} The value must implement this interface
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertInterface : function(value, iface, msg) {
      qx.core.Assert.assertInterface(value, iface, msg);
    },


    /**
     * Assert that the value represents the given CSS color value. This method
     * parses the color strings and compares the RGB values. It is able to
     * parse values supported by {@link qx.util.ColorUtil#stringToRgb}.
     *
     *  @param expected {String} The expected color
     *  @param value {String} The value to check
     *  @param msg {String} Message to be shown if the assertion fails.
     */
    assertCssColor : function(expected, value, msg) {
      qx.core.Assert.assertCssColor(expected, value, msg);
    },


    /**
     * Assert that the value is a DOM element.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertElement : function(value, msg) {
      qx.core.Assert.assertElement(value, msg);
    },


    /**
     * Assert that the value is an instance of {@link qx.core.Object}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxObject : function(value, msg) {
      qx.core.Assert.assertQxObject(value, msg);
    },


    /**
     * Assert that the value is an instance of {@link qx.ui.core.Widget}.
     *
     * @param value {var} Value to check
     * @param msg {String} Message to be shown if the assertion fails.
     */
    assertQxWidget : function(value, msg) {
      qx.core.Assert.assertQxWidget(value, msg);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#require(qx.core.Property)
#require(qx.core.ObjectRegistry)
#use(qx.event.dispatch.Direct)
#use(qx.event.handler.Object)

************************************************************************ */

/**
 * The qooxdoo root class. All other classes are direct or indirect subclasses of this one.
 *
 * This class contains methods for:
 *
 * * object management (creation and destruction)
 * * interfaces for event system
 * * generic setter/getter support
 * * interfaces for logging console
 * * user friendly OO interfaces like {@link #self} or {@link #base}
 */
qx.Class.define("qx.core.Object",
{
  extend : Object,
  include : [qx.data.MBinding],



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * Create a new instance
   */
  construct : function() {
    qx.core.ObjectRegistry.register(this);
  },




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** Internal type */
    $$type : "Object"
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      BASICS
    ---------------------------------------------------------------------------
    */

    /**
     * Return unique hash code of object
     *
     * @return {Integer} unique hash code of the object
     */
    toHashCode : function() {
      return this.$$hash;
    },


    /**
     * Returns a string representation of the qooxdoo object.
     *
     * @return {String} string representation of the object
     */
    toString : function() {
      return this.classname + "[" + this.$$hash + "]";
    },


    /**
     * Call the same method of the super class.
     *
     * @param args {arguments} the arguments variable of the calling method
     * @param varags {var} variable number of arguments passed to the overwritten function
     * @return {var} the return value of the method of the base class.
     */
    base : function(args, varags)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!qx.Bootstrap.isFunction(args.callee.base)) {
          throw new Error(
            "Cannot call super class. Method is not derived: " +
            args.callee.displayName
          );
        }
      }

      if (arguments.length === 1) {
        return args.callee.base.call(this);
      } else {
        return args.callee.base.apply(this, Array.prototype.slice.call(arguments, 1));
      }
    },


    /**
     * Returns the static class (to access static members of this class)
     *
     * @param args {arguments} the arguments variable of the calling method
     * @return {var} the return value of the method of the base class.
     */
    self : function(args) {
      return args.callee.self;
    },





    /*
    ---------------------------------------------------------------------------
      CLONE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * EXPERIMENTAL - NOT READY FOR PRODUCTION
     *
     * Returns a clone of this object. Copies over all user configured
     * property values. Do not configure a parent nor apply the appearance
     * styles directly.
     *
     * @return {qx.core.Object} The clone
     */
    clone : function()
    {
      var clazz = this.constructor;
      var clone = new clazz;
      var props = qx.Class.getProperties(clazz);
      var user = qx.core.Property.$$store.user;
      var setter = qx.core.Property.$$method.set;
      var name;

      // Iterate through properties
      for (var i=0, l=props.length; i<l; i++)
      {
        name = props[i];
        if (this.hasOwnProperty(user[name])) {
          clone[setter[name]](this[user[name]]);
        }
      }

      // Return clone
      return clone;
    },


    /*
    ---------------------------------------------------------------------------
      COMMON SETTER/GETTER/RESETTER SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Sets multiple properties at once by using a property list or
     * sets one property and its value by the first and second argument.
     * As a fallback, if no generated property setter could be found, a
     * handwritten setter will be searched and invoked if available.
     *
     * @param data {Map | String} a map of property values. The key is the name of the property.
     * @param value {var?} the value, only used when <code>data</code> is a string.
     * @return {Object} this instance.
     * @throws an Exception if a property defined does not exist
     */
    set : function(data, value)
    {
      var setter = qx.core.Property.$$method.set;

      if (qx.Bootstrap.isString(data))
      {
        if (!this[setter[data]])
        {
          if (this["set" + qx.Bootstrap.firstUp(data)] != undefined) {
            this["set" + qx.Bootstrap.firstUp(data)](value);
            return this;
          }

          if (qx.core.Environment.get("qx.debug"))
          {
            qx.Bootstrap.error(new Error("No such property: " + data));
            return this;
          }
        }


        return this[setter[data]](value);
      }
      else
      {
        for (var prop in data)
        {
          if (!this[setter[prop]])
          {
            if (this["set" + qx.Bootstrap.firstUp(prop)] != undefined) {
              this["set" + qx.Bootstrap.firstUp(prop)](data[prop]);
              continue;
            }

            if (qx.core.Environment.get("qx.debug"))
            {
              qx.Bootstrap.error(new Error("No such property: " + prop));
              return this;
            }
          }

          this[setter[prop]](data[prop]);
        }

        return this;
      }
    },


    /**
     * Returns the value of the given property. If no generated getter could be
     * found, a fallback tries to access a handwritten getter.
     *
     * @param prop {String} Name of the property.
     * @return {var} The value of the value
     * @throws an Exception if a property defined does not exist
     */
    get : function(prop)
    {
      var getter = qx.core.Property.$$method.get;

      if (!this[getter[prop]])
      {
        if (this["get" + qx.Bootstrap.firstUp(prop)] != undefined) {
          return this["get" + qx.Bootstrap.firstUp(prop)]();
        }

        if (qx.core.Environment.get("qx.debug"))
        {
          qx.Bootstrap.error(new Error("No such property: " + prop));
          return this;
        }
      }


      return this[getter[prop]]();
    },


    /**
     * Resets the value of the given property. If no generated resetter could be
     * found, a handwritten resetter will be invoked, if available.
     *
     * @param prop {String} Name of the property.
     * @throws an Exception if a property defined does not exist
     */
    reset : function(prop)
    {
      var resetter = qx.core.Property.$$method.reset;

      if (!this[resetter[prop]])
      {
        if (this["reset" + qx.Bootstrap.firstUp(prop)] != undefined) {
          this["reset" + qx.Bootstrap.firstUp(prop)]();
          return;
        }

        if (qx.core.Environment.get("qx.debug"))
        {
          qx.Bootstrap.error(new Error("No such property: " + prop));
          return;
        }
      }


      this[resetter[prop]]();
    },





    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    /** {Class} Pointer to the regular event registration class */
    __Registration : qx.event.Registration,


    /**
     * Add event listener to this object.
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? null} Reference to the 'this' variable inside
     *         the event listener. When not given, the corresponding dispatcher
     *         usually falls back to a default, which is the target
     *         by convention. Note this is not a strict requirement, i.e.
     *         custom dispatchers can follow a different strategy.
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListener : function(type, listener, self, capture)
    {
      if (!this.$$disposed) {
        return this.__Registration.addListener(this, type, listener, self, capture);
      }

      return null;
    },


    /**
     * Add event listener to this object, which is only called once. After the
     * listener is called the event listener gets removed.
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? window} reference to the 'this' variable inside the callback
     * @param capture {Boolean ? false} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event. The default is
     *         to attach the event handler to the bubbling phase.
     * @return {String} An opaque id, which can be used to remove the event listener
     *         using the {@link #removeListenerById} method.
     */
    addListenerOnce : function(type, listener, self, capture)
    {
      var callback = function(e)
      {
        this.removeListener(type, callback, this, capture);
        listener.call(self||this, e);
      };

      return this.addListener(type, callback, this, capture);
    },


    /**
     * Remove event listener from this object
     *
     * @param type {String} name of the event type
     * @param listener {Function} event callback function
     * @param self {Object ? null} reference to the 'this' variable inside the callback
     * @param capture {Boolean} Whether to remove the event listener of
     *   the bubbling or of the capturing phase.
     * @return {Boolean} Whether the event was removed successfully (has existed)
     */
    removeListener : function(type, listener, self, capture)
    {
      if (!this.$$disposed) {
        return this.__Registration.removeListener(this, type, listener, self, capture);
      }

      return false;
    },


    /**
     * Removes an event listener from an event target by an id returned by
     * {@link #addListener}
     *
     * @param id {String} The id returned by {@link #addListener}
     * @return {Boolean} Whether the event was removed successfully (has existed)
     */
    removeListenerById : function(id)
    {
      if (!this.$$disposed) {
        return this.__Registration.removeListenerById(this, id);
      }

      return false;
    },


    /**
     * Check if there are one or more listeners for an event type.
     *
     * @param type {String} name of the event type
     * @param capture {Boolean ? false} Whether to check for listeners of
     *         the bubbling or of the capturing phase.
     * @return {Boolean} Whether the object has a listener of the given type.
     */
    hasListener : function(type, capture) {
      return this.__Registration.hasListener(this, type, capture);
    },


    /**
     * Dispatch an event on this object
     *
     * @param evt {qx.event.type.Event} event to dispatch
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    dispatchEvent : function(evt)
    {
      if (!this.$$disposed) {
        return this.__Registration.dispatchEvent(this, evt);
      }

      return true;
    },


    /**
     * Creates and dispatches an event on this object.
     *
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireEvent : function(type, clazz, args)
    {
      if (!this.$$disposed) {
        return this.__Registration.fireEvent(this, type, clazz, args);
      }

      return true;
    },


    /**
     * Create an event object and dispatch it on this object.
     * The event dispatched with this method does never bubble! Use only if you
     * are sure that bubbling is not required.
     *
     * @param type {String} Event type to fire
     * @param clazz {Class?qx.event.type.Event} The event class
     * @param args {Array?null} Arguments, which will be passed to
     *       the event's init method.
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireNonBubblingEvent : function(type, clazz, args)
    {
      if (!this.$$disposed) {
        return this.__Registration.fireNonBubblingEvent(this, type, clazz, args);
      }

      return true;
    },


    /**
     * Creates and dispatches an non-bubbling data event on this object.
     *
     * @param type {String} Event type to fire
     * @param data {var} User defined data attached to the event object
     * @param oldData {var?null} The event's old data (optional)
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link qx.event.type.Event#preventDefault}
     * @return {Boolean} Whether the event default was prevented or not.
     *     Returns true, when the event was NOT prevented.
     */
    fireDataEvent : function(type, data, oldData, cancelable)
    {
      if (!this.$$disposed)
      {
        if (oldData === undefined) {
          oldData = null;
        }
        return this.__Registration.fireNonBubblingEvent(
          this, type, qx.event.type.Data, [data, oldData, !!cancelable]
        );
      }

      return true;
    },




    /*
    ---------------------------------------------------------------------------
      USER DATA
    ---------------------------------------------------------------------------
    */

    /** {Map} stored user data */
    __userData : null,


    /**
     * Store user defined data inside the object.
     *
     * @param key {String} the key
     * @param value {Object} the value of the user data
     * @return {void}
     */
    setUserData : function(key, value)
    {
      if (!this.__userData) {
        this.__userData = {};
      }

      this.__userData[key] = value;
    },


    /**
     * Load user defined data from the object
     *
     * @param key {String} the key
     * @return {Object} the user data
     */
    getUserData : function(key)
    {
      if (!this.__userData) {
        return null;
      }
      var data = this.__userData[key];
      return data === undefined ? null : data;
    },





    /*
    ---------------------------------------------------------------------------
      DEBUG
    ---------------------------------------------------------------------------
    */

    /** {Class} Pointer to the regular logger class */
    __Logger : qx.log.Logger,


    /**
     * Logs a debug message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    debug : function(varargs) {
      this.__logMessage("debug", arguments);
    },


    /**
     * Logs an info message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    info : function(varargs) {
      this.__logMessage("info", arguments);
    },


    /**
     * Logs a warning message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    warn : function(varargs) {
      this.__logMessage("warn", arguments);
    },


    /**
     * Logs an error message.
     *
     * @param varargs {var} The item(s) to log. Any number of arguments is
     * supported. If an argument is not a string, the object dump will be
     * logged.
     */
    error : function(varargs) {
      this.__logMessage("error", arguments);
    },


    /**
     * Prints the current stack trace
     *
     * @return {void}
     */
    trace : function() {
      this.__Logger.trace(this);
    },


    /**
     * Helper that calls the appropriate logger function with the current object
     * and any number of items.
     *
     * @param level {String} The log level of the message
     * @param varargs {arguments} Arguments list to be logged
     */
    __logMessage : function(level, varargs)
    {
      var argumentsArray = qx.lang.Array.fromArguments(varargs);
      argumentsArray.unshift(this);
      this.__Logger[level].apply(this.__Logger, argumentsArray);
    },






    /*
    ---------------------------------------------------------------------------
      DISPOSER
    ---------------------------------------------------------------------------
    */

    /**
     * Returns true if the object is disposed.
     *
     * @return {Boolean} Whether the object has been disposed
     */
    isDisposed : function() {
      return this.$$disposed || false;
    },


    /**
     * Dispose this object
     *
     * @return {void}
     */
    dispose : function()
    {
      // Check first
      if (this.$$disposed) {
        return;
      }

      // Mark as disposed (directly, not at end, to omit recursions)
      this.$$disposed = true;
      this.$$instance = null;
      this.$$allowconstruct = null;

      // Debug output
      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.core.Environment.get("qx.disposerDebugLevel") > 2) {
          qx.Bootstrap.debug(this, "Disposing " + this.classname + "[" + this.toHashCode() + "]");
        }
      }

      // Deconstructor support for classes
      var clazz = this.constructor;
      var mixins;

      while (clazz.superclass)
      {
        // Processing this class...
        if (clazz.$$destructor) {
          clazz.$$destructor.call(this);
        }

        // Destructor support for mixins
        if (clazz.$$includes)
        {
          mixins = clazz.$$flatIncludes;

          for (var i=0, l=mixins.length; i<l; i++)
          {
            if (mixins[i].$$destructor) {
              mixins[i].$$destructor.call(this);
            }
          }
        }

        // Jump up to next super class
        clazz = clazz.superclass;
      }

      // remove all property references for IE6 and FF2
      if (this.__removePropertyReferences) {
        this.__removePropertyReferences();
      }

      // Additional checks
      if (qx.core.Environment.get("qx.debug"))
      {
        if (qx.core.Environment.get("qx.disposerDebugLevel") > 0)
        {
          var key, value;
          for (key in this)
          {
            value = this[key];

            // Check for Objects but respect values attached to the prototype itself
            if (value !== null && typeof value === "object" && !(qx.Bootstrap.isString(value)))
            {
              // Check prototype value
              // undefined is the best, but null may be used as a placeholder for
              // private variables (hint: checks in qx.Class.define). We accept both.
              if (this.constructor.prototype[key] != null) {
                continue;
              }

              var ff2 = navigator.userAgent.indexOf("rv:1.8.1") != -1;
              var ie6 = navigator.userAgent.indexOf("MSIE 6.0") != -1;
              // keep the old behavior for IE6 and FF2
              if (ff2 || ie6) {
                if (value instanceof qx.core.Object || qx.core.Environment.get("qx.disposerDebugLevel") > 1) {
                  qx.Bootstrap.warn(this, "Missing destruct definition for '" + key + "' in " + this.classname + "[" + this.toHashCode() + "]: " + value);
                  delete this[key];
                }
              } else {
                if (qx.core.Environment.get("qx.disposerDebugLevel") > 1) {
                  qx.Bootstrap.warn(this, "Missing destruct definition for '" + key + "' in " + this.classname + "[" + this.toHashCode() + "]: " + value);
                  delete this[key];
                }
              }
            }
          }
        }
      }
    },


    /**
     * Possible reference to special method for IE6 and FF2
     * {@link #__removePropertyReferencesOld}
     *
     * @signature function()
     */
    __removePropertyReferences : null,


    /**
     * Special method for IE6 and FF2 which removes all $$user_ references
     * set up by the properties.
     * @signature function()
     */
    __removePropertyReferencesOld : function() {
      // remove all property references
      var properties = qx.Class.getProperties(this.constructor);
      for (var i = 0, l = properties.length; i < l; i++) {
        delete this["$$user_" + properties[i]];
      }
    },


    /*
    ---------------------------------------------------------------------------
      DISPOSER UTILITIES
    ---------------------------------------------------------------------------
    */


    /**
     * Disconnects and disposes given objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param varargs {arguments} List of fields (which store objects) to dispose
     */
    _disposeObjects : function(varargs) {
      qx.util.DisposeUtil.disposeObjects(this, arguments);
    },


    /**
     * Disconnects and disposes given singleton objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param varargs {arguments} List of fields (which store objects) to dispose
     */
    _disposeSingletonObjects : function(varargs) {
      qx.util.DisposeUtil.disposeObjects(this, arguments, true);
    },


    /**
     * Disposes all members of the given array and deletes
     * the field which refers to the array afterwards.
     *
     * @param field {String} Name of the field which refers to the array
     */
    _disposeArray : function(field) {
      qx.util.DisposeUtil.disposeArray(this, field);
    },


    /**
     * Disposes all members of the given map and deletes
     * the field which refers to the map afterwards.
     *
     * @param field {String} Name of the field which refers to the map
     */
    _disposeMap : function(field) {
      qx.util.DisposeUtil.disposeMap(this, field);
    }
  },




  /*
  *****************************************************************************
     ENVIRONMENT SETTINGS
  *****************************************************************************
  */

  environment : {
    "qx.disposerDebugLevel" : 0
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics, members)
  {
    // add asserts into each debug build
    if (qx.core.Environment.get("qx.debug")) {
      qx.Class.include(statics, qx.core.MAssert);
    }

    // special treatment for IE6 and FF2
    var ie6 = navigator.userAgent.indexOf("MSIE 6.0") != -1;
    var ff2 = navigator.userAgent.indexOf("rv:1.8.1") != -1;

    // patch the remove property method for IE6 and FF2
    if (ie6 || ff2) {
      members.__removePropertyReferences = members.__removePropertyReferencesOld;
      // debugger;
    }
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (!qx.core.ObjectRegistry.inShutDown) {
      // Cleanup event listeners
      qx.event.Registration.removeAllListeners(this);
    } else {
      // on shutdown, just clear the internal listener map
      qx.event.Registration.deleteAllListeners(this);
    }

    // Cleanup object registry
    qx.core.ObjectRegistry.unregister(this);

    // Cleanup user data
    this.__userData = null;

    // Cleanup properties
    // TODO: Is this really needed for non DOM/JS links?
    var clazz = this.constructor;
    var properties;
    var store = qx.core.Property.$$store;
    var storeUser = store.user;
    var storeTheme = store.theme;
    var storeInherit = store.inherit;
    var storeUseinit = store.useinit;
    var storeInit = store.init;

    while(clazz)
    {
      properties = clazz.$$properties;
      if (properties)
      {
        for (var name in properties)
        {
          if (properties[name].dereference) {
            this[storeUser[name]] = this[storeTheme[name]] = this[storeInherit[name]] = this[storeUseinit[name]] = this[storeInit[name]] = undefined;
          }
        }
      }

      clazz = clazz.superclass;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#use(qx.event.Registration)

************************************************************************ */

/**
 * Basic event object.
 *
 * Please note:
 * Event objects are only valid during the event dispatch. After the dispatch
 * event objects are pooled or disposed. If you want to safe a reference to an
 * event instance use the {@link #clone} method.
 *
 * The interface is modeled after the DOM level 2 event interface:
 * http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface
 */
qx.Class.define("qx.event.type.Event",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** The current event phase is the capturing phase. */
    CAPTURING_PHASE : 1,

    /** The event is currently being evaluated at the target */
    AT_TARGET       : 2,

    /** The current event phase is the bubbling phase. */
    BUBBLING_PHASE  : 3
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * Initialize the fields of the event. The event must be initialized before
     * it can be dispatched.
     *
     * @param canBubble {Boolean?false} Whether or not the event is a bubbling event.
     *     If the event is bubbling, the bubbling can be stopped using
     *     {@link #stopPropagation}
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link #preventDefault}
     * @return {qx.event.type.Event} The initialized event instance
     */
    init : function(canBubble, cancelable)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (canBubble !== undefined)
        {
          qx.core.Assert.assertBoolean(canBubble, "Invalid argument value 'canBubble'.");
        }

        if (cancelable !== undefined)
        {
          qx.core.Assert.assertBoolean(cancelable, "Invalid argument value 'cancelable'.");
        }
      }

      this._type = null;
      this._target = null;
      this._currentTarget = null;
      this._relatedTarget = null;
      this._originalTarget = null;
      this._stopPropagation = false;
      this._preventDefault = false;
      this._bubbles = !!canBubble;
      this._cancelable = !!cancelable;
      this._timeStamp = (new Date()).getTime();
      this._eventPhase = null;

      return this;
    },


    /**
     * Create a clone of the event object, which is not automatically disposed
     * or pooled after an event dispatch.
     *
     * @param embryo {qx.event.type.Event?null} Optional event class, which will
     *     be configured using the data of this event instance. The event must be
     *     an instance of this event class. If the value is <code>null</code>,
     *     a new pooled instance is created.
     * @return {qx.event.type.Event} a clone of this class.
     */
    clone : function(embryo)
    {
      if (embryo) {
        var clone = embryo;
      } else {
        var clone = qx.event.Pool.getInstance().getObject(this.constructor);
      }

      clone._type = this._type;
      clone._target = this._target;
      clone._currentTarget = this._currentTarget;
      clone._relatedTarget = this._relatedTarget;
      clone._originalTarget = this._originalTarget;
      clone._stopPropagation = this._stopPropagation;
      clone._bubbles = this._bubbles;
      clone._preventDefault = this._preventDefault;
      clone._cancelable = this._cancelable;

      return clone;
    },



    /**
     * Stops event from all further processing. Execute this when the
     * current handler should have "exclusive rights" to the event
     * and no further reaction by anyone else should happen.
     */
    stop : function()
    {
      if (this._bubbles) {
        this.stopPropagation();
      }

      if (this._cancelable) {
        this.preventDefault();
      }
    },


    /**
     * This method is used to prevent further propagation of an event during event
     * flow. If this method is called by any event listener the event will cease
     * propagating through the tree. The event will complete dispatch to all listeners
     * on the current event target before event flow stops.
     *
     * @return {void}
     */
    stopPropagation : function()
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(this._bubbles, "Cannot stop propagation on a non bubbling event: " + this.getType());
      }
      this._stopPropagation = true;
    },


    /**
     * Get whether further event propagation has been stopped.
     *
     * @return {Boolean} Whether further propagation has been stopped.
     */
    getPropagationStopped : function() {
      return !!this._stopPropagation;
    },


    /**
     * Prevent the default action of cancelable events, e.g. opening the context
     * menu, ...
     *
     * @return {void}
     */
    preventDefault : function()
    {
      if (qx.core.Environment.get("qx.debug")) {
        this.assertTrue(this._cancelable, "Cannot prevent default action on a non cancelable event: " + this.getType());
      }
      this._preventDefault = true;
    },


    /**
     * Get whether the default action has been prevented
     *
     * @return {Boolean} Whether the default action has been prevented
     */
    getDefaultPrevented : function() {
      return !!this._preventDefault;
    },


    /**
     * The name of the event
     *
     * @return {String} name of the event
     */
    getType : function() {
      return this._type;
    },


    /**
     * Override the event type
     *
     * @param type {String} new event type
     * @return {void}
     */
    setType : function(type) {
      this._type = type;
    },


    /**
     * Used to indicate which phase of event flow is currently being evaluated.
     *
     * @return {Integer} The current event phase. Possible values are
     *         {@link #CAPTURING_PHASE}, {@link #AT_TARGET} and {@link #BUBBLING_PHASE}.
     */
    getEventPhase : function() {
      return this._eventPhase;
    },


    /**
     * Override the event phase
     *
     * @param eventPhase {Integer} new event phase
     * @return {void}
     */
    setEventPhase : function(eventPhase) {
      this._eventPhase = eventPhase;
    },


    /**
     * The time (in milliseconds relative to the epoch) at which the event was created.
     *
     * @return {Integer} the timestamp the event was created.
     */
    getTimeStamp : function() {
      return this._timeStamp;
    },


    /**
     * Returns the event target to which the event was originally
     * dispatched.
     *
     * @return {Element} target to which the event was originally
     *       dispatched.
     */
    getTarget : function() {
      return this._target;
    },


    /**
     * Override event target.
     *
     * @param target {Element} new event target
     * @return {void}
     */
    setTarget : function(target) {
      this._target = target;
    },


    /**
     * Get the event target node whose event listeners are currently being
     * processed. This is particularly useful during event capturing and
     * bubbling.
     *
     * @return {Element} The target the event listener is currently
     *       dispatched on.
     */
    getCurrentTarget : function() {
      return this._currentTarget || this._target;
    },


    /**
     * Override current target.
     *
     * @param currentTarget {Element} new current target
     * @return {void}
     */
    setCurrentTarget : function(currentTarget) {
      this._currentTarget = currentTarget;
    },


    /**
     * Get the related event target. This is only configured for
     * events which also had an influences on another element e.g.
     * mouseover/mouseout, focus/blur, ...
     *
     * @return {Element} The related target
     */
    getRelatedTarget : function() {
      return this._relatedTarget;
    },


    /**
     * Override related target.
     *
     * @param relatedTarget {Element} new related target
     * @return {void}
     */
    setRelatedTarget : function(relatedTarget) {
      this._relatedTarget = relatedTarget;
    },


    /**
     * Get the original event target. This is only configured
     * for events which are fired by another event (often when
     * the target should be reconfigured for another view) e.g.
     * low-level DOM event to widget event.
     *
     * @return {Element} The original target
     */
    getOriginalTarget : function() {
      return this._originalTarget;
    },


    /**
     * Override original target.
     *
     * @param originalTarget {Element} new original target
     * @return {void}
     */
    setOriginalTarget : function(originalTarget) {
      this._originalTarget = originalTarget;
    },


    /**
     * Check whether or not the event is a bubbling event. If the event can
     * bubble the value is true, else the value is false.
     *
     * @return {Boolean} Whether the event bubbles
     */
    getBubbles : function() {
      return this._bubbles;
    },


    /**
     * Set whether the event bubbles.
     *
     * @param bubbles {Boolean} Whether the event bubbles
     * @return {void}
     */
    setBubbles : function(bubbles) {
      this._bubbles = bubbles;
    },


    /**
     * Get whether the event is cancelable
     *
     * @return {Boolean} Whether the event is cancelable
     */
    isCancelable : function() {
      return this._cancelable;
    },


    /**
     * Set whether the event is cancelable
     *
     * @param cancelable {Boolean} Whether the event is cancelable
     * @return {void}
     */
    setCancelable : function(cancelable) {
      this._cancelable = cancelable;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._target = this._currentTarget = this._relatedTarget =
      this._originalTarget = null;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * Event object for data holding event or data changes.
 */
qx.Class.define("qx.event.type.Data",
{
  extend : qx.event.type.Event,




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __data : null,
    __old : null,


    /**
     * Initializes an event object.
     *
     * @param data {var} The event's new data
     * @param old {var?null} The event's old data (optional)
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link qx.event.type.Event#preventDefault}
     * @return {qx.event.type.Data} the initialized instance.
     */
    init : function(data, old, cancelable)
    {
      this.base(arguments, false, cancelable);

      this.__data = data;
      this.__old = old;

      return this;
    },


    /**
     * Get a copy of this object
     *
     * @param embryo {qx.event.type.Data?null} Optional event class, which will
     *     be configured using the data of this event instance. The event must be
     *     an instance of this event class. If the data is <code>null</code>,
     *     a new pooled instance is created.
     * @return {qx.event.type.Data} a copy of this object
     */
    clone : function(embryo)
    {
      var clone = this.base(arguments, embryo);

      clone.__data = this.__data;
      clone.__old = this.__old;

      return clone;
    },


    /**
     * The new data of the event sending this data event.
     * The return data type is the same as the event data type.
     *
     * @return {var} The new data of the event
     */
    getData : function() {
      return this.__data;
    },


    /**
     * The old data of the event sending this data event.
     * The return data type is the same as the event data type.
     *
     * @return {var} The old data of the event
     */
    getOldData : function() {
      return this.__old;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__data = this.__old = null;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data binding package is still under development so there will be changes
 * to the API. This Features is for testing purpose only.
 */
qx.Class.define("qx.data.SingleValueBinding",
{

  statics :
  {
    /**
     * Static debug flag to enable log messages on every invoke of a listener.
     *
     * @depreacted since 1.4: Plesae use
     *   qx.core.Environment.get("qx.debug.databinding") instaad.
     */
    DEBUG_ON: false,


    /** internal reference for all bindings */
    __bindings: {},


    /**
     * The function is responsible for binding a source objects property to
     * a target objects property. Both properties have to have the usual qooxdoo
     * getter and setter. The source property also needs to fire change-events
     * on every change of its value.
     * Please keep in mind, that this binding is unidirectional. If you need
     * a binding in both directions, you have to use two of this bindings.
     *
     * It's also possible to bind some kind of a hierarchy as a source. This
     * means that you can separate the source properties with a dot and bind
     * by that the object referenced to this property chain.
     * Example with an object 'a' which has object 'b' stored in its 'child'
     * property. Object b has a string property named abc:
     * <pre><code>
     * qx.data.SingleValueBinding.bind(a, "child.abc", textfield, "value");
     * </code></pre>
     * In that case, if the property abc of b changes, the textfield will
     * automatically contain the new value. Also if the child of a changes, the
     * new value (abc of the new child) will be in the textfield.
     *
     * There is also a possibility of binding an array. Therefor the array
     * {@link qx.data.IListData} is needed because this array has change events
     * which the native does not. Imagine a qooxdoo object a which has a
     * children property containing an array holding more of its own kind.
     * Every object has a name property as a string.
     * <pre><code>
     * var svb = qx.data.SingleValueBinding;
     * // bind the first childs name of 'a' to a textfield
     * svb.bind(a, "children[0].name", textfield, "value");
     * // bind the last childs name of 'a' to a textfield
     * svb.bind(a, "children[last].name", textfield2, "value");
     * // also deeper bindinds are possible
     * svb.bind(a, "children[0].children[0].name", textfield3, "value");
     * </code></pre>
     *
     * As you can see in this example, the abc property of a's b will be bound
     * to the textfield. If now the value of b changed or even the a will get a
     * new b, the binding still shows the right value.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property chain to the target
     *   object.
     * @param options {Map?null} A map containing the options.
     *   <li>converter: A converter function which takes four parameters
     *       and should return the converted value. The first parameter is the
     *       data to convert and the second one is the corresponding model
     *       object, which is only set in case of the use of an controller.
     *       The third parameter is the source object for the binding and the
     *       fourth parameter the target object. If no conversion has been
     *       done, the given value should be returned.</li>
     *   <li>onUpdate: A callback function can be given here. This method will be
     *       called if the binding was updated successful. There will be
     *       three parameter you do get in that method call: the source object,
     *       the target object and the data as third parameter.</li>
     *   <li>onSetFail: A callback function can be given here. This method will
     *       be called if the set of the value fails.</li>
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding or e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index.
     *
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for object and property (source and
     *   target).
     */
    bind : function(
      sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options
    )
    {
      // set up the target binding
      var targetListenerMap = this.__setUpTargetBinding(
        sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options
      );

      // get the property names
      var propertyNames = sourcePropertyChain.split(".");

      // stuff that's needed to store for the listener function
      var arrayIndexValues =
        this.__checkForArrayInPropertyChain(propertyNames);
      var sources = [];
      var listeners = [];
      var listenerIds = [];
      var eventNames = [];
      var source = sourceObject;

      // add a try catch to make it possible to remove the listeners of the
      // chain in case the loop breaks after some listeners already added.
      try {
        // go through all property names
        for (var i = 0; i < propertyNames.length; i++) {
          // check for the array
          if (arrayIndexValues[i] !== "") {
            // push the array change event
            eventNames.push("change");
          } else {
            eventNames.push(this.__getEventNameForProperty(source, propertyNames[i]));
          }

          // save the current source
          sources[i] = source;

          // check for the last property
          if (i == propertyNames.length -1) {
            // if it is an array, set the initial value and bind the event
            if (arrayIndexValues[i] !== "") {
              // getthe current value
              var itemIndex = arrayIndexValues[i] === "last" ?
                source.length - 1 : arrayIndexValues[i];
              var currentValue = source.getItem(itemIndex);

              // set the initial value
              this.__setInitialValue(currentValue, targetObject, targetPropertyChain, options, sourceObject);

              // bind the event
              listenerIds[i] = this.__bindEventToProperty(
                source, eventNames[i], targetObject, targetPropertyChain, options, arrayIndexValues[i]
              );
            } else {
              // try to set the initial value
              if (propertyNames[i] != null && source["get" + qx.lang.String.firstUp(propertyNames[i])] != null) {
                var currentValue = source["get" + qx.lang.String.firstUp(propertyNames[i])]();
                this.__setInitialValue(currentValue, targetObject, targetPropertyChain, options, sourceObject);
              }
              // bind the property
              listenerIds[i] = this.__bindEventToProperty(
                source, eventNames[i], targetObject, targetPropertyChain, options
              );
            }

          // if its not the last property
          } else {

            // create the contenxt for the listener
            var context = {
              index: i,
              propertyNames: propertyNames,
              sources: sources,
              listenerIds: listenerIds,
              arrayIndexValues: arrayIndexValues,
              targetObject: targetObject,
              targetPropertyChain: targetPropertyChain,
              options: options,
              listeners: listeners
            };

            // create a listener
            var listener = qx.lang.Function.bind(this.__chainListener, this, context);

            // store the listener for further processing
            listeners.push(listener);

            // add the chaining listener
            listenerIds[i] = source.addListener(eventNames[i], listener);
          }

          // get and store the next source
          if (source["get" + qx.lang.String.firstUp(propertyNames[i])] == null) {
            source = null;
          } else if (arrayIndexValues[i] !== "") {
            source = source["get" + qx.lang.String.firstUp(propertyNames[i])](arrayIndexValues[i]);
          } else {
            source = source["get" + qx.lang.String.firstUp(propertyNames[i])]();
          }
          if (!source) {
            break;
          }
        }

      } catch (ex) {
        // remove the already added listener
        // go threw all added listeners (source)
        for (var i = 0; i < sources.length; i++) {
          // check if a source is available
          if (sources[i] && listenerIds[i]) {
            sources[i].removeListenerById(listenerIds[i]);
          }
        }
        var targets = targetListenerMap.targets;
        var targetIds = targetListenerMap.listenerIds[i];
        // go threw all added listeners (target)
        for (var i = 0; i < targets.length; i++) {
          // check if a target is available
          if (targets[i] && targetIds[i]) {
            targets[i].removeListenerById(targetIds[i]);
          }
        }

        throw ex;
      }

      // create the id map
      var id = {
        type: "deepBinding",
        listenerIds: listenerIds,
        sources: sources,
        targetListenerIds: targetListenerMap.listenerIds,
        targets: targetListenerMap.targets
      };
      // store the bindings
      this.__storeBinding(
        id, sourceObject, sourcePropertyChain, targetObject, targetPropertyChain
      );

      return id;
    },


    /**
     * Event listener for the chaining of the properties.
     *
     * @param context {Map} The current context for the listener.
     */
    __chainListener : function(context)
    {

      // invoke the onUpdate method
      if (context.options && context.options.onUpdate) {
        context.options.onUpdate(
          context.sources[context.index], context.targetObject
        );
      }

      // delete all listener after the current one
      for (var j = context.index + 1; j < context.propertyNames.length; j++) {
        // remove the old sources
        var source = context.sources[j];
        context.sources[j] = null;
        if (!source) {
          continue;
        }

        // remove the listeners
        source.removeListenerById(context.listenerIds[j]);
      }

      // get the current source
      var source = context.sources[context.index];
      // add new once after the current one
      for (var j = context.index + 1; j < context.propertyNames.length; j++) {
        // get and store the new source
        if (context.arrayIndexValues[j - 1] !== "") {
          source = source["get" + qx.lang.String.firstUp(context.propertyNames[j - 1])](context.arrayIndexValues[j - 1]);
        } else {
          source = source["get" + qx.lang.String.firstUp(context.propertyNames[j - 1])]();
        }
        context.sources[j] = source;
        // reset the target object if no new source could be found
        if (!source) {
          this.__resetTargetValue(context.targetObject, context.targetPropertyChain);
          break;
        }

        // if its the last property
        if (j == context.propertyNames.length - 1) {
          // if its an array
          if (qx.Class.implementsInterface(source, qx.data.IListData)) {
            // set the inital value
            var itemIndex = context.arrayIndexValues[j] === "last" ?
              source.length - 1 : context.arrayIndexValues[j];
            var currentValue = source.getItem(itemIndex);
            this.__setInitialValue(
              currentValue, context.targetObject, context.targetPropertyChain, context.options, context.sources[context.index]
            );

            // bind the item event to the new target
            context.listenerIds[j] = this.__bindEventToProperty(
              source, "change", context.targetObject, context.targetPropertyChain, context.options, context.arrayIndexValues[j]
            );

          } else {
            if (context.propertyNames[j] != null && source["get" + qx.lang.String.firstUp(context.propertyNames[j])] != null) {
              var currentValue = source["get" + qx.lang.String.firstUp(context.propertyNames[j])]();
              this.__setInitialValue(currentValue, context.targetObject, context.targetPropertyChain, context.options, context.sources[context.index]);
            }
            var eventName = this.__getEventNameForProperty(source, context.propertyNames[j]);
            // bind the last property to the new target
            context.listenerIds[j] = this.__bindEventToProperty(
              source, eventName, context.targetObject, context.targetPropertyChain, context.options
            );
          }
        } else {
          // check if a listener already created
          if (context.listeners[j] == null) {
            var listener = qx.lang.Function.bind(this.__chainListener, this, context);
            // store the listener for further processing
            context.listeners.push(listener);
          }
          // add a new listener
          if (qx.Class.implementsInterface(source, qx.data.IListData)) {
            var eventName = "change";
          } else {
            var eventName = this.__getEventNameForProperty(source, context.propertyNames[j]);
          }
          context.listenerIds[j] = source.addListener(eventName, context.listeners[j]);
        }
      }
    },


    /**
     * Internal helper for setting up the listening to the changes on the
     * target side of the binding. Only works if the target property is a
     * property chain
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property name of the target
     *   object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     * @return {var} A map containing the listener ids and the targets.
     */
    __setUpTargetBinding : function(
      sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options
    ) {
      // get the property names
      var propertyNames = targetPropertyChain.split(".");

      var arrayIndexValues =
        this.__checkForArrayInPropertyChain(propertyNames);
      var targets = [];
      var listeners = [];
      var listenerIds = [];
      var eventNames = [];
      var target = targetObject;

      // go through all property names
      for (var i = 0; i < propertyNames.length - 1; i++) {
        // check for the array
        if (arrayIndexValues[i] !== "") {
          // push the array change event
          eventNames.push("change");
        } else {
          try {
            eventNames.push(
              this.__getEventNameForProperty(target, propertyNames[i])
            );
          } catch (e) {
            // if the event names could not be terminated,
            // just ignore the target chain listening
            break;
          }
        }

        // save the current source
        targets[i] = target;

        // create a listener
        var listener = function() {
          // delete all listener after the current one
          for (var j = i + 1; j < propertyNames.length - 1; j++) {
            // remove the old sources
            var target = targets[j];
            targets[j] = null;
            if (!target) {
              continue;
            }

            // remove the listeners
            target.removeListenerById(listenerIds[j]);
          }

          // get the current target
          var target = targets[i];
          // add new once after the current one
          for (var j = i + 1; j < propertyNames.length - 1; j++) {

            var firstUpPropName = qx.lang.String.firstUp(propertyNames[j - 1]);
            // get and store the new target
            if (arrayIndexValues[j - 1] !== "") {
              var currentIndex = arrayIndexValues[j - 1] === "last" ?
                target.getLength() - 1 : arrayIndexValues[j - 1];
              target = target["get" + firstUpPropName](currentIndex);
            } else {
              target = target["get" + firstUpPropName]();
            }
            targets[j] = target;

            // check if a listener already created
            if (listeners[j] == null) {
              // store the listener for further processing
              listeners.push(listener);
            }

            // add a new listener
            if (qx.Class.implementsInterface(target, qx.data.IListData)) {
              var eventName = "change";
            } else {
              try {
                var eventName =
                  qx.data.SingleValueBinding.__getEventNameForProperty(
                    target, propertyNames[j]
                  );
              } catch (e) {
                // if the event name could not be terminated,
                // ignore the rest
                break;
              }
            }

            listenerIds[j] = target.addListener(eventName, listeners[j]);
           }

          qx.data.SingleValueBinding.updateTarget(
            sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options
          );
        };

        // store the listener for further processing
        listeners.push(listener);

        // add the chaining listener
        listenerIds[i] = target.addListener(eventNames[i], listener);

        var firstUpPropName = qx.lang.String.firstUp(propertyNames[i]);
        // get and store the next target
        if (target["get" + firstUpPropName] == null) {
          target = null;
        } else if (arrayIndexValues[i] !== "") {
          target = target["get" + firstUpPropName](arrayIndexValues[i]);
        } else {
          target = target["get" + firstUpPropName]();
        }
        if (!target) {
          break;
        }
      }

      return {listenerIds: listenerIds, targets: targets};
    },


    /**
     * Helper for updating the target. Gets the current set data from the source
     * and set that on the target.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourcePropertyChain {String} The property chain which represents
     *   the source property.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetPropertyChain {String} The property name of the target
     *   object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     *
     * @internal
     */
    updateTarget : function(
      sourceObject, sourcePropertyChain, targetObject, targetPropertyChain, options
    )
    {
      var value = this.getValueFromObject(sourceObject, sourcePropertyChain);

      // convert the data before setting
      value = qx.data.SingleValueBinding.__convertValue(
        value, targetObject, targetPropertyChain, options, sourceObject
      );

      this.__setTargetValue(targetObject, targetPropertyChain, value);
    },


    /**
     * Internal helper for getting the current set value at the property chain.
     *
     * @param o {qx.core.Object} The source of the binding.
     * @param propertyChain {String} The property chain which represents
     *   the source property.
     * @return {var?undefined} Returns the set value if defined.
     *
     * @internal
     */
    getValueFromObject : function(o, propertyChain) {
      var source = this.__getTargetFromChain(o, propertyChain);

      var value;
      if (source != null) {
        // geht the name of the last property
        var lastProperty = propertyChain.substring(
          propertyChain.lastIndexOf(".") + 1, propertyChain.length
        );

        // check for arrays
        if (lastProperty.charAt(lastProperty.length - 1) == "]") {
          // split up the chain into property and index
          var index = lastProperty.substring(
            lastProperty.lastIndexOf("[") + 1, lastProperty.length - 1
          );
          var prop = lastProperty.substring(0, lastProperty.lastIndexOf("["));

          // get the array
          var sourceArray = source["get" + qx.lang.String.firstUp(prop)]();
          if (index == "last") {
            index = sourceArray.length - 1;
          }
          if (sourceArray != null) {
            value = sourceArray.getItem(index);
          }

        } else {
          // set the given value
          value = source["get" + qx.lang.String.firstUp(lastProperty)]();
        }
      }

      return value;
    },


    /**
     * Tries to return a fitting event name to the given source object and
     * property name. First, it assumes that the propertyname is a real property
     * and therefore it checks the property definition for the event. The second
     * possibility is to check if there is an event with the given name. The
     * third and last possibility checked is if there is an event which is named
     * change + propertyname. If this three possibilities fail, an error will be
     * thrown.
     *
     * @param source {qx.core.Object} The source where the property is stored.
     * @param propertyname {String} The name of the property.
     * @return {String} The name of the corresponding property.
     */
    __getEventNameForProperty : function(source, propertyname)
    {
      // get the current event Name from the property definition
      var eventName = this.__getEventForProperty(source, propertyname);
      // if no event name could be found
      if (eventName == null) {
        // check if the propertyname is the event name
        if (qx.Class.supportsEvent(source.constructor, propertyname)) {
          eventName = propertyname;
        // check if the change + propertyname is the event name
        } else if (qx.Class.supportsEvent(
          source.constructor, "change" + qx.lang.String.firstUp(propertyname))
        ) {
          eventName = "change" + qx.lang.String.firstUp(propertyname);
        } else {
          throw new qx.core.AssertionError(
            "Binding property " + propertyname + " of object " + source +
            " not possible: No event available. "
          );
        }
      }
      return eventName;
    },


    /**
     * Resets the value of the given target after resolving the target property
     * chain.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     */
    __resetTargetValue : function(targetObject, targetPropertyChain)
    {
      // get the last target object of the chain
      var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
      if (target != null) {
        // get the name of the last property
        var lastProperty = targetPropertyChain.substring(
          targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length
        );
        // check for an array and set the value to null
        if (lastProperty.charAt(lastProperty.length - 1) == "]") {
          this.__setTargetValue(targetObject, targetPropertyChain, null);
          return;
        }
        // try to reset the property
        if (target["reset" + qx.lang.String.firstUp(lastProperty)] != undefined) {
          target["reset" + qx.lang.String.firstUp(lastProperty)]();
        } else {
          // fallback if no resetter is given (see bug #2456)
          target["set" + qx.lang.String.firstUp(lastProperty)](null);
        }
      }
    },


    /**
     * Sets the given value to the given target after resolving the
     * target property chain.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     * @param value {var} The value to set.
     */
    __setTargetValue : function(targetObject, targetPropertyChain, value)
    {
      // get the last target object of the chain
      var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
      if (target != null) {
        // geht the name of the last property
        var lastProperty = targetPropertyChain.substring(
          targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length
        );

        // check for arrays
        if (lastProperty.charAt(lastProperty.length - 1) == "]") {
          // split up the chain into property and index
          var index = lastProperty.substring(lastProperty.lastIndexOf("[") + 1, lastProperty.length - 1);
          var prop = lastProperty.substring(0, lastProperty.lastIndexOf("["));

          // get the array
          var targetArray = targetObject;
          if (!qx.Class.implementsInterface(targetArray, qx.data.IListData)) {
            targetArray = target["get" + qx.lang.String.firstUp(prop)]();
          }

          if (index == "last") {
            index = targetArray.length - 1;
          }
          if (targetArray != null) {
            targetArray.setItem(index, value);
          }

        } else {
          // set the given value
          target["set" + qx.lang.String.firstUp(lastProperty)](value);
        }
      }
    },


    /**
     * Helper-Function resolving the object on which the last property of the
     * chain should be set.
     *
     * @param targetObject {qx.core.Object} The object where the property chain
     *   starts.
     * @param targetPropertyChain {String} The names of the properties,
     *   separated with a dot.
     * @return {qx.core.Object | null} The object on which the last property
     *   should be set.
     */
    __getTargetFromChain : function(targetObject, targetPropertyChain)
    {
      var properties = targetPropertyChain.split(".");
      var target = targetObject;
      // ignore the last property
      for (var i = 0; i < properties.length - 1; i++) {
        try {
          var property = properties[i];
          // if there is an array notation
          if (property.indexOf("]") == property.length - 1) {
            var index = property.substring(
              property.indexOf("[") + 1, property.length - 1
            );
            property = property.substring(0, property.indexOf("["));
          }
          // in case there is a property infront of the brackets
          if (property != "") {
            target = target["get" + qx.lang.String.firstUp(property)]();
          }

          // if there is an index, we can be sure its an array
          if (index != null) {
            // check for the 'last' notation
            if (index == "last") {
              index = target.length - 1;
            }
            // get the array item
            target = target.getItem(index);
            index = null;
          }
        } catch (ex) {
          return null;
        }
      }
      return target;
    },


    /**
     * Set the given value to the target property. This method is used for
     * initially set the value.
     *
     * @param value {var} The value to set.
     * @param targetObject {qx.core.Object} The object which contains the target
     *   property.
     * @param targetPropertyChain {String} The name of the target property in the
     *   target object.
     * @param options {Map} The options map perhaps containing the user defined
     *   converter.
     * @param sourceObject {qx.core.Object} The source object of the binding (
     *   used for the onUpdate callback).
     */
    __setInitialValue : function(value, targetObject, targetPropertyChain, options, sourceObject)
    {
      // first convert the initial value
      value = this.__convertValue(
        value, targetObject, targetPropertyChain, options, sourceObject
      );
      // check if the converted value is undefined
      if (value === undefined) {
        this.__resetTargetValue(targetObject, targetPropertyChain);
      }
      // only set the initial value if one is given (may be null)
      if (value !== undefined) {
        try {
          this.__setTargetValue(targetObject, targetPropertyChain, value);

          // tell the user that the setter was invoked probably
          if (options && options.onUpdate) {
            options.onUpdate(sourceObject, targetObject, value);
          }
        } catch (e) {
          if (! (e instanceof qx.core.ValidationError)) {
            throw e;
          }

          if (options && options.onSetFail) {
            options.onSetFail(e);
          } else {
            qx.log.Logger.warn(
              "Failed so set value " + value + " on " + targetObject
               + ". Error message: " + e
            );
          }
        }
      }
    },


    /**
     * Checks for an array element in the given property names and adapts the
     * arrays to fit the algorithm.
     *
     * @param propertyNames {Array} The array containing the property names.
     *   Attention, this method can chang this parameter!!!
     * @return {Array} An array containing the values of the array properties
     *   corresponding to the property names.
     */
    __checkForArrayInPropertyChain: function(propertyNames) {
      // array for the values of the array properties
      var arrayIndexValues = [];

      // go through all properties and check for array notations
      for (var i = 0; i < propertyNames.length; i++) {
        var name = propertyNames[i];
        // if its an array property in the chain
        if (qx.lang.String.endsWith(name, "]")) {
          // get the inner value of the array notation
          var arrayIndex = name.substring(name.indexOf("[") + 1, name.indexOf("]"));

          // check the arrayIndex
          if (name.indexOf("]") != name.length - 1) {
            throw new Error("Please use only one array at a time: "
              + name + " does not work.");
          }
          if (arrayIndex !== "last") {
            if (arrayIndex == "" || isNaN(parseInt(arrayIndex, 10))) {
              throw new Error("No number or 'last' value hast been given"
                + " in an array binding: " + name + " does not work.");
            }
          }

          // if a property is infront of the array notation
          if (name.indexOf("[") != 0) {
            // store the property name without the array notation
            propertyNames[i] = name.substring(0, name.indexOf("["));
            // store the values in the array for the current iteration
            arrayIndexValues[i] = "";
            // store the properties for the next iteration (the item of the array)
            arrayIndexValues[i + 1] = arrayIndex;
            propertyNames.splice(i + 1, 0, "item");
            // skip the next iteration. its the array item and its already set
            i++;
          // it the array notation is the beginning
          } else {
            // store the array index and override the entry in the property names
            arrayIndexValues[i] = arrayIndex;
            propertyNames.splice(i, 1, "item");
          }

        } else {
          arrayIndexValues[i] = "";
        }
      }

      return arrayIndexValues;
    },


    /**
     * Internal helper method which is actually doing all bindings. That means
     * that an event listener will be added to the source object which listens
     * to the given event and invokes an set on the target property on the
     * targetObject.
     * This method does not store the binding in the internal reference store
     * so it should NOT be used from outside this class. For an outside usage,
     * use {@link #bind}.
     *
     * @param sourceObject {qx.core.Object} The source of the binding.
     * @param sourceEvent {String} The event of the source object which could
     *   be the change event in common but has to be an
     *   {@link qx.event.type.Data} event.
     * @param targetObject {qx.core.Object} The object which the source should
     *   be bind to.
     * @param targetProperty {String} The property name of the target object.
     * @param options {Map} A map containing the options. See
     *   {@link #bind} for more information.
     * @param arrayIndex {String} The index of the given array if its an array
     *   to bind.
     *
     * @return {var} Returns the internal id for that binding. This can be used
     *   for referencing the binding or e.g. for removing. This is not an atomic
     *   id so you can't you use it as a hash-map index. It's the id which will
     *   be returned by the {@link qx.core.Object#addListener} method.
     * @throws {qx.core.AssertionError} If the event is no data event or
     *   there is no property definition for the target object and target
     *   property.
     */
    __bindEventToProperty : function(sourceObject, sourceEvent, targetObject,
      targetProperty, options, arrayIndex)
    {
      // checks
      if (qx.core.Environment.get("qx.debug")) {
        // check for the data event
        var eventType = qx.Class.getEventType(
          sourceObject.constructor, sourceEvent
        );
        qx.core.Assert.assertEquals(
          "qx.event.type.Data", eventType, sourceEvent
          + " is not an data (qx.event.type.Data) event on "
          + sourceObject + "."
        );
      }

      var bindListener = function(arrayIndex, e) {
        // if an array value is given
        if (arrayIndex !== "") {
          //check if its the "last" value
          if (arrayIndex === "last") {
            arrayIndex = sourceObject.length - 1;
          }
          // get the data of the array
          var data = sourceObject.getItem(arrayIndex);

          // reset the target if the data is not set
          if (data === undefined) {
            qx.data.SingleValueBinding.__resetTargetValue(targetObject, targetProperty);
          }

          // only do something if the curren array has been changed
          var start = e.getData().start;
          var end = e.getData().end;
          if (arrayIndex < start || arrayIndex > end) {
            return;
          }
        } else {
          // get the data out of the event
          var data = e.getData();
        }

        // debug message
        if (qx.core.Environment.get("qx.debug.databinding")) {
          qx.log.Logger.debug("Binding executed from " + sourceObject + " by " +
            sourceEvent + " to " + targetObject + " (" + targetProperty + ")");
          qx.log.Logger.debug("Data before conversion: " + data);
        }

        // convert the data
        data = qx.data.SingleValueBinding.__convertValue(
          data, targetObject, targetProperty, options, sourceObject
        );

        // debug message
        if (qx.core.Environment.get("qx.debug.databinding")) {
          qx.log.Logger.debug("Data after conversion: " + data);
        }

        // try to set the value
        try {
          if (data !== undefined) {
            qx.data.SingleValueBinding.__setTargetValue(targetObject, targetProperty, data);
          } else {
            qx.data.SingleValueBinding.__resetTargetValue(targetObject, targetProperty);
          }

          // tell the user that the setter was invoked probably
          if (options && options.onUpdate) {
            options.onUpdate(sourceObject, targetObject, data);
          }

        } catch (e) {
          if (! (e instanceof qx.core.ValidationError)) {
            throw e;
          }

          if (options && options.onSetFail) {
            options.onSetFail(e);
          } else {
            qx.log.Logger.warn(
              "Failed so set value " + data + " on " + targetObject
               + ". Error message: " + e
            );
          }
        }
      }

      // check if an array index is given
      if (!arrayIndex) {
        // if not, signal it a s an empty string
        arrayIndex = "";
      }
      // bind the listener function (make the array index in the listener available)
      bindListener = qx.lang.Function.bind(bindListener, sourceObject, arrayIndex);

      // add the listener
      var id = sourceObject.addListener(sourceEvent, bindListener);

      return id;
    },


    /**
     * This method stores the given value as a binding in the internal structure
     * of all bindings.
     *
     * @param id {var} The listener id of the id for a deeper binding.
     * @param sourceObject {qx.core.Object} The source Object of the binding.
     * @param sourceEvent {String} The name of the source event.
     * @param targetObject {qx.core.Object} The target object.
     * @param targetProperty {String} The name of the property on the target
     *   object.
     */
    __storeBinding : function(
      id, sourceObject, sourceEvent, targetObject, targetProperty
    )
    {
      // add the listener id to the internal registry
      if (this.__bindings[sourceObject.toHashCode()] === undefined) {
        this.__bindings[sourceObject.toHashCode()] = [];
      }
      this.__bindings[sourceObject.toHashCode()].push(
        [id, sourceObject, sourceEvent, targetObject, targetProperty]
      );
    },


    /**
     * This method takes the given value, checks if the user has given a
     * converter and converts the value to its target type. If no converter is
     * given by the user, the {@link #__defaultConversion} will try to convert
     * the value.
     *
     * @param value {var} The value which possibly should be converted.
     * @param targetObject {qx.core.Object} The target object.
     * @param targetPropertyChain {String} The property name of the target object.
     * @param options {Map} The options map which can includes the converter.
     *   For a detailed information on the map, take a look at
     *   {@link #bind}.
     * @param sourceObject {qx.core.Object} The source obejct for the binding.
     *
     * @return {var} The converted value. If no conversion has been done, the
     *   value property will be returned.
     * @throws {qx.core.AssertionError} If there is no property definition
     *   of the given target object and target property.
     */
    __convertValue : function(
      value, targetObject, targetPropertyChain, options, sourceObject
    ) {
      // do the conversion given by the user
      if (options && options.converter) {
        var model;
        if (targetObject.getModel) {
          model = targetObject.getModel();
        }
        return options.converter(value, model, sourceObject, targetObject);
      // try default conversion
      } else {
        var target = this.__getTargetFromChain(targetObject, targetPropertyChain);
        var lastProperty = targetPropertyChain.substring(
          targetPropertyChain.lastIndexOf(".") + 1, targetPropertyChain.length
        );
        // if no target is currently available, return the original value
        if (target == null) {
          return value;
        }

        var propertieDefinition = qx.Class.getPropertyDefinition(
          target.constructor, lastProperty
        );
        var check = propertieDefinition == null ? "" : propertieDefinition.check;
        return this.__defaultConversion(value, check);
      }
    },


    /**
     * Helper method which tries to figure out if the given property on the
     * given object does have a change event and if returns the name of it.
     *
     * @param sourceObject {qx.core.Object} The object to check.
     * @param sourceProperty {String} The name of the property.
     *
     * @return {String} The name of the change event.
     * @throws {qx.core.AssertionError} If there is no property definition of
     *   the given object property pair.
     */
    __getEventForProperty : function(sourceObject, sourceProperty) {
      // get the event name
      var propertieDefinition =  qx.Class.getPropertyDefinition(
        sourceObject.constructor, sourceProperty
      );

      if (propertieDefinition == null) {
        return null;
      }
      return propertieDefinition.event;
    },


    /**
     * Tries to convert the data to the type given in the targetCheck argument.
     *
     * @param data {var} The data to convert.
     * @param targetCheck {String} The value of the check property. That usually
     *   contains the target type.
     */
    __defaultConversion : function(data, targetCheck) {
      var dataType = qx.lang.Type.getClass(data);

      // to integer
      if ((dataType == "Number" || dataType == "String") &&
          (targetCheck == "Integer" || targetCheck == "PositiveInteger")) {
        data = parseInt(data, 10);
      }

      // to string
      if ((dataType == "Boolean" || dataType == "Number" || dataType == "Date")
        && targetCheck == "String") {
        data = data + "";
      }

      // to float
      if ((dataType == "Number" || dataType == "String") &&
        (targetCheck == "Number" || targetCheck == "PositiveNumber")) {
        data = parseFloat(data);
      }

      return data;
    },


    /**
     * Removes the binding with the given id from the given sourceObject. The
     * id hast to be the id returned by any of the bind functions.
     *
     * @param sourceObject {qx.core.Object} The source object of the binding.
     * @param id {var} The id of the binding.
     * @throws {Error} If the binding could not be found.
     */
    removeBindingFromObject : function(sourceObject, id) {
      // check for a deep binding
      if (id.type == "deepBinding") {
        // go threw all added listeners (source)
        for (var i = 0; i < id.sources.length; i++) {
          // check if a source is available
          if (id.sources[i]) {
            id.sources[i].removeListenerById(id.listenerIds[i]);
          }
        }
        // go threw all added listeners (target)
        for (var i = 0; i < id.targets.length; i++) {
          // check if a target is available
          if (id.targets[i]) {
            id.targets[i].removeListenerById(id.targetListenerIds[i]);
          }
        }
      } else {
        // remove the listener
        sourceObject.removeListenerById(id);
      }

      // remove the id from the internal reference system
      var bindings = this.__bindings[sourceObject.toHashCode()];
      // check if the binding exists
      if (bindings != undefined) {
        for (var i = 0; i < bindings.length; i++) {
          if (bindings[i][0] == id) {
            qx.lang.Array.remove(bindings, bindings[i]);
            return;
          }
        }
      }
      throw new Error("Binding could not be found!");
    },


    /**
     * Removes all bindings for the given object.
     *
     * @param object {qx.core.Object} The object of which the bindings should be
     *   removed.
     * @throws {qx.core.AssertionError} If the object is not in the internal
     *   registry of the bindings.
     * @throws {Error} If one of the bindings listed internally can not be
     *   removed.
     */
    removeAllBindingsForObject : function(object) {
      // check for the null value

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertNotNull(object,
          "Can not remove the bindings for null object!");
      }

      // get the bindings
      var bindings = this.__bindings[object.toHashCode()];
      if (bindings != undefined)
      {
        // remove every binding with the removeBindingFromObject function
        for (var i = bindings.length - 1; i >= 0; i--) {
          this.removeBindingFromObject(object, bindings[i][0]);
        }
      }
    },


    /**
     * Returns an array which lists all bindings.
     *
     * @param object {qx.core.Object} The object of which the bindings should
     *   be returned.
     *
     * @return {Array} An array of binding informations. Every binding
     *   information is an array itself containing id, sourceObject,
     *   sourceEvent, targetObject and targetProperty in that order.
     */
    getAllBindingsForObject : function(object) {
      // create an empty array if no binding exists
      if (this.__bindings[object.toHashCode()] === undefined) {
        this.__bindings[object.toHashCode()] = [];
      }

      return this.__bindings[object.toHashCode()];
    },


    /**
     * Removes all binding in the whole application. After that not a single
     * binding is left.
     */
    removeAllBindings : function() {
      // go threw all registerd objects
      for (var hash in this.__bindings) {
        var object = qx.core.ObjectRegistry.fromHashCode(hash);
        // check for the object, perhaps its already deleted
        if (object == null) {
          delete this.__bindings[hash];
          continue;
        }
        this.removeAllBindingsForObject(object);
      }
      // reset the bindings map
      this.__bindings = {};
    },


    /**
     * Returns a map containing for every bound object an array of data binding
     * information. The key of the map is the hashcode of the bound objects.
     * Every binding is represented by an array containing id, sourceObject,
     * sourceEvent, targetObject and targetProperty.
     *
     * @return {Map} Map containing all bindings.
     */
    getAllBindings : function() {
      return this.__bindings;
    },


    /**
     * Debug function which shows some valuable information about the given
     * binding in console. For that it uses {@link qx.log.Logger}.
     *
     * @param object {qx.core.Object} the source of the binding.
     * @param id {var} The id of the binding.
     */
    showBindingInLog : function(object, id) {
      var binding;
      // go threw all bindings of the given object
      for (var i = 0; i < this.__bindings[object.toHashCode()].length; i++) {
        // the first array item is the id
        if (this.__bindings[object.toHashCode()][i][0] == id) {
          binding = this.__bindings[object.toHashCode()][i];
          break;
        }
      }

      if (binding === undefined) {
        var message = "Binding does not exist!"
      } else {
        var message = "Binding from '" + binding[1] + "' (" + binding[2] +
          ") to the object '" + binding[3] + "' ("+ binding[4] + ").";
      }

      qx.log.Logger.debug(message);
    },


    /**
     * Debug function which shows all bindings in the log console. To get only
     * one binding in the console use {@link #showBindingInLog}
     */
    showAllBindingsInLog : function() {
      // go threw all objects in the registry
      for (var hash in this.__bindings) {
        var object = qx.core.ObjectRegistry.fromHashCode(hash);
        for (var i = 0; i < this.__bindings[hash].length; i++) {
          this.showBindingInLog(object, this.__bindings[hash][i][0]);
        }
      }
    }

  }
});

//@deprecated since 1.4
qx.log.Logger.deprecatedConstantWarning("qx.data.SingleValueBinding", "DEBUG_ON");
 /* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is the common super class for all error classes in qooxdoo.
 *
 * It has a comment and a fail message as members. The toString method returns
 * the comment and the fail message separated by a colon.
 */
qx.Class.define("qx.type.BaseError",
{
  extend : Error,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param comment {String} Comment passed to the assertion call
   * @param failMessage {String} Fail message provided by the assertion
   */
  construct : function(comment, failMessage)
  {
    Error.call(this, failMessage);

    this.__comment = comment || "";
    // opera 10 crashes if the message is an empty string!!!?!?!
    this.message = failMessage || qx.type.BaseError.DEFAULTMESSAGE;
  },



  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics :
  {
    DEFAULTMESSAGE : "error"
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __comment : null,

    /** {String} Fail message provided by the assertion */
    message : null,


    /**
     * Comment passed to the assertion call
     *
     * @return {String} The comment passed to the assertion call
     */
    getComment : function() {
      return this.__comment;
    },


    /**
     * Get the error message
     *
     * @return {String} The error message
     */
    toString : function() {
      return this.__comment + (this.message ? ": " + this.message : "");
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Assertion errors are thrown if an assertion in {@link qx.core.Assert}
 * fails.
 */
qx.Class.define("qx.core.AssertionError",
{
  extend : qx.type.BaseError,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param comment {String} Comment passed to the assertion call
   * @param failMessage {String} Fail message provided by the assertion
   */
  construct : function(comment, failMessage)
  {
    qx.type.BaseError.call(this, comment, failMessage);
    this.__trace = qx.dev.StackTrace.getStackTrace();
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __trace : null,


    /**
     * Stack trace of the error
     *
     * @return {String[]} The stack trace of the location the exception was thrown
     */
    getStackTrace : function() {
      return this.__trace;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Michael Haitz (mhaitz)

************************************************************************ */

/**
 * This exception is thrown by the {@link qx.event.GlobalError} handler if a
 * observed method throws an exception.
 */
qx.Bootstrap.define("qx.core.GlobalError",
{
  extend : Error,


  /**
   * @param exc {Error} source exception
   * @param args {Array} arguments
   */
  construct : function(exc, args)
  {
    if (qx.core.Environment.get("qx.debug")) {
      qx.core.Assert.assertNotUndefined(exc);
    }

    this.__failMessage = "GlobalError: " + (exc && exc.message ? exc.message : exc);

    Error.call(this, this.__failMessage);

    this.__arguments = args;
    this.__exc = exc;
  },


  members :
  {
    __exc : null,
    __arguments : null,
    __failMessage : null,


    /**
     * Returns the error message.
     *
     * @return {String} error message
     */
    toString : function() {
      return this.__failMessage;
    },


    /**
     * Returns the arguments which are
     *
     * @return {Object} arguments
     */
    getArguments : function() {
      return this.__arguments;
    },


    /**
     * Get the source exception
     *
     * @return {Error} source exception
     */
    getSourceException : function() {
      return this.__exc;
    }

  },


  destruct : function ()
  {
    this.__exc = null;
    this.__arguments = null;
    this.__failMessage = null;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
   ________________________________________________________________________

   This class contains code based on the following work:

    http://www.JSON.org/json2.js
    2009-06-29

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

************************************************************************ */

/**
 * Pure JavaScript implementation of the EcmaScript 3.1 JSON object. This class
 * is used, if the browser does not support it natively.
 *
 * @internal
 */
qx.Class.define("qx.lang.JsonImpl",
{
  extend : Object,


  construct : function()
  {
    // bind parse and stringify so they can be called without a context.
    this.stringify = qx.lang.Function.bind(this.stringify, this);
    this.parse = qx.lang.Function.bind(this.parse, this);
  },

  members :
  {
    __gap: null,
    __indent: null,
    __rep: null,
    __stack : null,


    /**
     * This method produces a JSON text from a JavaScript value.
     *
     * @param value {var} any JavaScript value, usually an object or array.
     *
     * @param replacer {Function?} an optional parameter that determines how
     *    object values are stringified for objects. It can be a function or an
     *    array of strings.
     *
     * @param space {String?} an optional parameter that specifies the
     *    indentation of nested structures. If it is omitted, the text will
     *    be packed without extra whitespace. If it is a number, it will specify
     *    the number of spaces to indent at each level. If it is a string
     *    (such as '\t' or '&nbsp;'), it contains the characters used to indent
     *    at each level.
     *
     * @return {String} The JSON string of the value
     */
    stringify : function(value, replacer, space)
    {
      this.__gap = '';
      this.__indent = '';
      this.__stack = [];

      if (qx.lang.Type.isNumber(space))
      {
        // If the space parameter is a number, make an indent string containing that
        // many spaces.
        var space = Math.min(10, Math.floor(space));
        for (var i = 0; i < space; i += 1) {
          this.__indent += ' ';
        }
      }
      else if (qx.lang.Type.isString(space))
      {
        if (space.length > 10) {
          space = space.slice(0, 10);
        }
        // If the space parameter is a string, it will be used as the indent string.
        this.__indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, ignore it.
      if (
        replacer &&
        (qx.lang.Type.isFunction(replacer) || qx.lang.Type.isArray(replacer))
      ) {
        this.__rep = replacer;
      } else {
        this.__rep = null;
      }

      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.
      return this.__str('', {'': value});
    },


    /**
     * Produce a string from holder[key].
     *
     * @param key {String} the map key
     * @param holder {Object} an object with the given key
     * @return {String} The string representation of holder[key]
     */
    __str : function(key, holder)
    {
      var mind = this.__gap, partial, value = holder[key];

      // If the value has a toJSON method, call it to obtain a replacement value.
      if (value && qx.lang.Type.isFunction(value.toJSON)) {
        value = value.toJSON(key);
      } else if (qx.lang.Type.isDate(value)) {
        value = this.dateToJSON(value);
      }

      // If we were called with a replacer function, then call the replacer to
      // obtain a replacement value.
      if (typeof this.__rep === 'function') {
        value = this.__rep.call(holder, key, value);
      }

      if (value === null) {
        return 'null';
      }

      if (value === undefined) {
        return undefined;
      }

      // What happens next depends on the value's type.
      switch (qx.lang.Type.getClass(value))
      {
        case 'String':
          return this.__quote(value);

        case 'Number':
          // JSON numbers must be finite. Encode non-finite numbers as null.
          return isFinite(value) ? String(value) : 'null';

        case 'Boolean':
          // If the value is a boolean or null, convert it to a string. Note:
          // typeof null does not produce 'null'. The case is included here in
          // the remote chance that this gets fixed someday.
          return String(value);

        case 'Array':
          // Make an array to hold the partial results of stringifying this array value.
          this.__gap += this.__indent;
          partial = [];

          if (this.__stack.indexOf(value) !== -1) {
            throw new TypeError("Cannot stringify a recursive object.")
          }
          this.__stack.push(value);

          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.
          var length = value.length;
          for (var i = 0; i < length; i += 1) {
            partial[i] = this.__str(i, value) || 'null';
          }

          this.__stack.pop();

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.
          if (partial.length === 0) {
            var string = '[]';
          } else if (this.__gap) {
            string = '[\n' + this.__gap + partial.join(',\n' + this.__gap) + '\n' + mind + ']'
          } else {
            string = '[' + partial.join(',') + ']';
          }
          this.__gap = mind;
          return string;

        case 'Object':
          // Make an array to hold the partial results of stringifying this object value.
          this.__gap += this.__indent;
          partial = [];

          if (this.__stack.indexOf(value) !== -1) {
            throw new TypeError("Cannot stringify a recursive object.")
          }
          this.__stack.push(value);

          // If the replacer is an array, use it to select the members to be stringified.
          if (this.__rep && typeof this.__rep === 'object')
          {
            var length = this.__rep.length;
            for (var i = 0; i < length; i += 1)
            {
              var k = this.__rep[i];
              if (typeof k === 'string')
              {
                var v = this.__str(k, value);
                if (v) {
                  partial.push(this.__quote(k) + (this.__gap ? ': ' : ':') + v);
                }
              }
            }
          }
          else
          {
            // Otherwise, iterate through all of the keys in the object.
            for (var k in value)
            {
              if (Object.hasOwnProperty.call(value, k))
              {
                var v = this.__str(k, value);
                if (v) {
                  partial.push(this.__quote(k) + (this.__gap ? ': ' : ':') + v);
                }
              }
            }
          }

          this.__stack.pop();

          // Join all of the member texts together, separated with commas,
          // and wrap them in braces.
          if (partial.length === 0) {
            var string =  '{}';
          } else if (this.__gap) {
            string = '{\n' + this.__gap + partial.join(',\n' + this.__gap) + '\n' + mind + '}';
          } else {
            string = '{' + partial.join(',') + '}';
          }
          this.__gap = mind;
          return string;
      }
    },


    /**
     * Convert a date to JSON
     *
     * @param date {Date} The date to convert
     * @return {String} The JSON representation of the date
     */
    dateToJSON : function(date)
    {
      // Format integers to have at least two digits.
      var f2 = function(n) {
        return n < 10 ? '0' + n : n;
      }

      var f3 = function(n) {
        var value = f2(n);
        return n < 100 ? '0' + value : value;
      }

      return isFinite(date.valueOf()) ?
         date.getUTCFullYear()   + '-' +
       f2(date.getUTCMonth() + 1) + '-' +
       f2(date.getUTCDate())      + 'T' +
       f2(date.getUTCHours())     + ':' +
       f2(date.getUTCMinutes())   + ':' +
       f2(date.getUTCSeconds())   + '.' +
       f3(date.getUTCMilliseconds()) + 'Z' : null;
    },


    /**
     * If the string contains no control characters, no quote characters, and no
     * backslash characters, then we can safely slap some quotes around it.
     * Otherwise we must also replace the offending characters with safe escape
     * sequences.
     *
     * @param string {String} The string to quote
     * @return {String} The quoted string
     */
    __quote : function(string)
    {
      var meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      };

      var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      escapable.lastIndex = 0;

      if (escapable.test(string))
      {
        return '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"';
      }
      else
      {
        return '"' + string + '"';
      }
    },


    /**
     * This method parses a JSON text to produce an object or array.
     * It can throw a SyntaxError exception.
     *
     * @param text {String} JSON string to parse
     *
     * @param reviver {Function?} Optional reviver function to filter and
     *    transform the results
     *
     * @return {Object} The parsed JSON object
     *
     * @lint ignoreDeprecated(eval)
     */
    parse : function(text, reviver)
    {
      var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      cx.lastIndex = 0;

      // Parsing happens in four stages. In the first stage, we replace certain
      // Unicode characters with escape sequences. JavaScript handles many characters
      // incorrectly, either silently deleting them, or treating them as line endings.
      if (cx.test(text))
      {
        text = text.replace(cx, function (a) {
          return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      // In the second stage, we run the text against regular expressions that look
      // for non-JSON patterns. We are especially concerned with '()' and 'new'
      // because they can cause invocation, and '=' because it can cause mutation.
      // But just to be safe, we want to reject all unexpected forms.

      // We split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines. First we
      // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
      // replace all simple value tokens with ']' characters. Third, we delete all
      // open brackets that follow a colon or comma or that begin the text. Finally,
      // we look to see that the remaining characters are only whitespace or ']' or
      // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
      if (
        /^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
          replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
          replace(/(?:^|:|,)(?:\s*\[)+/g, ''))
      ) {
        // In the third stage we use the eval function to compile the text into a
        // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
        // in JavaScript: it can begin a block or an object literal. We wrap the text
        // in parens to eliminate the ambiguity.
        var j = eval('(' + text + ')');

        // In the optional fourth stage, we recursively walk the new structure, passing
        // each name/value pair to a reviver function for possible transformation.
        return typeof reviver === 'function' ?  this.__walk({'': j}, '', reviver) : j;
      }

      // If the text is not JSON parseable, then a SyntaxError is thrown.
      throw new SyntaxError('JSON.parse');
    },


    /**
     * The walk method is used to recursively walk the resulting structure so
     * that modifications can be made.
     *
     * @param holder {Object} the root object
     * @param key {String} walk holder[key]
     * @param reviver {Function} callback, which is called on every node.
     */
    __walk : function(holder, key, reviver)
    {
      var value = holder[key];
      if (value && typeof value === 'object')
      {
        for (var k in value)
        {
          if (Object.hasOwnProperty.call(value, k))
          {
            var v = this.__walk(value, k, reviver);
            if (v !== undefined) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }
      return reviver.call(holder, key, value);
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The GlobalError class stores a reference to a global error handler function.
 *
 *  This function is called for each uncatched JavaScript exception. To enable
 *  global error handling the setting <code>qx.globalErrorHandling</code> must
 *  be enabled and an error handler must be registered.
 *  Further each JavaScript "entry point" must be wrapped with a call to
 *  {@link qx.event.GlobalError#observeMethod}.
 */
qx.Bootstrap.define("qx.event.GlobalError",
{
  statics :
  {
    /**
     * Set the global fallback error handler
     *
     * @param callback {Function} The error handler. The first argument is the
     *    exception, which caused the error
     * @param context {Object} The "this" context of the callback function
     */
    setErrorHandler : function(callback, context)
    {
      this.__callback = callback || null;
      this.__context = context || window;

      if (qx.core.Environment.get("qx.globalErrorHandling"))
      {
        // wrap the original onerror
        if (callback && window.onerror) {
          var wrappedHandler = qx.Bootstrap.bind(this.__onErrorWindow, this);
          if (this.__originalOnError == null) {
            this.__originalOnError = window.onerror;
          }
          var self = this;
          window.onerror = function(msg, uri, lineNumber) {
            self.__originalOnError(msg, uri, lineNumber);
            wrappedHandler(msg, uri, lineNumber);
          };
        }

        if (callback && !window.onerror) {
          window.onerror = qx.Bootstrap.bind(this.__onErrorWindow, this);
        }

        // reset
        if (this.__callback == null) {
          if (this.__originalOnError != null) {
            window.onerror = this.__originalOnError;
            this.__originalOnError = null;
          } else {
            window.onerror = null;
          }
        }
      }
    },


    /**
     * Catches all errors of the <code>window.onerror</code> handler
     * and passes an {@link qx.core.WindowError} object to the error
     * handling.
     *
     * @param msg {String} browser error message
     * @param uri {String} uri to errornous script
     * @param lineNumber {Integer} line number of error
     */
    __onErrorWindow : function(msg, uri, lineNumber)
    {
      if (this.__callback)
      {
        this.handleError(new qx.core.WindowError(msg, uri, lineNumber));
        return true;
      }
    },


    /**
     * Wraps a method with error handling code. Only methods, which are called
     * directly by the browser (e.g. event handler) should be wrapped.
     *
     * @param method {Function} method to wrap
     * @return {Function} The function wrapped with error handling code
     */
    observeMethod : function(method)
    {
      if (qx.core.Environment.get("qx.globalErrorHandling"))
      {
        var self = this;
        return function()
        {
          if (!self.__callback) {
            return method.apply(this, arguments);
          }

          try {
            return method.apply(this, arguments);
          } catch(ex) {
            self.handleError(new qx.core.GlobalError(ex, arguments));
         }
        };
      }
      else
      {
        return method;
      }
    },


    /**
     * Delegates every given exception to the registered error handler
     *
     * @param ex {qx.core.WindowError|exception} Exception to delegate
     */
    handleError : function(ex)
    {
      if (this.__callback) {
        this.__callback.call(this.__context, ex);
      }
    }
  },


  defer : function(statics)
  {
    qx.core.Environment.add("qx.globalErrorHandling", true);
    statics.setErrorHandler(null, null);
    // @deprecated since 1.4
    qx.core.Setting.defineDeprecated("qx.globalErrorHandling", "on");
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
   ________________________________________________________________________

   This class contains code based on the following work:

    http://www.JSON.org/json2.js
    2009-06-29

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html

************************************************************************ */

/**
 * JSON (JavaScript Object Notation) parser, serializer for qooxdoo
 *
 * This class implements EcmaScript 3.1 JSON support.
 *
 * http://wiki.ecmascript.org/doku.php?id=es3.1:json_support
 *
 * If the browser supports native JSON the browser implementation is used.
 */
qx.Class.define("qx.lang.Json",
{
  statics :
  {
    /**
     * {JSON} The JSON object to use. If the browser has native JSON support
     *   this member points to <code>window.JSON</code>. Otherwise it points to
     *   the qooxdoo implementation {@link JsonImpl}.
     */
    JSON : (
      qx.lang.Type.getClass(window.JSON) == "JSON" &&
      JSON.parse('{"x":1}').x === 1
    ) ? window.JSON : new qx.lang.JsonImpl(),

    /**
     * This method produces a JSON text from a JavaScript value.
     *
     * When an object value is found, if the object contains a toJSON
     * method, its toJSON method will be called and the result will be
     * stringified. A toJSON method does not serialize: it returns the
     * value represented by the name/value pair that should be serialized,
     * or undefined if nothing should be serialized. The toJSON method
     * will be passed the key associated with the value, and this will be
     * bound to the object holding the key.
     *
     * For example, this would serialize Dates as ISO strings.
     *
     * <pre class="javascript">
     *     Date.prototype.toJSON = function (key) {
     *         function f(n) {
     *             // Format integers to have at least two digits.
     *             return n < 10 ? '0' + n : n;
     *         }
     *
     *         return this.getUTCFullYear()   + '-' +
     *              f(this.getUTCMonth() + 1) + '-' +
     *              f(this.getUTCDate())      + 'T' +
     *              f(this.getUTCHours())     + ':' +
     *              f(this.getUTCMinutes())   + ':' +
     *              f(this.getUTCSeconds())   + 'Z';
     *     };
     * </pre>
     *
     * You can provide an optional replacer method. It will be passed the
     * key and value of each member, with this bound to the containing
     * object. The value that is returned from your method will be
     * serialized. If your method returns undefined, then the member will
     * be excluded from the serialization.
     *
     * If the replacer parameter is an array of strings, then it will be
     * used to select the members to be serialized. It filters the results
     * such that only members with keys listed in the replacer array are
     * stringified.
     *
     * Values that do not have JSON representations, such as undefined or
     * functions, will not be serialized. Such values in objects will be
     * dropped; in arrays they will be replaced with null. You can use
     * a replacer function to replace those with JSON values.
     * JSON.stringify(undefined) returns undefined.
     *
     * The optional space parameter produces a stringification of the
     * value that is filled with line breaks and indentation to make it
     * easier to read.
     *
     * If the space parameter is a non-empty string, then that string will
     * be used for indentation. If the space parameter is a number, then
     * the indentation will be that many spaces.
     *
     * Example:
     *
     * <pre class="javascript">
     * text = JSON.stringify(['e', {pluribus: 'unum'}]);
     * // text is '["e",{"pluribus":"unum"}]'
     *
     *
     * text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
     * // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
     *
     * text = JSON.stringify([new Date()], function (key, value) {
     *     return this[key] instanceof Date ?
     *         'Date(' + this[key] + ')' : value;
     * });
     * // text is '["Date(---current time---)"]'
     * </pre>
     *
     * @signature function(value, replacer, space)
     *
     * @param value {var} any JavaScript value, usually an object or array.
     *
     * @param replacer {Function?} an optional parameter that determines how
     *    object values are stringified for objects. It can be a function or an
     *    array of strings.
     *
     * @param space {String?} an optional parameter that specifies the
     *    indentation of nested structures. If it is omitted, the text will
     *    be packed without extra whitespace. If it is a number, it will specify
     *    the number of spaces to indent at each level. If it is a string
     *    (such as '\t' or '&nbsp;'), it contains the characters used to indent
     *    at each level.
     *
     * @return {String} The JSON string of the value
     */
    stringify : null, // will be set in the defer block


    /**
     * This method parses a JSON text to produce an object or array.
     * It can throw a SyntaxError exception.
     *
     * The optional reviver parameter is a function that can filter and
     * transform the results. It receives each of the keys and values,
     * and its return value is used instead of the original value.
     * If it returns what it received, then the structure is not modified.
     * If it returns undefined then the member is deleted.
     *
     * Example:
     *
     * <pre class="javascript">
     * // Parse the text. Values that look like ISO date strings will
     * // be converted to Date objects.
     *
     * myData = JSON.parse(text, function (key, value)
     * {
     *   if (typeof value === 'string')
     *   {
     *     var a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
     *     if (a) {
     *       return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
     *     }
     *   }
     *   return value;
     * });
     *
     * myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
     *     var d;
     *     if (typeof value === 'string' &&
     *             value.slice(0, 5) === 'Date(' &&
     *             value.slice(-1) === ')') {
     *         d = new Date(value.slice(5, -1));
     *         if (d) {
     *             return d;
     *         }
     *     }
     *     return value;
     * });
     * </pre>
     *
     * @signature function(text, reviver)
     *
     * @param text {String} JSON string to parse
     *
     * @param reviver {Function?} Optional reviver function to filter and
     *    transform the results
     *
     * @return {Object} The parsed JSON object
     */
    parse : null // will be set in the defer block
  },


  defer : function(statics)
  {
    statics.stringify = statics.JSON.stringify;
    statics.parse = statics.JSON.parse;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This exception is thrown by the {@link qx.event.GlobalError} handler if a
 * <code>window.onerror</code> event occurs in the browser.
 */
qx.Bootstrap.define("qx.core.WindowError",
{
  extend : Error,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param failMessage {String} The error message
   * @param uri {String} URI where error was raised
   * @param lineNumber {Integer} The line number where the error was raised
   */
  construct : function(failMessage, uri, lineNumber)
  {
    Error.call(this, failMessage);

    this.__failMessage = failMessage;
    this.__uri = uri || "";
    this.__lineNumber = lineNumber === undefined ? -1 : lineNumber;
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __failMessage : null,
    __uri : null,
    __lineNumber : null,


    /**
     * Returns the error message.
     *
     * @return {String} error message
     */
    toString : function() {
      return this.__failMessage;
    },


    /**
     * Get the URI where error was raised
     *
     * @return {String} URI where error was raised
     */
    getUri : function() {
      return this.__uri;
    },


    /**
     * Get the line number where the error was raised
     *
     * @return {Integer} The line number where the error was raised
     */
    getLineNumber : function() {
      return this.__lineNumber;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * A validation Error which should be thrown if a validation fails.
 */
qx.Class.define("qx.core.ValidationError",
{
    extend : qx.type.BaseError
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Event handler Interface.
 *
 * All custom event handler like mouse or keyboard event handler must implement
 * this interface.
 */
qx.Interface.define("qx.event.IEventHandler",
{
  statics :
  {
    /** {Integer} The event target must be a dom node */
    TARGET_DOMNODE: 1,

    /** {Integer} The event target must be a window object */
    TARGET_WINDOW : 2,

    /** {Integer} The event target must be a qooxdoo object */
    TARGET_OBJECT: 4,

    /** {Integer} The event target must be a document node */
    TARGET_DOCUMENT: 8
  },


  members :
  {
    /**
     * Whether the event handler can handle events of the given type. If the
     * event handler class has a static variable called <code>IGNORE_CAN_HANDLE</code>
     * with the value <code>true</code> this function is not called. Whether the
     * handler can handle the event is them only determined by the static variables
     * <code>SUPPORTED_TYPES</code> and <code>TARGET_CHECK</code>.
     *
     * @param target {var} The target to, which the event handler should
     *     be attached
     * @param type {String} event type
     * @return {Boolean} Whether the event handler can handle events of the
     *     given type.
     */
    canHandleEvent : function(target, type) {},


    /**
     * This method is called each time an event listener, for one of the
     * supported events, is added using {@link qx.event.Manager#addListener}.
     *
     * @param target {var} The target to, which the event handler should
     *     be attached
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     */
    registerEvent : function(target, type, capture) {},


    /**
     * This method is called each time an event listener, for one of the
     * supported events, is removed by using {@link qx.event.Manager#removeListener}
     * and no other event listener is listening on this type.
     *
     * @param target {var} The target from, which the event handler should
     *     be removed
     * @param type {String} event type
     * @param capture {Boolean} Whether to attach the event to the
     *         capturing phase or the bubbling phase of the event.
     */
    unregisterEvent : function(target, type, capture) {}
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     Simon Bull

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Simon Bull (sbull)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This class manages pooled Object instances.
 *
 * It exists mainly to minimise the amount of browser memory usage by reusing
 * window instances after they have been closed.  However, it could equally be
 * used to pool instances of any type of Object (expect singletons).
 *
 * It is the client's responsibility to ensure that pooled objects are not
 * referenced or used from anywhere else in the application.
 */
qx.Class.define("qx.util.ObjectPool",
{
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param size {Integer} Size of each class pool
   */
  construct : function(size)
  {
    this.base(arguments);

    this.__pool = {};

    if (size != null) {
      this.setSize(size);
    }
  },




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /*
    ---------------------------------------------------------------------------
      PROPERTIES
    ---------------------------------------------------------------------------
    */

    /**
     * Number of objects of each class, which are pooled.
     *
     * A size of "null" represents an unlimited pool.
     */
    size :
    {
      check : "Integer",
      init : Infinity
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** {Map} Stores arrays of instances for all managed classes */
    __pool : null,


    /*
    ---------------------------------------------------------------------------
      IMPL
    ---------------------------------------------------------------------------
    */

    /**
     * This method finds and returns an instance of a requested type in the pool,
     * if there is one.  Note that the pool determines which instance (if any) to
     * return to the client.  The client cannot get a specific instance from the
     * pool.
     *
     * @param clazz {Class} A reference to a class from which an instance should be created.
     * @return {Object} An instance of the requested type. If non existed in the pool a new
     *   one is transparently created and returned.
     */
    getObject : function(clazz)
    {
      if (this.$$disposed) {
        return new clazz;
      }

      if (!clazz) {
        throw new Error("Class needs to be defined!");
      }

      var obj = null;
      var pool = this.__pool[clazz.classname];

      if (pool) {
        obj = pool.pop();
      }

      if (obj) {
        obj.$$pooled = false;
      } else {
        obj = new clazz;
      }

      return obj;
    },


    /**
     * This method places an Object in a pool of Objects of its type. Note that
     * once an instance has been pooled, there is no means to get that exact
     * instance back. The instance may be discarded for garbage collection if
     * the pool of its type is already full.
     *
     * It is assumed that no other references exist to this Object, and that it will
     * not be used at all while it is pooled.
     *
     * @param obj {Object} An Object instance to pool.
     */
    poolObject : function(obj)
    {
      // Dispose check
      if (!this.__pool) {
        return;
      }

      var classname = obj.classname;
      var pool = this.__pool[classname];

      if (obj.$$pooled) {
        throw new Error("Object is already pooled: " + obj);
      }

      if (!pool) {
        this.__pool[classname] = pool = [];
      }

      // Check to see whether the pool for this type is already full
      if (pool.length > this.getSize())
      {
        // Use enhanced destroy() method instead of simple dispose
        // when available to work together with queues etc.
        if (obj.destroy) {
          obj.destroy();
        } else {
          obj.dispose();
        }

        return;
      }

      obj.$$pooled = true;
      pool.push(obj);
    }
  },






  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    var pool = this.__pool;
    var classname, list, i, l;

    for (classname in pool)
    {
      list = pool[classname];
      for (i=0, l=list.length; i<l; i++) {
        list[i].dispose();
      }
    }

    delete this.__pool;
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Central instance pool for event objects. All event objects dispatched by the
 * event loader are pooled using this class.
 */
qx.Class.define("qx.event.Pool",
{
  extend : qx.util.ObjectPool,
  type : "singleton",


  // Even though this class contains almost no code it is required because the
  // legacy code needs a place to patch the event pooling behavior.


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function() {
    this.base(arguments, 30);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

************************************************************************ */

/* ************************************************************************

#optional(qx.log.Logger)
#ignore(qx.log)

************************************************************************ */

/**
 * Methods to cleanup fields from maps/objects.
 */
qx.Class.define("qx.util.DisposeUtil",
{
  statics :
  {
    /**
     * Disconnects and disposes given objects from instance.
     * Only works with qx.core.Object based objects e.g. Widgets.
     *
     * @param obj {Object} Object which contains the fields
     * @param arr {Array} List of fields (which store objects) to dispose
     * @param disposeSingletons {Boolean?} true, if singletons should be disposed
     */
    disposeObjects : function(obj, arr, disposeSingletons)
    {
      var name;
      for (var i=0, l=arr.length; i<l; i++)
      {
        name = arr[i];
        if (obj[name] == null || !obj.hasOwnProperty(name)) {
          continue;
        }

        if (!qx.core.ObjectRegistry.inShutDown)
        {
          if (obj[name].dispose) {
            // singletons
            if (!disposeSingletons && obj[name].constructor.$$instance) {
              throw new Error("The object stored in key " + name + " is a singleton! Please use disposeSingleton instead.");
            } else {
              obj[name].dispose();
            }
          } else {
            throw new Error("Has no disposable object under key: " + name + "!");
          }
        }

        obj[name] = null;
      }
    },


    /**
     * Disposes all members of the given array and deletes
     * the field which refers to the array afterwards.
     *
     * @param obj {Object} Object which contains the field
     * @param field {String} Name of the field which refers to the array
     * @return {void}
     */
    disposeArray : function(obj, field)
    {
      var data = obj[field];
      if (!data) {
        return;
      }

      // Fast path for application shutdown
      if (qx.core.ObjectRegistry.inShutDown)
      {
        obj[field] = null;
        return;
      }

      // Dispose all content
      try
      {
        var entry;
        for (var i=data.length-1; i>=0; i--)
        {
          entry = data[i];
          if (entry) {
            entry.dispose();
          }
        }
      }
      catch(ex) {
        throw new Error("The array field: " + field + " of object: " + obj + " has non disposable entries: " + ex);
      }

      // Reduce array size to zero
      data.length = 0;

      // Finally remove field
      obj[field] = null;
    },


    /**
     * Disposes all members of the given map and deletes
     * the field which refers to the map afterwards.
     *
     * @param obj {Object} Object which contains the field
     * @param field {String} Name of the field which refers to the array
     * @return {void}
     */
    disposeMap : function(obj, field)
    {
      var data = obj[field];
      if (!data) {
        return;
      }

      // Fast path for application shutdown
      if (qx.core.ObjectRegistry.inShutDown)
      {
        obj[field] = null;
        return;
      }

      // Dispose all content
      try
      {
        var entry;
        for (var key in data)
        {
          entry = data[key];
          if (data.hasOwnProperty(key) && entry) {
            entry.dispose();
          }
        }
      }
      catch(ex) {
        throw new Error("The map field: " + field + " of object: " + obj + " has non disposable entries: " + ex);
      }

      // Finally remove field
      obj[field] = null;
    },

    /**
     * Disposes a given object when another object is disposed
     *
     * @param disposeMe {Object} Object to dispose when other object is disposed
     * @param trigger {Object} Other object
     *
     */
    disposeTriggeredBy : function(disposeMe, trigger)
    {
      var triggerDispose = trigger.dispose;
      trigger.dispose = function(){
        triggerDispose.call(trigger);
        disposeMe.dispose();
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * All event dispatchers must implement this interface. Event dispatchers must
 * register themselves at the event Manager using
 * {@link qx.event.Registration#addDispatcher}.
 */
qx.Interface.define("qx.event.IEventDispatcher",
{
  members:
  {
    /**
     * Whether the dispatcher is responsible for the this event.
     *
     * @param target {Element|qx.core.Event} The event dispatch target
     * @param event {qx.event.type.Event} The event object
     * @param type {String} the event type
     * @return {Boolean} Whether the event dispatcher is responsible for the this event
     */
    canDispatchEvent : function(target, event, type)
    {
      this.assertInstance(event, qx.event.type.Event);
      this.assertString(type);
    },


    /**
     * This function dispatches the event to the event listeners.
     *
     * @param target {Element|qx.core.Event} The event dispatch target
     * @param event {qx.event.type.Event} event object to dispatch
     * @param type {String} the event type
     */
    dispatchEvent : function(target, event, type)
    {
      this.assertInstance(event, qx.event.type.Event);
      this.assertString(type);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Dispatches events directly on the event target (no bubbling nor capturing).
 */
qx.Class.define("qx.event.dispatch.Direct",
{
  extend : qx.core.Object,
  implement : qx.event.IEventDispatcher,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */


  /**
   * Create a new instance
   *
   * @param manager {qx.event.Manager} Event manager for the window to use
   */
  construct : function(manager) {
    this._manager = manager;
  },






  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} Priority of this dispatcher */
    PRIORITY : qx.event.Registration.PRIORITY_LAST
  },






  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      EVENT DISPATCHER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canDispatchEvent : function(target, event, type) {
      return !event.getBubbles();
    },


    // interface implementation
    dispatchEvent : function(target, event, type)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (target instanceof qx.core.Object)
        {
          var expectedEventClassName = qx.Class.getEventType(target.constructor, type);
          var expectedEventClass = qx.Class.getByName(expectedEventClassName);
          if (!expectedEventClass)
          {
            this.error(
              "The event type '" + type + "' declared in the class '" +
              target.constructor + " is not an available class': " +
              expectedEventClassName
            );
          }
          else if (!(event instanceof expectedEventClass))
          {
            this.error(
              "Expected event type to be instanceof '" + expectedEventClassName +
              "' but found '" + event.classname + "'"
            );
          }
        }
      }

      event.setEventPhase(qx.event.type.Event.AT_TARGET);

      var listeners = this._manager.getListeners(target, type, false);
      if (listeners)
      {
        for (var i=0, l=listeners.length; i<l; i++)
        {
          var context = listeners[i].context || target;

          if (qx.core.Environment.get("qx.debug")) {
            // warn if the context is disposed
            if (context && context.isDisposed && context.isDisposed()) {
              this.warn(
                "The context object '" + context + "' for the event '" +
                type + "' of '" + target + "'is already disposed."
              );
            }
          }

          listeners[i].handler.call(context, event);
        }
      }
    }
  },



  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addDispatcher(statics);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * This class provides qooxdoo object event support.
 */
qx.Class.define("qx.event.handler.Object",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_LAST,

    /** {Map} Supported event types */
    SUPPORTED_TYPES : null,

    /** {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_OBJECT,

    /** {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : false
  },





  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /*
    ---------------------------------------------------------------------------
      EVENT HANDLER INTERFACE
    ---------------------------------------------------------------------------
    */

    // interface implementation
    canHandleEvent : function(target, type) {
      return qx.Class.supportsEvent(target.constructor, type);
    },


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    }
  },






  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    qx.event.Registration.addHandler(statics);
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/* ************************************************************************

#require(qx.lang.Core)

************************************************************************ */

/**
 * Support string/array generics as introduced with JavaScript 1.6 for
 * all browsers.
 *
 * http://developer.mozilla.org/en/docs/New_in_JavaScript_1.6#Array_and_String_generics
 *
 * *Array*
 *
 * * join
 * * reverse
 * * sort
 * * push
 * * pop
 * * shift
 * * unshift
 * * splice
 * * concat
 * * slice
 * * indexOf
 * * lastIndexOf
 * * forEach
 * * map
 * * filter
 * * some
 * * every
 *
 * *String*
 *
 * * quote
 * * substring
 * * toLowerCase
 * * toUpperCase
 * * charAt
 * * charCodeAt
 * * indexOf
 * * lastIndexOf
 * * toLocaleLowerCase
 * * toLocaleUpperCase
 * * localeCompare
 * * match
 * * search
 * * replace
 * * split
 * * substr
 * * concat
 * * slice
 */
qx.Class.define("qx.lang.Generics",
{
  statics :
  {
    /** Which methods to map */
    __map :
    {
      "Array" : [ "join", "reverse", "sort", "push", "pop", "shift", "unshift", "splice", "concat", "slice", "indexOf", "lastIndexOf", "forEach", "map", "filter", "some", "every" ],
      "String" : [ "quote", "substring", "toLowerCase", "toUpperCase", "charAt", "charCodeAt", "indexOf", "lastIndexOf", "toLocaleLowerCase", "toLocaleUpperCase", "localeCompare", "match", "search", "replace", "split", "substr", "concat", "slice" ]
    },


    /**
     * Make a method of an object generic and return the generic functions.
     * The generic function takes as first parameter the object the method operates on.
     *
     * TODO: maybe mode this function to qx.lang.Function
     *
     * @param obj {Object} the object in which prototype the function is defined.
     * @param func {String} name of the method to wrap.
     * @return {Function} wrapped method. This function takes as first argument an
     *         instance of obj and as following arguments the arguments of the original method.
     */
    __wrap : function(obj, func)
    {
      return function(s) {
        return obj.prototype[func].apply(s, Array.prototype.slice.call(arguments, 1));
      };
    },


    /**
     * Initialize all generic functions as defined in JavaScript 1.6.
     *
     * @return {void}
     */
    __init : function()
    {
      var map = qx.lang.Generics.__map;

      for (var key in map)
      {
        var obj = window[key];
        var arr = map[key];

        for (var i=0, l=arr.length; i<l; i++)
        {
          var func = arr[i];

          if (!obj[func]) {
            obj[func] = qx.lang.Generics.__wrap(obj, func);
          }
        }
      }
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */

  defer : function(statics) {
    statics.__init();
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2009 Sebastian Werner, http://sebastian-werner.net

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)

   ======================================================================

   This class contains code based on the following work:

   * jQuery
     http://jquery.com
     Version 1.3.1

     Copyright:
       2009 John Resig

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

************************************************************************ */

/**
 * Helper functions for dates.
 *
 * The native JavaScript Date is not modified by this class.
 */
qx.Class.define("qx.lang.Date",
{
  statics :
  {
    /**
     * Returns the current time
     *
     * @return {Integer} Time in ms from 1970.
     */
    now : function() {
      return +new Date;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Sebastian Werner (wpbasti)
   * Andreas Ecker (ecker)
   * Fabian Jakobs (fjakobs)
   * Alexander Back (aback)
   * Martin Wittemann (martinwittemann)

************************************************************************* */

/* ************************************************************************

#asset(qx/icon/Tango/16/places/folder-open.png)
#asset(qx/icon/Tango/16/places/folder.png)
#asset(qx/icon/Tango/16/mimetypes/office-document.png)

#asset(qx/icon/Tango/16/actions/window-close.png)

#asset(qx/icon/Tango/22/places/folder-open.png)
#asset(qx/icon/Tango/22/places/folder.png)
#asset(qx/icon/Tango/22/mimetypes/office-document.png)

#asset(qx/icon/Tango/32/places/folder-open.png)
#asset(qx/icon/Tango/32/places/folder.png)
#asset(qx/icon/Tango/32/mimetypes/office-document.png)

#asset(qx/icon/Tango/16/apps/office-calendar.png)
#asset(qx/icon/Tango/16/apps/utilities-color-chooser.png)
#asset(qx/icon/Tango/16/actions/view-refresh.png)

#asset(qx/icon/Tango/16/actions/dialog-cancel.png)
#asset(qx/icon/Tango/16/actions/dialog-ok.png)

#asset(qx/decoration/Modern/*)

************************************************************************* */

/**
 * The modern appearance theme.
 */
qx.Theme.define("qx.theme.modern.Appearance",
{
  appearances :
  {
    /*
    ---------------------------------------------------------------------------
      CORE
    ---------------------------------------------------------------------------
    */

    "widget" : {},

    "root" :
    {
      style : function(states)
      {
        return {
          backgroundColor : "background-application",
          textColor       : "text-label",
          font            : "default"
        };
      }
    },

    "label" :
    {
      style : function(states)
      {
        return {
          textColor : states.disabled ? "text-disabled" : undefined
        };
      }
    },

    "move-frame" :
    {
      style : function(states)
      {
        return {
          decorator : "main"
        };
      }
    },

    "resize-frame" : "move-frame",

    "dragdrop-cursor" :
    {
      style : function(states)
      {
        var icon = "nodrop";

        if (states.copy) {
          icon = "copy";
        } else if (states.move) {
          icon = "move";
        } else if (states.alias) {
          icon = "alias";
        }

        return {
          source : "decoration/cursors/" + icon + ".gif",
          position : "right-top",
          offset : [ 2, 16, 2, 6 ]
        };
      }
    },

    "image" :
    {
      style : function(states)
      {
        return {
          opacity : !states.replacement && states.disabled ? 0.3 : 1
        };
      }
    },

    "atom" : {},
    "atom/label" : "label",
    "atom/icon" : "image",

    "popup" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.boxshadow");

        return {
          decorator : useCSS ? "popup-css" : "main",
          backgroundColor : "background-light",
          shadow : useCSS ? undefined : "shadow-popup"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      BUTTON
    ---------------------------------------------------------------------------
    */

    "button-frame" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator, textColor;
        var padding = [3, 9]; // default padding css-case

        if (states.checked && states.focused && !states.inner)
        {
          decorator = "button-checked-focused";
          textColor = undefined;
          padding = [1, 7];
        }
        else if (states.disabled)
        {
          decorator = "button-disabled";
          textColor = undefined;
        }
        else if (states.pressed)
        {
          decorator = "button-pressed";
          textColor = "text-hovered";
        }
        else if (states.checked)
        {
          decorator = "button-checked";
          textColor = undefined;
        }
        else if (states.hovered)
        {
          decorator = "button-hovered";
          textColor = "text-hovered";
        }
        else if (states.focused && !states.inner)
        {
          decorator = "button-focused";
          textColor = undefined;
          padding = [1, 7];
        }
        else
        {
          decorator = "button";
          textColor = undefined;
        }

        var shadow;
        // feature detect if we should use the CSS decorators
        if (qx.core.Environment.get("css.borderradius") &&
            qx.core.Environment.get("css.gradients")) {
          if (states.invalid && !states.disabled) {
            decorator += "-invalid-css";
          } else {
            decorator += "-css";
          }
        } else {
          shadow = states.invalid && !states.disabled ? "button-invalid-shadow" : undefined;
          padding = [2, 8];
        }

        return {
          decorator : decorator,
          textColor : textColor,
          shadow : shadow,
          padding : padding,
          margin : [1, 0]
        };
      }
    },

    "button-frame/image" :
    {
      style : function(states)
      {
        return {
          opacity : !states.replacement && states.disabled ? 0.5 : 1
        };
      }
    },

    "button" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states)
      {
        return {
          center : true
        };
      }
    },

    "hover-button" :
    {
      alias : "atom",
      include : "atom",

      style : function(states)
      {
        var decorator = states.hovered ? "selected" : undefined;
        if (decorator && qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }
        return {
          decorator : decorator,
          textColor : states.hovered ? "text-selected" : undefined
        };
      }
    },

    "splitbutton" : {},
    "splitbutton/button" : "button",
    "splitbutton/arrow" :
    {
      alias : "button",
      include : "button",

      style : function(states, superStyles)
      {
        return {
          icon : "decoration/arrows/down.png",
          padding : [superStyles.padding[0], superStyles.padding[1] - 6],
          marginLeft : 1
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      FORM FIELDS
    ---------------------------------------------------------------------------
    */

    "checkbox":
    {
      alias : "atom",

      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");

        var icon;
        if (useCSS) {
          if (states.checked) {
            icon = "decoration/form/checked.png";
          } else if (states.undetermined) {
            icon = "decoration/form/undetermined.png";
          } else {
            icon = "qx/static/blank.gif";
          }

        } else {
          // The "disabled" icon is set to an icon **without** the -disabled
          // suffix on purpose. This is because the Image widget handles this
          // already by replacing the current image with a disabled version
          // (if available). If no disabled image is found, the opacity style
          // is used.

          // Checked
          if (states.checked) {
            if (states.disabled) {
              icon = "checkbox-checked";
            } else if (states.focused) {
              icon = "checkbox-checked-focused";
            } else if (states.pressed) {
              icon = "checkbox-checked-pressed";
            } else if (states.hovered) {
              icon = "checkbox-checked-hovered";
            } else {
              icon = "checkbox-checked";
            }

          // Undetermined
          } else if (states.undetermined) {
            if (states.disabled) {
              icon = "checkbox-undetermined";
            } else if (states.focused) {
              icon = "checkbox-undetermined-focused";
            } else if (states.hovered) {
              icon = "checkbox-undetermined-hovered";
            } else {
              icon = "checkbox-undetermined";
            }

          // Focused & Pressed & Hovered (when enabled)
          } else if (!states.disabled) {
            if (states.focused) {
              icon = "checkbox-focused";
            } else if (states.pressed) {
              icon = "checkbox-pressed";
            } else if (states.hovered ) {
              icon = "checkbox-hovered";
            }
          }

          // Unchecked
          icon = icon || "checkbox";

          var invalid = states.invalid && !states.disabled ? "-invalid" : "";
          icon = "decoration/form/" + icon + invalid + ".png";
        }

        return {
          icon: icon,
          minWidth : useCSS ? 14 : undefined, // ensure that we have the old padding
          gap: useCSS ? 8 : 6 // use a bigger gap because of the shadow (glow)
        };
      }
    },

    "checkbox/icon" : {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");
        if (!useCSS) {
          // same as image
          return {opacity : !states.replacement && states.disabled ? 0.3 : 1};
        }

        var decorator;

        if (states.disabled) {
          decorator = "checkbox-disabled";
        } else if (states.focused) {
          decorator = "checkbox-focused";
        } else if (states.hovered) {
          decorator = "checkbox-hovered";
        } else {
          decorator = "checkbox";
        }

        decorator += states.invalid && !states.disabled ? "-invalid" : "";

        var padding;
        // Undetermined
        if (states.undetermined) {
          padding = [2, 0];
        }

        return {
          decorator : decorator,
          padding : padding,
          width: 12, // use 12 to allow the inset of the decorator to be applied
          height: 10
        }
      }
    },

    "radiobutton":
    {
      alias : "atom",

      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.boxshadow");

        var icon;
        if (useCSS) {
          icon = "qx/static/blank.gif";
        } else {
          // "disabled" state is not handled here with purpose. The image widget
          // does handle this already by replacing the current image with a
          // disabled version (if available). If no disabled image is found the
          // opacity style is used.
          if (states.checked && states.focused) {
            icon = "radiobutton-checked-focused";
          } else if (states.checked && states.disabled) {
            icon = "radiobutton-checked-disabled";
          } else if (states.checked && states.hovered) {
            icon = "radiobutton-checked-hovered";
          } else if (states.checked) {
            icon = "radiobutton-checked";
          } else if (states.focused) {
            icon = "radiobutton-focused";
          } else if (states.hovered) {
            icon = "radiobutton-hovered";
          } else {
            icon = "radiobutton";
          }

          var invalid = states.invalid && !states.disabled ? "-invalid" : "";
          icon = "decoration/form/" + icon + invalid + ".png";
        }
        return {
          icon: icon,
          gap : useCSS ? 8 : 6 // use a bigger gap because of the shadow (glow)
        };
      }
    },

    "radiobutton/icon" : {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.boxshadow");
        if (!useCSS) {
          // same as image
          return {opacity : !states.replacement && states.disabled ? 0.3 : 1};
        }

        var decorator;

        if (states.disabled && !states.checked) {
          decorator = "radiobutton-disabled";
        } else if (states.checked && states.focused) {
          decorator = "radiobutton-checked-focused";
        } else if (states.checked && states.disabled) {
          decorator = "radiobutton-checked-disabled";
        } else if (states.checked && states.hovered) {
          decorator = "radiobutton-checked-hovered";
        } else if (states.checked) {
          decorator = "radiobutton-checked";
        } else if (states.focused) {
          decorator = "radiobutton-focused";
        } else if (states.hovered) {
          decorator = "radiobutton-hovered";
        } else {
          decorator = "radiobutton";
        }

        decorator += states.invalid && !states.disabled ? "-invalid" : "";

        return {
          decorator : decorator,
          width: 12, // use 12 to allow the inset of the decorator to be applied
          height: 10
        }
      }
    },

    "textfield" :
    {
      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        var textColor;
        if (states.disabled) {
          textColor = "text-disabled";
        } else if (states.showingPlaceholder) {
          textColor = "text-placeholder";
        } else {
          textColor = "text-input";
        }

        return {
          decorator : decorator,
          padding : [ 2, 4, 1 ],
          textColor : textColor
        };
      }
    },

    "textarea" :
    {
      include : "textfield",

      style : function(states)
      {
        return {
          padding   : 4
        };
      }
    },




    /*
    ---------------------------------------------------------------------------
      SPINNER
    ---------------------------------------------------------------------------
    */

    "spinner" :
    {
      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator : decorator
        };
      }
    },

    "spinner/textfield" :
    {
      style : function(states)
      {
        return {
          marginRight: 2,
          padding: [2, 4, 1],
          textColor: states.disabled ? "text-disabled" : "text-input"
        };
      }
    },

    "spinner/upbutton" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states, superStyles)
      {
        return {
          icon : "decoration/arrows/up-small.png",
          padding : [superStyles.padding[0] - 1, superStyles.padding[1] - 5],
          shadow: undefined
        };
      }
    },

    "spinner/downbutton" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states, superStyles)
      {
        return {
          icon : "decoration/arrows/down-small.png",
          padding : [superStyles.padding[0] - 1, superStyles.padding[1] - 5],
          shadow: undefined
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      DATEFIELD
    ---------------------------------------------------------------------------
    */

    "datefield" : "combobox",

    "datefield/button" :
    {
      alias : "combobox/button",
      include : "combobox/button",

      style : function(states)
      {
        return {
          icon : "icon/16/apps/office-calendar.png",
          padding : [0, 3],
          decorator : undefined
        };
      }
    },

    "datefield/textfield" : "combobox/textfield",

    "datefield/list" :
    {
      alias : "datechooser",
      include : "datechooser",

      style : function(states)
      {
        return {
          decorator : undefined
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      GROUP BOX
    ---------------------------------------------------------------------------
    */

    "groupbox" :
    {
      style : function(states)
      {
        return {
          legendPosition : "top"
        };
      }
    },

    "groupbox/legend" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          padding   : [1, 0, 1, 4],
          textColor : states.invalid ? "invalid" : "text-title",
          font      : "bold"
        };
      }
    },

    "groupbox/frame" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius");
        return {
          padding : useCSS ? 10 : 12,
          margin : useCSS ? 1 : undefined,
          decorator : useCSS ? "group-css" : "group"
        };
      }
    },


    "check-groupbox" : "groupbox",

    "check-groupbox/legend" :
    {
      alias : "checkbox",
      include : "checkbox",

      style : function(states)
      {
        return {
          padding   : [1, 0, 1, 4],
          textColor : states.invalid ? "invalid" : "text-title",
          font      : "bold"
        };
      }
    },

    "radio-groupbox" : "groupbox",

    "radio-groupbox/legend" :
    {
      alias : "radiobutton",
      include : "radiobutton",

      style : function(states)
      {
        return {
          padding   : [1, 0, 1, 4],
          textColor : states.invalid ? "invalid" : "text-title",
          font      : "bold"
        };
      }
    },






    /*
    ---------------------------------------------------------------------------
      SCROLLAREA
    ---------------------------------------------------------------------------
    */

    "scrollarea" :
    {
      style : function(states)
      {
        return {
          // since the scroll container disregards the min size of the scrollbars
          // we have to set the min size of the scroll area to ensure that the
          // scrollbars always have an usable size.
          minWidth : 50,
          minHeight : 50
        };
      }
    },

    "scrollarea/corner" :
    {
      style : function(states)
      {
        return {
          backgroundColor : "background-application"
        };
      }
    },

    "scrollarea/pane" : "widget",
    "scrollarea/scrollbar-x" : "scrollbar",
    "scrollarea/scrollbar-y" : "scrollbar",






    /*
    ---------------------------------------------------------------------------
      SCROLLBAR
    ---------------------------------------------------------------------------
    */

    "scrollbar" :
    {
      style : function(states)
      {
        if (states["native"]) {
          return {};
        }

        var useCSS = qx.core.Environment.get("css.gradients");
        var decorator = states.horizontal ? "scrollbar-horizontal" : "scrollbar-vertical";
        if (useCSS) {
          decorator += "-css";
        }

        return {
          width     : states.horizontal ? undefined : 16,
          height    : states.horizontal ? 16 : undefined,
          decorator : decorator,
          padding   : 1
        };
      }
    },

    "scrollbar/slider" :
    {
      alias : "slider",

      style : function(states)
      {
        return {
          padding : states.horizontal ? [0, 1, 0, 1] : [1, 0, 1, 0]
        };
      }
    },

    "scrollbar/slider/knob" :
    {
      include : "button-frame",

      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients");

        var decorator = states.horizontal ? "scrollbar-slider-horizontal" :
                                            "scrollbar-slider-vertical";
        if (states.disabled) {
          decorator += "-disabled";
        }
        if (useCSS) {
          decorator += "-css";
        }

        return {
          decorator : decorator,
          minHeight : states.horizontal ? undefined : 9,
          minWidth  : states.horizontal ? 9 : undefined,
          padding : undefined
        };
      }
    },

    "scrollbar/button" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states)
      {
        var icon = "decoration/scrollbar/scrollbar-";
        if (states.left) {
          icon += "left.png";
        } else if (states.right) {
          icon += "right.png";
        } else if (states.up) {
          icon += "up.png";
        } else {
          icon += "down.png";
        }

        var useCSS = qx.core.Environment.get("css.gradients");

        if (states.left || states.right)
        {
          var paddingLeft = states.left ? 3 : 4;
          return {
            padding : useCSS ? [3, 0, 3, paddingLeft] : [2, 0, 2, paddingLeft],
            icon : icon,
            width: 15,
            height: 14
          };
        }
        else
        {

          return {
            padding : useCSS ? 3 : [3, 2],
            icon : icon,
            width: 14,
            height: 15
          };
        }
      }
    },

    "scrollbar/button-begin" : "scrollbar/button",
    "scrollbar/button-end" : "scrollbar/button",





    /*
    ---------------------------------------------------------------------------
      SLIDER
    ---------------------------------------------------------------------------
    */

    "slider" :
    {
      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator : decorator
        };
      }
    },

    "slider/knob" :
    {
      include : "button-frame",

      style : function(states)
      {
        return {
          decorator : states.disabled ? "scrollbar-slider-horizontal-disabled" :
                                        "scrollbar-slider-horizontal",
          shadow: undefined,
          height : 14,
          width : 14,
          padding: 0
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      LIST
    ---------------------------------------------------------------------------
    */

    "list" :
    {
      alias : "scrollarea",

      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          backgroundColor : "background-light",
          decorator : decorator
        };
      }
    },

    "list/pane" : "widget",

    "listitem" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator;
        if (states.dragover) {
          decorator = states.selected ? "selected-dragover" : "dragover";
        } else {
          decorator = states.selected ? "selected" : undefined;
          if (decorator && qx.core.Environment.get("css.gradients")) {
            decorator += "-css";
          }
        }

        return {
          padding   : states.dragover ? [4, 4, 2, 4] : 4,
          textColor : states.selected ? "text-selected" : undefined,
          decorator : decorator
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      SLIDEBAR
    ---------------------------------------------------------------------------
    */

    "slidebar" : {},
    "slidebar/scrollpane" : {},
    "slidebar/content" : {},

    "slidebar/button-forward" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states)
      {
        return {
          padding : 5,
          center : true,
          icon : states.vertical ?
            "decoration/arrows/down.png" :
            "decoration/arrows/right.png"
        };
      }
    },

    "slidebar/button-backward" :
    {
      alias : "button-frame",
      include : "button-frame",

      style : function(states)
      {
        return {
          padding : 5,
          center : true,
          icon : states.vertical ?
            "decoration/arrows/up.png" :
            "decoration/arrows/left.png"
        };
      }
    },




    /*
    ---------------------------------------------------------------------------
      TABVIEW
    ---------------------------------------------------------------------------
    */

    "tabview" :
    {
      style : function(states)
      {
        return {
          contentPadding : 16
        };
      }
    },

    "tabview/bar" :
    {
      alias : "slidebar",

      style : function(states)
      {
        var result =
        {
          marginBottom : states.barTop ? -1 : 0,
          marginTop : states.barBottom ? -4 : 0,
          marginLeft : states.barRight ? -3 : 0,
          marginRight : states.barLeft ? -1 : 0,
          paddingTop : 0,
          paddingRight : 0,
          paddingBottom : 0,
          paddingLeft : 0
        };

        if (states.barTop || states.barBottom)
        {
          result.paddingLeft = 5;
          result.paddingRight = 7;
        }
        else
        {
          result.paddingTop = 5;
          result.paddingBottom = 7;
        }

        return result;
      }
    },

    "tabview/bar/button-forward" :
    {
      include : "slidebar/button-forward",
      alias : "slidebar/button-forward",

      style : function(states)
      {
        if (states.barTop || states.barBottom)
        {
          return {
            marginTop : 2,
            marginBottom: 2
          };
        }
        else
        {
          return {
            marginLeft : 2,
            marginRight : 2
          };
        }
      }
    },

    "tabview/bar/button-backward" :
    {
      include : "slidebar/button-backward",
      alias : "slidebar/button-backward",

      style : function(states)
      {
        if (states.barTop || states.barBottom)
        {
          return {
            marginTop : 2,
            marginBottom: 2
          };
        }
        else
        {
          return {
            marginLeft : 2,
            marginRight : 2
          };
        }
      }
    },

    "tabview/bar/scrollpane" : {},

    "tabview/pane" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.borderradius");
        return {
          decorator : useCSS ? "tabview-pane-css" : "tabview-pane",
          minHeight : 100,

          marginBottom : states.barBottom ? -1 : 0,
          marginTop : states.barTop ? -1 : 0,
          marginLeft : states.barLeft ? -1 : 0,
          marginRight : states.barRight ? -1 : 0
        };
      }
    },

    "tabview-page" : {
      alias : "widget",
      include : "widget",

      style : function(states) {
        // is used for the padding of the pane
        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.borderradius");
        return {
          padding : useCSS ? [4, 3] : undefined
        }
      }
    },

    "tabview-page/button" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator, padding=0;
        var marginTop=0, marginBottom=0, marginLeft=0, marginRight=0;

        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.boxshadow") &&
          qx.core.Environment.get("css.gradients");

        if (states.checked)
        {
          if (states.barTop)
          {
            decorator = "tabview-page-button-top-active";
            padding = useCSS ? [5, 11] : [ 6, 14 ];
            marginLeft = states.firstTab ? 0 : -5;
            marginRight = states.lastTab ? 0 : -5;
          }
          else if (states.barBottom)
          {
            decorator = "tabview-page-button-bottom-active";
            padding = useCSS ? [5, 11] : [ 6, 14 ];
            marginLeft = states.firstTab ? 0 : -5;
            marginRight = states.lastTab ? 0 : -5;
            marginTop = 3;
          }
          else if (states.barRight)
          {
            decorator = "tabview-page-button-right-active";
            padding = useCSS ? [5, 10] : [ 6, 13 ];
            marginTop = states.firstTab ? 0 : -5;
            marginBottom = states.lastTab ? 0 : -5;
            marginLeft = 2;
          }
          else
          {
            decorator = "tabview-page-button-left-active";
            padding = useCSS ? [5, 10] : [ 6, 13 ];
            marginTop = states.firstTab ? 0 : -5;
            marginBottom = states.lastTab ? 0 : -5;
          }
        }
        else
        {
          if (states.barTop)
          {
            decorator = "tabview-page-button-top-inactive";
            padding = useCSS ? [3, 9] : [ 4, 10 ];
            marginTop = 4;
            marginLeft = states.firstTab ? 5 : 1;
            marginRight = 1;
          }
          else if (states.barBottom)
          {
            decorator = "tabview-page-button-bottom-inactive";
            padding = useCSS ? [3, 9] : [ 4, 10 ];
            marginBottom = 4;
            marginLeft = states.firstTab ? 5 : 1;
            marginRight = 1;
            marginTop = 3;
          }
          else if (states.barRight)
          {
            decorator = "tabview-page-button-right-inactive";
            padding = useCSS ? [3, 9] : [ 4, 10 ];
            marginRight = 5;
            marginTop = states.firstTab ? 5 : 1;
            marginBottom = 1;
            marginLeft = 3;
          }
          else
          {
            decorator = "tabview-page-button-left-inactive";
            padding = useCSS ? [3, 9] : [ 4, 10 ];
            marginLeft = 5;
            marginTop = states.firstTab ? 5 : 1;
            marginBottom = 1;
            marginRight = 1;
          }
        }

        if (decorator && useCSS) {
          decorator += "-css";
        }

        return {
          zIndex : states.checked ? 10 : 5,
          decorator : decorator,
          padding   : padding,
          marginTop : marginTop,
          marginBottom : marginBottom,
          marginLeft : marginLeft,
          marginRight : marginRight,
          textColor : states.checked ? "text-active" : "text-inactive"
        };
      }
    },

    "tabview-page/button/label" :
    {
      alias : "label",

      style : function(states)
      {
        return {
          padding : [0, 1, 0, 1],
          margin : states.focused ? 0 : 1,
          decorator : states.focused ? "keyboard-focus" : undefined
        };
      }
    },

    "tabview-page/button/close-button" :
    {
      alias : "atom",
      style : function(states)
      {
        return {
          icon : "qx/icon/Tango/16/actions/window-close.png"
        };
      }
    },

    /*
    ---------------------------------------------------------------------------
      TOOLBAR
    ---------------------------------------------------------------------------
    */

    "toolbar" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients");
        return {
          decorator : useCSS ? "toolbar-css" : "toolbar",
          spacing : 2
        };
      }
    },

    "toolbar/part" :
    {
      style : function(states)
      {
        return {
          decorator : "toolbar-part",
          spacing : 2
        };
      }
    },

    "toolbar/part/container" :
    {
      style : function(states)
      {
        return {
          paddingLeft : 2,
          paddingRight : 2
        };
      }
    },

    "toolbar/part/handle" :
    {
      style : function(states)
      {
        return {
          source : "decoration/toolbar/toolbar-handle-knob.gif",
          marginLeft : 3,
          marginRight : 3
        };
      }
    },

    "toolbar-button" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator;
        if (
          states.pressed ||
          (states.checked && !states.hovered) ||
          (states.checked && states.disabled))
        {
          decorator = "toolbar-button-checked";
        } else if (states.hovered && !states.disabled) {
          decorator = "toolbar-button-hovered";
        }

        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.borderradius");
        if (useCSS && decorator) {
          decorator += "-css";
        }

        return {
          marginTop : 2,
          marginBottom : 2,
          padding : (states.pressed || states.checked || states.hovered) && !states.disabled
                    || (states.disabled && states.checked) ? 3 : 5,
          decorator : decorator
        };
      }
    },

    "toolbar-menubutton" :
    {
      alias : "toolbar-button",
      include : "toolbar-button",

      style : function(states)
      {
        return {
          showArrow : true
        };
      }
    },

    "toolbar-menubutton/arrow" :
    {
      alias : "image",
      include : "image",

      style : function(states)
      {
        return {
          source : "decoration/arrows/down-small.png"
        };
      }
    },

    "toolbar-splitbutton" :
    {
      style : function(states)
      {
        return {
          marginTop : 2,
          marginBottom : 2
        };
      }
    },

    "toolbar-splitbutton/button" :
    {
      alias : "toolbar-button",
      include : "toolbar-button",

      style : function(states)
      {
        return {
          icon : "decoration/arrows/down.png",
          marginTop : undefined,
          marginBottom : undefined
        };
      }
    },

    "toolbar-splitbutton/arrow" :
    {
      alias : "toolbar-button",
      include : "toolbar-button",

      style : function(states)
      {
        if (states.pressed || states.checked || (states.hovered && !states.disabled)) {
          var padding = 1;
        } else {
          var padding = 3;
        }

        return {
          padding : padding,
          icon : "decoration/arrows/down.png",
          marginTop : undefined,
          marginBottom : undefined
        };
      }
    },

    "toolbar-separator" :
    {
      style : function(states)
      {
        return {
          decorator : "toolbar-separator",
          margin    : 7
        };
      }
    },




    /*
    ---------------------------------------------------------------------------
      TREE
    ---------------------------------------------------------------------------
    */

    "tree" : "list",

    "tree-item" :
    {
      style : function(states)
      {
        var decorator = states.selected ? "selected" : undefined;
        if (decorator && qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          padding    : [ 2, 6 ],
          textColor  : states.selected ? "text-selected" : undefined,
          decorator  : decorator
        };
      }
    },

    "tree-item/icon" :
    {
      include : "image",

      style : function(states)
      {
        return {
          paddingRight : 5
        };
      }
    },

    "tree-item/label" : "label",

    "tree-item/open" :
    {
      include : "image",

      style : function(states)
      {
        var icon;
        if (states.selected && states.opened)
        {
          icon = "decoration/tree/open-selected.png";
        }
        else if (states.selected && !states.opened)
        {
          icon = "decoration/tree/closed-selected.png";
        }
        else if (states.opened)
        {
          icon = "decoration/tree/open.png";
        }
        else
        {
          icon = "decoration/tree/closed.png";
        }

        return {
          padding : [0, 5, 0, 2],
          source  : icon
        };
      }
    },

    "tree-folder" :
    {
      include : "tree-item",
      alias : "tree-item",

      style : function(states)
      {
        var icon, iconOpened;
        if (states.small) {
          icon = states.opened ? "icon/16/places/folder-open.png" : "icon/16/places/folder.png";
          iconOpened = "icon/16/places/folder-open.png";
        } else if (states.large) {
          icon = states.opened ? "icon/32/places/folder-open.png" : "icon/32/places/folder.png";
          iconOpened = "icon/32/places/folder-open.png";
        } else {
          icon = states.opened ? "icon/22/places/folder-open.png" : "icon/22/places/folder.png";
          iconOpened = "icon/22/places/folder-open.png";
        }

        return {
          icon : icon,
          iconOpened : iconOpened
        };
      }
    },

    "tree-file" :
    {
      include : "tree-item",
      alias : "tree-item",

      style : function(states)
      {
        return {
          icon :
            states.small ? "icon/16/mimetypes/office-document.png" :
            states.large ? "icon/32/mimetypes/office-document.png" :
            "icon/22/mimetypes/office-document.png"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      TREEVIRTUAL
    ---------------------------------------------------------------------------
    */

    "treevirtual" : "table",

    "treevirtual-folder" :
    {
      style : function(states)
      {
        return {
          icon : states.opened ?
            "icon/16/places/folder-open.png" :
            "icon/16/places/folder.png"
        };
      }
    },

    "treevirtual-file" :
    {
      include : "treevirtual-folder",
      alias : "treevirtual-folder",

      style : function(states)
      {
        return {
          icon : "icon/16/mimetypes/office-document.png"
        };
      }
    },

    "treevirtual-line" :
    {
      style : function(states)
      {
        return {
          icon : "qx/static/blank.gif"
        };
      }
    },

    "treevirtual-contract" :
    {
      style : function(states)
      {
        return {
          icon : "decoration/tree/open.png",
          paddingLeft : 5,
          paddingTop : 2
        };
      }
    },

    "treevirtual-expand" :
    {
      style : function(states)
      {
        return {
          icon : "decoration/tree/closed.png",
          paddingLeft : 5,
          paddingTop : 2
        };
      }
    },

    "treevirtual-only-contract" : "treevirtual-contract",
    "treevirtual-only-expand" : "treevirtual-expand",
    "treevirtual-start-contract" : "treevirtual-contract",
    "treevirtual-start-expand" : "treevirtual-expand",
    "treevirtual-end-contract" : "treevirtual-contract",
    "treevirtual-end-expand" : "treevirtual-expand",
    "treevirtual-cross-contract" : "treevirtual-contract",
    "treevirtual-cross-expand" : "treevirtual-expand",

    "treevirtual-end" :
    {
      style : function(states)
      {
        return {
          icon : "qx/static/blank.gif"
        };
      }
    },

    "treevirtual-cross" :
    {
      style : function(states)
      {
        return {
          icon : "qx/static/blank.gif"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      TOOL TIP
    ---------------------------------------------------------------------------
    */

    "tooltip" :
    {
      include : "popup",

      style : function(states)
      {
        return {
          backgroundColor : "background-tip",
          padding : [ 1, 3, 2, 3 ],
          offset : [ 15, 5, 5, 5 ]
        };
      }
    },

    "tooltip/atom" : "atom",

    "tooltip-error" :
    {
      include : "tooltip",

      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.boxshadow");
        return {
          textColor: "text-selected",
          backgroundColor : undefined,
          placeMethod: "widget",
          offset: [0, 0, 0, 14],
          marginTop: -2,
          position: "right-top",
          showTimeout: 100,
          hideTimeout: 10000,
          decorator: useCSS ? "tooltip-error-css" : "tooltip-error",
          shadow: "tooltip-error-arrow",
          font: "bold",
          padding: useCSS ? 3 : undefined
        };
      }
    },

    "tooltip-error/atom" : "atom",

    /*
    ---------------------------------------------------------------------------
      WINDOW
    ---------------------------------------------------------------------------
    */

    "window" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");

        var decorator;
        var shadow;

        if (useCSS) {
          if (states.showStatusbar) {
            decorator = "window-incl-statusbar-css";
          } else {
            decorator = "window-css";
          }
        } else {
           shadow = "shadow-window";
        }
        return {
          decorator : decorator,
          shadow : shadow,
          contentPadding : [ 10, 10, 10, 10 ],
          margin : [0, 5, 5, 0]
          
        };
      }
    },

    "window/pane" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");
        return {
          decorator : useCSS ? "window-pane-css" : "window"
        };
      }
    },

    "window/captionbar" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");

        var decorator = states.active ? "window-captionbar-active" : "window-captionbar-inactive";
        if (useCSS) {
          decorator += "-css";
        }

        return {
          decorator    : decorator,
          textColor    : states.active ? "window-caption-active-text" : "text-gray",
          minHeight    : 26,
          paddingRight : 2
        };
      }
    },

    "window/icon" :
    {
      style : function(states)
      {
        return {
          margin : [ 5, 0, 3, 6 ]
        };
      }
    },

    "window/title" :
    {
      style : function(states)
      {
        return {
          alignY      : "middle",
          font        : "bold",
          marginLeft  : 6,
          marginRight : 12
        };
      }
    },

    "window/minimize-button" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          icon : states.active ? states.hovered ? "decoration/window/minimize-active-hovered.png" :
                                                  "decoration/window/minimize-active.png" :
                                                  "decoration/window/minimize-inactive.png",
          margin : [ 4, 8, 2, 0 ]
        };
      }
    },

    "window/restore-button" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          icon : states.active ? states.hovered ? "decoration/window/restore-active-hovered.png" :
                                                  "decoration/window/restore-active.png" :
                                                  "decoration/window/restore-inactive.png",
          margin : [ 5, 8, 2, 0 ]
        };
      }
    },

    "window/maximize-button" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          icon : states.active ? states.hovered ? "decoration/window/maximize-active-hovered.png" :
                                                  "decoration/window/maximize-active.png" :
                                                  "decoration/window/maximize-inactive.png",
          margin : [ 4, 8, 2, 0 ]
        };
      }
    },

    "window/close-button" :
    {
      alias : "atom",

      style : function(states)
      {
        return {
          icon : states.active ? states.hovered ? "decoration/window/close-active-hovered.png" :
                                                  "decoration/window/close-active.png" :
                                                  "decoration/window/close-inactive.png",
          margin : [ 4, 8, 2, 0 ]
        };
      }
    },

    "window/statusbar" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");
        return {
          padding   : [ 2, 6 ],
          decorator : useCSS ? "window-statusbar-css" : "window-statusbar",
          minHeight : 18
        };
      }
    },

    "window/statusbar-text" :
    {
      style : function(states)
      {
        return {
          font : "small"
        };
      }
    },







    /*
    ---------------------------------------------------------------------------
      IFRAME
    ---------------------------------------------------------------------------
    */

    "iframe" :
    {
      style : function(states)
      {
        return {
          decorator : "main"
        };
      }
    },






    /*
    ---------------------------------------------------------------------------
      RESIZER
    ---------------------------------------------------------------------------
    */

    "resizer" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.boxshadow") &&
          qx.core.Environment.get("css.borderradius") &&
          qx.core.Environment.get("css.gradients");

        return {
          decorator : useCSS ? "pane-css" : "pane"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      SPLITPANE
    ---------------------------------------------------------------------------
    */

    "splitpane" :
    {
      style : function(states)
      {
        return {
          decorator : "splitpane"
        };
      }
    },

    "splitpane/splitter" :
    {
      style : function(states)
      {
        return {
          width : states.horizontal ? 3 : undefined,
          height : states.vertical ? 3 : undefined,
          backgroundColor : "background-splitpane"
        };
      }
    },

    "splitpane/splitter/knob" :
    {
      style : function(states)
      {
        return {
          source : states.horizontal ? "decoration/splitpane/knob-horizontal.png" : "decoration/splitpane/knob-vertical.png"
        };
      }
    },

    "splitpane/slider" :
    {
      style : function(states)
      {
        return {
          width : states.horizontal ? 3 : undefined,
          height : states.vertical ? 3 : undefined,
          backgroundColor : "background-splitpane"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      SELECTBOX
    ---------------------------------------------------------------------------
    */

    "selectbox" : "button-frame",

    "selectbox/atom" : "atom",
    "selectbox/popup" : "popup",

    "selectbox/list" : {
      alias : "list"
    },

    "selectbox/arrow" :
    {
      include : "image",

      style : function(states)
      {
        return {
          source : "decoration/arrows/down.png",
          paddingLeft : 5
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      DATE CHOOSER
    ---------------------------------------------------------------------------
    */

    "datechooser" :
    {
      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          padding : 2,
          decorator : decorator,
          backgroundColor : "background-light"
        };
      }
    },

    "datechooser/navigation-bar" : {},

    "datechooser/nav-button"  :
    {
      include : "button-frame",
      alias : "button-frame",

      style : function(states)
      {
        var result = {
          padding : [ 2, 4 ],
          shadow : undefined
        };

        if (states.lastYear) {
          result.icon = "decoration/arrows/rewind.png";
          result.marginRight = 1;
        } else if (states.lastMonth) {
          result.icon = "decoration/arrows/left.png";
        } else if (states.nextYear) {
          result.icon = "decoration/arrows/forward.png";
          result.marginLeft = 1;
        } else if (states.nextMonth) {
          result.icon = "decoration/arrows/right.png";
        }

        return result;
      }
    },

    "datechooser/last-year-button-tooltip" : "tooltip",
    "datechooser/last-month-button-tooltip" : "tooltip",
    "datechooser/next-year-button-tooltip" : "tooltip",
    "datechooser/next-month-button-tooltip" : "tooltip",

    "datechooser/last-year-button" : "datechooser/nav-button",
    "datechooser/last-month-button" : "datechooser/nav-button",
    "datechooser/next-month-button" : "datechooser/nav-button",
    "datechooser/next-year-button" : "datechooser/nav-button",

    "datechooser/month-year-label" :
    {
      style : function(states)
      {
        return {
          font      : "bold",
          textAlign : "center",
          textColor: states.disabled ? "text-disabled" : undefined
        };
      }
    },

    "datechooser/date-pane" :
    {
      style : function(states)
      {
        return {
          textColor: states.disabled ? "text-disabled" : undefined,
          marginTop : 2
        };
      }
    },

    "datechooser/weekday" :
    {
      style : function(states)
      {
        return {
          textColor : states.disabled ? "text-disabled" : states.weekend ? "text-light" : undefined,
          textAlign : "center",
          paddingTop : 2,
          backgroundColor : "background-medium"
        };
      }
    },

    "datechooser/week" :
    {
      style : function(states)
      {
        return {
          textAlign : "center",
          padding   : [ 2, 4 ],
          backgroundColor : "background-medium"
        };
      }
    },

    "datechooser/day" :
    {
      style : function(states)
      {
        var decorator = states.disabled ? undefined : states.selected ? "selected" : undefined;
        if (decorator && qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          textAlign : "center",
          decorator : decorator,
          textColor : states.disabled ? "text-disabled" : states.selected ? "text-selected" : states.otherMonth ? "text-light" : undefined,
          font      : states.today ? "bold" : undefined,
          padding   : [ 2, 4 ]
        };
      }
    },







    /*
    ---------------------------------------------------------------------------
      COMBOBOX
    ---------------------------------------------------------------------------
    */

    "combobox" :
    {
      style : function(states)
      {
        var decorator;

        var focused = !!states.focused;
        var invalid = !!states.invalid;
        var disabled = !!states.disabled;

        if (focused && invalid && !disabled) {
          decorator = "input-focused-invalid";
        } else if (focused && !invalid && !disabled) {
          decorator = "input-focused";
        } else if (disabled) {
          decorator = "input-disabled";
        } else if (!focused && invalid && !disabled) {
          decorator = "border-invalid";
        } else {
          decorator = "input";
        }

        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator : decorator
        };
      }
    },

    "combobox/popup" : "popup",

    "combobox/list" : {
      alias : "list"
    },

    "combobox/button" :
    {
      include : "button-frame",
      alias   : "button-frame",

      style : function(states, superStyles)
      {
        var ret = {
          icon : "decoration/arrows/down.png",
          padding : [superStyles.padding[0], superStyles.padding[1] - 6],
          shadow : undefined,
          margin : undefined
        };

        if (states.selected) {
          ret.decorator = "button-focused";
        }

        return ret;
      }
    },

    "combobox/textfield" :
    {
      include : "textfield",

      style : function(states)
      {
        return {
          decorator : undefined
        };
      }
    },






    /*
    ---------------------------------------------------------------------------
      MENU
    ---------------------------------------------------------------------------
    */

   "menu" :
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients") &&
          qx.core.Environment.get("css.boxshadow");

        var result =
        {
          decorator : useCSS ? "menu-css" : "menu",
          shadow : useCSS ? undefined : "shadow-popup",
          spacingX : 6,
          spacingY : 1,
          iconColumnWidth : 16,
          arrowColumnWidth : 4,
          placementModeY : states.submenu || states.contextmenu ? "best-fit" : "keep-align"
        };

        if (states.submenu)
        {
          result.position = "right-top";
          result.offset = [-2, -3];
        }

        return result;
      }
    },

    "menu/slidebar" : "menu-slidebar",

    "menu-slidebar" : "widget",

    "menu-slidebar-button" :
    {
      style : function(states)
      {
        var decorator = states.hovered  ? "selected" : undefined;
        if (decorator && qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator : decorator,
          padding : 7,
          center : true
        };
      }
    },

    "menu-slidebar/button-backward" :
    {
      include : "menu-slidebar-button",

      style : function(states)
      {
        return {
          icon : states.hovered ? "decoration/arrows/up-invert.png" : "decoration/arrows/up.png"
        };
      }
    },

    "menu-slidebar/button-forward" :
    {
      include : "menu-slidebar-button",

      style : function(states)
      {
        return {
          icon : states.hovered ? "decoration/arrows/down-invert.png" : "decoration/arrows/down.png"
        };
      }
    },

    "menu-separator" :
    {
      style : function(states)
      {
        return {
          height : 0,
          decorator : "menu-separator",
          margin    : [ 4, 2 ]
        };
      }
    },

    "menu-button" :
    {
      alias : "atom",

      style : function(states)
      {
        var decorator = states.selected ? "selected" : undefined;
        if (decorator && qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator : decorator,
          textColor : states.selected ? "text-selected" : undefined,
          padding   : [ 4, 6 ]
        };
      }
    },

    "menu-button/icon" :
    {
      include : "image",

      style : function(states)
      {
        return {
          alignY : "middle"
        };
      }
    },

    "menu-button/label" :
    {
      include : "label",

      style : function(states)
      {
        return {
          alignY : "middle",
          padding : 1
        };
      }
    },

    "menu-button/shortcut" :
    {
      include : "label",

      style : function(states)
      {
        return {
          alignY : "middle",
          marginLeft : 14,
          padding : 1
        };
      }
    },

    "menu-button/arrow" :
    {
      include : "image",

      style : function(states)
      {
        return {
          source : states.selected ? "decoration/arrows/right-invert.png" : "decoration/arrows/right.png",
          alignY : "middle"
        };
      }
    },

    "menu-checkbox" :
    {
      alias : "menu-button",
      include : "menu-button",

      style : function(states)
      {
        return {
          icon : !states.checked ? undefined :
            states.selected ? "decoration/menu/checkbox-invert.gif" :
              "decoration/menu/checkbox.gif"
        };
      }
    },

    "menu-radiobutton" :
    {
      alias : "menu-button",
      include : "menu-button",

      style : function(states)
      {
        return {
          icon : !states.checked ? undefined :
            states.selected ? "decoration/menu/radiobutton-invert.gif" :
              "decoration/menu/radiobutton.gif"
        };
      }
    },




    /*
    ---------------------------------------------------------------------------
      MENU BAR
    ---------------------------------------------------------------------------
    */

   "menubar" :
   {
     style : function(states)
     {
       var useCSS = qx.core.Environment.get("css.gradients");
       return {
         decorator : useCSS ? "menubar-css" : "menubar"
       };
     }
   },

   "menubar-button" :
   {
     alias : "atom",

     style : function(states)
     {
       var decorator = (states.pressed || states.hovered) && !states.disabled ? "selected" : undefined;
       if (decorator && qx.core.Environment.get("css.gradients")) {
         decorator += "-css";
       }

       return {
         decorator : decorator,
         textColor : states.pressed || states.hovered ? "text-selected" : undefined,
         padding   : [ 3, 8 ]
       };
     }
   },



    /*
    ---------------------------------------------------------------------------
      COLOR SELECTOR
    ---------------------------------------------------------------------------
    */

    "colorselector" : "widget",
    "colorselector/control-bar" : "widget",
    "colorselector/control-pane": "widget",
    "colorselector/visual-pane" : "groupbox",
    "colorselector/preset-grid" : "widget",

    "colorselector/colorbucket":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          width : 16,
          height : 16
        };
      }
    },

    "colorselector/preset-field-set" : "groupbox",
    "colorselector/input-field-set" : "groupbox",
    "colorselector/preview-field-set" : "groupbox",

    "colorselector/hex-field-composite" : "widget",
    "colorselector/hex-field" : "textfield",

    "colorselector/rgb-spinner-composite" : "widget",
    "colorselector/rgb-spinner-red" : "spinner",
    "colorselector/rgb-spinner-green" : "spinner",
    "colorselector/rgb-spinner-blue" : "spinner",

    "colorselector/hsb-spinner-composite" : "widget",
    "colorselector/hsb-spinner-hue" : "spinner",
    "colorselector/hsb-spinner-saturation" : "spinner",
    "colorselector/hsb-spinner-brightness" : "spinner",

    "colorselector/preview-content-old":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          width : 50,
          height : 10
        };
      }
    },

    "colorselector/preview-content-new":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          backgroundColor : "background-light",
          width : 50,
          height : 10
        };
      }
    },


    "colorselector/hue-saturation-field":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          margin : 5
        };
      }
    },

    "colorselector/brightness-field":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          margin : [5, 7]
        };
      }
    },

    "colorselector/hue-saturation-pane": "widget",
    "colorselector/hue-saturation-handle" : "widget",
    "colorselector/brightness-pane": "widget",
    "colorselector/brightness-handle" : "widget",




    /*
    ---------------------------------------------------------------------------
      COLOR POPUP
    ---------------------------------------------------------------------------
    */

    "colorpopup" :
    {
      alias : "popup",
      include : "popup",

      style : function(states)
      {
        return {
          padding : 5,
          backgroundColor : "background-application"
        };
      }
    },

    "colorpopup/field":
    {
      style : function(states)
      {
        return {
          decorator : "main",
          margin : 2,
          width : 14,
          height : 14,
          backgroundColor : "background-light"
        };
      }
    },

    "colorpopup/selector-button" : "button",
    "colorpopup/auto-button" : "button",
    "colorpopup/preview-pane" : "groupbox",

    "colorpopup/current-preview":
    {
      style : function(state)
      {
        return {
          height : 20,
          padding: 4,
          marginLeft : 4,
          decorator : "main",
          allowGrowX : true
        };
      }
    },

    "colorpopup/selected-preview":
    {
      style : function(state)
      {
        return {
          height : 20,
          padding: 4,
          marginRight : 4,
          decorator : "main",
          allowGrowX : true
        };
      }
    },

    "colorpopup/colorselector-okbutton":
    {
      alias : "button",
      include : "button",

      style : function(states)
      {
        return {
          icon : "icon/16/actions/dialog-ok.png"
        };
      }
    },

    "colorpopup/colorselector-cancelbutton":
   {
      alias : "button",
      include : "button",

      style : function(states)
      {
        return {
          icon : "icon/16/actions/dialog-cancel.png"
        };
      }
    },

    /*
    ---------------------------------------------------------------------------
      TABLE
    ---------------------------------------------------------------------------
    */

    "table" :
    {
      alias : "widget",

      style : function(states)
      {
        return {
          decorator : "table"
        };
      }
    },

    "table/statusbar" :
    {
      style : function(states)
      {
        return {
          decorator : "table-statusbar",
          padding   : [ 0, 2 ]
        };
      }
    },

    "table/column-button" :
    {
      alias : "button-frame",

      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients");
        return {
          decorator : useCSS ? "table-scroller-header-css" : "table-scroller-header",
          padding   : 3,
          icon      : "decoration/table/select-column-order.png"
        };
      }
    },

    "table-column-reset-button" :
    {
      include : "menu-button",
      alias : "menu-button",

      style : function()
      {
        return {
          icon : "icon/16/actions/view-refresh.png"
        };
      }
    },

    "table-scroller" : "widget",

    "table-scroller/scrollbar-x": "scrollbar",
    "table-scroller/scrollbar-y": "scrollbar",

    "table-scroller/header":
    {
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients");
        return {
          decorator : useCSS ? "table-scroller-header-css" : "table-scroller-header"
        };
      }
    },

    "table-scroller/pane" :
    {
      style : function(states)
      {
        return {
          backgroundColor : "table-pane"
        };
      }
    },

    "table-scroller/focus-indicator" :
    {
      style : function(states)
      {
        return {
          decorator : "table-scroller-focus-indicator"
        };
      }
    },

    "table-scroller/resize-line" :
    {
      style : function(states)
      {
        return {
          backgroundColor : "border-separator",
          width : 2
        };
      }
    },

    "table-header-cell" :
    {
      alias : "atom",
      style : function(states)
      {
        return {
          minWidth  : 13,
          minHeight : 20,
          padding   : states.hovered ? [ 3, 4, 2, 4 ] : [ 3, 4 ],
          decorator : states.hovered ? "table-header-cell-hovered" : "table-header-cell",
          sortIcon  : states.sorted ?
              (states.sortedAscending ? "decoration/table/ascending.png" : "decoration/table/descending.png")
              : undefined
        };
      }
    },

    "table-header-cell/label" :
    {
      style : function(states)
      {
        return {
          minWidth : 0,
          alignY : "middle",
          paddingRight : 5
        };
      }
    },

    "table-header-cell/sort-icon" :
    {
      style : function(states)
      {
        return {
          alignY : "middle",
          alignX : "right"
        };
      }
    },

    "table-header-cell/icon" :
    {
      style : function(states)
      {
        return {
          minWidth : 0,
          alignY : "middle",
          paddingRight : 5
        };
      }
    },

    "table-editor-textfield" :
    {
      include : "textfield",

      style : function(states)
      {
        return {
          decorator : undefined,
          padding : [ 2, 2 ],
          backgroundColor : "background-light"
        };
      }
    },

    "table-editor-selectbox" :
    {
      include : "selectbox",
      alias : "selectbox",

      style : function(states)
      {
        return {
          padding : [ 0, 2 ],
          backgroundColor : "background-light"
        };
      }
    },

    "table-editor-combobox" :
    {
      include : "combobox",
      alias : "combobox",

      style : function(states)
      {
        return {
          decorator : undefined,
          backgroundColor : "background-light"
        };
      }
    },





    /*
    ---------------------------------------------------------------------------
      PROGRESSIVE
    ---------------------------------------------------------------------------
    */

    "progressive-table-header" :
    {
      alias : "widget",

      style : function(states)
      {
        return {
          decorator : "progressive-table-header"
        };
      }
    },

    "progressive-table-header-cell" :
    {
      alias : "atom",
      style : function(states)
      {
        var useCSS = qx.core.Environment.get("css.gradients");
        return {
          minWidth : 40,
          minHeight : 25,
          paddingLeft : 6,
          decorator : useCSS ? "progressive-table-header-cell-css" : "progressive-table-header-cell"
        };
      }
    },

    /*
    ---------------------------------------------------------------------------
      APPLICATION
    ---------------------------------------------------------------------------
    */

    "app-header" :
    {
      style : function(states)
      {
        return {
          font : "bold",
          textColor : "text-selected",
          padding : [8, 12],
          decorator : "app-header"
        };
      }
    },

    "app-header-label": "label",


    /*
    ---------------------------------------------------------------------------
      VIRTUAL WIDGETS
    ---------------------------------------------------------------------------
    */

    "virtual-list" : "list",
    "virtual-list/row-layer" : "row-layer",

    "row-layer" :
    {
      style : function(states)
      {
        return {
          colorEven : "virtual-row-layer-background-even",
          colorOdd : "virtual-row-layer-background-odd"
        };
      }
    },

    "group-item" :
    {
      include : "label",
      alias : "label",

      style : function(states)
      {
        return {
          padding : 4,
          decorator : qx.core.Environment.get("css.gradients") ? "group-item-css" : "group-item",
          textColor : "groupitem-text",
          font: "bold"
        };
      }
    },

    "virtual-selectbox" : "selectbox",
    "virtual-selectbox/dropdown" : "popup",
    "virtual-selectbox/dropdown/list" : {
      alias : "virtual-list"
    },

    "virtual-combobox" : "combobox",
    "virtual-combobox/dropdown" : "popup",
    "virtual-combobox/dropdown/list" : {
      alias : "virtual-list"
    },

    "virtual-tree" : "list",
    "virtual-tree-folder" : "tree-folder",
    "virtual-tree-file" : "tree-file",

    "column-layer" : "widget",

    "cell" :
    {
      style : function(states)
      {
        return {
          textColor: states.selected ? "text-selected" : "text-label",
          padding: [3, 6],
          font: "default"
        };
      }
    },

    "cell-string" : "cell",
    "cell-number" :
    {
      include : "cell",
      style : function(states)
      {
        return {
          textAlign : "right"
        };
      }
    },
    "cell-image" : "cell",
    "cell-boolean" :
    {
      include : "cell",
      style : function(states)
      {
        return {
          iconTrue : "decoration/table/boolean-true.png",
          iconFalse : "decoration/table/boolean-false.png"
        };
      }
    },
    "cell-atom" : "cell",
    "cell-date" : "cell",
    "cell-html" : "cell",



    /*
    ---------------------------------------------------------------------------
      HTMLAREA
    ---------------------------------------------------------------------------
    */

    "htmlarea" :
    {
      "include" : "widget",

      style : function(states)
      {
        return {
          backgroundColor : "htmlarea-background"
        };
      }
    },


    /*
    ---------------------------------------------------------------------------
      PROGRESSBAR
    ---------------------------------------------------------------------------
    */
    "progressbar":
    {
      style: function(states) {
        return {
          decorator: "progressbar",
          padding: [1],
          backgroundColor: "progressbar-background"
        }
      }
    },

    "progressbar/progress":
    {
      style: function(states)
      {
        var decorator = states.disabled ? "group-item" : "selected";
        if (qx.core.Environment.get("css.gradients")) {
          decorator += "-css";
        }

        return {
          decorator: decorator
        }
      }
    }
  }
});

