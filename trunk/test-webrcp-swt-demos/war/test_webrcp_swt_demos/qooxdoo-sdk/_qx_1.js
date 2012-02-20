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

#resource(qx.static:qx/static)
#ignore(qx.data)
#optional(qx.data.IListData)

************************************************************************ */

/**
 * Create namespace
 */
if (!window.qx) {
  window.qx = {};
}

/**
 * Bootstrap qx.Bootstrap to create myself later
 * This is needed for the API browser etc. to let them detect me
 */
qx.Bootstrap = {

  genericToString : function() {
    return "[Class " + this.classname + "]";
  },

  createNamespace : function(name, object)
  {
    var splits = name.split(".");
    var parent = window;
    var part = splits[0];

    for (var i=0, len=splits.length-1; i<len; i++, part=splits[i])
    {
      if (!parent[part]) {
        parent = parent[part] = {};
      } else {
        parent = parent[part];
      }
    }

    // store object
    parent[part] = object;

    // return last part name (e.g. classname)
    return part;
  },


  setDisplayName : function(fcn, classname, name)
  {
    fcn.displayName = classname + "." + name + "()";
  },


  setDisplayNames : function(functionMap, classname)
  {
    for (var name in functionMap)
    {
      var value = functionMap[name];
      if (value instanceof Function) {
        value.displayName = classname + "." + name + "()";
      }
    }
  },


  define : function(name, config)
  {
    if (!config) {
      var config = { statics : {} };
    }

    var clazz;
    var proto = null;

    qx.Bootstrap.setDisplayNames(config.statics, name);

    if (config.members || config.extend)
    {
      qx.Bootstrap.setDisplayNames(config.members, name + ".prototype");

      clazz = config.construct || new Function;

      if (config.extend) {
        this.extendClass(clazz, clazz, config.extend, name, basename);
      }

      var statics = config.statics || {};
      // use getKeys to include the shadowed in IE
      for (var i=0, keys=qx.Bootstrap.getKeys(statics), l=keys.length; i<l; i++) {
        var key = keys[i];
        clazz[key] = statics[key];
      }

      proto = clazz.prototype;
      var members = config.members || {};
      // use getKeys to include the shadowed in IE
      for (var i=0, keys=qx.Bootstrap.getKeys(members), l=keys.length; i<l; i++) {
        var key = keys[i];
        proto[key] = members[key];
      }
    }
    else
    {
      clazz = config.statics || {};
    }

    // Create namespace
    var basename = this.createNamespace(name, clazz);

    // Store names in constructor/object
    clazz.name = clazz.classname = name;
    clazz.basename = basename;

    // Store type info
    clazz.$$type = "Class";

    // Attach toString
    if (!clazz.hasOwnProperty("toString")) {
      clazz.toString = this.genericToString;
    }

    // Execute defer section
    if (config.defer) {
      config.defer(clazz, proto);
    }

    // Store class reference in global class registry
    qx.Bootstrap.$$registry[name] = config.statics;

    return clazz;
  }
};


/**
 * Internal class that is responsible for bootstrapping the qooxdoo
 * framework at load time.
 *
 * Automatically loads JavaScript language fixes and enhancements to
 * bring all engines to at least JavaScript 1.6.
 *
 * Does support:
 *
 * * Construct
 * * Statics
 * * Members
 * * Extend
 * * Defer
 *
 * Does not support:
 *
 * * Super class calls
 * * Mixins, Interfaces, Properties, ...
 */
qx.Bootstrap.define("qx.Bootstrap",
{
  statics :
  {
    /** Timestamp of qooxdoo based application startup */
    LOADSTART : qx.$$start || new Date(),

    /**
     * Mapping for early use of the qx.debug environment setting.
     * @lint ignoreUndefined(qxvariants)
     */
     DEBUG : (function() {
       // make sure to reflect all changes here to the environment class!
       var debug = true;
       if (qx.$$environment && qx.$$environment["qx.debug"] === false) {
         debug = false;
       }
       if (window.qxvariants && window.qxvariants["qx.debug"] == "off") {
         debug = false;
       }
       return debug;
     })(),

    /**
     * Creates a namespace and assigns the given object to it.
     *
     * @internal
     * @param name {String} The complete namespace to create. Typically, the last part is the class name itself
     * @param object {Object} The object to attach to the namespace
     * @return {Object} last part of the namespace (typically the class name)
     * @throws an exception when the given object already exists.
     */
    createNamespace : qx.Bootstrap.createNamespace,


    /**
     * Define a new class using the qooxdoo class system.
     * Lightweight version of {@link qx.Class#define} only used during bootstrap phase.
     *
     * @internal
     * @signature function(name, config)
     * @param name {String} Name of the class
     * @param config {Map ? null} Class definition structure.
     * @return {Class} The defined class
     */
    define : qx.Bootstrap.define,


    /**
     * Sets the display name of the given function
     *
     * @signature (fcn, classname, name)
     * @param fcn {Function} the function to set the display name for
     * @param classname {String} the name of the class the function is defined in
     * @param name {String} the function name
     */
    setDisplayName : qx.Bootstrap.setDisplayName,


    /**
     * Set the names of all functions defined in the given map
     *
     * @signature function(functionMap, classname)
     * @param functionMap {Object} a map with functions as values
     * @param classname {String} the name of the class, the functions are
     *   defined in
     */
    setDisplayNames : qx.Bootstrap.setDisplayNames,

    /**
     * This method will be attached to all classes to return
     * a nice identifier for them.
     *
     * @internal
     * @signature function()
     * @return {String} The class identifier
     */
    genericToString : qx.Bootstrap.genericToString,


    /**
     * Inherit a clazz from a super class.
     *
     * This function differentiates between class and constructor because the
     * constructor written by the user might be wrapped and the <code>base</code>
     * property has to be attached to the constructor, while the <code>superclass</code>
     * property has to be attached to the wrapped constructor.
     *
     * @param clazz {Function} The class's wrapped constructor
     * @param construct {Function} The unwrapped constructor
     * @param superClass {Function} The super class
     * @param name {Function} fully qualified class name
     * @param basename {Function} the base name
     */
    extendClass : function(clazz, construct, superClass, name, basename)
    {
      var superproto = superClass.prototype;

      // Use helper function/class to save the unnecessary constructor call while
      // setting up inheritance.
      var helper = new Function;
      helper.prototype = superproto;
      var proto = new helper;

      // Apply prototype to new helper instance
      clazz.prototype = proto;

      // Store names in prototype
      proto.name = proto.classname = name;
      proto.basename = basename;

      /*
        - Store base constructor to constructor-
        - Store reference to extend class
      */
      construct.base = clazz.superclass = superClass;

      /*
        - Store statics/constructor onto constructor/prototype
        - Store correct constructor
        - Store statics onto prototype
      */
      construct.self = clazz.constructor = proto.constructor = clazz;
    },


    /**
     * Find a class by its name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name) {
      return qx.Bootstrap.$$registry[name];
    },


    /** {Map} Stores all defined classes */
    $$registry : {},


    /*
    ---------------------------------------------------------------------------
      OBJECT UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */

    /**
     * Get the number of objects in the map
     *
     * @signature function(map)
     * @param map {Object} the map
     * @return {Integer} number of objects in the map
     */
    objectGetLength :
    ({
      "count": function(map) {
        return map.__count__;
      },

      "default": function(map)
      {
        var length = 0;

        for (var key in map) {
          length++;
        }

        return length;
      }
    })[(({}).__count__ == 0) ? "count" : "default"],


    /**
     * Inserts all keys of the source object into the
     * target objects. Attention: The target map gets modified.
     *
     * @param target {Object} target object
     * @param source {Object} object to be merged
     * @param overwrite {Boolean ? true} If enabled existing keys will be overwritten
     * @return {Object} Target with merged values from the source object
     */
    objectMergeWith : function(target, source, overwrite)
    {
      if (overwrite === undefined) {
        overwrite = true;
      }

      for (var key in source)
      {
        if (overwrite || target[key] === undefined) {
          target[key] = source[key];
        }
      }

      return target;
    },


    /**
     * IE does not return "shadowed" keys even if they are defined directly
     * in the object.
     *
     * @internal
     */
    __shadowedKeys :
    [
      "isPrototypeOf",
      "hasOwnProperty",
      "toLocaleString",
      "toString",
      "valueOf",
      "constructor"
    ],


    /**
     * Get the keys of a map as array as returned by a "for ... in" statement.
     *
     * @signature function(map)
     * @param map {Object} the map
     * @return {Array} array of the keys of the map
     */
    getKeys :
    ({
      "ES5" : Object.keys,

      "BROKEN_IE" : function(map)
      {
        var arr = [];
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        for (var key in map) {
          if (hasOwnProperty.call(map, key)) {
            arr.push(key);
          }
        }

        // IE does not return "shadowed" keys even if they are defined directly
        // in the object. This is incompatible with the ECMA standard!!
        // This is why this checks are needed.
        var shadowedKeys = qx.Bootstrap.__shadowedKeys;
        for (var i=0, a=shadowedKeys, l=a.length; i<l; i++)
        {
          if (hasOwnProperty.call(map, a[i])) {
            arr.push(a[i]);
          }
        }

        return arr;
      },

      "default" : function(map)
      {
        var arr = [];

        var hasOwnProperty = Object.prototype.hasOwnProperty;
        for (var key in map) {
          if (hasOwnProperty.call(map, key)) {
            arr.push(key);
          }
        }

        return arr;
      }
    })[
      typeof(Object.keys) == "function" ? "ES5" :
        (function() {for (var key in {toString : 1}) { return key }})() !== "toString" ? "BROKEN_IE" : "default"
    ],


    /**
     * Get the keys of a map as string
     *
     * @param map {Object} the map
     * @return {String} String of the keys of the map
     *         The keys are separated by ", "
     */
    getKeysAsString : function(map)
    {
      var keys = qx.Bootstrap.getKeys(map);
      if (keys.length == 0) {
        return "";
      }

      return '"' + keys.join('\", "') + '"';
    },


    /**
     * Mapping from JavaScript string representation of objects to names
     * @internal
     */
    __classToTypeMap :
    {
      "[object String]": "String",
      "[object Array]": "Array",
      "[object Object]": "Object",
      "[object RegExp]": "RegExp",
      "[object Number]": "Number",
      "[object Boolean]": "Boolean",
      "[object Date]": "Date",
      "[object Function]": "Function",
      "[object Error]": "Error"
    },


    /*
    ---------------------------------------------------------------------------
      FUNCTION UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */


    /**
     * Returns a function whose "this" is altered.
     *
     * *Syntax*
     *
     * <pre class='javascript'>qx.lang.Function.self(myFunction, [self, [varargs...]]);</pre>
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
     * @param func {Function} Original function to wrap
     * @param self {Object ? null} The object that the "this" of the function will refer to.
     * @param varargs {arguments ? null} The arguments to pass to the function.
     * @return {Function} The bound function.
     */
    bind : function(func, self, varargs)
    {
      var fixedArgs = Array.prototype.slice.call(arguments, 2, arguments.length);
      return function() {
        var args = Array.prototype.slice.call(arguments, 0, arguments.length);
        return func.apply(self, fixedArgs.concat(args));
      }
    },


    /*
    ---------------------------------------------------------------------------
      STRING UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */


    /**
     * Convert the first character of the string to upper case.
     *
     * @param str {String} the string
     * @return {String} the string with an upper case first character
     */
    firstUp : function(str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
    },


    /**
     * Convert the first character of the string to lower case.
     *
     * @param str {String} the string
     * @return {String} the string with a lower case first character
     */
    firstLow : function(str) {
      return str.charAt(0).toLowerCase() + str.substr(1);
    },


    /*
    ---------------------------------------------------------------------------
      TYPE UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */

    /**
     * Get the internal class of the value. See
     * http://thinkweb2.com/projects/prototype/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
     * for details.
     *
     * @param value {var} value to get the class for
     * @return {String} the internal class of the value
     */
    getClass : function(value)
    {
      var classString = Object.prototype.toString.call(value);
      return (
        qx.Bootstrap.__classToTypeMap[classString] ||
        classString.slice(8, -1)
      );
    },


    /**
     * Whether the value is a string.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a string.
     */
    isString : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        typeof value === "string" ||
        qx.Bootstrap.getClass(value) == "String" ||
        value instanceof String ||
        (!!value && !!value.$$isString))
      );
    },


    /**
     * Whether the value is an array.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an array.
     */
    isArray : function(value)
    {
      // Added "value !== null" because IE throws an exception "Object expected"
      // by executing "value instanceof Array" if value is a DOM element that
      // doesn't exist. It seems that there is an internal different between a
      // JavaScript null and a null returned from calling DOM.
      // e.q. by document.getElementById("ReturnedNull").
      return (
        value !== null && (
        value instanceof Array ||
        (value && qx.data && qx.data.IListData && qx.Bootstrap.hasInterface(value.constructor, qx.data.IListData) ) ||
        qx.Bootstrap.getClass(value) == "Array" ||
        (!!value && !!value.$$isArray))
      );
    },


    /**
     * Whether the value is an object. Note that built-in types like Window are
     * not reported to be objects.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is an object.
     */
    isObject : function(value) {
      return (
        value !== undefined &&
        value !== null &&
        qx.Bootstrap.getClass(value) == "Object"
      );
    },


    /**
     * Whether the value is a function.
     *
     * @param value {var} Value to check.
     * @return {Boolean} Whether the value is a function.
     */
    isFunction : function(value) {
      return qx.Bootstrap.getClass(value) == "Function";
    },


    /*
    ---------------------------------------------------------------------------
      CLASS UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */


    /**
     * Whether the given class exists
     *
     * @param name {String} class name to check
     * @return {Boolean} true if class exists
     */
    classIsDefined : function(name) {
      return qx.Bootstrap.getByName(name) !== undefined;
    },

    /**
     * Returns the definition of the given property. Returns null
     * if the property does not exist.
     *
     * TODO: Correctly support refined properties?
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Map|null} whether the object support the given event.
     */
    getPropertyDefinition : function(clazz, name)
    {
      while (clazz)
      {
        if (clazz.$$properties && clazz.$$properties[name]) {
          return clazz.$$properties[name];
        }

        clazz = clazz.superclass;
      }

      return null;
    },


    /**
     * Whether a class has the given property
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the property to check for
     * @return {Boolean} whether the class includes the given property.
     */
    hasProperty : function(clazz, name) {
      return !!qx.Bootstrap.getPropertyDefinition(clazz, name);
    },


    /**
     * Returns the event type of the given event. Returns null if
     * the event does not exist.
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event
     * @return {Map|null} Event type of the given event.
     */
    getEventType : function(clazz, name)
    {
      var clazz = clazz.constructor;

      while (clazz.superclass)
      {
        if (clazz.$$events && clazz.$$events[name] !== undefined) {
          return clazz.$$events[name];
        }

        clazz = clazz.superclass;
      }

      return null;
    },


    /**
     * Whether a class supports the given event type
     *
     * @param clazz {Class} class to check
     * @param name {String} name of the event to check for
     * @return {Boolean} whether the class supports the given event.
     */
    supportsEvent : function(clazz, name) {
      return !!qx.Bootstrap.getEventType(clazz, name);
    },


    /**
     * Returns the class or one of its super classes which contains the
     * declaration of the given interface. Returns null if the interface is not
     * specified anywhere.
     *
     * @param clazz {Class} class to look for the interface
     * @param iface {Interface} interface to look for
     * @return {Class | null} the class which directly implements the given interface
     */
    getByInterface : function(clazz, iface)
    {
      var list, i, l;

      while (clazz)
      {
        if (clazz.$$implements)
        {
          list = clazz.$$flatImplements;

          for (i=0, l=list.length; i<l; i++)
          {
            if (list[i] === iface) {
              return clazz;
            }
          }
        }

        clazz = clazz.superclass;
      }

      return null;
    },


    /**
     * Whether a given class or any of its super classes includes a given interface.
     *
     * This function will return "true" if the interface was defined
     * in the class declaration ({@link qx.Class#define}) of the class
     * or any of its super classes using the "implement"
     * key.
     *
     * @param clazz {Class} class to check
     * @param iface {Interface} the interface to check for
     * @return {Boolean} whether the class includes the interface.
     */
    hasInterface : function(clazz, iface) {
      return !!qx.Bootstrap.getByInterface(clazz, iface);
    },


    /**
     * Returns a list of all mixins available in a given class.
     *
     * @param clazz {Class} class which should be inspected
     * @return {Mixin[]} array of mixins this class uses
     */
    getMixins : function(clazz)
    {
      var list = [];

      while (clazz)
      {
        if (clazz.$$includes) {
          list.push.apply(list, clazz.$$flatIncludes);
        }

        clazz = clazz.superclass;
      }

      return list;
    },


    /*
    ---------------------------------------------------------------------------
      LOGGING UTILITY FUNCTIONS
    ---------------------------------------------------------------------------
    */

    $$logs : [],


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
      qx.Bootstrap.$$logs.push(["debug", arguments]);
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
      qx.Bootstrap.$$logs.push(["info", arguments]);
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
      qx.Bootstrap.$$logs.push(["warn", arguments]);
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
      qx.Bootstrap.$$logs.push(["error", arguments]);
    },


    /**
     * Prints the current stack trace at level "info"
     *
     * @param object {Object} Contextual object (either instance or static class)
     */
    trace : function(object) {}
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * This class is responsible for checking the operating systems name.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.OperatingSystem",
{
  statics :
  {
    /**
     * Checks for the name of the operating system.
     * @return {String} The name of the operating system.
     * @internal
     */
    getName : function() {
      var input = navigator && navigator.platform;
      if (!input) {
        return "";
      }

      if (
        input.indexOf("Windows") != -1 ||
        input.indexOf("Win32") != -1 ||
        input.indexOf("Win64") != -1
      ) {
        return "win";

      } else if (
        input.indexOf("Macintosh") != -1 ||
        input.indexOf("MacPPC") != -1 ||
        input.indexOf("MacIntel") != -1
      ) {
        return "osx";

      } else if (
        input.indexOf("iPod") != -1 ||
        input.indexOf("iPhone") != -1 ||
        input.indexOf("iPad") != -1
      ) {
        return "ios";

      } else if (
        input.indexOf("Linux") != -1
      ) {
        return "linux";

      } else if (
        input.indexOf("X11") != -1 ||
        input.indexOf("BSD") != -1
      ) {
        return "unix";

      } else if (
        input.indexOf("Android") != -1
      ) {
        return "android";

      } else if (
        input.indexOf("SymbianOS") != -1
      ) {
        return "symbian";
      }

      // don't know
      return "";
    },



    /** Maps user agent names to system IDs */
    __ids : {
      // Windows
      "Windows NT 6.1" : "7",
      "Windows NT 6.0" : "vista",
      "Windows NT 5.2" : "2003",
      "Windows NT 5.1" : "xp",
      "Windows NT 5.0" : "2000",
      "Windows 2000" : "2000",
      "Windows NT 4.0" : "nt4",

      "Win 9x 4.90" : "me",
      "Windows CE" : "ce",
      "Windows 98" : "98",
      "Win98" : "98",
      "Windows 95" : "95",
      "Win95" : "95",

      // OS X
      "Mac OS X 10_7" : "10.7",
      "Mac OS X 10.7" : "10.7",
      "Mac OS X 10_6" : "10.6",
      "Mac OS X 10.6" : "10.6",
      "Mac OS X 10_5" : "10.5",
      "Mac OS X 10.5" : "10.5",
      "Mac OS X 10_4" : "10.4",
      "Mac OS X 10.4" : "10.4",
      "Mac OS X 10_3" : "10.3",
      "Mac OS X 10.3" : "10.3",
      "Mac OS X 10_2" : "10.2",
      "Mac OS X 10.2" : "10.2",
      "Mac OS X 10_1" : "10.1",
      "Mac OS X 10.1" : "10.1",
      "Mac OS X 10_0" : "10.0",
      "Mac OS X 10.0" : "10.0"
    },


    /**
     * Checks for the version of the operating system using the internal map.
     *
     * @internal
     * @return {String} The version as strin or an empty string if the version
     *   could not be detected.
     */
    getVersion : function() {
      var str = [];
      for (var key in qx.bom.client.OperatingSystem.__ids) {
        str.push(key);
      }

      var reg = new RegExp("(" + str.join("|").replace(/\./g, "\.") + ")", "g");
      var match = reg.exec(navigator.userAgent);

      if (match && match[1]) {
        return qx.bom.client.OperatingSystem.__ids[match[1]];
      }
      return "";
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class comes with all relevant information regarding
 * the client's selected locale.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Locale",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {

    /**
     * {String} The name of the system locale e.g. "de" when the full
     * locale is "de_AT"
     * @deprecated since 1.4: See qx.core.Environment
     */
    LOCALE : "",

    /**
     * {String} The name of the variant for the system locale e.g.
     * "at" when the full locale is "de_AT"
     * @deprecated since 1.4: See qx.core.Environment
     */
    VARIANT : "",


    /**
     * The name of the system locale e.g. "de" when the full locale is "de_AT"
     * @return {String} The current locale
     * @internal
     */
    getLocale : function() {
      var locale = qx.bom.client.Locale.__getNavigatorLocale();

      var index = locale.indexOf("-");
      if (index != -1) {
        locale = locale.substr(0, index);
      }

      return locale;
    },


    /**
     * The name of the variant for the system locale e.g. "at" when the
     * full locale is "de_AT"
     *
     * @return {String} The locales variant.
     * @internal
     */
    getVariant : function() {
      var locale = qx.bom.client.Locale.__getNavigatorLocale();
      var variant = "";

      var index = locale.indexOf("-");

      if (index != -1) {
        variant = locale.substr(index + 1);
      }

      return variant;
    },


    /**
     * Internal helper for accessing the navigators language.
     *
     * @return {String} The language set by the navigator.
     */
    __getNavigatorLocale : function()
    {
      var locale = (navigator.userLanguage || navigator.language || "");

      // Android Bug: Android does not return the system language from the
      // navigator language. Try to parse the language from the userAgent.
      // See http://code.google.com/p/android/issues/detail?id=4641
      if (qx.bom.client.OperatingSystem.getName() == "android")
      {
        var match = /(\w{2})-(\w{2})/i.exec(navigator.userAgent);
        if (match) {
          locale = match[0];
        }
      }

      return locale.toLowerCase();
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  /**
   * @lint ignoreUndefined(qxvariants)
   */
  defer : function(statics) {
    // @deprecated since 1.4 (whole defer block)
    statics.LOCALE = statics.getLocale();
    statics.VARIANT = statics.getVariant();

    // only when debug is on (@deprecated)
    if (qx.Bootstrap.DEBUG) {
      var keys = ["LOCALE","VARIANT"];
      for (var i = 0; i < keys.length; i++) {
        // check if __defineGetter__ is available
        if (statics.__defineGetter__) {
          var constantValue = statics[keys[i]];
          statics.__defineGetter__(keys[i], qx.Bootstrap.bind(function(key, c) {
            var warning =
              "The constant '"+ key + "' of '" + statics.classname + "'is deprecated: " +
              "Please check the API documentation of qx.core.Environment."
            if (qx.dev && qx.dev.StackTrace) {
              warning += "\nTrace:" + qx.dev.StackTrace.getStackTrace().join("\n")
            }
            qx.Bootstrap.warn(warning);
            return c;
          }, statics, keys[i], constantValue));
        }
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Internal class which contains the checks used by {@link qx.core.Environment}.
 * All checks in here are marked as internal which means you should never use
 * them directly.
 *
 * This class should contain all checks about HTML.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Html",
{
  statics:
  {
    /**
     * Whether the client supports Web Workers.
     *
     * @internal
     * @return {Boolean} <code>true</code> if webworkers are supported
     */
    getWebWorker : function() {
      return window.Worker != null;
    },


    /**
     * Whether the client supports Geo Location.
     *
     * @internal
     * @return {Boolean} <code>true</code> if geolocation supported
     */
    getGeoLocation : function() {
      return navigator.geolocation != null;
    },


    /**
     * Whether the client supports audio.
     *
     * @internal
     * @return {Boolean} <code>true</code> if audio is supported
     */
    getAudio : function() {
      return !!document.createElement('audio').canPlayType;
    },

    /**
     * Whether the client can play ogg audio format.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getAudioOgg : function() {
      if (!qx.bom.client.Html.getAudio()) {
        return "";
      }
      var a = document.createElement("audio");
      return a.canPlayType("audio/ogg");
    },

    /**
     * Whether the client can play mp3 audio format.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getAudioMp3 : function() {
      if (!qx.bom.client.Html.getAudio()) {
        return "";
      }
      var a = document.createElement("audio");
      return a.canPlayType("audio/mpeg");
    },

    /**
     * Whether the client can play wave audio wave format.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getAudioWav : function() {
      if (!qx.bom.client.Html.getAudio()) {
        return "";
      }
      var a = document.createElement("audio");
      return a.canPlayType("audio/x-wav");
    },

    /**
     * Whether the client can play au audio format.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getAudioAu : function() {
      if (!qx.bom.client.Html.getAudio()) {
        return "";
      }
      var a = document.createElement("audio");
      return a.canPlayType("audio/basic");
    },

    /**
     * Whether the client can play aif audio format.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getAudioAif : function() {
      if (!qx.bom.client.Html.getAudio()) {
        return "";
      }
      var a = document.createElement("audio");
      return a.canPlayType("audio/x-aiff");
    },


    /**
     * Whether the client supports video.
     *
     * @internal
     * @return {Boolean} <code>true</code> if video is supported
     */
    getVideo : function() {
      return !!document.createElement('video').canPlayType;
    },

    /**
     * Whether the client supports ogg video.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getVideoOgg : function() {
      if (!qx.bom.client.Html.getVideo()) {
        return "";
      }
      var v = document.createElement("video");
      return v.canPlayType('video/ogg; codecs="theora, vorbis"');
    },

    /**
     * Whether the client supports mp4 video.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getVideoH264 : function() {
      if (!qx.bom.client.Html.getVideo()) {
        return "";
      }
      var v = document.createElement("video");
      return v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
    },

    /**
     * Whether the client supports webm video.
     *
     * @internal
     * @return {String} "" or "maybe" or "probably"
     */
    getVideoWebm : function() {
      if (!qx.bom.client.Html.getVideo()) {
        return "";
      }
      var v = document.createElement("video");
      return v.canPlayType('video/webm; codecs="vp8, vorbis"');
    },

    /**
     * Whether the client supports local storage.
     *
     * @internal
     * @return {Boolean} <code>true</code> if local storage is supported
     */
    getLocalStorage : function() {
      try {
        return window.localStorage != null;
      } catch (exc) {
        // Firefox Bug: Local execution of window.sessionStorage throws error
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=357323
        return false;
      }
    },


    /**
     * Whether the client supports session storage.
     *
     * @internal
     * @return {Boolean} <code>true</code> if session storage is supported
     */
    getSessionStorage : function() {
      try {
        return window.sessionStorage != null;
      } catch (exc) {
        // Firefox Bug: Local execution of window.sessionStorage throws error
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=357323
        return false;
      }
    },


    /**
     * Whether the browser supports CSS class lists.
     * https://developer.mozilla.org/en/DOM/element.classList
     *
     * @internal
     * @return {Boolean} <code>true</code> if class list is supported.
     */
    getClassList : function() {
      return !!(document.documentElement.classList &&
        qx.Bootstrap.getClass(document.documentElement.classList) === "DOMTokenList"
      );
    },


    /**
     * Checks if XPath could be used.
     *
     * @internal
     * @return {Boolean} <code>true</code> if xpath is supported.
     */
    getXPath : function() {
      return !!document.evaluate;
    },


    /**
     * Checks if XUL could be used.
     *
     * @internal
     * @return {Boolean} <code>true</code> if XUL is supported.
     */
    getXul : function() {
      try {
        document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "label");
        return true;
      } catch (e) {
        return false;
      }
    },


    /**
     * Checks if SVG could be used
     *
     * @internal
     * @return {Boolean} <code>true</code> if SVG is supported.
     */
    getSvg : function() {
      return document.implementation && document.implementation.hasFeature &&
        (document.implementation.hasFeature("org.w3c.dom.svg", "1.0") ||
        document.implementation.hasFeature(
          "http://www.w3.org/TR/SVG11/feature#BasicStructure",
          "1.1"
        )
      );
    },


    /**
     * Checks if VML could be used
     *
     * @internal
     * @return {Boolean} <code>true</code> if VML is supported.
     */
    getVml : function() {
      return qx.bom.client.Engine.getName() == "mshtml";
    },


    /**
     * Checks if canvas could be used
     *
     * @internal
     * @return {Boolean} <code>true</code> if canvas is supported.
     */
    getCanvas : function() {
      return !!window.CanvasRenderingContext2D;
    },


    /**
     * Asynchronous check for using data urls.
     *
     * @internal
     * @param callback {Function} The function which should be executed as
     *   soon as the check is done.
     */
    getDataUrl : function(callback) {
      var data = new Image();
      data.onload = data.onerror = function() {
        // wrap that into a timeout because IE might execute it synchronously
        window.setTimeout(function() {
          callback.call(null, (data.width == 1 && data.height == 1));
        }, 0);
      };
      data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
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
     * Carsten Lergenmueller (carstenl)
     * Fabian Jakobs (fbjakobs)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Determines browser-dependent information about the transport layer.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Transport",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Returns the maximum number of parallel requests the current browser
     * supports per host addressed.
     *
     * Note that this assumes one connection can support one request at a time
     * only. Technically, this is not correct when pipelining is enabled (which
     * it currently is only for IE 8 and Opera). In this case, the number
     * returned will be too low, as one connection supports multiple pipelined
     * requests. This is accepted for now because pipelining cannot be
     * detected from JavaScript and because modern browsers have enough
     * parallel connections already - it's unlikely an app will require more
     * than 4 parallel XMLHttpRequests to one server at a time.
     *
     * @internal
     */
    getMaxConcurrentRequestCount: function()
    {
      var maxConcurrentRequestCount;

      // Parse version numbers.
      var versionParts = qx.bom.client.Engine.getVersion().split(".");
      var versionMain = 0;
      var versionMajor = 0;
      var versionMinor = 0;

      // Main number
      if (versionParts[0]) {
        versionMain = versionParts[0];
      }

      // Major number
      if (versionParts[1]) {
        versionMajor = versionParts[1];
      }

      // Minor number
      if (versionParts[2]) {
        versionMinor = versionParts[2];
      }

      // IE 8 gives the max number of connections in a property
      // see http://msdn.microsoft.com/en-us/library/cc197013(VS.85).aspx
      if (window.maxConnectionsPerServer){
        maxConcurrentRequestCount = window.maxConnectionsPerServer;

      } else if (qx.bom.client.Engine.getName() == "opera") {
        // Opera: 8 total
        // see http://operawiki.info/HttpProtocol
        maxConcurrentRequestCount = 8;

      } else if (qx.bom.client.Engine.getName() == "webkit") {
        // Safari: 4
        // http://www.stevesouders.com/blog/2008/03/20/roundup-on-parallel-connections/

        // TODO: Distinguish Chrome from Safari, Chrome has 6 connections
        //       according to
        //      http://stackoverflow.com/questions/561046/how-many-concurrent-ajax-xmlhttprequest-requests-are-allowed-in-popular-browser

        maxConcurrentRequestCount = 4;

      } else if (qx.bom.client.Engine.getName() == "gecko"
                 && ( (versionMain >1)
                      || ((versionMain == 1) && (versionMajor > 9))
                      || ((versionMain == 1) && (versionMajor == 9) && (versionMinor >= 1)))){
          // FF 3.5 (== Gecko 1.9.1): 6 Connections.
          // see  http://gemal.dk/blog/2008/03/18/firefox_3_beta_5_will_have_improved_connection_parallelism/
          maxConcurrentRequestCount = 6;

      } else {
        // Default is 2, as demanded by RFC 2616
        // see http://blogs.msdn.com/ie/archive/2005/04/11/407189.aspx
        maxConcurrentRequestCount = 2;
      }

      return maxConcurrentRequestCount;
    },


    /**
     * Checks whether the app is loaded with SSL enabled which means via https.
     *
     * @internal
     * @return {Boolean} <code>true</code>, if the app runs on https
     */
    getSsl : function() {
      return window.location.protocol === "https:";
    },

    /**
     * Checks what kind of XMLHttpRequest object the browser supports
     * for the current protocol, if any.
     *
     * The standard XMLHttpRequest is preferred over ActiveX XMLHTTP.
     *
     * @internal
     * @return {String}
     *  <code>"xhr"</code>, if the browser provides standard XMLHttpRequest.<br/>
     *  <code>"activex"</code>, if the browser provides ActiveX XMLHTTP.<br/>
     *  <code>""</code>, if there is not XHR support at all.
     */
    getXmlHttpRequest : function() {
      // Standard XHR can be disabled in IE's security settings,
      // therefore provide ActiveX as fallback. Additionaly,
      // standard XHR in IE7 is broken for file protocol.
      var supports = window.ActiveXObject ?
        (function() {
          if ( window.location.protocol !== "file:" ) {
            try {
              new window.XMLHttpRequest();
              return "xhr";
            } catch(noXhr) {}
          }

          try {
            new window.ActiveXObject("Microsoft.XMLHTTP");
            return "activex";
          } catch(noActiveX) {}
        })()
        :
        (function() {
          try {
            new window.XMLHttpRequest();
            return "xhr";
          } catch(noXhr) {}
        })();

      return supports || "";
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Contains detection for QuickTime, Windows Media, DivX, Silverlight adn gears.
 * If no version could be detected the version is set to an empty string as
 * default.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Plugin",
{
  statics :
  {
    /**
     * Checkes for the availability of google gears plugin.
     *
     * @internal
     * @return {Boolean} <code>true</code> if gears is available
     */
    getGears : function() {
      return !!(window.google && window.google.gears);
    },


    /**
     * Database of supported features.
     * Filled with additional data at initialization
     */
    __db :
    {
      quicktime :
      {
        plugin : "QuickTime",
        control : "QuickTimeCheckObject.QuickTimeCheck.1"
        // call returns boolean: instance.IsQuickTimeAvailable(0)
      },

      wmv :
      {
        plugin : "Windows Media",
        control : "WMPlayer.OCX.7"
        // version string in: instance.versionInfo
      },

      divx :
      {
        plugin : "DivX Web Player",
        control : "npdivx.DivXBrowserPlugin.1"
      },

      silverlight :
      {
        plugin : "Silverlight",
        control : "AgControl.AgControl"
        // version string in: instance.version (Silverlight 1.0)
        // version string in: instance.settings.version (Silverlight 1.1)
        // version check possible using instance.IsVersionSupported
      }
    },


    /**
     * Fetches the version of the quicktime plugin.
     * @return {String} The version of the plugin, if available,
     *   an empty string otherwise
     * @internal
     */
    getQuicktimeVersion : function() {
      var entry = qx.bom.client.Plugin.__db["quicktime"];
      return qx.bom.client.Plugin.__getVersion(entry.control, entry.plugin);
    },


    /**
     * Fetches the version of the windows media plugin.
     * @return {String} The version of the plugin, if available,
     *   an empty string otherwise
     * @internal
     */
    getWindowsMediaVersion : function() {
      var entry = qx.bom.client.Plugin.__db["wmv"];
      return qx.bom.client.Plugin.__getVersion(entry.control, entry.plugin);
    },


    /**
     * Fetches the version of the divx plugin.
     * @return {String} The version of the plugin, if available,
     *   an empty string otherwise
     * @internal
     */
    getDivXVersion : function() {
      var entry = qx.bom.client.Plugin.__db["divx"];
      return qx.bom.client.Plugin.__getVersion(entry.control, entry.plugin);
    },


    /**
     * Fetches the version of the silverlight plugin.
     * @return {String} The version of the plugin, if available,
     *   an empty string otherwise
     * @internal
     */
    getSilverlightVersion : function() {
      var entry = qx.bom.client.Plugin.__db["silverlight"];
      return qx.bom.client.Plugin.__getVersion(entry.control, entry.plugin);
    },


    /**
     * Checks if the quicktime plugin is available.
     * @return {Boolean} <code>true</code> if the plugin is available
     * @internal
     */
    getQuicktime : function() {
      var entry = qx.bom.client.Plugin.__db["quicktime"];
      return qx.bom.client.Plugin.__isAvailable(entry.control, entry.plugin);
    },


    /**
     * Checks if the windows media plugin is available.
     * @return {Boolean} <code>true</code> if the plugin is available
     * @internal
     */
    getWindowsMedia : function() {
      var entry = qx.bom.client.Plugin.__db["wmv"];
      return qx.bom.client.Plugin.__isAvailable(entry.control, entry.plugin);
    },


    /**
     * Checks if the divx plugin is available.
     * @return {Boolean} <code>true</code> if the plugin is available
     * @internal
     */
    getDivX : function() {
      var entry = qx.bom.client.Plugin.__db["divx"];
      return qx.bom.client.Plugin.__isAvailable(entry.control, entry.plugin);
    },


    /**
     * Checks if the silverlight plugin is available.
     * @return {Boolean} <code>true</code> if the plugin is available
     * @internal
     */
    getSilverlight : function() {
      var entry = qx.bom.client.Plugin.__db["silverlight"];
      return qx.bom.client.Plugin.__isAvailable(entry.control, entry.plugin);
    },


    /**
     * Internal helper for getting the version of a given plugin.
     *
     * @param activeXName {String} The name which should be used to generate
     *   the test ActiveX Object.
     * @param pluginName {String} The name with which the pugin is listed in
     *   the navigator.plugins list.
     * @return {String} The version of the plugin as string.
     */
    __getVersion : function(activeXName, pluginName) {
      var available = qx.bom.client.Plugin.__isAvailable(
        activeXName, pluginName
      );
      // don't check if the plugin is not available
      if (!available) {
        return "";
      }

      // IE checks
      if (qx.bom.client.Engine.getName() == "mshtml") {
        var obj = new ActiveXObject(activeXName);

        try {
          var version = obj.versionInfo;
          if (version != undefined) {
            return version;
          }

          version = obj.version;
          if (version != undefined) {
            return version;
          }

          version = obj.settings.version;
          if (version != undefined) {
            return version;
          }
        } catch (ex) {
          return "";
        }

        return "";

      // all other browsers
      } else {
        var plugins = navigator.plugins;

        var verreg = /([0-9]\.[0-9])/g;
        for (var i = 0; i < plugins.length; i++)
        {
          var plugin = plugins[i];
          if (plugin.name.indexOf(pluginName) !== -1)
          {
            if (verreg.test(plugin.name) || verreg.test(plugin.description)) {
              return RegExp.$1;
            } else {
              return "";
            }
            return "";
          }
        }
      }
    },


    /**
     * Internal helper for getting the availability of a given plugin.
     *
     * @param activeXName {String} The name which should be used to generate
     *   the test ActiveX Object.
     * @param pluginName {String} The name with which the pugin is listed in
     *   the navigator.plugins list.
     * @return {Boolean} <code>true</code>, if the plugin available
     */
    __isAvailable : function(activeXName, pluginName) {
      // IE checks
      if (qx.bom.client.Engine.getName() == "mshtml") {

        var control = window.ActiveXObject;
        if (!control) {
          return false;
        }

        try {
          new ActiveXObject(activeXName);
        } catch(ex) {
          return false;
        }

        return true;
      // all other
      } else {

        var plugins = navigator.plugins;
        if (!plugins) {
          return false;
        }

        var name;
        for (var i = 0; i < plugins.length; i++)
        {
          name = plugins[i].name;

          if (name.indexOf(pluginName) !== -1) {
            return true;
          }
        }
        return false;
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
     * Sebastian Werner (wpbasti)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class comes with all relevant information regarding
 * the client's engine.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Engine",
{
  // General: http://en.wikipedia.org/wiki/Browser_timeline
  // Webkit: http://developer.apple.com/internet/safari/uamatrix.html
  // Firefox: http://en.wikipedia.org/wiki/History_of_Mozilla_Firefox
  statics :
  {
    /**
     * {String} Name of the client's HTML/JS engine e.g. mshtml, gecko, webkit, opera, khtml
     * @deprecated since 1.4: See qx.core.Environment
     */
    NAME : "",

    /**
     * {String} Full version string with multiple dots (major.minor.revision) e.g. 1.8.1, 8.5.4 #
     * @deprecated since 1.4: See qx.core.Environment
     */
    FULLVERSION : "0.0.0",

    /**
     * {Float} Version of the client's HTML/JS engine e.g. 1.0, 1.7, 1.9
     * @deprecated since 1.4: See qx.core.Environment
     */
    VERSION : 0.0,

    /**
     * {Boolean} Flag to detect if the client is based on the Opera HTML/JS engine
     * @deprecated since 1.4: See qx.core.Environment
     */
    OPERA : false,

    /**
     * {Boolean} Flag to detect if the client is based on the Webkit HTML/JS engine
     * @deprecated since 1.4: See qx.core.Environment
     */
    WEBKIT : false,

    /**
     * {Boolean} Flag to detect if the client is based on the Gecko HTML/JS engine
     * @deprecated since 1.4: See qx.core.Environment
     */
    GECKO : false,

    /**
     * {Boolean} Flag to detect if the client is based on the Internet Explorer HTML/JS engine
     * @deprecated since 1.4: See qx.core.Environment
     */
    MSHTML : false,

    /**
     * {Boolean} Flag to detect if the client engine is assumed
     * @deprecated since 1.4: See qx.core.Environment
     */
    UNKNOWN_ENGINE : false,

    /**
     * {Boolean} Flag to detect if the client engine version is assumed
     * @deprecated since 1.4: See qx.core.Environment
     */
    UNKNOWN_VERSION: false,

    /**
     * {Integer|null} Flag to detect the document mode from the Internet Explorer 8
     *
     * <code>null</code> The document mode is not supported.
     * <code>5</code> Microsoft Internet Explorer 5 mode (also known as "quirks mode").
     * <code>7</code> Internet Explorer 7 Standards mode.
     * <code>8</code> Internet Explorer 8 Standards mode.
     *
     * @deprecated since 1.4: See qx.core.Environment
     */
    DOCUMENT_MODE : null,

    /**
     * Returns the version of the engine.
     *
     * @return {String} The version number of the current engine.
     * @internal
     */
    getVersion : function() {
      var agent = window.navigator.userAgent;

      var version = "";
      if (qx.bom.client.Engine.__isOpera()) {
        // Opera has a special versioning scheme, where the second part is combined
        // e.g. 8.54 which should be handled like 8.5.4 to be compatible to the
        // common versioning system used by other browsers
        if (/Opera[\s\/]([0-9]+)\.([0-9])([0-9]*)/.test(agent))
        {
          version = RegExp.$1 + "." + RegExp.$2;
          if (RegExp.$3 != "") {
            version += "." + RegExp.$3;
          }
        }
      } else if (qx.bom.client.Engine.__isWebkit()) {
        if (/AppleWebKit\/([^ ]+)/.test(agent))
        {
          version = RegExp.$1;

          // We need to filter these invalid characters
          var invalidCharacter = RegExp("[^\\.0-9]").exec(version);

          if (invalidCharacter) {
            version = version.slice(0, invalidCharacter.index);
          }
        }
      } else if (qx.bom.client.Engine.__isGecko()) {
        // Parse "rv" section in user agent string
        if (/rv\:([^\);]+)(\)|;)/.test(agent)) {
          version = RegExp.$1;
        }
      } else if (qx.bom.client.Engine.__isMshtml()) {
        if (/MSIE\s+([^\);]+)(\)|;)/.test(agent)) {
          version = RegExp.$1;

          // If the IE8 or IE9 is running in the compatibility mode, the MSIE value
          // is set to an older version, but we need the correct version. The only
          // way is to compare the trident version.
          if (version < 8 && /Trident\/([^\);]+)(\)|;)/.test(agent)) {
            if (RegExp.$1 == "4.0") {
              version = "8.0";
            } else if (RegExp.$1 == "5.0") {
              version = "9.0";
            }
          }
        }
      } else {
        var failFunction = window.qxFail;
        if (failFunction && typeof failFunction === "function") {
          version = failFunction().FULLVERSION;
        } else {
          version = "1.9.0.0";
          qx.Bootstrap.warn("Unsupported client: " + agent
            + "! Assumed gecko version 1.9.0.0 (Firefox 3.0).");
        }
      }

      return version;
    },


    /**
     * Returns the name of the engine.
     *
     * @return {String} The name of the current engine.
     * @internal
     */
    getName : function() {
      var name;
      if (qx.bom.client.Engine.__isOpera()) {
        name = "opera";
      } else if (qx.bom.client.Engine.__isWebkit()) {
        name = "webkit";
      } else if (qx.bom.client.Engine.__isGecko()) {
        name = "gecko";
      } else if (qx.bom.client.Engine.__isMshtml()) {
        name = "mshtml";
      } else {
        // check for the fallback
        var failFunction = window.qxFail;
        if (failFunction && typeof failFunction === "function") {
          name = failFunction().NAME;
        } else {
          name = "gecko";
          qx.Bootstrap.warn("Unsupported client: " + window.navigator.userAgent
            + "! Assumed gecko version 1.9.0.0 (Firefox 3.0).");
        }
      }
      return name;
    },


    /**
     * Internal helper for checking for opera.
     * @return {boolean} true, if its opera.
     */
    __isOpera : function() {
      return window.opera &&
        Object.prototype.toString.call(window.opera) == "[object Opera]";
    },


    /**
     * Internal helper for checking for webkit.
     * @return {boolean} true, if its webkit.
     */
    __isWebkit : function() {
      return window.navigator.userAgent.indexOf("AppleWebKit/") != -1;
    },


    /**
     * Internal helper for checking for gecko.
     * @return {boolean} true, if its gecko.
     */
    __isGecko : function() {
      return window.controllers && window.navigator.product === "Gecko";
    },


    /**
     * Internal helper to check for MSHTML.
     * @return {boolean} true, if its MSHTML.
     */
    __isMshtml : function() {
      return window.navigator.cpuClass &&
        /MSIE\s+([^\);]+)(\)|;)/.test(window.navigator.userAgent);
    }
  },




  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  /**
   * @lint ignoreUndefined(qxvariants)
   */
  defer : function(statics) {
    // @deprecated since 1.4: all code in the defer
    statics.NAME = statics.getName();

    // check the version
    statics.FULLVERSION = statics.getVersion();
    if (statics.FULLVERSION == "") {
      statics.UNKNOWN_VERSION = true;
    }

    if (statics.__isOpera()) {
      statics.OPERA = true;
      if (statics.FULLVERSION == "") {
        statics.FULLVERSION = "9.6.0";
      }
    } else if (statics.__isWebkit()) {
      statics.WEBKIT = true;
      if (statics.FULLVERSION == "") {
        statics.FULLVERSION = "525.26";
      }
    } else if (statics.__isGecko()) {
      statics.GECKO = true;
      if (statics.FULLVERSION == "") {
        statics.FULLVERSION = "1.9.0.0";
      }
    } else if (statics.__isMshtml()) {
      statics.MSHTML = true;
      if (document.documentMode) {
        statics.DOCUMENT_MODE = document.documentMode;
      }
    } else {
      // check for the fallback
      var failFunction = window.qxFail;
      if (failFunction && typeof failFunction === "function") {
        if (failFunction().NAME) {
          statics[failFunction().NAME.toUpperCase()] = true;
        }
      } else {
        statics.GECKO = true;
        statics.UNKNOWN_ENGINE = true;
        statics.UNKNOWN_VERSION = true;
      }
    }

    statics.VERSION = parseFloat(statics.FULLVERSION);

    // only when debug is on (@deprecated)
    if (qx.Bootstrap.DEBUG) {
      // add deprecation warnings
      var keys = ["NAME", "FULLVERSION","VERSION","OPERA","WEBKIT",
        "GECKO","MSHTML","UNKNOWN_ENGINE","UNKNOWN_VERSION","DOCUMENT_MODE"];
      for (var i = 0; i < keys.length; i++) {
        // check if __defineGetter__ is available
        if (statics.__defineGetter__) {
          var constantValue = statics[keys[i]];
          statics.__defineGetter__(keys[i], qx.Bootstrap.bind(function(key, c) {
            var warning =
              "The constant '"+ key + "' of '" + statics.classname + "'is deprecated: " +
              "Please check the API documentation of qx.core.Environment."
            if (qx.dev && qx.dev.StackTrace) {
              warning += "\nTrace:" + qx.dev.StackTrace.getStackTrace().join("\n")
            }
            qx.Bootstrap.warn(warning);
            return c;
          }, statics, keys[i], constantValue));
        }
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

   ======================================================================

   This class contains code from:

     Copyright:
       2009 Deutsche Telekom AG, Germany, http://telekom.com

     License:
       LGPL: http://www.gnu.org/licenses/lgpl.html
       EPL: http://www.eclipse.org/org/documents/epl-v10.php

     Authors:
       * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Basic browser detection for qooxdoo.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Browser",
{
  statics :
  {
    /**
     * {Boolean} Whether the browser could not be determined
     * @deprecated since 1.4: See qx.core.Environment
     */
    UNKNOWN : true,

    /**
     * {String} Name of the browser
     * @deprecated since 1.4: See qx.core.Environment
     */
    NAME : "unknown",

    /**
     * {String} Combination of name and version e.g. "firefox 3.5"
     * @deprecated since 1.4: See qx.core.Environment
     */
    TITLE : "unknown 0.0",

    /**
     * {Number} Floating point number of browser version
     * @deprecated since 1.4: See qx.core.Environment
     */
    VERSION : 0.0,

    /**
     * {String} Full version. Might contain two dots e.g. "3.5.1"
     * @deprecated since 1.4: See qx.core.Environment
     */
    FULLVERSION : "0.0.0",


    /**
     * Checks for the name of the browser and returns it.
     * @return {String} The name of the current browser.
     * @internal
     */
    getName : function() {
      var agent = navigator.userAgent;
      var reg = new RegExp("(" + qx.bom.client.Browser.__agents + ")(/| )([0-9]+\.[0-9])");
      var match = agent.match(reg);
      if (!match) {
        return "";
      }

      var name = match[1].toLowerCase();

      var engine = qx.bom.client.Engine.getName();
      if (engine === "webkit")
      {
        if (name === "android")
        {
          // Fix Chrome name (for instance wrongly defined in user agent on Android 1.6)
          name = "mobile chrome";
        }
        else if (agent.indexOf("Mobile Safari") !== -1 || agent.indexOf("Mobile/") !== -1)
        {
          // Fix Safari name
          name = "mobile safari";
        }
      }
      else if (engine ===  "mshtml")
      {
        if (name === "msie")
        {
          name = "ie";

          // Fix IE mobile before Microsoft added IEMobile string
          if (qx.bom.client.OperatingSystem.getVersion() === "ce") {
            name = "iemobile";
          }
        }
      }
      else if (engine === "opera")
      {
        if (name === "opera mobi") {
          name = "operamobile";
        } else if (name === "opera mini") {
          name = "operamini";
        }
      }

      return name;
    },


    /**
     * Determines the version of the current browser.
     * @return {String} The name of the current browser.
     * @internal
     */
    getVersion : function() {
      var agent = navigator.userAgent;
      var reg = new RegExp("(" + qx.bom.client.Browser.__agents + ")(/| )([0-9]+\.[0-9])");
      var match = agent.match(reg);
      if (!match) {
        return "";
      }

      var name = match[1].toLowerCase();
      var version = match[3];

      // Support new style version string used by Opera and Safari
      if (agent.match(/Version(\/| )([0-9]+\.[0-9])/)) {
        version = RegExp.$2;
      }

      if (qx.bom.client.Engine.getName() == "mshtml")
      {
        // Use the Engine version, because IE8 and higher change the user agent
        // string to an older version in compatibility mode
        version = qx.bom.client.Engine.getVersion();

        if (name === "msie" && qx.bom.client.OperatingSystem.getVersion() == "ce") {
          // Fix IE mobile before Microsoft added IEMobile string
          version = "5.0";
        }
      }

      return version;
    },


    /**
     * Returns in which document mode the current document is (only for IE).
     *
     * @internal
     * @return {Number} The mode in which the browser is.
     */
    getDocumentMode : function() {
      if (document.documentMode) {
        return document.documentMode;
      }
      return 0;
    },


    /**
     * Check if in quirks mode.
     *
     * @internal
     * @return {Boolean} <code>true</code>, if the environment is in quirks mode
     */
    getQuirksMode : function() {
      if(qx.bom.client.Engine.getName() == "mshtml" &&
        parseFloat(qx.bom.client.Engine.getVersion()) >= 8)
      {
        return qx.bom.client.Engine.DOCUMENT_MODE === 5;
      } else {
        return document.compatMode !== "CSS1Compat";
      }
    },


    /**
     * Internal helper map for picking the right browser names to check.
     */
    __agents : {
      // Safari should be the last one to check, because some other Webkit-based browsers
      // use this identifier together with their own one.
      // "Version" is used in Safari 4 to define the Safari version. After "Safari" they place the
      // Webkit version instead. Silly.
      // Palm Pre uses both Safari (contains Webkit version) and "Version" contains the "Pre" version. But
      // as "Version" is not Safari here, we better detect this as the Pre-Browser version. So place
      // "Pre" in front of both "Version" and "Safari".
      "webkit" : "AdobeAIR|Titanium|Fluid|Chrome|Android|Epiphany|Konqueror|iCab|OmniWeb|Maxthon|Pre|Mobile Safari|Safari",

      // Better security by keeping Firefox the last one to match
      "gecko" : "prism|Fennec|Camino|Kmeleon|Galeon|Netscape|SeaMonkey|Firefox",

      // No idea what other browsers based on IE's engine
      "mshtml" : "IEMobile|Maxthon|MSIE",

      // Keep "Opera" the last one to correctly prefer/match the mobile clients
      "opera" : "Opera Mini|Opera Mobi|Opera"
    }[qx.bom.client.Engine.getName()]
  },

  /**
   * @lint ignoreUndefined(qxvariants)
   */
  defer : function(statics) {
    // @deprecated since 1.4: all code in this defer method
    statics.NAME = statics.getName();
    statics.FULLVERSION = statics.getVersion();
    statics.VERSION = parseFloat(statics.FULLVERSION);
    statics.TITLE = statics.NAME + " " + statics.VERSION;

    if (statics.NAME !== "") {
      statics.UNKNOWN = false;
    }

    // only when debug is on (@deprecated)
    if (qx.Bootstrap.DEBUG) {
      // add @deprecation warnings
      var keys = ["FULLVERSION","VERSION","NAME","TITLE", "UNKNOWN"];
      for (var i = 0; i < keys.length; i++) {
        // check if __defineGetter__ is available
        if (statics.__defineGetter__) {
          var constantValue = statics[keys[i]];
          statics.__defineGetter__(keys[i], qx.Bootstrap.bind(function(key, c) {
            var warning =
              "The constant '"+ key + "' of '" + statics.classname + "'is deprecated: " +
              "Please check the API documentation of qx.core.Environment."
            if (qx.dev && qx.dev.StackTrace) {
              warning += "\nTrace:" + qx.dev.StackTrace.getStackTrace().join("\n")
            }
            qx.Bootstrap.warn(warning);
            return c;
          }, statics, keys[i], constantValue));
        }
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/* ************************************************************************

#ignore(WebKitCSSMatrix)

************************************************************************ */

/**
 * The purpose of this class is to contain all checks about css.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Css",
{
  statics :
  {
    /**
     * Checks what box model is used in the current environemnt.
     * @return {String} It either returns "content" or "border".
     * @internal
     */
    getBoxModel : function() {
      var content = qx.bom.client.Engine.getName() !== "mshtml" ||
        !qx.bom.client.Browser.getQuirksMode() ;

      return content ? "content" : "border";
    },


    /**
     * Checks if text overflow could be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getTextOverflow : function() {
      return "textOverflow" in document.documentElement.style ||
        "OTextOverflow" in document.documentElement.style;
    },


    /**
     * Checks if a placeholder could be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getPlaceholder : function() {
      var i = document.createElement("input");
      return "placeholder" in i;
    },


    /**
     * Checks if border radius could be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getBorderRadius : function() {
      return "borderRadius" in document.documentElement.style ||
        "MozBorderRadius" in document.documentElement.style ||
        "WebkitBorderRadius" in document.documentElement.style;
    },


    /**
     * Checks if box shadow could be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getBoxShadow : function() {
      return "boxShadow" in document.documentElement.style ||
        "MozBoxShadow" in document.documentElement.style ||
        "WebkitBoxShadow" in document.documentElement.style;
    },


    /**
     * Checks if translate3d can be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     * @lint ignoreUndefined(WebKitCSSMatrix)
     */
    getTranslate3d : function()
    {
      return 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix();
    },


    /**
     * Checks if background gradients could be used.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getGradients : function() {
      var el;
      try {
        el = document.createElement("div");
      } catch (ex) {
        el = document.createElement();
      }

      var style = [
        "-webkit-gradient(linear,0% 0%,100% 100%,from(white), to(red))",
        "-moz-linear-gradient(0deg, white 0%, red 100%)",
        "-o-linear-gradient(0deg, white 0%, red 100%)",
        "linear-gradient(0deg, white 0%, red 100%)"
      ];

      for (var i=0; i < style.length; i++) {
        // try catch for IE
        try {
          el.style["background"] = style[i];
          if (el.style["background"].indexOf("gradient") != -1) {
            return true;
          }
        } catch (ex) {}
      };

      return false;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * The purpose of this class is to contain all checks for PhoneGap.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.PhoneGap",
{
  statics :
  {
    /**
     * Checks if PhoneGap is available.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getPhoneGap : function() {
      return "PhoneGap" in window;
    },


    /**
     * Checks if notifications can be displayed.
     * @return {Boolean} <code>true</code>, if it could be used.
     * @internal
     */
    getNotification : function() {
      return "notification" in navigator;
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
     * Martin Wittemann (martinwittemann)

   ======================================================================

   This class contains code based on the following work:

   * SWFFix
     http://www.swffix.org
     Version 0.3 (r17)

     Copyright:
       (c) 2007 SWFFix developers

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Geoff Stearns
       * Michael Williams
       * Bobby van der Sluis

************************************************************************ */

/* ************************************************************************

#require(qx.bom.client.OperatingSystem)

************************************************************************ */

/**
 * This class contains all Flash detection.
 *
 * It is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Flash",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * {Boolean} If Flash support is available
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    AVAILABLE : false,

    /**
     * {String} Full version string with multiple dots (major.minor.revision) e.g. 1.8.1, 8.5.4, ...
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    FULLVERSION : "0.0.0",

    /**
     * {String} Revision string e.g. 0, 124, ...
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    REVISION : "0",

    /**
     * {Float} Version of the installed flash player e.g. 9.0, 6.0, ...
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    VERSION : 0.0,

    /**
     * {Boolean} Whether the system supports express installation
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    EXPRESSINSTALL : false,

    /**
     * {Boolean} Whether the flash version uses the new security model or
     * not (since 9.0.151.0 && 10.0.12.36)
     * @deprecated since 1.4: Please take a look at qx.core.Environment.get
     */
    STRICT_SECURITY_MODEL : false,


    /**
     * Checks if the flash plugin is available.
     * @return {Boolean} <code>true</code>, if flash is available.
     * @internal
     */
    isAvailable : function() {
      return parseFloat(qx.bom.client.Flash.getVersion()) > 0;
    },


    /**
     * Checks for the version of flash and returns it as a string. If the
     * version could not be detected, an empty string will be returnd.
     *
     * @return {String} The version number as string.
     * @internal
     */
    getVersion : function() {
      if (qx.bom.client.Engine.getName() == "mshtml") {
        if (!window.ActiveXObject) {
          return "";
        }

        var full = [0,0,0];
        var fp6Crash = false;

        try {
          var obj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
        }
        catch(ex)
        {
          try
          {
            var obj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
            full = [ 6, 0, 21 ];
            obj.AllowScriptAccess = "always";
          }
          catch(ex)
          {
            if (full[0] == 6) {
              fp6Crash = true;
            }
          }

          if (!fp6Crash)
          {
            try {
              obj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            } catch(ex) {}
          }
        }

        if (!fp6Crash && typeof obj == "object")
        {
          var info = obj.GetVariable("$version");

          if (typeof info != "undefined")
          {
            info = info.split(" ")[1].split(",");
            full[0] = parseInt(info[0], 10);
            full[1] = parseInt(info[1], 10);
            full[2] = parseInt(info[2], 10);
          }
        }

        return full.join(".");

      // all other browsers
      } else {
        if (!navigator.plugins || typeof navigator.plugins["Shockwave Flash"] !== "object") {
          return "";
        }

        var full = [0,0,0];
        var desc = navigator.plugins["Shockwave Flash"].description;

        if (typeof desc != "undefined")
        {
          desc = desc.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
          full[0] = parseInt(desc.replace(/^(.*)\..*$/, "$1"), 10);
          full[1] = parseInt(desc.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
          full[2] = /r/.test(desc) ? parseInt(desc.replace(/^.*r(.*)$/, "$1"), 10) : 0;
        }

        return full.join(".");
      }
    },


    /**
     * Checks if the flash installation is an expres installation.
     *
     * @return {Boolean} <code>true</code>, if its an express installation.
     * @internal
     */
    getExpressInstall : function() {
      var availableVersion = qx.bom.client.Flash.getVersion();
      if (availableVersion == "") {
        return false;
      }

      var os = qx.bom.client.OperatingSystem.getName();
      return (os == "win" || os == "osx") &&
        qx.bom.client.Flash.__supportsVersion("6.0.65", availableVersion);
    },


    /**
     * Checks if a strict security model is available.
     *
     * @return {Boolean} <code>true</code>, if its available.
     * @internal
     */
    getStrictSecurityModel : function() {
      var version = qx.bom.client.Flash.getVersion();
      if (version == "") {
        return false;
      }
      var full = version.split(".");

      if (full[0] < 10) {
        return qx.bom.client.Flash.__supportsVersion("9.0.151", version);
      } else {
        return qx.bom.client.Flash.__supportsVersion("10.0.12", version);
      }
    },


    /**
     * Storage for supported Flash versions.
     *
     * @internal
     */
    _cachedSupportsVersion : {},


    /**
     * If the system support the given version of Flash(TM) movie.
     *
     * @deprecated aince 1.4
     *
     * @param input {String} Version string e.g. 6.0.64
     * @return {Boolean} <code>true</code> when supported, otherwise <code>false</code>
     */
    supportsVersion : function(input)
    {
      if (typeof this._cachedSupportsVersion[input] === "boolean")
      {
        return this._cachedSupportsVersion[input];
      }
      else
      {
        var splitInput = input.split(".");
        var system = this.FULLVERSION.split(".");

        for (var i=0; i<splitInput.length; i++)
        {
          var diff = parseInt(system[i], 10) - parseInt(splitInput[i], 10);
          if (diff > 0) {
            return (this._cachedSupportsVersion[input] = true);
          } else if (diff < 0) {
            return (this._cachedSupportsVersion[input] = false);
          }
        }

        return (this._cachedSupportsVersion[input] = true);
      }
    },


    /**
     * Check if the first given version is supported by either the current
     * version available on the system or the optional given second parameter.
     *
     * @param input {String} The version to check.
     * @param availableVersion {String} The version available on the current
     *   system.
     * @return {Boolean} <code>true</code>, if the version is supported.
     */
    __supportsVersion : function(input, availableVersion) {
      var splitInput = input.split(".");
      var system = availableVersion || qx.bom.client.Flash.getVersion();
      system = system.split(".");

      for (var i=0; i<splitInput.length; i++)
      {
        var diff = parseInt(system[i], 10) - parseInt(splitInput[i], 10);
        if (diff > 0) {
          return true;
        } else if (diff < 0) {
          return false;
        }
      }
      return true;
    }
  },


  /*
  *****************************************************************************
     DEFER
  *****************************************************************************
  */
  /**
   * @lint ignoreUndefined(qxvariants)
   */
  defer : function(statics) {
    // @deprecated since 1.4 (whole defer block)
    statics.FULLVERSION = statics.getVersion();
    statics.VERSION = parseFloat(statics.FULLVERSION);
    statics.AVAILABLE = statics.isAvailable();
    var full = statics.FULLVERSION.split(".");
    statics.REVISION = full[full.length-1];
    statics.STRICT_SECURITY_MODEL = statics.getStrictSecurityModel();
    statics.EXPRESSINSTALL = statics.getExpressInstall();

    // only when debug is on (@deprecated)
    if (qx.Bootstrap.DEBUG) {
      // add @deprecation warnings
      var keys = ["FULLVERSION", "VERSION", "AVAILABLE",
        "REVISION", "STRICT_SECURITY_MODEL", "EXPRESSINSTALL"];
      for (var i = 0; i < keys.length; i++) {
        // check if __defineGetter__ is available
        if (statics.__defineGetter__) {
          var constantValue = statics[keys[i]];
          statics.__defineGetter__(keys[i], qx.Bootstrap.bind(function(key, c) {
            var warning =
              "The constant '"+ key + "' of '" + statics.classname + "'is deprecated: " +
              "Please check the API documentation of qx.core.Environment."
            if (qx.dev && qx.dev.StackTrace) {
              warning += "\nTrace:" + qx.dev.StackTrace.getStackTrace().join("\n")
            }
            qx.Bootstrap.warn(warning);
            return c;
          }, statics, keys[i], constantValue));
        }
      }
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The main purpose of this class to hold all checks about ECMAScript.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.EcmaScript",
{
  statics :
  {
    /**
     * Checks if the ECMAScript object count could be used:
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object#Properties_2
     *
     * @internal
     * @return {Boolean} <code>true</code> if the count is available.
     */
    getObjectCount : function() {
      return (({}).__count__ == 0);
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The class is responsible for device detection. This is specially usefull
 * if you are on a mobile device.
 *
 * This class is used by {@link qx.core.Environment} and should not be used
 * directly. Please check its class comment for details how to use it.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Device",
{
  statics :
  {
    /** Maps user agent names to device IDs */
    __ids : {
      "iPod" : "ipod",
      "iPad" : "ipad",
      "iPhone" : "iPhone",

      "PSP" : "psp",
      "PLAYSTATION 3" : "ps3",
      "Nintendo Wii" : "wii",
      "Nintendo DS" : "ds",
      "XBOX" : "xbox",
      "Xbox" : "xbox"
    },


    /**
     * Returns the name of the current device if detectable. It falls back to
     * <code>pc</code> if the detection for other devices fails.
     *
     * @internal
     * @return {String} The string of the device found.
     */
    getName : function() {
      var str = [];
      for (var key in this.__ids) {
        str.push(key);
      }

      var reg = new RegExp("(" + str.join("|").replace(/\./g, "\.") + ")", "g");
      var match = reg.exec(navigator.userAgent);

      if (match && match[1]) {
        return qx.bom.client.Device.__ids[match[1]];
      }
      return "pc";
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Internal class which contains the checks used by {@link qx.core.Environment}.
 * All checks in here are marked as internal which means you should never use
 * them directly.
 *
 * This class should contain all checks about events.
 *
 * @internal
 */
qx.Bootstrap.define("qx.bom.client.Event",
{
  statics :
  {
    /**
     * Checks if touch events are supported.
     *
     * @internal
     * @return {Boolean} <code>true</code> if touch events are supported.
     */
    getTouch : function() {
      return ("ontouchstart" in window);
    },


    /**
     * Checks if pointer events are available.
     *
     * @internal
     * @return {Boolean} <code>true</code> if pointer events are supported.
     */
    getPointer : function() {
      // Check if browser reports that pointerEvents is a known style property
      if ("pointerEvents" in document.documentElement.style) {
        // Opera 10.63 incorrectly advertises support for CSS pointer events (#4229).
        // Do not rely on pointer events in Opera until this browser issue is fixed.
        // IE9 only supports pointer events only for SVG.
        // See http://msdn.microsoft.com/en-us/library/ff972269%28v=VS.85%29.aspx
        var browserName = qx.bom.client.Engine.getName();
        return browserName != "opera" && browserName != "mshtml";
      }
      return false;
    }
  }
});

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2005-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is the single point to access all settings that may be different
 * in different environments. This contains e.g. the browser name, engine
 * version but also qooxdoo or application specific settings.
 *
 * It's public API can be found in its four main methods. One pair of methods
 * are used to check the synchronous values of the environment. The other pais
 * is used for asynchronous checks.
 *
 * The most used method should be {@link #get} which is used to return the
 * current value for a given environment check.
 *
 * All qx settings can be changed via the generator's config. See the manual
 * for more details about the environment key in the config. As you can see
 * from the methods API, there is no way to override an existing key. So if you
 * need to change a qx setting, you have to use the generator to do so.
 *
 * The following table shows all checks which could be used. If you are
 * interessted in more details, check the reference to the implementation of
 * each check. Plese do not use these check implementation directly due to the
 * missing caching feature the Environment class offers.
 *
 * <table border="0" cellspacing="10">
 *   <tbody>
 *     <tr>
 *       <td colspan="4"><h2>Synchronous checks</h2>
 *       </td>
 *     </tr>
 *     <tr>
 *       <th><h3>Key</h3></th>
 *       <th><h3>Type</h3></th>
 *       <th><h3>Example</h3></th>
 *       <th><h3>Details</h3></th>
 *     </tr>
 *     <tr>
 *       <td colspan="4"><b>browser</b></td>
 *     </tr>
 *     <tr>
 *       <td>browser.documentmode</td><td><i>Integer</em></td><td><code>0</code></td>
 *       <td>{@link qx.bom.client.Browser#getDocumentMode}</td>
 *     </tr>
 *     <tr>
 *       <td>browser.name</td><td><i>String</em></td><td><code> chrome </code></td>
 *       <td>{@link qx.bom.client.Browser#getName}</td>
 *     </tr>
 *     <tr>
 *       <td>browser.quirksmode</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Browser#getQuirksMode}</td>
 *     </tr>
 *     <tr>
 *       <td>browser.version</td><td><i>String</em></td><td><code>11.0</code></td>
 *       <td>{@link qx.bom.client.Browser#getVersion}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>css</b></td>
 *     </tr>
 *     <tr>
 *       <td>css.borderradius</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getBorderRadius}</td>
 *     </tr>
 *     <tr>
 *       <td>css.boxmodel</td><td><i>String</em></td><td><code>content</code></td>
 *       <td>{@link qx.bom.client.Css#getBoxModel}</td>
 *     </tr>
 *     <tr>
 *       <td>css.boxshadow</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getBoxShadow}</td>
 *     </tr>
 *     <tr>
 *       <td>css.gradients</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getGradients}</td>
 *     </tr>
 *     <tr>
 *       <td>css.placeholder</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getPlaceholder}</td>
 *     </tr>
 *     <tr>
 *       <td>css.textoverflow</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getTextOverflow}</td>
 *     </tr>
 *     <tr>
 *       <td>css.translate3d</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Css#getTranslate3d}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>device</b></td>
 *     </tr>
 *     <tr>
 *       <td>device.name</td><td><i>String</em></td><td><code>pc</code></td>
 *       <td>{@link qx.bom.client.Device#getName}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>ecmascript</b></td>
 *     </tr>
 *     <tr>
 *       <td>ecmascript.objectcount</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.EcmaScript#getObjectCount}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>engine</b></td>
 *     </tr>
 *     <tr>
 *       <td>engine.name</td><td><i>String</em></td><td><code>webkit</code></td>
 *       <td>{@link qx.bom.client.Engine#getName}</td>
 *     </tr>
 *     <tr>
 *       <td>engine.version</td><td><i>String</em></td><td><code>534.24</code></td>
 *       <td>{@link qx.bom.client.Engine#getVersion}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>event</b></td>
 *     </tr>
 *     <tr>
 *       <td>event.pointer</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Event#getPointer}</td>
 *     </tr>
 *     <tr>
 *       <td>event.touch</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Event#getTouch}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>html</b></td>
 *     </tr>
 *     <tr>
 *       <td>html.audio</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getAudio}</td>
 *     </tr>
 *     <tr>
 *       <td>html.audio.mp3</td><td><i>String</em></td><td><code>""</code></td>
 *       <td>{@link qx.bom.client.Html#getAudioMp3}</td>
 *     </tr>
 *     <tr>
 *       <td>html.audio.ogg</td><td><i>String</em></td><td><code>"maybe"</code></td>
 *       <td>{@link qx.bom.client.Html#getAudioOgg}</td>
 *     </tr>
 *     <tr>
 *       <td>html.audio.wav</td><td><i>String</em></td><td><code>"probably"</code></td>
 *       <td>{@link qx.bom.client.Html#getAudioWav}</td>
 *     </tr>
 *     <tr>
 *       <td>html.audio.ai</td><td><i>String</em></td><td><code>"maybe"</code></td>
 *       <td>{@link qx.bom.client.Html#getAudioAi}</td>
 *     </tr>
 *     <tr>
 *       <td>html.audio.aif</td><td><i>String</em></td><td><code>"probably"</code></td>
 *       <td>{@link qx.bom.client.Html#getAudioAif}</td>
 *     </tr>
 *     <tr>
 *       <td>html.canvas</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getCanvas}</td>
 *     </tr>
 *     <tr>
 *       <td>html.classlist</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getClassList}</td>
 *     </tr>
 *     <tr>
 *       <td>html.geolocation</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getGeoLocation}</td>
 *     </tr>
 *     <tr>
 *       <td>html.storage.local</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getLocalStorage}</td>
 *     </tr>
 *     <tr>
 *       <td>html.storage.session</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getSessionStorage}</td>
 *     </tr>
 *     <tr>
 *       <td>html.svg</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getSvg}</td>
 *     </tr>
 *     <tr>
 *       <td>html.video</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getVideo}</td>
 *     </tr>
 *     <tr>
 *       <td>html.video.h264</td><td><i>String</em></td><td><code>"probably"</code></td>
 *       <td>{@link qx.bom.client.Html#getVideoH264}</td>
 *     </tr>
 *     <tr>
 *       <td>html.video.ogg</td><td><i>String</em></td><td><code>""</code></td>
 *       <td>{@link qx.bom.client.Html#getVideoOgg}</td>
 *     </tr>
 *     <tr>
 *       <td>html.video.webm</td><td><i>String</em></td><td><code>"maybe"</code></td>
 *       <td>{@link qx.bom.client.Html#getVideoWebm}</td>
 *     </tr>
 *     <tr>
 *       <td>html.vml</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Html#getVml}</td>
 *     </tr>
 *     <tr>
 *       <td>html.webworker</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getWebWorker}</td>
 *     </tr>
 *     <tr>
 *       <td>html.xpath</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getXPath}</td>
 *     </tr>
 *     <tr>
 *       <td>html.xul</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getXul}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>io</b></td>
 *     </tr>
 *     <tr>
 *       <td>io.maxrequests</td><td><i>Integer</em></td><td><code>4</code></td>
 *       <td>{@link qx.bom.client.Transport#getMaxConcurrentRequestCount}</td>
 *     </tr>
 *     <tr>
 *       <td>io.ssl</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Transport#getSsl}</td>
 *     </tr>
 *     <tr>
 *       <td>io.xhr</td><td><i>String</em></td><td><code>xhr</code></td>
 *       <td>{@link qx.bom.client.Transport#getXmlHttpRequest}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>locale</b></td>
 *     </tr>
 *     <tr>
 *       <td>locale</td><td><i>String</em></td><td><code>de</code></td>
 *       <td>{@link qx.bom.client.Locale#getLocale}</td>
 *     </tr>
 *     <tr>
 *       <td>locale.variant</td><td><i>String</em></td><td><code>de</code></td>
 *       <td>{@link qx.bom.client.Locale#getVariant}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>os</b></td>
 *     </tr>
 *     <tr>
 *       <td>os.name</td><td><i>String</em></td><td><code>osx</code></td>
 *       <td>{@link qx.bom.client.OperatingSystem#getName}</td>
 *     </tr>
 *     <tr>
 *       <td>os.version</td><td><i>String</em></td><td><code>10.6</code></td>
 *       <td>{@link qx.bom.client.OperatingSystem#getVersion}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>phonegap</b></td>
 *     </tr>
 *     <tr>
 *       <td>phonegap</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.PhoneGap#getPhoneGap}</td>
 *     </tr>
 *     <tr>
 *       <td>phonegap.notification</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.PhoneGap#getNotification}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>plugin</b></td>
 *     </tr>
 *     <tr>
 *       <td>plugin.divx</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Plugin#getDivX}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.divx.version</td><td><i>String</em></td><td></td>
 *       <td>{@link qx.bom.client.Plugin#getDivXVersion}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.flash</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Flash#isAvailable}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.flash.express</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Flash#getExpressInstall}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.flash.strictsecurity</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Flash#getStrictSecurityModel}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.flash.version</td><td><i>String</em></td><td><code>10.2.154</code></td>
 *       <td>{@link qx.bom.client.Flash#getVersion}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.gears</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Plugin#getGears}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.quicktime</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Plugin#getQuicktime}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.quicktime.version</td><td><i>String</em></td><td><code>7.6</code></td>
 *       <td>{@link qx.bom.client.Plugin#getQuicktimeVersion}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.silverlight</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Plugin#getSilverlight}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.silverlight.version</td><td><i>String</em></td><td></td>
 *       <td>{@link qx.bom.client.Plugin#getSilverlightVersion}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.windowsmedia</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td>{@link qx.bom.client.Plugin#getWindowsMedia}</td>
 *     </tr>
 *     <tr>
 *       <td>plugin.windowsmedia.version</td><td><i>String</em></td><td></td>
 *       <td>{@link qx.bom.client.Plugin#getWindowsMediaVersion}</td>
 *     </tr>

 *     <tr>
 *       <td colspan="4"><b>qx</b></td>
 *     </tr>
 *     <tr>
 *       <td>qx.allowUrlSettings</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.allowUrlVariants</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.application</td><td><i>String</em></td><td><code>name.space</code></td>
 *       <td><i>default:</i> <code>&lt;&lt;application name&gt;&gt;</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.aspects</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.debug</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>true</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.debug.databinding</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.disposerDebugLevel</td><td><i>Integer</em></td><td><code>0</code></td>
 *       <td><i>default:</i> <code>0</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.dynamicmousewheel</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>true</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.dynlocale</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>true</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.globalErrorHandling</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.mobile.emulatetouch</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.mobile.nativescroll</td><td><i>Boolean</em></td><td><code>false</code></td>
 *       <td><i>default:</i> <code>false</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.propertyDebugLevel</td><td><i>Integer</em></td><td><code>0</code></td>
 *       <td><i>default:</i> <code>0</code></td>
 *     </tr>
 *     <tr>
 *       <td>qx.theme</td><td><i>String</em></td><td><code>qx.theme.Modern</code></td>
 *       <td><i>default:</i> <code>&lt;&lt;theme name&gt;&gt;</code></td>
 *     </tr>
 *     <tr>
 *       <td colspan="4"><h3>Asynchronous checks</h3>
 *       </td>
 *     </tr>
 *     <tr>
 *       <td>html.dataurl</td><td><i>Boolean</em></td><td><code>true</code></td>
 *       <td>{@link qx.bom.client.Html#getDataUrl}</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 */
qx.Bootstrap.define("qx.core.Environment",
{
  statics : {

    /** Map containing the synchronous check functions. */
    _checks : {},
    /** Map containing the asynchronous check functions. */
    _asyncChecks : {},

    /** Internal cache for all checks. */
    __cache : {},


    /**
     * The default accessor for the checks. It returns the value the current
     * environment has for the given key. The key could be something like
     * "qx.debug", "css.textoverflow" or "io.ssl". A complete list of
     * checks can be found in the class comment of this class.
     *
     * Please keep in mind that the result is cached. If you want to run the
     * check function again in case something could have been changed, take a
     * look at the {@link #invalidateCacheKey} function.
     *
     * @param key {String} The name of the check you want to query.
     */
    get : function(key) {
      // check the cache
      if (this.__cache[key] != undefined) {
        return this.__cache[key];
      }

      // search for a fitting check
      var check = this._checks[key];
      if (check) {
        // execute the check and write the result in the cache
        var value = check();
        this.__cache[key] = value;
        return value;
      }

      // debug flag
      if (qx.Bootstrap.DEBUG) {
        qx.Bootstrap.warn(
          key + " is not a valid key. Please see the API-doc of " +
          "qx.core.Environment for a list of predefined keys."
        );
        qx.Bootstrap.trace(this);
      }
    },


    /**
     * Invokes the callback as soon as the check has been done. If no check
     * could be found, a warning will be printed.
     *
     * @param key {String} The key of the asynchronous check.
     * @param callback {Function} The function to call as soon as the check is
     *   done. The function should have one argument which is the result of the
     *   check.
     * @param self {var} The context to use when invoking the callback.
     */
    getAsync : function(key, callback, self) {
      // check the cache
      var env = this;
      if (this.__cache[key] != undefined) {
        // force async behavior
        window.setTimeout(function() {
          callback.call(self, env.__cache[key]);
        }, 0);
        return;
      }

      var check = this._asyncChecks[key];
      if (check) {
        check(function(result) {
          env.__cache[key] = result;
          callback.call(self, result);
        });
        return;
      }

      // debug flag
      if (qx.Bootstrap.DEBUG) {
        qx.Bootstrap.warn(
          key + " is not a valid key. Please see the API-doc of " +
          "qx.core.Environment for a list of predefined keys."
        );
        qx.Bootstrap.trace(this);
      }
    },


    /**
     * Returns the proper value dependent on the check for the given key.
     *
     * @param key {String} The name of the check the select depends on.
     * @param values {Map} A map containing the values which should be returned
     *   in any case. The "default" key could be used as a catch all statement.
     * @return {var} The value which is stored in the map for the given
     *   check of the key.
     */
    select : function(key, values) {
      return this.__pickFromValues(this.get(key), values);
    },


    /**
     * Selects the proper function dependent on the asynchronous check.
     *
     * @param key {String} The key for the async check.
     * @param values {Map} A map containing functions. The map keys should
     *   contain all possibilities which could be returned by the given check
     *   key. The "default" key could be used as a catch all statement.
     *   The called function will get one parameter, the result of the query.
     * @param self {var} The context which should be used when calling the
     *   method in the values map.
     */
    selectAsync : function(key, values, self) {
      this.getAsync(key, function(result) {
        var value = this.__pickFromValues(key, values);
        value.call(self, result)
      }, this);
    },


    /**
     * Internal helper which tries to pick the given key from the given values
     * map. If that key is not found, it tries to use a key named "default".
     * If there is also no default key, it prints out a warning and returns
     * undefined.
     *
     * @param key {String} The key to search for in the values.
     * @param values {Map} A map containing some keys.
     * @return {var} The value stored as values[key] usually.
     */
    __pickFromValues : function(key, values) {
      var value = values[key];
      if (values.hasOwnProperty(key)) {
        return value;
      }

      // check for piped values
      for (var id in values) {
        if (id.indexOf("|") != -1) {
          var ids = id.split("|");
          for (var i = 0; i < ids.length; i++) {
            if (ids[i] == key) {
              return values[id];
            }
          };
        }
      }

      // @deprecated since 1.4: This is only for deprecation of
      // qx.core.Variant.select

      // check for true --> on
      if (value === true && values["on"] != undefined) {
        if (qx.Bootstrap.DEBUG)
        {
          qx.Bootstrap.warn(
            "The check '" + key + "' is a boolean value. "+
            "Please change your select map from 'on' to 'true'."
          );
          qx.Bootstrap.trace(this);
        }
        return values["on"];
      }

      // check for false --> off
      if (value === false && values["off"] != undefined) {
        if (qx.Bootstrap.DEBUG)
        {
          qx.Bootstrap.warn(
            "The check '" + key + "' is a boolean value. "+
            "Please change your select map from 'off' to 'false'."
          );
          qx.Bootstrap.trace(this);
        }
        return values["off"];
      }


      if (values["default"] !== undefined) {
        return values["default"];
      }

      if (qx.Bootstrap.DEBUG)
      {
        throw new Error('No match for variant "' + key +
          '" (' + (typeof key) + ' type)' +
          ' in variants [' + qx.Bootstrap.getKeysAsString(values) +
          '] found, and no default ("default") given');
      }
    },


    /**
     * Invalidates the cache for the given key.
     *
     * @param key {String} The key of the check.
     */
    invalidateCacheKey : function(key) {
      delete this.__cache[key];
    },


    /**
     * Add a check to the environment class. If there is already a check
     * added for the given key, the add will be ignored.
     *
     * @param key {String} The key for the check e.g. html.featurexyz.
     * @param check {var} It could be either a function or a simple value.
     *   The function should be responsible for the check and should return the
     *   result of the check.
     */
    add : function(key, check) {
      // ignore already added checks.
      if (this._checks[key] == undefined) {
        // add functions directly
        if (check instanceof Function) {
          this._checks[key] = check;
        // otherwise, create a check function and use that
        } else {
          this._checks[key] = this.__createCheck(check);
        }
      }
    },


    /**
     * Adds an asynchronous check to the environment. If there is already a check
     * added for the given key, the add will be ignored.
     *
     * @param key {String} The key of the check e.g. html.featureabc
     * @param check {Function} A function which should check for a specific
     *   environment setting in an asynchronous way. The method should take two
     *   arguments. First one is the callback and the second one is the context.
     */
    addAsync : function(key, check) {
      if (this._checks[key] == undefined) {
        this._asyncChecks[key] = check;
      }
    },



    /**
     * Initializer for the default values of the framework settings.
     */
    _initDefaultQxValues : function() {
      // old settings
      this.add("qx.allowUrlSettings", function() {return false;});
      this.add("qx.allowUrlVariants", function() {return false;});
      this.add("qx.propertyDebugLevel", function() {return 0;});

      // old variants
      // make sure to reflect all changes to qx.debug here to thebootstrap class!
      this.add("qx.debug", function() {return true;});
      this.add("qx.aspects", function() {return false;});
      this.add("qx.dynlocale", function() {return true;});
      this.add("qx.mobile.emulatetouch", function() {return false;});
      this.add("qx.mobile.nativescroll", function() {return false;});

      this.add("qx.dynamicmousewheel", function() {return true;});
      this.add("qx.debug.databinding", function() {return false;});
    },


    /**
     * Import checks from global qx.$$environment into the Environment class.
     */
    __importFromGenerator : function()
    {
      // @deprecated since 1.4: import from settings map in case someone
      // added it manually
      if (window.qxsettings)
      {
        for (var key in window.qxsettings) {
          var value = window.qxsettings[key];
          if (
            key == "qx.bom.htmlarea.HtmlArea.debug" ||
            key == "qx.globalErrorHandling"
          ) {
            // normalization for "on" and "off" @deprecated since 1.4
            if (value == "on") {
              value = true;
            } else if (value == "off") {
              value = false;
            }
          }

          this._checks[key] = this.__createCheck(value);
        }
      }

      // @deprecated since 1.4: import from variants map in case someone
      // added it manually
      if (window.qxvariants)
      {
        for (var key in window.qxvariants) {
          var value = window.qxvariants[key];
          if (
            key == "qx.aspects" ||
            key == "qx.debug" ||
            key == "qx.dynlocale" ||
            key == "qx.mobile.emulatetouch" ||
            key == "qx.mobile.nativescroll"
          ) {
            // normalization for "on" and "off" @deprecated since 1.4
            if (value == "on") {
              value = true;
            } else if (value == "off") {
              value = false;
            }
          }

          this._checks[key] = this.__createCheck(value);
        }
      }

      // import the environment map
      if (qx && qx.$$environment)
      {
        for (var key in qx.$$environment) {
          var value = qx.$$environment[key];

          this._checks[key] = this.__createCheck(value);
        }
      }
    },


    /**
     * Checks the URL for environment settings and imports these into the
     * Environment class.
     */
    __importFromUrl : function() {
      if (window.document && window.document.location) {
        var urlChecks = window.document.location.search.slice(1).split("&");

        for (var i = 0; i < urlChecks.length; i++)
        {
          var check = urlChecks[i].split(":");
          if (check.length != 3 || check[0] != "qxenv") {
            continue;
          }

          var key = check[1];
          var value = decodeURIComponent(check[2]);

          // implicit type conversion
          if (value == "true") {
            value = true;
          } else if (value == "false") {
            value = false;
          } else if (/^(\d|\.)+$/.test(value)) {
            value = parseFloat(value);
          }

          this._checks[key] = this.__createCheck(value);
        }
      }
    },


    /**
     * Internal helper which creates a function retuning the given value.
     *
     * @param value {var} The value which should be returned.
     * @return {Function} A function which could be used by a test.
     */
    __createCheck : function(value) {
      return qx.Bootstrap.bind(function(value) {
        return value;
      }, null, value);
    },


    /**
     * Internal helper for the generator to flag that this block contains the
     * dependency for the given check key.
     *
     * @internal
     * @param key {String} the check key.
     * @return {Boolean} Always true
     */
    useCheck : function(key) {
      return true;
    },


    /**
     * Initializer for the checks which are available on runtime.
     */
    _initChecksMap : function() {
      // CAUTION! If you edit this function, be sure to use the following
      // pattern to asure the removal of the generator on demand.
      // if (this.useCheck("check.name")) {
      //   this._checks["check.name"] = checkFunction;
      // }
      // Also keep in mind to change the class comment to reflect the current
      // available checks.

      // /////////////////////////////////////////
      // Engine
      // /////////////////////////////////////////
      if (this.useCheck("engine.version")) {
        this._checks["engine.version"] = qx.bom.client.Engine.getVersion;
      }
      if (this.useCheck("engine.name")) {
        this._checks["engine.name"] = qx.bom.client.Engine.getName;
      }

      // /////////////////////////////////////////
      // Browser
      // /////////////////////////////////////////
      if (this.useCheck("browser.name")) {
        this._checks["browser.name"] = qx.bom.client.Browser.getName;
      }
      if (this.useCheck("browser.version")) {
        this._checks["browser.version"] = qx.bom.client.Browser.getVersion;
      }
      if (this.useCheck("browser.documentmode")) {
        this._checks["browser.documentmode"] = qx.bom.client.Browser.getDocumentMode;
      }
      if (this.useCheck("browser.quirksmode")) {
        this._checks["browser.quirksmode"] = qx.bom.client.Browser.getQuirksMode;
      }

      // /////////////////////////////////////////
      // DEVICE
      // /////////////////////////////////////////
      if (this.useCheck("device.name")) {
        this._checks["device.name"] = qx.bom.client.Device.getName;
      }

      // /////////////////////////////////////////
      // LOCALE
      // /////////////////////////////////////////
      if (this.useCheck("locale")) {
        this._checks["locale"] = qx.bom.client.Locale.getLocale;
      }

      if (this.useCheck("locale.variant")) {
        this._checks["locale.variant"] = qx.bom.client.Locale.getVariant;
      }

      // /////////////////////////////////////////
      // OPERATING SYSTEM
      // /////////////////////////////////////////
      if (this.useCheck("os.name")) {
        this._checks["os.name"] = qx.bom.client.OperatingSystem.getName;
      }
      if (this.useCheck("os.version")) {
        this._checks["os.version"] = qx.bom.client.OperatingSystem.getVersion;
      }

      // /////////////////////////////////////////
      // plugin
      // /////////////////////////////////////////
      if (this.useCheck("plugin.gears")) {
        this._checks["plugin.gears"] = qx.bom.client.Plugin.getGears;
      }

      if (this.useCheck("plugin.quicktime")) {
        this._checks["plugin.quicktime"] = qx.bom.client.Plugin.getQuicktime;
      }
      if (this.useCheck("plugin.quicktime.version")) {
        this._checks["plugin.quicktime.version"] = qx.bom.client.Plugin.getQuicktimeVersion;
      }

      if (this.useCheck("plugin.windowsmedia")) {
        this._checks["plugin.windowsmedia"] = qx.bom.client.Plugin.getWindowsMedia;
      }
      if (this.useCheck("plugin.windowsmedia.version")) {
        this._checks["plugin.windowsmedia.version"] = qx.bom.client.Plugin.getWindowsMediaVersion;
      }

      if (this.useCheck("plugin.divx")) {
        this._checks["plugin.divx"] = qx.bom.client.Plugin.getDivX;
      }
      if (this.useCheck("plugin.divx.version")) {
        this._checks["plugin.divx.version"] = qx.bom.client.Plugin.getDivXVersion;
      }

      if (this.useCheck("plugin.silverlight")) {
        this._checks["plugin.silverlight"] = qx.bom.client.Plugin.getSilverlight;
      }
      if (this.useCheck("plugin.silverlight.version")) {
        this._checks["plugin.silverlight.version"] = qx.bom.client.Plugin.getSilverlightVersion;
      }

      if (this.useCheck("plugin.flash")) {
        this._checks["plugin.flash"] = qx.bom.client.Flash.isAvailable;
      }
      if (this.useCheck("plugin.flash.version")) {
        this._checks["plugin.flash.version"] = qx.bom.client.Flash.getVersion;
      }
      if (this.useCheck("plugin.flash.express")) {
        this._checks["plugin.flash.express"] = qx.bom.client.Flash.getExpressInstall;
      }
      if (this.useCheck("plugin.flash.strictsecurity")) {
        this._checks["plugin.flash.strictsecurity"] = qx.bom.client.Flash.getStrictSecurityModel;
      }

      // /////////////////////////////////////////
      // IO
      // /////////////////////////////////////////
      if (this.useCheck("io.maxrequests")) {
        this._checks["io.maxrequests"] = qx.bom.client.Transport.getMaxConcurrentRequestCount;
      }
      if (this.useCheck("io.ssl")) {
        this._checks["io.ssl"] = qx.bom.client.Transport.getSsl;
      }
      if (this.useCheck("io.xhr")) {
        this._checks["io.xhr"] = qx.bom.client.Transport.getXmlHttpRequest;
      }

      // /////////////////////////////////////////
      // EVENTS
      // /////////////////////////////////////////
      if (this.useCheck("event.touch")) {
        this._checks["event.touch"] = qx.bom.client.Event.getTouch;
      }

      if (this.useCheck("event.pointer")) {
        this._checks["event.pointer"] = qx.bom.client.Event.getPointer;
      }

      // /////////////////////////////////////////
      // ECMA SCRIPT
      // /////////////////////////////////////////
      if (this.useCheck("ecmascript.objectcount")) {
        this._checks["ecmascript.objectcount"] =
          qx.bom.client.EcmaScript.getObjectCount;
      }

      // /////////////////////////////////////////
      // HTML
      // /////////////////////////////////////////
      if (this.useCheck("html.webworker")) {
        this._checks["html.webworker"] = qx.bom.client.Html.getWebWorker;
      }
      if (this.useCheck("html.geolocation")) {
        this._checks["html.geolocation"] = qx.bom.client.Html.getGeoLocation;
      }
      if (this.useCheck("html.audio")) {
        this._checks["html.audio"] = qx.bom.client.Html.getAudio;
      }
      if (this.useCheck("html.audio.ogg")) {
        this._checks["html.audio.ogg"] = qx.bom.client.Html.getAudioOgg;
      }
      if (this.useCheck("html.audio.mp3")) {
        this._checks["html.audio.mp3"] = qx.bom.client.Html.getAudioMp3;
      }
      if (this.useCheck("html.audio.wav")) {
        this._checks["html.audio.wav"] = qx.bom.client.Html.getAudioWav;
      }
      if (this.useCheck("html.audio.au")) {
        this._checks["html.audio.au"] = qx.bom.client.Html.getAudioAu;
      }
      if (this.useCheck("html.audio.aif")) {
        this._checks["html.audio.aif"] = qx.bom.client.Html.getAudioAif;
      }
      if (this.useCheck("html.video")) {
        this._checks["html.video"] = qx.bom.client.Html.getVideo;
      }
      if (this.useCheck("html.video.ogg")) {
        this._checks["html.video.ogg"] = qx.bom.client.Html.getVideoOgg;
      }
      if (this.useCheck("html.video.h264")) {
        this._checks["html.video.h264"] = qx.bom.client.Html.getVideoH264;
      }
      if (this.useCheck("html.video.webm")) {
        this._checks["html.video.webm"] = qx.bom.client.Html.getVideoWebm;
      }
      if (this.useCheck("html.storage.local")) {
        this._checks["html.storage.local"] = qx.bom.client.Html.getLocalStorage;
      }
      if (this.useCheck("html.storage.session")) {
        this._checks["html.storage.session"] = qx.bom.client.Html.getSessionStorage;
      }
      if (this.useCheck("html.classlist")) {
        this._checks["html.classlist"] = qx.bom.client.Html.getClassList;
      }

      if (this.useCheck("html.xpath")) {
        this._checks["html.xpath"] = qx.bom.client.Html.getXPath;
      }
      if (this.useCheck("html.xul")) {
        this._checks["html.xul"] = qx.bom.client.Html.getXul;
      }

      if (this.useCheck("html.canvas")) {
        this._checks["html.canvas"] = qx.bom.client.Html.getCanvas;
      }
      if (this.useCheck("html.svg")) {
        this._checks["html.svg"] = qx.bom.client.Html.getSvg;
      }
      if (this.useCheck("html.vml")) {
        this._checks["html.vml"] = qx.bom.client.Html.getVml;
      }
      if (this.useCheck("html.dataurl")) {
        this._asyncChecks["html.dataurl"] = qx.bom.client.Html.getDataUrl;
      }

      // /////////////////////////////////////////
      // CSS
      // /////////////////////////////////////////
      if (this.useCheck("css.textoverflow")) {
        this._checks["css.textoverflow"] = qx.bom.client.Css.getTextOverflow;
      }

      if (this.useCheck("css.placeholder")) {
        this._checks["css.placeholder"] = qx.bom.client.Css.getPlaceholder;
      }

      if (this.useCheck("css.borderradius")) {
        this._checks["css.borderradius"] = qx.bom.client.Css.getBorderRadius;
      }

      if (this.useCheck("css.boxshadow")) {
        this._checks["css.boxshadow"] = qx.bom.client.Css.getBoxShadow;
      }

      if (this.useCheck("css.gradients")) {
        this._checks["css.gradients"] = qx.bom.client.Css.getGradients;
      }

      if (this.useCheck("css.boxmodel")) {
        this._checks["css.boxmodel"] = qx.bom.client.Css.getBoxModel;
      }

      if (this.useCheck("css.translate3d")) {
        this._checks["css.translate3d"] = qx.bom.client.Css.getTranslate3d;
      }

      // /////////////////////////////////////////
      // PHONEGAP
      // /////////////////////////////////////////
      if (this.useCheck("phonegap")) {
        this._checks["phonegap"] = qx.bom.client.PhoneGap.getPhoneGap;
      }

      if (this.useCheck("phonegap.notification")) {
        this._checks["phonegap.notification"] = qx.bom.client.PhoneGap.getNotification;
      }
    }
  },


  defer : function(statics) {
    // create default values for the environment class
    statics._initDefaultQxValues();
    // first initialize the defined checks
    statics._initChecksMap();
    // load the checks from the generator
    statics.__importFromGenerator();
    // load the checks from the url
    if (statics.get("qx.allowUrlSettings") != true) {
      statics.__importFromUrl();
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
 * Theme classes contain styling information for certain aspects of the
 * graphical user interface.
 *
 * Supported themes are: colors, decorations, fonts, icons, appearances.
 * The additional meta theme allows for grouping of the individual
 * themes.
 *
 * For more details, take a look at the
 * <a href='http://manual.qooxdoo.org/1.4/pages/gui_toolkit/ui_theming.html' target='_blank'>
 * documentation of the theme system in the qooxdoo manual.</a>
 */
qx.Bootstrap.define("qx.Theme",
{
  statics:
  {
    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Theme config
     *
     * Example:
     * <pre class='javascript'>
     * qx.Theme.define("name",
     * {
     *   aliases : {
     *     "aliasKey" : "resourceFolderOrUri"
     *   },
     *   extend : otherTheme,
     *   include : [MMixinTheme],
     *   patch : [MMixinTheme],
     *   colors : {},
     *   decorations : {},
     *   fonts : {},
     *   icons : {},
     *   widgets : {},
     *   appearances : {},
     *   meta : {}
     * });
     * </pre>
     *
     * For more details, take a look at the
     * <a href='http://manual.qooxdoo.org/1.4/pages/gui_toolkit/ui_theming.html' target='_blank'>
     * documentation of the theme system in the qooxdoo manual.</a>
     *
     * @param name {String} name of the mixin
     * @param config {Map} config structure
     * @return {void}
     */
    define : function(name, config)
    {
      if (!config) {
        var config = {};
      }

      config.include = this.__normalizeArray(config.include);
      config.patch = this.__normalizeArray(config.patch);

      // Validate incoming data
      if (qx.core.Environment.get("qx.debug")) {
        this.__validateConfig(name, config);
      }

      // Create alias
      var theme =
      {
        $$type : "Theme",
        name : name,
        title : config.title,

        // Attach toString
        toString : this.genericToString
      };

      // Remember extend
      if (config.extend) {
        theme.supertheme = config.extend;
      }

      // Assign to namespace
      theme.basename = qx.Bootstrap.createNamespace(name, theme);

      // Convert theme entry from Object to Function (for prototype inheritance)
      this.__convert(theme, config);

      this.__initializeAliases(theme, config);

      // Store class reference in global class registry
      this.$$registry[name] = theme;

      // Include mixin themes
      for (var i=0, a=config.include, l=a.length; i<l; i++) {
        this.include(theme, a[i]);
      }

      for (var i=0, a=config.patch, l=a.length; i<l; i++) {
        this.patch(theme, a[i]);
      }
    },

    /**
     * Normalize an object to an array
     *
     * @param objectOrArray {Object|Array} Either an object that is to be
     *   normalized to an array, or an array, which is just passed through
     *
     * @return {Array} Either an array that has the original object as its
     *   single item, or the original array itself
     */
    __normalizeArray : function(objectOrArray)
    {
      if (!objectOrArray) {
        return [];
      }

      if (qx.Bootstrap.isArray(objectOrArray)) {
        return objectOrArray;
      } else {
        return [objectOrArray];
      }
    },


    /**
     * Initialize alias inheritance
     *
     * @param theme {Map} The theme
     * @param config {Map} config structure
     */
    __initializeAliases : function(theme, config)
    {
      var aliases = config.aliases || {};
      if (config.extend && config.extend.aliases) {
        qx.Bootstrap.objectMergeWith(aliases, config.extend.aliases, false);
      }

      theme.aliases = aliases;
    },


    /**
     * Return a map of all known themes
     *
     * @return {Map} known themes
     */
    getAll : function() {
      return this.$$registry;
    },


    /**
     * Returns a theme by name
     *
     * @param name {String} theme name to check
     * @return {Object ? void} theme object
     */
    getByName : function(name) {
      return this.$$registry[name];
    },


    /**
     * Determine if theme exists
     *
     * @param name {String} theme name to check
     * @return {Boolean} true if theme exists
     */
    isDefined : function(name) {
      return this.getByName(name) !== undefined;
    },


    /**
     * Determine the number of themes which are defined
     *
     * @return {Number} the number of classes
     */
    getTotalNumber : function() {
      return qx.Bootstrap.objectGetLength(this.$$registry);
    },




    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL API
    ---------------------------------------------------------------------------
    */

    /**
     * This method will be attached to all themes to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The interface identifier
     */
    genericToString : function() {
      return "[Theme " + this.name + "]";
    },


    /**
     * Extract the inheritable key (could be only one)
     *
     * @param config {Map} The map from where to extract the key
     * @return {String} the key which was found
     */
    __extractType : function(config)
    {
      for (var i=0, keys=this.__inheritableKeys, l=keys.length; i<l; i++)
      {
        if (config[keys[i]]) {
          return keys[i];
        }
      }
    },


    /**
     * Convert existing entry to a prototype based inheritance function
     *
     * @param theme {Theme} newly created theme object
     * @param config {Map} incoming theme configuration
     */
    __convert : function(theme, config)
    {
      var type = this.__extractType(config);

      // Use theme key from extended theme if own one is not available
      if (config.extend && !type) {
        type = config.extend.type;
      }

      // Save theme type
      theme.type = type || "other";

      // Return if there is no key defined at all
      if (!type) {
        return;
      }

      // Create pseudo class
      var clazz = function() {};

      // Process extend config
      if (config.extend) {
        clazz.prototype = new config.extend.$$clazz;
      }

      var target = clazz.prototype;
      var source = config[type];

      // Copy entries to prototype
      for (var id in source)
      {
        target[id] = source[id];

        // Appearance themes only:
        // Convert base flag to class reference (needed for mixin support)
        if (target[id].base)
        {
          if (qx.core.Environment.get("qx.debug"))
          {
            if (!config.extend) {
              throw new Error("Found base flag in entry '" + id + "' of theme '" + config.name + "'. Base flags are not allowed for themes without a valid super theme!");
            }
          }

          target[id].base = config.extend;
        }
      }

      // store pseudo class
      theme.$$clazz = clazz;

      // and create instance under the old key
      theme[type] = new clazz;
    },


    /** {Map} Internal theme registry */
    $$registry : {},


    /** {Array} Keys which support inheritance */
    __inheritableKeys : [ "colors", "borders", "decorations", "fonts", "icons", "widgets", "appearances", "meta" ],


    /** {Map} allowed keys in theme definition */
    __allowedKeys : qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "title"       : "string", // String
        "aliases"     : "object", // Map
        "type"        : "string", // String
        "extend"      : "object", // Theme
        "colors"      : "object", // Map
        "borders"     : "object", // Map
        "decorations" : "object", // Map
        "fonts"       : "object", // Map
        "icons"       : "object", // Map
        "widgets"     : "object", // Map
        "appearances" : "object", // Map
        "meta"        : "object", // Map
        "include"     : "object", // Array
        "patch"       : "object"  // Array
      },

      "default" : null
    }),

    /** {Map} allowed keys inside a meta theme block */
    __metaKeys :qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "color" : "object",
        "border" : "object",
        "decoration" : "object",
        "font" : "object",
        "icon" : "object",
        "appearance" : "object",
        "widget" : "object"
      },

      "default" : null
    }),

    /**
     * Validates incoming configuration and checks keys and values
     *
     * @signature function(name, config)
     * @param name {String} The name of the class
     * @param config {Map} Configuration map
     * @return {void}
     * @throws An error if the given config is not valid (e.g. wrong key or wrong key value)
     */
    __validateConfig : qx.core.Environment.select("qx.debug",
    {
      "true": function(name, config)
      {
        var allowed = this.__allowedKeys;
        for (var key in config)
        {
          if (allowed[key] === undefined) {
            throw new Error('The configuration key "' + key + '" in theme "' + name + '" is not allowed!');
          }

          if (config[key] == null) {
            throw new Error('Invalid key "' + key + '" in theme "' + name + '"! The value is undefined/null!');
          }

          if (allowed[key] !== null && typeof config[key] !== allowed[key]) {
            throw new Error('Invalid type of key "' + key + '" in theme "' + name + '"! The type of the key must be "' + allowed[key] + '"!');
          }
        }

        // Validate maps
        var maps = [ "colors", "borders", "decorations", "fonts", "icons", "widgets", "appearances", "meta" ];
        for (var i=0, l=maps.length; i<l; i++)
        {
          var key = maps[i];

          if (config[key] !== undefined && (config[key] instanceof Array || config[key] instanceof RegExp || config[key] instanceof Date || config[key].classname !== undefined)) {
            throw new Error('Invalid key "' + key + '" in theme "' + name + '"! The value needs to be a map!');
          }
        }

        // Check conflicts (detect number ...)
        var counter = 0;
        for (var i=0, l=maps.length; i<l; i++)
        {
          var key = maps[i];

          if (config[key]) {
            counter++;
          }

          if (counter > 1) {
            throw new Error("You can only define one theme category per file! Invalid theme: " + name);
          }
        }

        // At least one entry
        if (!config.extend && counter === 0) {
          throw new Error("You must define at least one entry in your theme configuration :" + name);
        }

        // Validate meta
        if (config.meta)
        {
          var value;
          for (var key in config.meta)
          {
            value = config.meta[key];

            if (this.__metaKeys[key] === undefined) {
              throw new Error('The key "' + key + '" is not allowed inside a meta theme block.');
            }

            if (typeof value !== this.__metaKeys[key]) {
              throw new Error('The type of the key "' + key + '" inside the meta block is wrong.');
            }

            if (!(typeof value === "object" && value !== null && value.$$type === "Theme")) {
              throw new Error('The content of a meta theme must reference to other themes. The value for "' + key + '" in theme "' + name + '" is invalid: ' + value);
            }
          }
        }

        // Validate extend
        if (config.extend && config.extend.$$type !== "Theme") {
          throw new Error('Invalid extend in theme "' + name + '": ' + config.extend);
        }

        // Validate include
        if (config.include) {
          for (var i=0,l=config.include.length; i<l; i++) {
            if (typeof(config.include[i]) == "undefined" || config.include[i].$$type !== "Theme") {
              throw new Error('Invalid include in theme "' + name + '": ' + config.include[i]);
            }
          }
        }

        // Validate patch
        if (config.patch) {
          for (var i=0,l=config.patch.length; i<l; i++) {
            if (typeof(config.patch[i])  == "undefined" || config.patch[i].$$type !== "Theme") {
              throw new Error('Invalid patch in theme "' + name + '": ' + config.patch[i]);
            }
          }
        }
      },

      "default" : function() {}
    }),


    /**
     * Include all keys of the given mixin theme into the theme. The mixin may
     * include keys which are already defined in the target theme. Existing
     * features of equal name will be overwritten.
     *
     * @param theme {Theme} An existing theme which should be modified by including the mixin theme.
     * @param mixinTheme {Theme} The theme to be included.
     */
    patch : function(theme, mixinTheme)
    {
      var type = this.__extractType(mixinTheme);
      if (type !== this.__extractType(theme)) {
        throw new Error("The mixins '" + theme.name + "' are not compatible '" + mixinTheme.name + "'!");
      }

      var source = mixinTheme[type];
      var target = theme.$$clazz.prototype;

      for (var key in source) {
        target[key] = source[key];
      }
    },


    /**
     * Include all keys of the given mixin theme into the theme. If the
     * mixin includes any keys that are already available in the
     * class, they will be silently ignored. Use the {@link #patch} method
     * if you need to overwrite keys in the current class.
     *
     * @param theme {Theme} An existing theme which should be modified by including the mixin theme.
     * @param mixinTheme {Theme} The theme to be included.
     */
    include : function(theme, mixinTheme)
    {
      var type = mixinTheme.type;
      if (type !== theme.type) {
        throw new Error("The mixins '" + theme.name + "' are not compatible '" + mixinTheme.name + "'!");
      }

      var source = mixinTheme[type];
      var target = theme.$$clazz.prototype;

      for (var key in source)
      {
        //Skip keys already present
        if (target[key] !== undefined) {
          continue;
        }

        target[key] = source[key];
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
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)

************************************************************************ */

/**
 * This class is used to define interfaces (similar to Java interfaces).
 *
 * See the description of the {@link #define} method how an interface is
 * defined.
 */
qx.Bootstrap.define("qx.Interface",
{
  statics :
  {
    /*
    ---------------------------------------------------------------------------
       PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Define a new interface. Interface definitions look much like class definitions.
     *
     * The main difference is that the bodies of functions defined in <code>members</code>
     * and <code>statics</code> are called before the original function with the
     * same arguments. This can be used to check the passed arguments. If the
     * checks fail, an exception should be thrown. It is convenient to use the
     * method defined in {@link qx.core.MAssert} to check the arguments.
     *
     * In the <code>build</code> version the checks are omitted.
     *
     * For properties only the names are required so the value of the properties
     * can be empty maps.
     *
     * Example:
     * <pre class='javascript'>
     * qx.Interface.define("name",
     * {
     *   extend: [SuperInterfaces],
     *
     *   statics:
     *   {
     *     PI : 3.14
     *   },
     *
     *   properties: {"color": {}, "name": {} },
     *
     *   members:
     *   {
     *     meth1: function() {},
     *     meth2: function(a, b) { this.assertArgumentsCount(arguments, 2, 2); },
     *     meth3: function(c) { this.assertInterface(c.constructor, qx.some.Interface); }
     *   },
     *
     *   events :
     *   {
     *     keydown : "qx.event.type.KeySequence"
     *   }
     * });
     * </pre>
     *
     * @param name {String} name of the interface
     * @param config {Map ? null} Interface definition structure. The configuration map has the following keys:
     *   <table>
     *     <tr><th>Name</th><th>Type</th><th>Description</th></tr>
     *     <tr><th>extend</th><td>Interface |<br>Interface[]</td><td>Single interface or array of interfaces this interface inherits from.</td></tr>
     *     <tr><th>members</th><td>Map</td><td>Map of members of the interface.</td></tr>
     *     <tr><th>statics</th><td>Map</td><td>
     *         Map of statics of the interface. The statics will not get copied into the target class.
     *         This is the same behaviour as statics in mixins ({@link qx.Mixin#define}).
     *     </td></tr>
     *     <tr><th>properties</th><td>Map</td><td>Map of properties and their definitions.</td></tr>
     *     <tr><th>events</th><td>Map</td><td>Map of event names and the corresponding event class name.</td></tr>
     *   </table>
     */
    define : function(name, config)
    {
      if (config)
      {
        // Normalize include
        if (config.extend && !(config.extend instanceof Array)) {
          config.extend = [config.extend];
        }

        // Validate incoming data
        if (qx.core.Environment.get("qx.debug")) {
          this.__validateConfig(name, config);
        }

        // Create interface from statics
        var iface = config.statics ? config.statics : {};

        // Attach configuration
        if (config.extend) {
          iface.$$extends = config.extend;
        }

        if (config.properties) {
          iface.$$properties = config.properties;
        }

        if (config.members) {
          iface.$$members = config.members;
        }

        if (config.events) {
          iface.$$events = config.events;
        }
      }
      else
      {
        // Create empty interface
        var iface = {};
      }

      // Add Basics
      iface.$$type = "Interface";
      iface.name = name;

      // Attach toString
      iface.toString = this.genericToString;

      // Assign to namespace
      iface.basename = qx.Bootstrap.createNamespace(name, iface);

      // Add to registry
      qx.Interface.$$registry[name] = iface;

      // Return final interface
      return iface;
    },


    /**
     * Returns an interface by name
     *
     * @param name {String} class name to resolve
     * @return {Class} the class
     */
    getByName : function(name) {
      return this.$$registry[name];
    },


    /**
     * Determine if interface exists
     *
     * @param name {String} Interface name to check
     * @return {Boolean} true if interface exists
     */
    isDefined : function(name) {
      return this.getByName(name) !== undefined;
    },


    /**
     * Determine the number of interfaces which are defined
     *
     * @return {Number} the number of classes
     */
    getTotalNumber : function() {
      return qx.Bootstrap.objectGetLength(this.$$registry);
    },


    /**
     * Generates a list of all interfaces including their super interfaces
     * (resolved recursively)
     *
     * @param ifaces {Interface[] ? []} List of interfaces to be resolved
     * @return {Array} List of all interfaces
     */
    flatten : function(ifaces)
    {
      if (!ifaces) {
        return [];
      }

      // we need to create a copy and not to modify the existing array
      var list = ifaces.concat();

      for (var i=0, l=ifaces.length; i<l; i++)
      {
        if (ifaces[i].$$extends) {
          list.push.apply(list, this.flatten(ifaces[i].$$extends));
        }
      }

      return list;
    },


    /**
     * Assert members
     *
     * @param object {Object} The object, which contains the methods
     * @param clazz {Class} class of the object
     * @param iface {Interface} the interface to verify
     * @param wrap {Boolean ? false} wrap functions required by interface to
     *     check parameters etc.
     */
    __assertMembers : function(object, clazz, iface, wrap)
    {
      // Validate members
      var members = iface.$$members;
      if (members)
      {
        for (var key in members)
        {
          if (qx.Bootstrap.isFunction(members[key]))
          {
            var isPropertyMethod = this.__isPropertyMethod(clazz, key);
            var hasMemberFunction = isPropertyMethod || qx.Bootstrap.isFunction(object[key]);

            if (!hasMemberFunction)
            {
              throw new Error(
                  'Implementation of method "' + key +
                  '" is missing in class "' + clazz.classname +
                  '" required by interface "' + iface.name + '"'
              );
            }

            // Only wrap members if the interface was not been applied yet. This
            // can easily be checked by the recursive hasInterface method.
            var shouldWrapFunction =
              wrap === true &&
              !isPropertyMethod &&
              !qx.Bootstrap.hasInterface(clazz, iface);

            if (shouldWrapFunction) {
              object[key] = this.__wrapInterfaceMember(
                iface, object[key], key, members[key]
              );
            }
          }
          else
          {
            // Other members are not checked more detailed because of
            // JavaScript's loose type handling
            if (typeof object[key] === undefined)
            {
              if (typeof object[key] !== "function") {
                throw new Error(
                  'Implementation of member "' + key +
                  '" is missing in class "' + clazz.classname +
                  '" required by interface "' + iface.name + '"'
                );
              }
            }
          }
        }
      }
    },


    /**
     * Internal helper to detect if the method will be generated by the
     * property system.
     *
     * @param clazz {Class} The current class.
     * @param methodName {String} The name of the method.
     *
     * @return {Boolean} true, if the method will be generated by the property
     *   system.
     */
    __isPropertyMethod: function(clazz, methodName)
    {
      var match = methodName.match(/^(is|toggle|get|set|reset)(.*)$/);

      if (!match) {
        return false;
      }

      var propertyName = qx.Bootstrap.firstLow(match[2]);
      var isPropertyMethod = qx.Bootstrap.getPropertyDefinition(clazz, propertyName);
      if (!isPropertyMethod) {
        return false;
      }

      var isBoolean = match[0] == "is" || match[0] == "toggle";
      if (isBoolean) {
        return qx.Bootstrap.getPropertyDefinition(clazz, propertyName).check == "Boolean";
      }

      return true;
    },


    /**
     * Assert properties
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     */
    __assertProperties : function(clazz, iface)
    {
      if (iface.$$properties)
      {
        for (var key in iface.$$properties)
        {
          if (!qx.Bootstrap.getPropertyDefinition(clazz, key)) {
            throw new Error(
              'The property "' + key + '" is not supported by Class "' +
              clazz.classname + '"!'
            );
          }
        }
      }
    },


    /**
     * Assert events
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     */
    __assertEvents : function(clazz, iface)
    {
      if (iface.$$events)
      {
        for (var key in iface.$$events)
        {
          if (!qx.Bootstrap.supportsEvent(clazz, key)) {
            throw new Error(
              'The event "' + key + '" is not supported by Class "' +
              clazz.classname + '"!'
            );
          }
        }
      }
    },


    /**
     * Asserts that the given object implements all the methods defined in the
     * interface. This method throws an exception if the object does not
     * implement the interface.
     *
     *  @param object {Object} Object to check interface for
     *  @param iface {Interface} The interface to verify
     */
    assertObject : function(object, iface)
    {
      var clazz = object.constructor;
      this.__assertMembers(object, clazz, iface, false);
      this.__assertProperties(clazz, iface);
      this.__assertEvents(clazz, iface);

      // Validate extends, recursive
      var extend = iface.$$extends;
      if (extend)
      {
        for (var i=0, l=extend.length; i<l; i++) {
          this.assertObject(object, extend[i]);
        }
      }
    },


    /**
     * Checks if an interface is implemented by a class
     *
     * @param clazz {Class} class to check interface for
     * @param iface {Interface} the interface to verify
     * @param wrap {Boolean ? false} wrap functions required by interface to
     *     check parameters etc.
     */
    assert : function(clazz, iface, wrap)
    {
      this.__assertMembers(clazz.prototype, clazz, iface, wrap);
      this.__assertProperties(clazz, iface);
      this.__assertEvents(clazz, iface);

      // Validate extends, recursive
      var extend = iface.$$extends;
      if (extend)
      {
        for (var i=0, l=extend.length; i<l; i++) {
          this.assert(clazz, extend[i], wrap);
        }
      }
    },





    /*
    ---------------------------------------------------------------------------
       PRIVATE/INTERNAL API
    ---------------------------------------------------------------------------
    */

    /**
     * This method will be attached to all interface to return
     * a nice identifier for them.
     *
     * @internal
     * @return {String} The interface identifier
     */
    genericToString : function() {
      return "[Interface " + this.name + "]";
    },


    /** Registry of all defined interfaces */
    $$registry : {},


    /**
     * Wrap a method with a precondition check.
     *
     * @signature function(iface, origFunction, functionName, preCondition)
     * @param iface {String} Name of the interface, where the pre condition
     *   was defined. (Used in error messages).
     * @param origFunction {Function} function to wrap.
     * @param functionName {String} name of the function. (Used in error messages).
     * @param preCondition {Function}. This function gets called with the arguments of the
     *   original function. If this function return true the original function is called.
     *   Otherwise an exception is thrown.
     * @return {Function} wrapped function
     */
    __wrapInterfaceMember : qx.core.Environment.select("qx.debug",
    {
      "true": function(iface, origFunction, functionName, preCondition)
      {
        function wrappedFunction()
        {
          // call precondition
          preCondition.apply(this, arguments);

          // call original function
          return origFunction.apply(this, arguments);
        }

        origFunction.wrapper = wrappedFunction;
        return wrappedFunction;
      },

      "default" : function() {}
    }),


    /** {Map} allowed keys in interface definition */
    __allowedKeys : qx.core.Environment.select("qx.debug",
    {
      "true":
      {
        "extend"     : "object", // Interface | Interface[]
        "statics"    : "object", // Map
        "members"    : "object", // Map
        "properties" : "object", // Map
        "events"     : "object"  // Map
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
        if (qx.core.Environment.get("qx.debug"))
        {
          // Validate keys
          var allowed = this.__allowedKeys;

          for (var key in config)
          {
            if (allowed[key] === undefined) {
              throw new Error('The configuration key "' + key + '" in class "' + name + '" is not allowed!');
            }

            if (config[key] == null) {
              throw new Error("Invalid key '" + key + "' in interface '" + name + "'! The value is undefined/null!");
            }

            if (allowed[key] !== null && typeof config[key] !== allowed[key]) {
              throw new Error('Invalid type of key "' + key + '" in interface "' + name + '"! The type of the key must be "' + allowed[key] + '"!');
            }
          }

          // Validate maps
          var maps = [ "statics", "members", "properties", "events" ];
          for (var i=0, l=maps.length; i<l; i++)
          {
            var key = maps[i];

            if (config[key] !== undefined && (config[key] instanceof Array || config[key] instanceof RegExp || config[key] instanceof Date || config[key].classname !== undefined)) {
              throw new Error('Invalid key "' + key + '" in interface "' + name + '"! The value needs to be a map!');
            }
          }

          // Validate extends
          if (config.extend)
          {
            for (var i=0, a=config.extend, l=a.length; i<l; i++)
            {
              if (a[i] == null) {
                throw new Error("Extends of interfaces must be interfaces. The extend number '" + i+1 + "' in interface '" + name + "' is undefined/null!");
              }

              if (a[i].$$type !== "Interface") {
                throw new Error("Extends of interfaces must be interfaces. The extend number '" + i+1 + "' in interface '" + name + "' is not an interface!");
              }
            }
          }

          // Validate statics
          if (config.statics)
          {
            for (var key in config.statics)
            {
              if (key.toUpperCase() !== key) {
                throw new Error('Invalid key "' + key + '" in interface "' + name + '"! Static constants must be all uppercase.');
              }

              switch(typeof config.statics[key])
              {
                case "boolean":
                case "string":
                case "number":
                  break;

                default:
                  throw new Error('Invalid key "' + key + '" in interface "' + name + '"! Static constants must be all of a primitive type.')
              }
            }
          }
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
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (mwittemann)

************************************************************************ */

/**
 * This interface defines a data structure compatible with the data binding
 * controllers.
 * It defines a minimum of functionality which the controller need to work.
 */
qx.Interface.define("qx.data.IListData",
{
  events :
  {
    /**
     * The change event which will be fired if there is a change in the data
     * structure.The data should contain a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove' or 'order'</li>
     * <li>item: The item which has been changed.</li>
     */
    "change" : "qx.event.type.Data",

    /**
     * The changeLength event will be fired every time the length of the
     * data structure changes.
     */
    "changeLength": "qx.event.type.Event"
  },


  members :
  {
    /**
     * Returns the item at the given index
     *
     * @param index {Number} The index requested of the data element.
     *
     * @return {var} The element at the given index.
     */
    getItem : function(index) {},


    /**
     * Sets the given item at the given position in the data structure. A
     * change event has to be fired.
     *
     * @param index {Number} The index of the data element.
     * @param item {var} The new item to set.
     */
    setItem : function(index, item) {},


    /**
     * Method to remove and add new element to the data. For every remove or
     * add a change event should be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of element which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An array containing the removed elements.
     */
    splice : function(startIndex, amount, varargs) {},


    /**
     * Check if the given item is in the current data structure.
     *
     * @param item {var} The item which is possibly in the data structure.
     * @return {boolean} true, if the array contains the given item.
     */
    contains : function(item) {},


    /**
     * Returns the current length of the data structure.
     *
     * @return {Number} The current length of the data structure.
     */
    getLength : function() {},


    /**
     * Returns the list data as native array.
     *
     * @return {Array} The native array.
     */
    toArray: function() {}
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

************************************************************************* */

/**
 * The modern font theme.
 */
qx.Theme.define("qx.theme.modern.Font",
{
  fonts :
  {
    "default" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 12 : 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ]
    },

    "bold" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 12 : 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ],
      bold : true
    },

    "small" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 11 : 10,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ]
    },

    "monospace" :
    {
      size: 11,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Console", "Monaco" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Consolas" ] :
        [ "Consolas", "DejaVu Sans Mono", "Courier New", "monospace" ]
    }
  }
});
