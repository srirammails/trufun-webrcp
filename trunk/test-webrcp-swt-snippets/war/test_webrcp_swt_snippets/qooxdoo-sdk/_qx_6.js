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

************************************************************************ */

/**
 * Abstract base class for all managers of themed values.
 */
qx.Class.define("qx.util.ValueManager",
{
  type : "abstract",
  extend : qx.core.Object,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Create empty dynamic map
    this._dynamic = {};
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    _dynamic : null,

    /**
     * Returns the dynamically interpreted result for the incoming value
     *
     * @param value {String} dynamically interpreted identifier
     * @return {var} return the (translated) result of the incoming value
     */
    resolveDynamic : function(value) {
      return this._dynamic[value];
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns true if the value is interpreted dynamically
     */
    isDynamic : function(value) {
      return !!this._dynamic[value];
    },

    /**
     * Returns the dynamically interpreted result for the incoming value,
     * (if available), otherwise returns the original value
     * @param value {String} Value to resolve
     * @return {var} either returns the (translated) result of the incoming
     * value or the value itself
     */
    resolve : function(value)
    {
      if (value && this._dynamic[value]) {
        return this._dynamic[value];
      }

      return value;
    },

     /**
      * Sets the dynamics map.
      * @param value {Map} The map.
      */
    _setDynamic : function(value) {
      this._dynamic = value;
    },

    /**
     * Returns the dynamics map.
     * @return {Map} The map.
     */
    _getDynamic : function() {
      return this._dynamic;
    }

  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._dynamic = null;
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
 * Manager for color themes
 */
qx.Class.define("qx.theme.manager.Color",
{
  type : "singleton",
  extend : qx.util.ValueManager,




  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /** the currently selected color theme */
    theme :
    {
      check : "Theme",
      nullable : true,
      apply : "_applyTheme",
      event : "changeTheme"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    _applyTheme : function(value)
    {
      var dest = {};

      if (value)
      {
        var source = value.colors;
        var util = qx.util.ColorUtil;
        var temp;

        for (var key in source)
        {
          temp = source[key];

          if (typeof temp === "string")
          {
            if (!util.isCssString(temp)) {
              throw new Error("Could not parse color: " + temp);
            }
          }
          else if (temp instanceof Array)
          {
            temp = util.rgbToRgbString(temp);
          }
          else
          {
            throw new Error("Could not parse color: " + temp);
          }

          dest[key] = temp;
        }
      }

      this._setDynamic(dest);
    },


    /**
     * Returns the dynamically interpreted result for the incoming value,
     * (if available), otherwise returns the original value
     * @param value {String} Value to resolve
     * @return {var} either returns the (translated) result of the incoming
     * value or the value itself
     */
    resolve : function(value)
    {
      var cache = this._dynamic;
      var resolved = cache[value];

      if (resolved)
      {
        return resolved;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && theme.colors[value])
      {
        return cache[value] = theme.colors[value];
      }

      return value;
    },


    /**
     * Whether a value is interpreted dynamically
     *
     * @param value {String} dynamically interpreted identifier
     * @return {Boolean} returns true if the value is interpreted dynamically
     */
    isDynamic : function(value) {
      var cache = this._dynamic;

      if (value && (cache[value] !== undefined))
      {
        return true;
      }

      // If the font instance is not yet cached create a new one to return
      // This is true whenever a runtime include occurred (using "qx.Theme.include"
      // or "qx.Theme.patch"), since these methods only merging the keys of
      // the theme and are not updating the cache
      var theme = this.getTheme();
      if (theme !== null && value && (theme.colors[value] !== undefined))
      {
        cache[value] = theme.colors[value];
        return true;
      }

      return false;
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

#optional(qx.theme.manager.Color)

************************************************************************ */

/**
 * Methods to convert colors between different color spaces.
 */
qx.Class.define("qx.util.ColorUtil",
{
  statics :
  {
    /**
     * Regular expressions for color strings
     */
    REGEXP :
    {
      hex3 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      hex6 : /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
      rgb : /^rgb\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/,
      rgba : /^rgba\(\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*,\s*([0-9]{1,3}\.{0,1}[0-9]*)\s*\)$/
    },


    /**
     * CSS3 system color names.
     */
    SYSTEM :
    {
      activeborder        : true,
      activecaption       : true,
      appworkspace        : true,
      background          : true,
      buttonface          : true,
      buttonhighlight     : true,
      buttonshadow        : true,
      buttontext          : true,
      captiontext         : true,
      graytext            : true,
      highlight           : true,
      highlighttext       : true,
      inactiveborder      : true,
      inactivecaption     : true,
      inactivecaptiontext : true,
      infobackground      : true,
      infotext            : true,
      menu                : true,
      menutext            : true,
      scrollbar           : true,
      threeddarkshadow    : true,
      threedface          : true,
      threedhighlight     : true,
      threedlightshadow   : true,
      threedshadow        : true,
      window              : true,
      windowframe         : true,
      windowtext          : true
    },


    /**
     * Named colors, only the 16 basic colors plus the following ones:
     * transparent, grey, magenta, orange and brown
     */
    NAMED :
    {
      black       : [ 0, 0, 0 ],
      silver      : [ 192, 192, 192 ],
      gray        : [ 128, 128, 128 ],
      white       : [ 255, 255, 255 ],
      maroon      : [ 128, 0, 0 ],
      red         : [ 255, 0, 0 ],
      purple      : [ 128, 0, 128 ],
      fuchsia     : [ 255, 0, 255 ],
      green       : [ 0, 128, 0 ],
      lime        : [ 0, 255, 0 ],
      olive       : [ 128, 128, 0 ],
      yellow      : [ 255, 255, 0 ],
      navy        : [ 0, 0, 128 ],
      blue        : [ 0, 0, 255 ],
      teal        : [ 0, 128, 128 ],
      aqua        : [ 0, 255, 255 ],

      // Additional values
      transparent : [ -1, -1, -1 ],
      magenta     : [ 255, 0, 255 ],   // alias for fuchsia
      orange      : [ 255, 165, 0 ],
      brown       : [ 165, 42, 42 ]
    },


    /**
     * Whether the incoming value is a named color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a named color
     */
    isNamedColor : function(value) {
      return this.NAMED[value] !== undefined;
    },


    /**
     * Whether the incoming value is a system color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a system color
     */
    isSystemColor : function(value) {
      return this.SYSTEM[value] !== undefined;
    },


    /**
     * Whether the color theme manager is loaded. Generally
     * part of the GUI of qooxdoo.
     *
     * @return {Boolean} <code>true</code> when color theme support is ready.
     **/
    supportsThemes : function() {
      return qx.Class.isDefined("qx.theme.manager.Color");
    },


    /**
     * Whether the incoming value is a themed color.
     *
     * @param value {String} the color value to test
     * @return {Boolean} true if the color is a themed color
     */
    isThemedColor : function(value)
    {
      if (!this.supportsThemes()) {
        return false;
      }

      return qx.theme.manager.Color.getInstance().isDynamic(value);
    },


    /**
     * Try to convert an incoming string to an RGB array.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws an error if the string could not be parsed
     */
    stringToRgb : function(str)
    {
      if (this.supportsThemes() && this.isThemedColor(str)) {
        var str = qx.theme.manager.Color.getInstance().resolveDynamic(str);
      }

      if (this.isNamedColor(str))
      {
        return this.NAMED[str];
      }
      else if (this.isSystemColor(str))
      {
        throw new Error("Could not convert system colors to RGB: " + str);
      }
      else if (this.isRgbString(str))
      {
        return this.__rgbStringToRgb();
      }
      else if (this.isHex3String(str))
      {
        return this.__hex3StringToRgb();
      }
      else if (this.isHex6String(str))
      {
        return this.__hex6StringToRgb();
      }

      throw new Error("Could not parse color: " + str);
    },


    /**
     * Try to convert an incoming string to an RGB array.
     * Support named colors, RGB strings, hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {Array} returns an array of red, green, blue on a successful transformation
     * @throws an error if the string could not be parsed
     */
    cssStringToRgb : function(str)
    {
      if (this.isNamedColor(str))
      {
        return this.NAMED[str];
      }
      else if (this.isSystemColor(str))
      {
        throw new Error("Could not convert system colors to RGB: " + str);
      }
      else if (this.isRgbString(str))
      {
        return this.__rgbStringToRgb();
      }
      else if (this.isRgbaString(str))
      {
        return this.__rgbaStringToRgb();
      }
      else if (this.isHex3String(str))
      {
        return this.__hex3StringToRgb();
      }
      else if (this.isHex6String(str))
      {
        return this.__hex6StringToRgb();
      }

      throw new Error("Could not parse color: " + str);
    },


    /**
     * Try to convert an incoming string to an RGB string, which can be used
     * for all color properties.
     * Supports themed, named and system colors, but also RGB strings,
     * hex3 and hex6 values.
     *
     * @param str {String} any string
     * @return {String} a RGB string
     * @throws an error if the string could not be parsed
     */
    stringToRgbString : function(str) {
      return this.rgbToRgbString(this.stringToRgb(str));
    },


    /**
     * Converts a RGB array to an RGB string
     *
     * @param rgb {Array} an array with red, green and blue
     * @return {String} a RGB string
     */
    rgbToRgbString : function(rgb) {
      return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    },


    /**
     * Converts a RGB array to an hex6 string
     *
     * @param rgb {Array} an array with red, green and blue
     * @return {String} a hex6 string
     */
    rgbToHexString : function(rgb)
    {
      return (
        qx.lang.String.pad(rgb[0].toString(16).toUpperCase(), 2) +
        qx.lang.String.pad(rgb[1].toString(16).toUpperCase(), 2) +
        qx.lang.String.pad(rgb[2].toString(16).toUpperCase(), 2)
      );
    },


    /**
     * Detects if a string is a valid qooxdoo color
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid qooxdoo color
     */
    isValidPropertyValue : function(str) {
      return this.isThemedColor(str) || this.isNamedColor(str) || this.isHex3String(str) || this.isHex6String(str) || this.isRgbString(str);
    },


    /**
     * Detects if a string is a valid CSS color string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid CSS color string
     */
    isCssString : function(str) {
      return this.isSystemColor(str) || this.isNamedColor(str) || this.isHex3String(str) || this.isHex6String(str) || this.isRgbString(str);
    },


    /**
     * Detects if a string is a valid hex3 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex3 string
     */
    isHex3String : function(str) {
      return this.REGEXP.hex3.test(str);
    },


    /**
     * Detects if a string is a valid hex6 string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid hex6 string
     */
    isHex6String : function(str) {
      return this.REGEXP.hex6.test(str);
    },


    /**
     * Detects if a string is a valid RGB string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGB string
     */
    isRgbString : function(str) {
      return this.REGEXP.rgb.test(str);
    },


    /**
     * Detects if a string is a valid RGBA string
     *
     * @param str {String} any string
     * @return {Boolean} true when the incoming value is a valid RGBA string
     */
    isRgbaString : function(str) {
      return this.REGEXP.rgba.test(str);
    },


    /**
     * Converts a regexp object match of a rgb string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __rgbStringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);

      return [red, green, blue];
    },

   /**
    * Converts a regexp object match of a rgba string to an RGB array.
    *
    * @return {Array} an array with red, green, blue
    */
    __rgbaStringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 10);
      var green = parseInt(RegExp.$2, 10);
      var blue = parseInt(RegExp.$3, 10);

      return [red, green, blue];
    },


    /**
     * Converts a regexp object match of a hex3 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex3StringToRgb : function()
    {
      var red = parseInt(RegExp.$1, 16) * 17;
      var green = parseInt(RegExp.$2, 16) * 17;
      var blue = parseInt(RegExp.$3, 16) * 17;

      return [red, green, blue];
    },


    /**
     * Converts a regexp object match of a hex6 string to an RGB array.
     *
     * @return {Array} an array with red, green, blue
     */
    __hex6StringToRgb : function()
    {
      var red = (parseInt(RegExp.$1, 16) * 16) + parseInt(RegExp.$2, 16);
      var green = (parseInt(RegExp.$3, 16) * 16) + parseInt(RegExp.$4, 16);
      var blue = (parseInt(RegExp.$5, 16) * 16) + parseInt(RegExp.$6, 16);

      return [red, green, blue];
    },


    /**
     * Converts a hex3 string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) string
     * @return {Array} an array with red, green, blue
     */
    hex3StringToRgb : function(value)
    {
      if (this.isHex3String(value)) {
        return this.__hex3StringToRgb(value);
      }

      throw new Error("Invalid hex3 value: " + value);
    },


    /**
     * Converts a hex6 string to an RGB array
     *
     * @param value {String} a hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hex6StringToRgb : function(value)
    {
      if (this.isHex6String(value)) {
        return this.__hex6StringToRgb(value);
      }

      throw new Error("Invalid hex6 value: " + value);
    },


    /**
     * Converts a hex string to an RGB array
     *
     * @param value {String} a hex3 (#xxx) or hex6 (#xxxxxx) string
     * @return {Array} an array with red, green, blue
     */
    hexStringToRgb : function(value)
    {
      if (this.isHex3String(value)) {
        return this.__hex3StringToRgb(value);
      }

      if (this.isHex6String(value)) {
        return this.__hex6StringToRgb(value);
      }

      throw new Error("Invalid hex value: " + value);
    },


    /**
     * Convert RGB colors to HSB
     *
     * @param rgb {Number[]} red, blue and green as array
     * @return {Array} an array with hue, saturation and brightness
     */
    rgbToHsb : function(rgb)
    {
      var hue, saturation, brightness;

      var red = rgb[0];
      var green = rgb[1];
      var blue = rgb[2];

      var cmax = (red > green) ? red : green;

      if (blue > cmax) {
        cmax = blue;
      }

      var cmin = (red < green) ? red : green;

      if (blue < cmin) {
        cmin = blue;
      }

      brightness = cmax / 255.0;

      if (cmax != 0) {
        saturation = (cmax - cmin) / cmax;
      } else {
        saturation = 0;
      }

      if (saturation == 0)
      {
        hue = 0;
      }
      else
      {
        var redc = (cmax - red) / (cmax - cmin);
        var greenc = (cmax - green) / (cmax - cmin);
        var bluec = (cmax - blue) / (cmax - cmin);

        if (red == cmax) {
          hue = bluec - greenc;
        } else if (green == cmax) {
          hue = 2.0 + redc - bluec;
        } else {
          hue = 4.0 + greenc - redc;
        }

        hue = hue / 6.0;

        if (hue < 0) {
          hue = hue + 1.0;
        }
      }

      return [ Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100) ];
    },


    /**
     * Convert HSB colors to RGB
     *
     * @param hsb {Number[]} an array with hue, saturation and brightness
     * @return {Integer[]} an array with red, green, blue
     */
    hsbToRgb : function(hsb)
    {
      var i, f, p, q, t;

      var hue = hsb[0] / 360;
      var saturation = hsb[1] / 100;
      var brightness = hsb[2] / 100;

      if (hue >= 1.0) {
        hue %= 1.0;
      }

      if (saturation > 1.0) {
        saturation = 1.0;
      }

      if (brightness > 1.0) {
        brightness = 1.0;
      }

      var tov = Math.floor(255 * brightness);
      var rgb = {};

      if (saturation == 0.0)
      {
        rgb.red = rgb.green = rgb.blue = tov;
      }
      else
      {
        hue *= 6.0;

        i = Math.floor(hue);

        f = hue - i;

        p = Math.floor(tov * (1.0 - saturation));
        q = Math.floor(tov * (1.0 - (saturation * f)));
        t = Math.floor(tov * (1.0 - (saturation * (1.0 - f))));

        switch(i)
        {
          case 0:
            rgb.red = tov;
            rgb.green = t;
            rgb.blue = p;
            break;

          case 1:
            rgb.red = q;
            rgb.green = tov;
            rgb.blue = p;
            break;

          case 2:
            rgb.red = p;
            rgb.green = tov;
            rgb.blue = t;
            break;

          case 3:
            rgb.red = p;
            rgb.green = q;
            rgb.blue = tov;
            break;

          case 4:
            rgb.red = t;
            rgb.green = p;
            rgb.blue = tov;
            break;

          case 5:
            rgb.red = tov;
            rgb.green = p;
            rgb.blue = q;
            break;
        }
      }

      return [rgb.red, rgb.green, rgb.blue];
    },


    /**
     * Creates a random color.
     *
     * @return {String} a valid qooxdoo/CSS rgb color string.
     */
    randomColor : function()
    {
      var r = Math.round(Math.random() * 255);
      var g = Math.round(Math.random() * 255);
      var b = Math.round(Math.random() * 255);

      return this.rgbToRgbString([r, g, b]);
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
 * This singleton manages global resource aliases.
 *
 * The AliasManager supports simple prefix replacement on strings. There are
 * some pre-defined aliases, and you can register your own with {@link #add}.
 * The AliasManager is automatically invoked in various situations, e.g. when
 * resolving the icon image for a button, so it is common to register aliases for
 * <a href="http://manual.qooxdoo.org/1.4/pages/gui_toolkit/ui_resources.html">resource id's</a>.
 * You can of course call the AliasManager's {@link #resolve}
 * explicitly to get an alias resolution in any situation, but keep that
 * automatic invocation of the AliasManager in mind when defining new aliases as
 * they will be applied globally in many classes, not only your own.
 *
 * Examples:
 * <ul>
 *  <li> <code>foo</code> -> <code>bar/16pt/baz</code>  (resolves e.g. __"foo/a/b/c.png"__ to
 *    __"bar/16pt/baz/a/b/c.png"__)
 *  <li> <code>imgserver</code> -> <code>http&#058;&#047;&#047;imgs03.myserver.com/my/app/</code>
 *    (resolves e.g. __"imgserver/a/b/c.png"__ to
 *    __"http&#058;&#047;&#047;imgs03.myserver.com/my/app/a/b/c.png"__)
 * </ul>
 *
 * For resources, only aliases that resolve to proper resource id's can be __managed__
 * resources, and will be considered __unmanaged__ resources otherwise.
 */
qx.Class.define("qx.util.AliasManager",
{
  type : "singleton",
  extend : qx.util.ValueManager,




  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Contains defined aliases (like icons/, widgets/, application/, ...)
    this.__aliases = {};

    // Define static alias from setting
    this.add("static", "qx/static");
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    __aliases : null,

    /**
     * pre-process incoming dynamic value
     *
     * @param value {String} incoming value
     * @return {String} pre processed value
     */
    _preprocess : function(value)
    {
      var dynamics = this._getDynamic();

      if (dynamics[value] === false)
      {
        return value;
      }
      else if (dynamics[value] === undefined)
      {
        if (value.charAt(0) === "/" || value.charAt(0) === "." || value.indexOf("http://") === 0 || value.indexOf("https://") === "0" || value.indexOf("file://") === 0)
        {
          dynamics[value] = false;
          return value;
        }

        if (this.__aliases[value]) {
          return this.__aliases[value];
        }

        var alias = value.substring(0, value.indexOf("/"));
        var resolved = this.__aliases[alias];

        if (resolved !== undefined) {
          dynamics[value] = resolved + value.substring(alias.length);
        }
      }

      return value;
    },


    /**
     * Define an alias to a resource path
     *
     * @param alias {String} alias name for the resource path/url
     * @param base {String} first part of URI for all images which use this alias
     * @return {void}
     */
    add : function(alias, base)
    {
      // Store new alias value
      this.__aliases[alias] = base;

      // Localify stores
      var dynamics = this._getDynamic();

      // Update old entries which use this alias
      for (var path in dynamics)
      {
        if (path.substring(0, path.indexOf("/")) === alias)
        {
          dynamics[path] = base + path.substring(alias.length);
        }
      }
    },


    /**
     * Remove a previously defined alias
     *
     * @param alias {String} alias name for the resource path/url
     * @return {void}
     */
    remove : function(alias)
    {
      delete this.__aliases[alias];

      // No signal for depending objects here. These
      // will informed with the new value using add().
    },


    /**
     * Resolves a given path
     *
     * @param path {String} input path
     * @return {String} resulting path (with interpreted aliases)
     */
    resolve : function(path)
    {
      var dynamic = this._getDynamic();

      if (path != null) {
        path = this._preprocess(path);
      }

      return dynamic[path] || path;
    },


    /**
     * Get registered aliases
     *
     * @return {Map} the map of the currently registered alias:resolution pairs
     */
    getAliases : function()
    {
      var res = {};
      for (var key in this.__aliases) {
        res[key] = this.__aliases[key];
      }
      return res;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__aliases = null;
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
     * Alexander Steitz (aback)

************************************************************************ */

/**
 * Powerful creation and update features for images used for decoration
 * purposes like for rounded borders, icons, etc.
 *
 * Includes support for image clipping, PNG alpha channel support, additional
 * repeat options like <code>scale-x</code> or <code>scale-y</code>.
 */
qx.Class.define("qx.bom.element.Decoration",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Boolean} Whether clipping hints should be logged */
    DEBUG : false,

    /** {Map} Collect warnings for potential clipped images */
    __warnings : {},

    /**
     * {Boolean} Whether the alpha image loader is needed.
     * We enable this for all IE browser because of issues reported by Maria
     * Siebert and others in combination with the opacity filter applied
     * to e.g. disabled icons. Thanks Maria.
     *
     * To prevent these issues use the "disabled" images. This is done by adding
     * a special second image which is already in a disabled state. In order to
     * make use of this feature the image has to follow the convention "-disabled".
     * (e.g. "button.png" -> "button-disabled.png")
     *
     * The situation for IE8 is that running in "IE8 Standards Mode" IE8 has a
     * runtime performance issue. The updates are compared to IE7 really slow.
     * The cause for this is the dynamic adding/removing of the IMG elements
     * which are part of the decorator. Using the alpha image loader does change
     * this DOM structure to only use DIV elements which do not have a negative
     * performance impact. See Bug #2185 for details.
     */
    __enableAlphaFix : (qx.core.Environment.get("engine.name") == "mshtml") && qx.core.Environment.get("engine.version") < 9,


    /** {Map} List of repeat modes which supports the IE AlphaImageLoader */
    __alphaFixRepeats : qx.core.Environment.select("engine.name",
    {
      "mshtml" :
      {
        "scale-x" : true,
        "scale-y" : true,
        "scale" : true,
        "no-repeat" : true
      },

      "default" : null
    }),


    /** {Map} Mapping between background repeat and the tag to create */
    __repeatToTagname :
    {
      "scale-x" : "img",
      "scale-y" : "img",
      "scale" : "img",
      "repeat" : "div",
      "no-repeat" : "div",
      "repeat-x" : "div",
      "repeat-y" : "div"
    },


    /**
     * Updates the element to display the given source
     * with the repeat option.
     *
     * @param element {Element} DOM element to update
     * @param source {String} Any valid URI
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param style {Map} Additional styles to apply
     */
    update : function(element, source, repeat, style)
    {
      var tag = this.getTagName(repeat, source);
      if (tag != element.tagName.toLowerCase()) {
        throw new Error("Image modification not possible because elements could not be replaced at runtime anymore!");
      }

      var ret = this.getAttributes(source, repeat, style);

      if (tag === "img") {
        element.src = ret.src || qx.util.ResourceManager.getInstance().toUri("qx/static/blank.gif");
      }

      // Fix for old background position
      if (element.style.backgroundPosition != "" && ret.style.backgroundPosition === undefined) {
        ret.style.backgroundPosition = null;
      }

      // Fix for old clip
      if (element.style.clip != "" && ret.style.clip === undefined) {
        ret.style.clip = null;
      }

      // Apply new styles
      var Style = qx.bom.element.Style;
      Style.setStyles(element, ret.style);

      // we need to apply the filter to prevent black rendering artifacts
      // http://blog.hackedbrain.com/archive/2007/05/21/6110.aspx
      if (this.__enableAlphaFix)
      {
        try {
          element.filters["DXImageTransform.Microsoft.AlphaImageLoader"].apply();
        } catch(e) {}
      }
    },


    /**
     * Creates a decorator image element with the given options.
     *
     * @param source {String} Any valid URI
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param style {Map} Additional styles to apply
     */
    create : function(source, repeat, style)
    {
      var tag = this.getTagName(repeat, source);
      var ret = this.getAttributes(source, repeat, style);
      var css = qx.bom.element.Style.compile(ret.style);

      if (tag === "img") {
        return '<img src="' + ret.src + '" style="' + css + '"/>';
      } else {
        return '<div style="' + css + '"></div>';
      }
    },


    /**
     * Translates the given repeat option to a tag name. Useful
     * for systems which depends on early information of the tag
     * name to prepare element like {@link qx.html.Image}.
     *
     * @param repeat {String} One of <code>scale-x</code>, <code>scale-y</code>,
     *   <code>scale</code>, <code>repeat</code>, <code>repeat-x</code>,
     *   <code>repeat-y</code>, <code>repeat</code>
     * @param source {String?null} Source used to identify the image format
     * @return {String} The tag name: <code>div</code> or <code>img</code>
     */
    getTagName : function(repeat, source)
    {
      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        if (source && this.__enableAlphaFix && this.__alphaFixRepeats[repeat] && qx.lang.String.endsWith(source, ".png")) {
          return "div";
        }
      }

      return this.__repeatToTagname[repeat];
    },


    /**
     * This method is used to collect all needed attributes for
     * the tag name detected by {@link #getTagName}.
     *
     * @param source {String} Image source
     * @param repeat {String} Repeat mode of the image
     * @param style {Map} Additional styles to apply
     * @return {String} Markup for image
     */
    getAttributes : function(source, repeat, style)
    {
      if (!style) {
        style = {};
      }

      if (!style.position) {
        style.position = "absolute";
      }

      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        // Add a fix for small blocks where IE has a minHeight
        // of the fontSize in quirks mode
        style.fontSize = 0;
        style.lineHeight = 0;
      }
      else if ((qx.core.Environment.get("engine.name") == "webkit"))
      {
        // This stops images from being dragable in webkit
        style.WebkitUserDrag = "none";
      }

      var format = qx.util.ResourceManager.getInstance().getImageFormat(source) ||
                   qx.io.ImageLoader.getFormat(source);
      if (qx.core.Environment.get("qx.debug"))
      {
        if (source != null && format == null) {
          qx.log.Logger.warn("ImageLoader: Not recognized format of external image '" + source + "'!");
        }
      }

      var result;

      // Enable AlphaImageLoader in IE6/IE7/IE8
      if (this.__enableAlphaFix && this.__alphaFixRepeats[repeat] && format === "png") {
        result = this.__processAlphaFix(style, repeat, source);
      }
      else
      {
        if (repeat === "scale") {
          result = this.__processScale(style, repeat, source);
        } else  if (repeat === "scale-x" || repeat === "scale-y") {
          result = this.__processScaleXScaleY(style, repeat, source);
        } else {
          // Native repeats or "no-repeat"
          result = this.__processRepeats(style, repeat, source);
        }
      }

      return result;
    },


    /**
     * Normalize the given width and height values
     *
     * @param style {Map} style information
     * @param width {Integer?null} width as number or null
     * @param height {Integer?null} height as number or null
     */
    __normalizeWidthHeight : function(style, width, height)
    {
      if (style.width == null && width != null) {
        style.width = width + "px";
      }

      if (style.height == null && height != null) {
        style.height = height + "px";
      }

      return style;
    },


    /**
     * Returns the dimension of the image by calling
     * {@link qx.util.ResourceManager} or {@link qx.io.ImageLoader}
     * depending on if the image is a managed one.
     *
     * @param source {String} image source
     * @return {Map} dimension of image
     */
    __getDimension : function(source)
    {
      var width = qx.util.ResourceManager.getInstance().getImageWidth(source) ||
                  qx.io.ImageLoader.getWidth(source);
      var height = qx.util.ResourceManager.getInstance().getImageHeight(source) ||
                   qx.io.ImageLoader.getHeight(source);

      return {
        width: width,
        height: height
      };
    },


    /**
     * Get all styles for IE browser which need to load the image
     * with the help of the AlphaImageLoader
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     *
     * @return {Map} style infos
     */
    __processAlphaFix : function(style, repeat, source)
    {
      var dimension = this.__getDimension(source);
      style = this.__normalizeWidthHeight(style, dimension.width, dimension.height);

      var sizingMethod = repeat == "no-repeat" ? "crop" : "scale";
      var filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" +
                   qx.util.ResourceManager.getInstance().toUri(source) +
                   "', sizingMethod='" + sizingMethod + "')";

      style.filter = filter;
      style.backgroundImage = style.backgroundRepeat = "";

      return {
        style : style
      };
    },


    /**
     * Process scaled images.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     *
     * @return {Map} image URI and style infos
     */
    __processScale : function(style, repeat, source)
    {
      var uri = qx.util.ResourceManager.getInstance().toUri(source);
      var dimension = this.__getDimension(source);

      style = this.__normalizeWidthHeight(style, dimension.width, dimension.height);

      return {
        src : uri,
        style : style
      };
    },


    /**
     * Process images which are either scaled horizontally or
     * vertically.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param sourceid {String} image resource id
     *
     * @return {Map} image URI and style infos
     */
    __processScaleXScaleY : function(style, repeat, sourceid)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();
      var clipped = ResourceManager.getCombinedFormat(sourceid);
      var dimension = this.__getDimension(sourceid);
      var uri;

      if (clipped)
      {
        var data = ResourceManager.getData(sourceid);
        var combinedid = data[4];
        if (clipped == "b64") {
          uri = ResourceManager.toDataUri(sourceid);
        }
        else {
          uri = ResourceManager.toUri(combinedid);
        }

        if (repeat === "scale-x") {
          style = this.__getStylesForClippedScaleX(style, data, dimension.height);
        } else {
          style = this.__getStylesForClippedScaleY(style, data, dimension.width);
        }

        return {
          src : uri,
          style : style
        };
      }

      // No clipped image available
      else
      {
        if (qx.core.Environment.get("qx.debug")) {
          this.__checkForPotentialClippedImage(sourceid);
        }

        if (repeat == "scale-x")
        {
          style.height = dimension.height == null ? null : dimension.height + "px";
          // note: width is given by the user
        }
        else if (repeat == "scale-y")
        {
          style.width = dimension.width == null ? null : dimension.width + "px";
          // note: height is given by the user
        }

        uri = ResourceManager.toUri(sourceid);
        return {
          src : uri,
          style : style
        };
      }
    },


    /**
     * Generates the style infos for horizontally scaled clipped images.
     *
     * @param style {Map} style infos
     * @param data {Array} image data retrieved from the {@link qx.util.ResourceManager}
     * @param height {Integer} image height
     *
     * @return {Map} style infos and image URI
     */
    __getStylesForClippedScaleX : function(style, data, height)
    {
      // Use clipped image (multi-images on x-axis)
      var imageHeight = qx.util.ResourceManager.getInstance().getImageHeight(data[4]);

      // Add size and clipping
      style.clip = {top: -data[6], height: height};
      style.height = imageHeight + "px";

      // note: width is given by the user

      // Fix user given y-coordinate to include the combined image offset
      if (style.top != null) {
        style.top = (parseInt(style.top, 10) + data[6]) + "px";
      } else if (style.bottom != null) {
        style.bottom = (parseInt(style.bottom, 10) + height - imageHeight - data[6]) + "px";
      }

      return style;
    },


    /**
     * Generates the style infos for vertically scaled clipped images.
     *
     * @param style {Map} style infos
     * @param data {Array} image data retrieved from the {@link qx.util.ResourceManager}
     * @param width {Integer} image width
     *
     * @return {Map} style infos and image URI
     */
    __getStylesForClippedScaleY : function(style, data, width)
    {
      // Use clipped image (multi-images on x-axis)
      var imageWidth = qx.util.ResourceManager.getInstance().getImageWidth(data[4]);

      // Add size and clipping
      style.clip = {left: -data[5], width: width};
      style.width = imageWidth + "px";

      // note: height is given by the user

      // Fix user given x-coordinate to include the combined image offset
      if (style.left != null) {
        style.left = (parseInt(style.left, 10) + data[5]) + "px";
      } else if (style.right != null) {
        style.right = (parseInt(style.right, 10) + width - imageWidth - data[5]) + "px";
      }

      return style;
    },


    /**
     * Process repeated images.
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param sourceid {String} image resource id
     *
     * @return {Map} image URI and style infos
     */
    __processRepeats : function(style, repeat, sourceid)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();
      var clipped = ResourceManager.getCombinedFormat(sourceid);
      var dimension = this.__getDimension(sourceid);

      // Double axis repeats cannot be clipped
      if (clipped && repeat !== "repeat")
      {
        // data = [ 8, 5, "png", "qx", "qx/decoration/Modern/arrows-combined.png", -36, 0]
        var data = ResourceManager.getData(sourceid);
        var combinedid = data[4];
        if (clipped == "b64")
        {
          var uri = ResourceManager.toDataUri(sourceid);
          var offx = offy = 0;
        }
        else
        {
          var uri  = ResourceManager.toUri(combinedid);
          var offx = data[5];
          var offy = data[6];
        }

        var bg = qx.bom.element.Background.getStyles(uri, repeat, offx, offy);
        for (var key in bg) {
          style[key] = bg[key];
        }

        if (dimension.width != null && style.width == null && (repeat == "repeat-y" || repeat === "no-repeat")) {
          style.width = dimension.width + "px";
        }

        if (dimension.height != null && style.height == null && (repeat == "repeat-x" || repeat === "no-repeat")) {
          style.height = dimension.height + "px";
        }

        return {
          style : style
        };
      }
      else
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          if (repeat !== "repeat") {
            this.__checkForPotentialClippedImage(sourceid);
          }
        }

        style = this.__normalizeWidthHeight(style, dimension.width, dimension.height);
        style = this.__getStylesForSingleRepeat(style, sourceid, repeat);

        return {
          style : style
        };
      }
    },


    /**
     * Generate all style infos for single repeated images
     *
     * @param style {Map} style information
     * @param repeat {String} repeat mode
     * @param source {String} image source
     *
     * @return {Map} style infos
     */
    __getStylesForSingleRepeat : function(style, source, repeat)
    {
      // retrieve the "backgroundPosition" style if available to prevent
      // overwriting with default values
      var top = null;
      var left = null;
      if (style.backgroundPosition)
      {
        var backgroundPosition = style.backgroundPosition.split(" ");

        left = parseInt(backgroundPosition[0], 10);
        if (isNaN(left)) {
          left = backgroundPosition[0];
        }

        top = parseInt(backgroundPosition[1], 10);
        if (isNaN(top)) {
          top = backgroundPosition[1];
        }
      }

      var bg = qx.bom.element.Background.getStyles(source, repeat, left, top);
      for (var key in bg) {
        style[key] = bg[key];
      }

      // Reset the AlphaImageLoader filter if applied
      // This prevents IE from setting BOTH CSS filter AND backgroundImage
      // This is only a fallback if the image is not recognized as PNG
      // If it's a Alpha-PNG file it *may* result in display problems
      if (style.filter) {
        style.filter = "";
      }

      return style;
    },


    /**
     * Output a warning if the image can be clipped.
     *
     * @param source {String} image source
     */
    __checkForPotentialClippedImage : function(source)
    {
      if (this.DEBUG && qx.util.ResourceManager.getInstance().has(source) && source.indexOf("qx/icon") == -1)
      {
        if (!this.__warnings[source])
        {
          qx.log.Logger.debug("Potential clipped image candidate: " + source);
          this.__warnings[source] = true;
        }
      }
    },


    /**
     * For IE browsers the alpha image loader might be necessary. This accessor
     * method provides an API for high-level classes to check if the alpha image
     * loader is enabled.
     *
     * @signature function()
     * @return {Boolean} <code>true</code> when the AlphaImageLoader is used, <code>false</code> otherwise.
     */
    isAlphaImageLoaderEnabled : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function() {
        return qx.bom.element.Decoration.__enableAlphaFix;
      },

      "default" : function() {
        return false;
      }
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Contains information about images (size, format, clipping, ...) and
 * other resources like CSS files, local data, ...
 */
qx.Class.define("qx.util.ResourceManager",
{
  extend  : qx.core.Object,
  type    : "singleton",

  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Map} the shared image registry */
    __registry : qx.$$resources || {},

    /** {Map} prefix per library used in HTTPS mode for IE */
    __urlPrefix : {}
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {

    /**
     * Whether the registry has information about the given resource.
     *
     * @param id {String} The resource to get the information for
     * @return {Boolean} <code>true</code> when the resource is known.
     */
    has : function(id) {
      return !!this.self(arguments).__registry[id];
    },


    /**
     * Get information about an resource.
     *
     * @param id {String} The resource to get the information for
     * @return {Array} Registered data or <code>null</code>
     */
    getData : function(id) {
      return this.self(arguments).__registry[id] || null;
    },


    /**
     * Returns the width of the given resource ID,
     * when it is not a known image <code>0</code> is
     * returned.
     *
     * @param id {String} Resource identifier
     * @return {Integer} The image width, maybe <code>null</code> when the width is unknown
     */
    getImageWidth : function(id)
    {
      var entry = this.self(arguments).__registry[id];
      return entry ? entry[0] : null;
    },


    /**
     * Returns the height of the given resource ID,
     * when it is not a known image <code>0</code> is
     * returned.
     *
     * @param id {String} Resource identifier
     * @return {Integer} The image height, maybe <code>null</code> when the height is unknown
     */
    getImageHeight : function(id)
    {
      var entry = this.self(arguments).__registry[id];
      return entry ? entry[1] : null;
    },


    /**
     * Returns the format of the given resource ID,
     * when it is not a known image <code>null</code>
     * is returned.
     *
     * @param id {String} Resource identifier
     * @return {String} File format of the image
     */
    getImageFormat : function(id)
    {
      var entry = this.self(arguments).__registry[id];
      return entry ? entry[2] : null;
    },


    /**
     * Whether the given resource identifier is an image
     * with clipping information available.
     *
     * @deprecated since 1.4: superseded by getCombinedFormat()
     *
     * @param id {String} Resource identifier
     * @return {Boolean} Whether the resource ID is known as a clipped image
     */
    isClippedImage : function(id)
    {
      qx.log.Logger.deprecatedMethodWarning(arguments.callee,
        "isClippedImage has been superseded by getCombinedFormat");
      var entry = this.self(arguments).__registry[id];
      return entry && entry.length > 4 && typeof(entry[4]) == "string" &&
        this.constructor.__registry[entry[4]];
    },


    /**
     * Returns the format of the combined image (png, gif, ...), if the given
     * resource identifier is an image contained in one, or the empty string
     * otherwise.
     *
     * @param id {String} Resource identifier
     * @return {String} The type of the combined image containing id
     */
    getCombinedFormat : function(id)
    {
      var clippedtype = "";
      var entry = this.self(arguments).__registry[id];
      var isclipped = entry && entry.length > 4 && typeof(entry[4]) == "string"
        && this.constructor.__registry[entry[4]];
      if (isclipped){
        var combId  = entry[4];
        var combImg = this.constructor.__registry[combId];
        clippedtype = combImg[2];
      }
      return clippedtype;
    },


    /**
     * Converts the given resource ID to a full qualified URI
     *
     * @param id {String} Resource ID
     * @return {String} Resulting URI
     */
    toUri : function(id)
    {
      if (id == null) {
        return id;
      }

      var entry = this.self(arguments).__registry[id];
      if (!entry) {
        return id;
      }

      if (typeof entry === "string") {
        var lib = entry;
      }
      else
      {
        var lib = entry[3];

        // no lib reference
        // may mean that the image has been registered dynamically
        if (!lib) {
          return id;
        }
      }

      var urlPrefix = "";
      if ((qx.core.Environment.get("engine.name") == "mshtml") &&
          qx.core.Environment.get("io.ssl")) {
        urlPrefix = this.self(arguments).__urlPrefix[lib];
      }

      return urlPrefix + qx.$$libraries[lib].resourceUri + "/" + id;
    },

    /**
     * Construct a data: URI for an image resource.
     *
     * Constructs a data: URI for a given resource id, if this resource is
     * contained in a base64 combined image. If this is not the case (e.g.
     * because the combined image has not been loaded yet), returns the direct
     * URI to the image file itself.
     *
     * @param resid {String} resource id of the image
     * @return {String} "data:" or "http:" URI
     */
    toDataUri : function (resid)
    {
      var resentry = this.constructor.__registry[resid];
      var combined = this.constructor.__registry[resentry[4]];
      var uri;
      if (combined) {
        var resstruct = combined[4][resid];
        uri = "data:image/" + resstruct["type"] + ";" + resstruct["encoding"] +
              "," + resstruct["data"];
      }
      else {
        //TODO: remove this for release
        this.debug("ResourceManager.toDataUri: falling back for", resid);
        uri = this.toUri(resid);
      }
      return uri;
    }
  },


  defer : function(statics)
  {
    if ((qx.core.Environment.get("engine.name") == "mshtml"))
    {
      // To avoid a "mixed content" warning in IE when the application is
      // delivered via HTTPS a prefix has to be added. This will transform the
      // relative URL to an absolute one in IE.
      // Though this warning is only displayed in conjunction with images which
      // are referenced as a CSS "background-image", every resource path is
      // changed when the application is served with HTTPS.
      if (qx.core.Environment.get("io.ssl"))
      {
        for (var lib in qx.$$libraries)
        {
          var resourceUri;
          if (qx.$$libraries[lib].resourceUri) {
            resourceUri = qx.$$libraries[lib].resourceUri;
          }
          else
          {
            // default for libraries without a resourceUri set
            statics.__urlPrefix[lib] = "";
            continue;
          }

          // It is valid to to begin a URL with "//" so this case has to
          // be considered. If the to resolved URL begins with "//" the
          // manager prefixes it with "https:" to avoid any problems for IE
          if (resourceUri.match(/^\/\//) != null) {
            statics.__urlPrefix[lib] = window.location.protocol;
          }
          // If the resourceUri begins with a single slash, include the current
          // hostname
          else if (resourceUri.match(/^\//) != null) {
            statics.__urlPrefix[lib] = window.location.protocol + "//" + window.location.host;
          }
          // If the resolved URL begins with "./" the final URL has to be
          // put together using the document.URL property.
          // IMPORTANT: this is only applicable for the source version
          else if (resourceUri.match(/^\.\//) != null)
          {
            var url = document.URL;
            statics.__urlPrefix[lib] = url.substring(0, url.lastIndexOf("/") + 1);
          } else if (resourceUri.match(/^http/) != null) {
            // Let absolute URLs pass through
            statics.__urlPrefix[lib] = "";
          }
          else
          {
            // check for parameters with URLs as value
            var index = window.location.href.indexOf("?");
            var href;
            if (index == -1) {
              href = window.location.href;
            } else {
              href = window.location.href.substring(0, index);
            }

            statics.__urlPrefix[lib] = href.substring(0, href.lastIndexOf("/") + 1);
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
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * Contains methods to control and query the element's overflow properties.
 */
qx.Class.define("qx.bom.element.Overflow",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} The typical native scrollbar size in the environment */
    __scrollbarSize : null,

    /**
     * Get the typical native scrollbar size in the environment
     *
     * @return {Integer} The native scrollbar size
     */
    getScrollbarWidth : function()
    {
      if (this.__scrollbarSize !== null) {
        return this.__scrollbarSize;
      }

      var Style = qx.bom.element.Style;

      var getStyleSize = function(el, propertyName) {
        return parseInt(Style.get(el, propertyName), 10) || 0;
      };

      var getBorderRight = function(el)
      {
        return (
          Style.get(el, "borderRightStyle") == "none"
          ? 0
          : getStyleSize(el, "borderRightWidth")
        );
      };

      var getBorderLeft = function(el)
      {
        return (
          Style.get(el, "borderLeftStyle") == "none"
          ? 0
          : getStyleSize(el, "borderLeftWidth")
        );
      };

      var getInsetRight = qx.core.Environment.select("engine.name",
      {
        "mshtml" : function(el)
        {
          if (
            Style.get(el, "overflowY") == "hidden" ||
            el.clientWidth == 0
          ) {
            return getBorderRight(el);
          }

          return Math.max(0, el.offsetWidth - el.clientLeft - el.clientWidth);
        },

          "default" : function(el)
        {
          // Alternative method if clientWidth is unavailable
          // clientWidth == 0 could mean both: unavailable or really 0
          if (el.clientWidth == 0)
          {
            var ov = Style.get(el, "overflow");
            var sbv = (
              ov == "scroll" ||
              ov == "-moz-scrollbars-vertical" ? 16 : 0
            );
            return Math.max(0, getBorderRight(el) + sbv);
          }

          return Math.max(
            0,
            (el.offsetWidth - el.clientWidth - getBorderLeft(el))
          );
        }
      });

      var getScrollBarSizeRight = function(el) {
        return getInsetRight(el) - getBorderRight(el);
      };

      var t = document.createElement("div");
      var s = t.style;

      s.height = s.width = "100px";
      s.overflow = "scroll";

      document.body.appendChild(t);
      var c = getScrollBarSizeRight(t);
      this.__scrollbarSize = c ? c : 16;
      document.body.removeChild(t);

      return this.__scrollbarSize;
    },


    /**
     * Compiles the given property into a cross-browser style string.
     *
     * @signature function(prop, value)
     * @param prop {String} Property name (overflowX or overflowY)
     * @param value {String} Overflow value for the given axis
     * @return {String} CSS string
     */
    _compile : qx.core.Environment.select("engine.name",
    {
      // gecko support differs
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      // older geckos do not support overflowX
      function(prop, value)
      {
        // Fix for gecko < 1.6
        if (value == "hidden") {
          value = "-moz-scrollbars-none";
        }

        // Apply style
        return "overflow:" + value + ";";
      } :

      // gecko >= 1.8 supports overflowX, too
      function(prop, value) {
        return prop + ":" + value + ";";
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(prop, value) {
        return "overflow:" + value + ";";
      } :

      // opera >=9.5 supports overflowX, too
      function(prop, value) {
        return prop + ":" + value + ";";
      },

      // use native overflowX property
      "default" : function(prop, value) {
        return prop + ":" + value + ";";
      }
    }),


    /**
     * Compiles the horizontal overflow property into a cross-browser style string.
     *
     * @param value {String} Overflow value
     * @return {String} CSS string
     */
    compileX : function(value) {
      return this._compile("overflow-x", value);
    },


    /**
     * Compiles the vertical overflow property into a cross-browser style string.
     *
     * @param value {String} Overflow value
     * @return {String} CSS string
     */
    compileY : function(value) {
      return this._compile("overflow-y", value);
    },


    // Mozilla notes (http://developer.mozilla.org/en/docs/Mozilla_CSS_Extensions):
    // -moz-scrollbars-horizontal: Indicates that horizontal scrollbars should
    //    always appear and vertical scrollbars should never appear.
    // -moz-scrollbars-vertical: Indicates that vertical scrollbars should
    //    always appear and horizontal scrollbars should never appear.
    // -moz-scrollbars-none: Indicates that no scrollbars should appear but
    //    the element should be scrollable from script. (This is the same as
    //    hidden, and has been since Mozilla 1.6alpha.)
    //
    // Also a lot of interesting bugs:
    // * https://bugzilla.mozilla.org/show_bug.cgi?id=42676
    // * https://bugzilla.mozilla.org/show_bug.cgi?id=47710
    // * https://bugzilla.mozilla.org/show_bug.cgi?id=235524

    /**
     * Returns the computed value of the horizontal overflow
     *
     * @signature function(element, mode)
     * @param element {Element} DOM element to query
     * @param mode {Number} Choose one of the modes {@link qx.bom.element.Style#COMPUTED_MODE},
     *   {@link qx.bom.element.Style#CASCADED_MODE}, {@link qx.bom.element.Style#LOCAL_MODE}.
     *   The computed mode is the default one.
     * @return {String} computed overflow value
     */
    getX : qx.core.Environment.select("engine.name",
    {
      // gecko support differs
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      // older geckos do not support overflowX
      // it's also more safe to translate hidden to -moz-scrollbars-none
      // because of issues in older geckos
      function(element, mode)
      {
        var overflow = qx.bom.element.Style.get(element, "overflow", mode, false);

        if (overflow === "-moz-scrollbars-none") {
          overflow = "hidden";
        }

        return overflow;
      } :

      // gecko >= 1.8 supports overflowX, too
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowX", mode, false);
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflow", mode, false);
      } :

      // opera >=9.5 supports overflowX, too
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowX", mode, false);
      },

      // use native overflowX property
      "default" : function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowX", mode, false);
      }
    }),


    /**
     * Sets the local horizontal overflow value to the given value
     *
     * @signature function(element, value)
     * @param element {Element} DOM element to modify
     * @param value {String} Any of "visible", "scroll", "hidden", "auto" or ""
     * @return {void}
     */
    setX : qx.core.Environment.select("engine.name",
    {
      // gecko support differs
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      // older geckos do not support overflowX
      function(element, value)
      {
        // Fix for gecko < 1.6
        if (value == "hidden") {
          value = "-moz-scrollbars-none";
        }

        // Apply style
        element.style.overflow = value;
      } :

      // gecko >= 1.8 supports overflowX, too
      function(element, value) {
        element.style.overflowX = value;
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, value) {
        element.style.overflow = value;
      } :

      // opera >=9.5 supports overflowX, too
      function(element, value) {
        element.style.overflowX = value;
      },

      // use native overflowX property
      "default" : function(element, value) {
        element.style.overflowX = value;
      }
    }),


    /**
     * Removes the locally configured horizontal overflow property
     *
     * @signature function(element)
     * @param element {Element} DOM element to modify
     * @return {void}
     */
    resetX : qx.core.Environment.select("engine.name",
    {
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      function(element) {
        element.style.overflow = "";
      } :

      // gecko >= 1.8 supports overflowX, too
      function(element) {
        element.style.overflowX = "";
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, value) {
        element.style.overflow = "";
      } :

      // opera >=9.5 supports overflowX, too
      function(element, value) {
        element.style.overflowX = "";
      },

      // use native overflowY property
      "default" : function(element) {
        element.style.overflowX = "";
      }
    }),


    /**
     * Returns the computed value of the vertical overflow
     *
     * @signature function(element, mode)
     * @param element {Element} DOM element to query
     * @param mode {Number} Choose one of the modes {@link qx.bom.element.Style#COMPUTED_MODE},
     *   {@link qx.bom.element.Style#CASCADED_MODE}, {@link qx.bom.element.Style#LOCAL_MODE}.
     *   The computed mode is the default one.
     * @return {String} computed overflow value
     */
    getY : qx.core.Environment.select("engine.name",
    {
      // gecko support differs
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      // older geckos do not support overflowY
      // it's also more safe to translate hidden to -moz-scrollbars-none
      // because of issues in older geckos
      function(element, mode)
      {
        var overflow = qx.bom.element.Style.get(element, "overflow", mode, false);

        if (overflow === "-moz-scrollbars-none") {
          overflow = "hidden";
        }

        return overflow;
      } :

      // gecko >= 1.8 supports overflowY, too
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowY", mode, false);
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflow", mode, false);
      } :

      // opera >=9.5 supports overflowY, too
      function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowY", mode, false);
      },

      // use native overflowY property
      "default" : function(element, mode) {
        return qx.bom.element.Style.get(element, "overflowY", mode, false);
      }
    }),


    /**
     * Sets the local vertical overflow value to the given value
     *
     * @signature function(element, value)
     * @param element {Element} DOM element to modify
     * @param value {String} Any of "visible", "scroll", "hidden", "auto" or ""
     * @return {void}
     */
    setY : qx.core.Environment.select("engine.name",
    {
      // gecko support differs
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      // older geckos do not support overflowY
      // it's also more safe to translate hidden to -moz-scrollbars-none
      // because of issues in older geckos
      function(element, value)
      {
        // Fix for gecko < 1.6
        if (value === "hidden") {
          value = "-moz-scrollbars-none";
        }

        // Apply style
        element.style.overflow = value;
      } :

      // gecko >= 1.8 supports overflowY, too
      function(element, value) {
        element.style.overflowY = value;
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, value) {
        element.style.overflow = value;
      } :

      // opera >=9.5 supports overflowX, too
      function(element, value) {
        element.style.overflowY = value;
      },

      // use native overflowY property
      "default" : function(element, value) {
        element.style.overflowY = value;
      }
    }),


    /**
     * Removes the locally configured vertical overflow property
     *
     * @signature function(element)
     * @param element {Element} DOM element to modify
     * @return {void}
     */
    resetY : qx.core.Environment.select("engine.name",
    {
      "gecko" : parseFloat(qx.core.Environment.get("engine.version")) < 1.8 ?

      function(element) {
        element.style.overflow = "";
      } :

      // gecko >= 1.8 supports overflowX, too
      function(element) {
        element.style.overflowY = "";
      },

      // opera support differs
      "opera" : parseFloat(qx.core.Environment.get("engine.version")) < 9.5 ?

      // older versions of opera have no support for splitted overflow properties.
      function(element, value) {
        element.style.overflow = "";
      } :

      // opera >=9.5 supports overflowX, too
      function(element, value) {
        element.style.overflowY = "";
      },

      // use native overflowY property
      "default" : function(element) {
        element.style.overflowY = "";
      }
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

************************************************************************ */


/**
 * Contains methods to control and query the element's cursor property
 */
qx.Class.define("qx.bom.element.Cursor",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** Internal helper structure to map cursor values to supported ones */
    __map : qx.core.Environment.select("engine.name",
    {
      "mshtml" :
      {
        "cursor" : "hand",
        "ew-resize" : "e-resize",
        "ns-resize" : "n-resize",
        "nesw-resize" : "ne-resize",
        "nwse-resize" : "nw-resize"
      },

      "opera" :
      {
        "col-resize" : "e-resize",
        "row-resize" : "n-resize",
        "ew-resize" : "e-resize",
        "ns-resize" : "n-resize",
        "nesw-resize" : "ne-resize",
        "nwse-resize" : "nw-resize"
      },

      "default" : {}
    }),


    /**
     * Compiles the given cursor into a CSS compatible string.
     *
     * @param cursor {String} Valid CSS cursor name
     * @return {String} CSS string
     */
    compile : function(cursor) {
      return "cursor:" + (this.__map[cursor] || cursor) + ";";
    },


    /**
     * Returns the computed cursor style for the given element.
     *
     * @param element {Element} The element to query
     * @param mode {Number} Choose one of the modes {@link qx.bom.element.Style#COMPUTED_MODE},
     *   {@link qx.bom.element.Style#CASCADED_MODE}, {@link qx.bom.element.Style#LOCAL_MODE}.
     *   The computed mode is the default one.
     * @return {String} Computed cursor value of the given element.
     */
    get : function(element, mode) {
      return qx.bom.element.Style.get(element, "cursor", mode, false);
    },


    /**
     * Applies a new cursor style to the given element
     *
     * @param element {Element} The element to modify
     * @param value {String} New cursor value to set
     * @return {void}
     */
    set : function(element, value) {
      element.style.cursor = this.__map[value] || value;
    },


    /**
     * Removes the local cursor style applied to the element
     *
     * @param element {Element} The element to modify
     * @return {void}
     */
    reset : function(element) {
      element.style.cursor = "";
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
 * Contains methods to control and query the element's box-sizing property.
 *
 * Supported values:
 *
 * * "content-box" = W3C model (dimensions are content specific)
 * * "border-box" = Microsoft model (dimensions are box specific incl. border and padding)
 */
qx.Class.define("qx.bom.element.BoxSizing",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Map} Internal helper structure to return the valid box-sizing style property names */
    __styleProperties : qx.core.Environment.select("engine.name",
    {
      "mshtml" : null,
      "webkit" : ["boxSizing", "KhtmlBoxSizing", "WebkitBoxSizing"],
      "gecko" : ["MozBoxSizing"],
      "opera" : ["boxSizing"]
    }),


    /** {Map} Internal helper structure to return the valid box-sizing CSS property names */
    __cssProperties : qx.core.Environment.select("engine.name",
    {
      "mshtml" : null,
      "webkit" : ["box-sizing", "-khtml-box-sizing", "-webkit-box-sizing"],
      "gecko" : ["-moz-box-sizing"],
      "opera" : ["box-sizing"]
    }),


    /** {Map} Internal data structure for __usesNativeBorderBox() */
    __nativeBorderBox :
    {
      tags :
      {
        button : true,
        select : true
      },

      types :
      {
        search : true,
        button : true,
        submit : true,
        reset : true,
        checkbox : true,
        radio : true
      }
    },


    /**
     * Whether the given elements defaults to the "border-box" Microsoft model in all cases.
     *
     * @param element {Element} DOM element to query
     * @return {Boolean} true when the element uses "border-box" independently from the doctype
     */
    __usesNativeBorderBox : function(element)
    {
      var map = this.__nativeBorderBox;
      return map.tags[element.tagName.toLowerCase()] || map.types[element.type];
    },


    /**
     * Compiles the given box sizing into a CSS compatible string.
     *
     * @signature function(value)
     * @param value {String} Valid CSS box-sizing value
     * @return {String} CSS string
     */
    compile : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(value)
      {
        if (qx.core.Environment.get("qx.debug"))
        {
          qx.log.Logger.warn(this, "This client do not support the dynamic modification of the box-sizing property.");
          qx.log.Logger.trace();
        }
      },

      "default" : function(value)
      {
        var props = this.__cssProperties;
        var css = "";

        if (props)
        {
          for (var i=0, l=props.length; i<l; i++) {
            css += props[i] + ":" + value + ";";
          }
        }

        return css;
      }
    }),


    /**
     * Returns the box sizing for the given element.
     *
     * @signature function(element)
     * @param element {Element} The element to query
     * @return {String} Box sizing value of the given element.
     */
    get : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element)
      {
        if (qx.bom.Document.isStandardMode(qx.dom.Node.getDocument(element)))
        {
          if (!this.__usesNativeBorderBox(element)) {
            return "content-box";
          }
        }

        return "border-box";
      },

      "default" : function(element)
      {
        var props = this.__styleProperties;
        var value;

        if (props)
        {
          for (var i=0, l=props.length; i<l; i++)
          {
            value = qx.bom.element.Style.get(element, props[i], null, false);
            if (value != null && value !== "") {
              return value;
            }
          }
        }
        return "";
      }
    }),


    /**
     * Applies a new box sizing to the given element
     *
     * @signature function(element, value)
     * @param element {Element} The element to modify
     * @param value {String} New box sizing value to set
     * @return {void}
     */
    set : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, value)
      {
        if (qx.core.Environment.get("qx.debug")) {
          qx.log.Logger.warn(this, "This client do not support the dynamic modification of the box-sizing property.");
        }
      },

      "default" : function(element, value)
      {
        var props = this.__styleProperties;
        if (props)
        {
          for (var i=0, l=props.length; i<l; i++) {
            element.style[props[i]] = value;
          }
        }
      }
    }),


    /**
     * Removes the local box sizing applied to the element
     *
     * @param element {Element} The element to modify
     * @return {void}
     */
    reset : function(element) {
      this.set(element, "");
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
 * Contains methods to control and query the element's clip property
 */
qx.Class.define("qx.bom.element.Clip",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Compiles the given clipping into a CSS compatible string. This
     * is a simple square which describes the visible area of an DOM element.
     * Changing the clipping does not change the dimensions of
     * an element.
     *
     * @param map {Map}  Map which contains <code>left</code>, <code>top</code>
     *   <code>width</code> and <code>height</code> of the clipped area.
     * @return {String} CSS compatible string
     */
    compile : function(map)
    {
      if (!map) {
        return "clip:auto;";
      }

      var left = map.left;
      var top = map.top;
      var width = map.width;
      var height = map.height;

      var right, bottom;

      if (left == null)
      {
        right = (width == null ? "auto" : width + "px");
        left = "auto";
      }
      else
      {
        right = (width == null ? "auto" : left + width + "px");
        left = left + "px";
      }

      if (top == null)
      {
        bottom = (height == null ? "auto" : height + "px");
        top = "auto";
      }
      else
      {
        bottom = (height == null ? "auto" : top + height + "px");
        top = top + "px";
      }

      return "clip:rect(" + top + "," + right + "," + bottom + "," + left + ");";
    },


    /**
     * Gets the clipping of the given element.
     *
     * @param element {Element} DOM element to query
     * @param mode {Number} Choose one of the modes {@link qx.bom.element.Style#COMPUTED_MODE},
     *   {@link qx.bom.element.Style#CASCADED_MODE}, {@link qx.bom.element.Style#LOCAL_MODE}.
     *   The computed mode is the default one.
     * @return {Map} Map which contains <code>left</code>, <code>top</code>
     *   <code>width</code> and <code>height</code> of the clipped area.
     *   Each one could be null or any integer value.
     */
    get : function(element, mode)
    {
      var clip = qx.bom.element.Style.get(element, "clip", mode, false);

      var left, top, width, height;
      var right, bottom;

      if (typeof clip === "string" && clip !== "auto" && clip !== "")
      {
        clip = qx.lang.String.trim(clip);

        // Do not use "global" here. This will break Firefox because of
        // an issue that the lastIndex will not be resetted on separate calls.
        if (/\((.*)\)/.test(clip))
        {
          var result = RegExp.$1;

          // Process result
          // Some browsers store values space-separated, others comma-separated.
          // Handle both cases by means of feature-detection.
          if (/,/.test(result)) {
            var split = result.split(",");
          }
          else
          {
            var split = result.split(" ");
          }

          top = qx.lang.String.trim(split[0]);
          right = qx.lang.String.trim(split[1]);
          bottom = qx.lang.String.trim(split[2]);
          left = qx.lang.String.trim(split[3]);

          // Normalize "auto" to null
          if (left === "auto") {
            left = null;
          }

          if (top === "auto") {
            top = null;
          }

          if (right === "auto") {
            right = null;
          }

          if (bottom === "auto") {
            bottom = null;
          }

          // Convert to integer values
          if (top != null) {
            top = parseInt(top, 10);
          }

          if (right != null) {
            right = parseInt(right, 10);
          }

          if (bottom != null) {
            bottom = parseInt(bottom, 10);
          }

          if (left != null) {
            left = parseInt(left, 10);
          }

          // Compute width and height
          if (right != null && left != null) {
            width = right - left;
          } else if (right != null) {
            width = right;
          }

          if (bottom != null && top != null) {
            height = bottom - top;
          } else if (bottom != null) {
            height = bottom;
          }
        }
        else
        {
          throw new Error("Could not parse clip string: " + clip);
        }
      }

      // Return map when any value is available.
      return {
        left : left || null,
        top : top || null,
        width : width || null,
        height : height || null
      };
    },


    /**
     * Sets the clipping of the given element. This is a simple
     * square which describes the visible area of an DOM element.
     * Changing the clipping does not change the dimensions of
     * an element.
     *
     * @param element {Element} DOM element to modify
     * @param map {Map} A map with one or more of these available keys:
     *   <code>left</code>, <code>top</code>, <code>width</code>, <code>height</code>.
     * @return {void}
     */
    set : function(element, map)
    {
      if (!map)
      {
        element.style.clip = "rect(auto,auto,auto,auto)";
        return;
      }

      var left = map.left;
      var top = map.top;
      var width = map.width;
      var height = map.height;

      var right, bottom;

      if (left == null)
      {
        right = (width == null ? "auto" : width + "px");
        left = "auto";
      }
      else
      {
        right = (width == null ? "auto" : left + width + "px");
        left = left + "px";
      }

      if (top == null)
      {
        bottom = (height == null ? "auto" : height + "px");
        top = "auto";
      }
      else
      {
        bottom = (height == null ? "auto" : top + height + "px");
        top = top + "px";
      }

      element.style.clip = "rect(" + top + "," + right + "," + bottom + "," + left + ")";
    },


    /**
     * Resets the clipping of the given DOM element.
     *
     * @param element {Element} DOM element to modify
     * @return {void}
     */
    reset : function(element) {
      element.style.clip = "rect(auto, auto, auto, auto)";
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
     * Christian Hagendorn (chris_schmidt)

   ======================================================================

   This class contains code based on the following work:

   * Prototype JS
     http://www.prototypejs.org/
     Version 1.5

     Copyright:
       (c) 2006-2007, Prototype Core Team

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Prototype Core Team

   ----------------------------------------------------------------------

     Copyright (c) 2005-2008 Sam Stephenson

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without restriction,
     including without limitation the rights to use, copy, modify, merge,
     publish, distribute, sublicense, and/or sell copies of the Software,
     and to permit persons to whom the Software is furnished to do so,
     subject to the following conditions:

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.

************************************************************************ */


/**
 * Cross-browser opacity support.
 *
 * Optimized for animations (contains workarounds for typical flickering
 * in some browsers). Reduced class dependencies for optimal size and
 * performance.
 */
qx.Class.define("qx.bom.element.Opacity",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * {Boolean} <code>true</code> when the style attribute "opacity" is supported,
     * <code>false</code> otherwise.
     */
    SUPPORT_CSS3_OPACITY : false,

    /**
     * Compiles the given opacity value into a cross-browser CSS string.
     * Accepts numbers between zero and one
     * where "0" means transparent, "1" means opaque.
     *
     * @signature function(opacity)
     * @param opacity {Float} A float number between 0 and 1
     * @return {String} CSS compatible string
     */
    compile : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(opacity)
      {
        if (opacity >= 1) {
          opacity = 1;
        }

        if (opacity < 0.00001) {
          opacity = 0;
        }

        if (qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY) {
          return "opacity:" + opacity + ";";
        } else {
          return "zoom:1;filter:alpha(opacity=" + (opacity * 100) + ");";
        }
      },

      "gecko" : function(opacity)
      {
        // Animations look better when not using 1.0 in gecko
        if (opacity >= 1) {
          opacity = 0.999999;
        }

        if (!qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY) {
          return "-moz-opacity:" + opacity + ";";
        } else {
          return "opacity:" + opacity + ";";
        }
      },

      "default" : function(opacity)
      {
        if (opacity >= 1) {
          return "";
        }

        return "opacity:" + opacity + ";";
      }
    }),


    /**
     * Sets opacity of given element. Accepts numbers between zero and one
     * where "0" means transparent, "1" means opaque.
     *
     * @param element {Element} DOM element to modify
     * @param opacity {Float} A float number between 0 and 1
     * @return {void}
     * @signature function(element, opacity)
     */
    set : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, opacity)
      {
        if (qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY)
        {
          if (opacity >= 1) {
            opacity = "";
          }

          element.style.opacity = opacity;
        }
        else
        {
          // Read in computed filter
          var filter = qx.bom.element.Style.get(element, "filter", qx.bom.element.Style.COMPUTED_MODE, false);

          if (opacity >= 1)
          {
            opacity = 1;
          }

          if (opacity < 0.00001) {
            opacity = 0;
          }

          // IE has trouble with opacity if it does not have layout (hasLayout)
          // Force it by setting the zoom level
          if (!element.currentStyle || !element.currentStyle.hasLayout) {
            element.style.zoom = 1;
          }

          // Remove old alpha filter and add new one
          element.style.filter = filter.replace(/alpha\([^\)]*\)/gi, "") + "alpha(opacity=" + opacity * 100 + ")";
        }
      },

      "gecko" : function(element, opacity)
      {
        // Animations look better when not using 1.0 in gecko
        if (opacity >= 1) {
          opacity = 0.999999;
        }

        if (!qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY) {
          element.style.MozOpacity = opacity;
        } else {
          element.style.opacity = opacity;
        }
      },

      "default" : function(element, opacity)
      {
        if (opacity >= 1) {
          opacity = "";
        }

        element.style.opacity = opacity;
      }
    }),


    /**
     * Resets opacity of given element.
     *
     * @param element {Element} DOM element to modify
     * @return {void}
     * @signature function(element)
     */
    reset : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element)
      {
        if (qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY)
        {
          element.style.opacity = "";
        }
        else
        {
          // Read in computed filter
          var filter = qx.bom.element.Style.get(element, "filter", qx.bom.element.Style.COMPUTED_MODE, false);

          // Remove old alpha filter
          element.style.filter = filter.replace(/alpha\([^\)]*\)/gi, "");
        }
      },

      "gecko" : function(element)
      {
        if (!qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY) {
          element.style.MozOpacity = "";
        } else {
          element.style.opacity = "";
        }
      },

      "default" : function(element) {
        element.style.opacity = "";
      }
    }),


    /**
     * Gets computed opacity of given element. Accepts numbers between zero and one
     * where "0" means transparent, "1" means opaque.
     *
     * @param element {Element} DOM element to modify
     * @param mode {Number} Choose one of the modes {@link qx.bom.element.Style#COMPUTED_MODE},
     *   {@link qx.bom.element.Style#CASCADED_MODE}, {@link qx.bom.element.Style#LOCAL_MODE}.
     *   The computed mode is the default one.
     * @return {Float} A float number between 0 and 1
     * @signature function(element, mode)
     */
    get : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, mode)
      {
        if (qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY)
        {
          var opacity = qx.bom.element.Style.get(element, "opacity", mode, false);

          if (opacity != null) {
            return parseFloat(opacity);
          }

          return 1.0;
        }
        else
        {
          var filter = qx.bom.element.Style.get(element, "filter", mode, false);

          if (filter)
          {
            var opacity = filter.match(/alpha\(opacity=(.*)\)/);

            if (opacity && opacity[1]) {
              return parseFloat(opacity[1]) / 100;
            }
          }

          return 1.0;
        }
      },

      "gecko" : function(element, mode)
      {
        var opacity = qx.bom.element.Style.get(element, !qx.bom.element.Opacity.SUPPORT_CSS3_OPACITY ? "MozOpacity" : "opacity", mode, false);

        if (opacity == 0.999999) {
          opacity = 1.0;
        }

        if (opacity != null) {
          return parseFloat(opacity);
        }

        return 1.0;
      },

      "default" : function(element, mode)
      {
        var opacity = qx.bom.element.Style.get(element, "opacity", mode, false);

        if (opacity != null) {
          return parseFloat(opacity);
        }

        return 1.0;
      }
    })
  },

  defer : function(statics) {
    statics.SUPPORT_CSS3_OPACITY = (typeof document.documentElement.style.opacity == "string");
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

   ======================================================================

   This class contains code based on the following work:

   * Prototype JS
     http://www.prototypejs.org/
     Version 1.5

     Copyright:
       (c) 2006-2007, Prototype Core Team

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

     Authors:
       * Prototype Core Team

   ----------------------------------------------------------------------

     Copyright (c) 2005-2008 Sam Stephenson

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without restriction,
     including without limitation the rights to use, copy, modify, merge,
     publish, distribute, sublicense, and/or sell copies of the Software,
     and to permit persons to whom the Software is furnished to do so,
     subject to the following conditions:

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
     DEALINGS IN THE SOFTWARE.

************************************************************************ */

/* ************************************************************************

#require(qx.lang.String)

************************************************************************ */

/**
 * Style querying and modification of HTML elements.
 *
 * Automatically normalizes cross-browser differences for setting and reading
 * CSS attributes. Optimized for performance.
 */
qx.Class.define("qx.bom.element.Style",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Detect vendor specific properties.
     */
    __detectVendorProperties : function()
    {
      var vendorProperties = [
        "appearance",
        "userSelect",
        "textOverflow",
        "borderImage"
      ];

      var styleNames = {};

      var style = document.documentElement.style;
      var prefixes = ['Moz', 'Webkit', 'Khtml', 'O', 'Ms'];
      for (var i=0,l=vendorProperties.length; i<l; i++)
      {
        var propName = vendorProperties[i];
        var key = propName;
        if (style[propName])
        {
          styleNames[key] = propName;
          continue;
        }

        propName = qx.lang.String.firstUp(propName);

        for (var j=0, pl=prefixes.length; j<pl; j++)
        {
          var prefixed = prefixes[j] + propName;
          if (typeof style[prefixed] == 'string')
          {
            styleNames[key] = prefixed;
            break;
          };

        }
      }

      this.__styleNames = styleNames;

      this.__styleNames["userModify"] = qx.core.Environment.select("engine.name", {
        "gecko" : "MozUserModify",
        "webkit" : "WebkitUserModify",
        "default" : "userSelect"
      });

      this.__cssNames = {};
      for (var key in styleNames) {
        this.__cssNames[key] = this.__hyphenate(styleNames[key]);
      }

      this.__styleNames["float"] = qx.core.Environment.select("engine.name", {
        "mshtml" : "styleFloat",
        "default" : "cssFloat"
      });
    },


    /**
     * Mshtml has proprietary pixel* properties for locations and dimensions
     * which return the pixel value. Used by getComputed() in mshtml variant.
     *
     * @internal
     */
    __mshtmlPixel :
    {
      width : "pixelWidth",
      height : "pixelHeight",
      left : "pixelLeft",
      right : "pixelRight",
      top : "pixelTop",
      bottom : "pixelBottom"
    },

    /**
     * Whether a special class is available for the processing of this style.
     *
     * @internal
     */
    __special :
    {
      clip : qx.bom.element.Clip,
      cursor : qx.bom.element.Cursor,
      opacity : qx.bom.element.Opacity,
      boxSizing : qx.bom.element.BoxSizing,
      overflowX : {
        set : qx.lang.Function.bind(qx.bom.element.Overflow.setX, qx.bom.element.Overflow),
        get : qx.lang.Function.bind(qx.bom.element.Overflow.getX, qx.bom.element.Overflow),
        reset : qx.lang.Function.bind(qx.bom.element.Overflow.resetX, qx.bom.element.Overflow),
        compile : qx.lang.Function.bind(qx.bom.element.Overflow.compileX, qx.bom.element.Overflow)
      },
      overflowY : {
        set : qx.lang.Function.bind(qx.bom.element.Overflow.setY, qx.bom.element.Overflow),
        get : qx.lang.Function.bind(qx.bom.element.Overflow.getY, qx.bom.element.Overflow),
        reset : qx.lang.Function.bind(qx.bom.element.Overflow.resetY, qx.bom.element.Overflow),
        compile : qx.lang.Function.bind(qx.bom.element.Overflow.compileY, qx.bom.element.Overflow)
      }
    },


    /*
    ---------------------------------------------------------------------------
      COMPILE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Compiles the given styles into a string which can be used to
     * concat a HTML string for innerHTML usage.
     *
     * @param map {Map} Map of style properties to compile
     * @return {String} Compiled string of given style properties.
     */
    compile : function(map)
    {
      var html = [];
      var special = this.__special;
      var names = this.__cssNames;
      var name, value;

      for (name in map)
      {
        // read value
        value = map[name];
        if (value == null) {
          continue;
        }

        // normalize name
        name = names[name] || name;

        // process special properties
        if (special[name]) {
          html.push(special[name].compile(value));
        } else {
          html.push(this.__hyphenate(name), ":", value, ";");
        }
      }

      return html.join("");
    },


    /** {Map} Caches hyphened style names e.g. marginTop => margin-top. */
    __hyphens : {},


    /**
     * Hyphenate the given string. Replaces upper case letters with lower case
     * letters prefixed with a hyphen.
     *
     * @param propName {String} A CSS property name
     * @return {String} The hyphenated version of the property name
     */
    __hyphenate : function(propName)
    {
      var hyphens = this.__hyphens;
      var prop = hyphens[propName];
      if (!prop) {
        prop = hyphens[propName] = qx.lang.String.hyphenate(propName);
      }
      return prop;
    },


    /*
    ---------------------------------------------------------------------------
      CSS TEXT SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Set the full CSS content of the style attribute
     *
     * @param element {Element} The DOM element to modify
     * @param value {String} The full CSS string
     * @signature function(element, value)
     * @return {void}
     */
    setCss : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, value) {
        element.style.cssText = value;
      },

      "default" : function(element, value) {
        element.setAttribute("style", value);
      }
    }),


    /**
     * Returns the full content of the style attribute.
     *
     * @param element {Element} The DOM element to query
     * @return {String} the full CSS string
     * @signature function(element)
     */
    getCss : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element) {
        return element.style.cssText.toLowerCase();
      },

      "default" : function(element) {
        return element.getAttribute("style");
      }
    }),





    /*
    ---------------------------------------------------------------------------
      STYLE ATTRIBUTE SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Checks whether the browser supports the given CSS property.
     *
     * @param propertyName {String} The name of the property
     * @return {Boolean} Whether the property id supported
     */
    isPropertySupported : function(propertyName)
    {
      return (
        this.__special[propertyName] ||
        this.__styleNames[propertyName] ||
        propertyName in document.documentElement.style
      );
    },


    /** {Integer} Computed value of a style property. Compared to the cascaded style,
     * this one also interprets the values e.g. translates <code>em</code> units to
     * <code>px</code>.
     */
    COMPUTED_MODE : 1,


    /** {Integer} Cascaded value of a style property. */
    CASCADED_MODE : 2,


    /**
     * {Integer} Local value of a style property. Ignores inheritance cascade.
     *   Does not interpret values.
     */
    LOCAL_MODE : 3,


    /**
     * Sets the value of a style property
     *
     * @param element {Element} The DOM element to modify
     * @param name {String} Name of the style attribute (js variant e.g. marginTop, wordSpacing)
     * @param value {var} The value for the given style
     * @param smart {Boolean?true} Whether the implementation should automatically use
     *    special implementations for some properties
     * @return {void}
     */
    set : function(element, name, value, smart)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.core.Assert.assertElement(element, "Invalid argument 'element'");
        qx.core.Assert.assertString(name, "Invalid argument 'name'");
        if (smart !== undefined) {
          qx.core.Assert.assertBoolean(smart, "Invalid argument 'smart'");
        }
      }


      // normalize name
      name = this.__styleNames[name] || name;

      // special handling for specific properties
      // through this good working switch this part costs nothing when
      // processing non-smart properties
      if (smart!==false && this.__special[name]) {
        return this.__special[name].set(element, value);
      } else {
        element.style[name] = value !== null ? value : "";
      }
    },


    /**
     * Convenience method to modify a set of styles at once.
     *
     * @param element {Element} The DOM element to modify
     * @param styles {Map} a map where the key is the name of the property
     *    and the value is the value to use.
     * @param smart {Boolean?true} Whether the implementation should automatically use
     *    special implementations for some properties
     * @return {void}
     */
    setStyles : function(element, styles, smart)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        qx.core.Assert.assertElement(element, "Invalid argument 'element'");
        qx.core.Assert.assertMap(styles, "Invalid argument 'styles'");
        if (smart !== undefined) {
          qx.core.Assert.assertBoolean(smart, "Invalid argument 'smart'");
        }
      }

      // inline calls to "set" and "reset" because this method is very
      // performance critical!
      var styleNames = this.__styleNames;
      var special = this.__special;

      var style = element.style;

      for (var key in styles)
      {
        var value = styles[key];
        var name = styleNames[key] || key;

        if (value === undefined)
        {
          if (smart!==false && special[name]) {
            special[name].reset(element);
          } else {
            style[name] = "";
          }
        }
        else
        {
          if (smart!==false && special[name]) {
            special[name].set(element, value);
          } else {
            style[name] = value !== null ? value : "";
          }
        }
      }
    },


    /**
     * Resets the value of a style property
     *
     * @param element {Element} The DOM element to modify
     * @param name {String} Name of the style attribute (js variant e.g. marginTop, wordSpacing)
     * @param smart {Boolean?true} Whether the implementation should automatically use
     *    special implementations for some properties
     * @return {void}
     */
    reset : function(element, name, smart)
    {
      // normalize name
      name = this.__styleNames[name] || name;

      // special handling for specific properties
      if (smart!==false && this.__special[name]) {
        return this.__special[name].reset(element);
      } else {
        element.style[name] = "";
      }
    },


    /**
     * Gets the value of a style property.
     *
     * *Computed*
     *
     * Returns the computed value of a style property. Compared to the cascaded style,
     * this one also interprets the values e.g. translates <code>em</code> units to
     * <code>px</code>.
     *
     * *Cascaded*
     *
     * Returns the cascaded value of a style property.
     *
     * *Local*
     *
     * Ignores inheritance cascade. Does not interpret values.
     *
     * @signature function(element, name, mode, smart)
     * @param element {Element} The DOM element to modify
     * @param name {String} Name of the style attribute (js variant e.g. marginTop, wordSpacing)
     * @param mode {Number} Choose one of the modes {@link #COMPUTED_MODE}, {@link #CASCADED_MODE},
     *   {@link #LOCAL_MODE}. The computed mode is the default one.
     * @param smart {Boolean?true} Whether the implementation should automatically use
     *    special implementations for some properties
     * @return {var} The value of the property
     */
    get : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(element, name, mode, smart)
      {
        // normalize name
        name = this.__styleNames[name] || name;

        // special handling
        if (smart!==false && this.__special[name]) {
          return this.__special[name].get(element, mode);
        }

        // if the element is not inserted into the document "currentStyle"
        // may be undefined. In this case always return the local style.
        if (!element.currentStyle) {
          return element.style[name] || "";
        }

        // switch to right mode
        switch(mode)
        {
          case this.LOCAL_MODE:
            return element.style[name] || "";

          case this.CASCADED_MODE:
            return element.currentStyle[name] || "";

          default:
            // Read cascaded style
            var currentStyle = element.currentStyle[name] || "";

            // Pixel values are always OK
            if (/^-?[\.\d]+(px)?$/i.test(currentStyle)) {
              return currentStyle;
            }

            // Try to convert non-pixel values
            var pixel = this.__mshtmlPixel[name];
            if (pixel)
            {
              // Backup local and runtime style
              var localStyle = element.style[name];

              // Overwrite local value with cascaded value
              // This is needed to have the pixel value setupped
              element.style[name] = currentStyle || 0;

              // Read pixel value and add "px"
              var value = element.style[pixel] + "px";

              // Recover old local value
              element.style[name] = localStyle;

              // Return value
              return value;
            }

            // Non-Pixel values may be problematic
            if (/^-?[\.\d]+(em|pt|%)?$/i.test(currentStyle)) {
              throw new Error("Untranslated computed property value: " + name + ". Only pixel values work well across different clients.");
            }

            // Just the current style
            return currentStyle;
        }
      },

      "default" : function(element, name, mode, smart)
      {
        // normalize name
        name = this.__styleNames[name] || name;

        // special handling
        if (smart!==false && this.__special[name]) {
          return this.__special[name].get(element, mode);
        }

        // switch to right mode
        switch(mode)
        {
          case this.LOCAL_MODE:
            return element.style[name] || "";

          case this.CASCADED_MODE:
            // Currently only supported by Opera and Internet Explorer
            if (element.currentStyle) {
              return element.currentStyle[name] || "";
            }

            throw new Error("Cascaded styles are not supported in this browser!");

          // Support for the DOM2 getComputedStyle method
          //
          // Safari >= 3 & Gecko > 1.4 expose all properties to the returned
          // CSSStyleDeclaration object. In older browsers the function
          // "getPropertyValue" is needed to access the values.
          //
          // On a computed style object all properties are read-only which is
          // identical to the behavior of MSHTML's "currentStyle".
          default:
            // Opera, Mozilla and Safari 3+ also have a global getComputedStyle which is identical
            // to the one found under document.defaultView.

            // The problem with this is however that this does not work correctly
            // when working with frames and access an element of another frame.
            // Then we must use the <code>getComputedStyle</code> of the document
            // where the element is defined.
            var doc = qx.dom.Node.getDocument(element);
            var computed = doc.defaultView.getComputedStyle(element, null);

            // All relevant browsers expose the configured style properties to
            // the CSSStyleDeclaration objects
            return computed ? computed[name] : "";
        }
      }
    })
  },

  defer : function(statics) {
    statics.__detectVendorProperties();
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

   ======================================================================

   This class contains code based on the following work:

   * Yahoo! UI Library
       http://developer.yahoo.com/yui
       Version 2.2.0

     Copyright:
       (c) 2007, Yahoo! Inc.

     License:
       BSD: http://developer.yahoo.com/yui/license.txt

   ----------------------------------------------------------------------

     http://developer.yahoo.com/yui/license.html

     Copyright (c) 2009, Yahoo! Inc.
     All rights reserved.

     Redistribution and use of this software in source and binary forms,
     with or without modification, are permitted provided that the
     following conditions are met:

     * Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in
       the documentation and/or other materials provided with the
       distribution.
     * Neither the name of Yahoo! Inc. nor the names of its contributors
       may be used to endorse or promote products derived from this
       software without specific prior written permission of Yahoo! Inc.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
     INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     OF THE POSSIBILITY OF SUCH DAMAGE.

************************************************************************ */

/**
 * Includes library functions to work with the current document.
 */
qx.Class.define("qx.bom.Document",
{
  statics :
  {
    /**
     * Whether the document is in quirks mode (e.g. non XHTML, HTML4 Strict or missing doctype)
     *
     * @signature function(win)
     * @param win {Window?window} The window to query
     * @return {Boolean} true when containing document is in quirks mode
     */
    isQuirksMode : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(win)
      {
        if(qx.core.Environment.get("engine.version") >= 8) {
          return (win||window).document.documentMode === 5;
        } else {
          return (win||window).document.compatMode !== "CSS1Compat";
        }
      },

      "webkit" : function(win)
      {
        if (document.compatMode === undefined)
        {
          var el = (win||window).document.createElement("div");
          el.style.cssText = "position:absolute;width:0;height:0;width:1";
          return el.style.width === "1px" ? true : false;
        } else {
          return (win||window).document.compatMode !== "CSS1Compat";
        }
      },

      "default" : function(win) {
        return (win||window).document.compatMode !== "CSS1Compat";
      }
    }),


    /**
     * Whether the document is in standard mode (e.g. XHTML, HTML4 Strict or doctype defined)
     *
     * @param win {Window?window} The window to query
     * @return {Boolean} true when containing document is in standard mode
     */
    isStandardMode : function(win) {
      return !this.isQuirksMode(win);
    },


    /**
     * Returns the width of the document.
     *
     * Internet Explorer in standard mode stores the proprietary <code>scrollWidth</code> property
     * on the <code>documentElement</code>, but in quirks mode on the body element. All
     * other known browsers simply store the correct value on the <code>documentElement</code>.
     *
     * If the viewport is wider than the document the viewport width is returned.
     *
     * As the html element has no visual appearance it also can not scroll. This
     * means that we must use the body <code>scrollWidth</code> in all non mshtml clients.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @param win {Window?window} The window to query
     * @return {Integer} The width of the actual document (which includes the body and its margin).
     *
     * NOTE: Opera 9.5x and 9.6x have wrong value for the scrollWidth property,
     * if an element use negative value for top and left to be outside the viewport!
     * See: http://bugzilla.qooxdoo.org/show_bug.cgi?id=2869
     */
    getWidth : function(win)
    {
      var doc = (win||window).document;
      var view = qx.bom.Viewport.getWidth(win);
      var scroll = this.isStandardMode(win) ? doc.documentElement.scrollWidth : doc.body.scrollWidth;
      return Math.max(scroll, view);
    },


    /**
     * Returns the height of the document.
     *
     * Internet Explorer in standard mode stores the proprietary <code>scrollHeight</code> property
     * on the <code>documentElement</code>, but in quirks mode on the body element. All
     * other known browsers simply store the correct value on the <code>documentElement</code>.
     *
     * If the viewport is higher than the document the viewport height is returned.
     *
     * As the html element has no visual appearance it also can not scroll. This
     * means that we must use the body <code>scrollHeight</code> in all non mshtml clients.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @param win {Window?window} The window to query
     * @return {Integer} The height of the actual document (which includes the body and its margin).
     *
     * NOTE: Opera 9.5x and 9.6x have wrong value for the scrollWidth property,
     * if an element use negative value for top and left to be outside the viewport!
     * See: http://bugzilla.qooxdoo.org/show_bug.cgi?id=2869
     */
    getHeight : function(win)
    {
      var doc = (win||window).document;
      var view = qx.bom.Viewport.getHeight(win);
      var scroll = this.isStandardMode(win) ? doc.documentElement.scrollHeight : doc.body.scrollHeight;
      return Math.max(scroll, view);
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
     * Tino Butz (tbtz)

   ======================================================================

   This class contains code based on the following work:

   * Unify Project

     Homepage:
       http://unify-project.org

     Copyright:
       2009-2010 Deutsche Telekom AG, Germany, http://telekom.com

     License:
       MIT: http://www.opensource.org/licenses/mit-license.php

   * Yahoo! UI Library
       http://developer.yahoo.com/yui
       Version 2.2.0

     Copyright:
       (c) 2007, Yahoo! Inc.

     License:
       BSD: http://developer.yahoo.com/yui/license.txt

   ----------------------------------------------------------------------

     http://developer.yahoo.com/yui/license.html

     Copyright (c) 2009, Yahoo! Inc.
     All rights reserved.

     Redistribution and use of this software in source and binary forms,
     with or without modification, are permitted provided that the
     following conditions are met:

     * Redistributions of source code must retain the above copyright
       notice, this list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in
       the documentation and/or other materials provided with the
       distribution.
     * Neither the name of Yahoo! Inc. nor the names of its contributors
       may be used to endorse or promote products derived from this
       software without specific prior written permission of Yahoo! Inc.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
     FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
     INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
     SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
     HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
     STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
     ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
     OF THE POSSIBILITY OF SUCH DAMAGE.

************************************************************************ */

/**
 * Includes library functions to work with the client's viewport (window).
 */
qx.Class.define("qx.bom.Viewport",
{
  statics :
  {
    /**
     * Returns the current width of the viewport (excluding an eventually visible scrollbar).
     *
     * <code>clientWidth</code> is the inner width of an element in pixels. It includes padding
     * but not the vertical scrollbar (if present, if rendered), border or margin.
     *
     * The property <code>innerWidth</code> is not useable as defined by the standard as it includes the scrollbars
     * which is not the indented behavior of this method. We can decrement the size by the scrollbar
     * size but there are easier possibilities to work around this.
     *
     * Safari 2 and 3 beta (3.0.2) do not correctly implement <code>clientWidth</code> on documentElement/body,
     * but <code>innerWidth</code> works there. Interesting is that webkit do not correctly implement
     * <code>innerWidth</code>, too. It calculates the size excluding the scroll bars and this
     * differs from the behavior of all other browsers - but this is exactly what we want to have
     * in this case.
     *
     * Opera less then 9.50 only works well using <code>body.clientWidth</code>.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @signature function(win)
     * @param win {Window?window} The window to query
     * @return {Integer} The width of the viewable area of the page (excludes scrollbars).
     */
    getWidth : qx.core.Environment.select("engine.name",
    {
      "opera" : function(win) {
        if (parseFloat(qx.core.Environment.get("engine.version")) < 9.5) {
          return (win||window).document.body.clientWidth;
        }
        else
        {
          var doc = (win||window).document;
          return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientWidth : doc.body.clientWidth;
        }
      },

      "webkit" : function(win) {
        if (parseFloat(qx.core.Environment.get("engine.version")) < 523.15) { // Version < 3.0.4
          return (win||window).innerWidth;
        }
        else
        {
          var doc = (win||window).document;
          return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientWidth : doc.body.clientWidth;
        }
      },

      "default" : function(win)
      {
        var doc = (win||window).document;
        return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientWidth : doc.body.clientWidth;
      }
    }),


    /**
     * Returns the current height of the viewport (excluding an eventually visible scrollbar).
     *
     * <code>clientHeight</code> is the inner height of an element in pixels. It includes padding
     * but not the vertical scrollbar (if present, if rendered), border or margin.
     *
     * The property <code>innerHeight</code> is not useable as defined by the standard as it includes the scrollbars
     * which is not the indented behavior of this method. We can decrement the size by the scrollbar
     * size but there are easier possibilities to work around this.
     *
     * Safari 2 and 3 beta (3.0.2) do not correctly implement <code>clientHeight</code> on documentElement/body,
     * but <code>innerHeight</code> works there. Interesting is that webkit do not correctly implement
     * <code>innerHeight</code>, too. It calculates the size excluding the scroll bars and this
     * differs from the behavior of all other browsers - but this is exactly what we want to have
     * in this case.
     *
     * Opera less then 9.50 only works well using <code>body.clientHeight</code>.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @signature function(win)
     * @param win {Window?window} The window to query
     * @return {Integer} The Height of the viewable area of the page (excludes scrollbars).
     */
    getHeight : qx.core.Environment.select("engine.name",
    {
      "opera" : function(win) {
        if (parseFloat(qx.core.Environment.get("engine.version")) < 9.5) {
          return (win||window).document.body.clientHeight;
        }
        else
        {
          var doc = (win||window).document;
          return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientHeight : doc.body.clientHeight;
        }
      },

      "webkit" : function(win) {
        if (parseFloat(qx.core.Environment.get("engine.version")) < 523.15) { // Version < 3.0.4
          return (win||window).innerHeight;
        }
        else {
          var doc = (win||window).document;
          return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientHeight : doc.body.clientHeight;
        }
      },

      "default" : function(win)
      {
        var doc = (win||window).document;
        return qx.bom.Document.isStandardMode(win) ? doc.documentElement.clientHeight : doc.body.clientHeight;
      }
    }),


    /**
     * Returns the scroll position of the viewport
     *
     * All clients except MSHTML supports the non-standard property <code>pageXOffset</code>.
     * As this is easier to evaluate we prefer this property over <code>scrollLeft</code>.
     *
     * For MSHTML the access method differs between standard and quirks mode;
     * as this can differ from document to document this test must be made on
     * each query.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @signature function(win)
     * @param win {Window?window} The window to query
     * @return {Integer} Scroll position from left edge, always a positive integer
     */
    getScrollLeft : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(win)
      {
        var doc = (win||window).document;
        return doc.documentElement.scrollLeft || doc.body.scrollLeft;
      },

      "default" : function(win) {
        return (win||window).pageXOffset;
      }
    }),


    /**
     * Returns the scroll position of the viewport
     *
     * All clients except MSHTML supports the non-standard property <code>pageYOffset</code>.
     * As this is easier to evaluate we prefer this property over <code>scrollTop</code>.
     *
     * For MSHTML the access method differs between standard and quirks mode;
     * as this can differ from document to document this test must be made on
     * each query.
     *
     * Verified to correctly work with:
     *
     * * Mozilla Firefox 2.0.0.4
     * * Opera 9.2.1
     * * Safari 3.0 beta (3.0.2)
     * * Internet Explorer 7.0
     *
     * @signature function(win)
     * @param win {Window?window} The window to query
     * @return {Integer} Scroll position from top edge, always a positive integer
     */
    getScrollTop : qx.core.Environment.select("engine.name",
    {
      "mshtml" : function(win)
      {
        var doc = (win||window).document;
        return doc.documentElement.scrollTop || doc.body.scrollTop;
      },

      "default" : function(win) {
        return (win||window).pageYOffset;
      }
    }),


    /**
     * Returns the current orientation of the viewport in degree.
     *
     * All possible values and their meaning:
     *
     * * <code>0</code>: "Portrait"
     * * <code>-90</code>: "Landscape (right, screen turned clockwise)"
     * * <code>90</code>: "Landscape (left, screen turned counterclockwise)"
     * * <code>180</code>: "Portrait (upside-down portrait)"
     *
     * @param win {Window?window} The window to query
     * @return {Integer} The current orientation in degree
     */
    getOrientation : function(win)
    {
      // See http://developer.apple.com/library/safari/#documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html%23//apple_ref/doc/uid/TP40006511-SW16
      // for more information.
      var orientation = (win||window).orientation;
      if (orientation == null) {
        orientation = this.getWidth(win) > this.getHeight(win) ? 90 : 0;
      }
      return orientation;
    },


    /**
     * Whether the viewport orientation is currently in landscape mode.
     *
     * @param win {Window?window} The window to query
     * @return {Boolean} <code>true</code> when the viewport orientation
     *     is currently in landscape mode.
     */
    isLandscape : function(win) {
      return Math.abs(this.getOrientation(win)) == 90;
    },


    /**
     * Whether the viewport orientation is currently in portrait mode.
     *
     * @param win {Window?window} The window to query
     * @return {Boolean} <code>true</code> when the viewport orientation
     *     is currently in portrait mode.
     */
    isPortrait : function(win)
    {
      var orientation = this.getOrientation(win);
      return (orientation == 0 || orientation == 180);
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
 * The ImageLoader can preload and manage loaded image resources. It easily
 * handles multiple requests and supports callbacks for successful and failed
 * requests.
 *
 * After loading of an image the dimension of the image is stored as long
 * as the application is running. This is quite useful for in-memory layouting.
 *
 * Use {@link #load} to preload your own images.
 */
qx.Bootstrap.define("qx.io.ImageLoader",
{
  statics :
  {
    /** {Map} Internal data structure to cache image sizes */
    __data : {},


    /** {Map} Default image size */
    __defaultSize :
    {
      width : null,
      height : null
    },

    /** {Array} Known image types */
    __knownImageTypesRegExp : /\.(png|gif|jpg|jpeg|bmp)\b/i,


    /**
     * Whether the given image has previously been loaded using the
     * {@link #load} method.
     *
     * @param source {String} Image source to query
     * @return {Boolean} <code>true</code> when the image is loaded
     */
    isLoaded : function(source)
    {
      var entry = this.__data[source];
      return !!(entry && entry.loaded);
    },


    /**
     * Whether the given image has previously been requested using the
     * {@link #load} method but failed.
     *
     * @param source {String} Image source to query
     * @return {Boolean} <code>true</code> when the image loading failed
     */
    isFailed : function(source)
    {
      var entry = this.__data[source];
      return !!(entry && entry.failed);
    },


    /**
     * Whether the given image is currently loading.
     *
     * @param source {String} Image source to query
     * @return {Boolean} <code>true</code> when the image is loading in the moment.
     */
    isLoading : function(source)
    {
      var entry = this.__data[source];
      return !!(entry && entry.loading);
    },


    /**
     * Returns the format of a previously loaded image
     *
     * @param source {String} Image source to query
     * @return {String ? null} The format of the image or <code>null</code>
     */
    getFormat : function(source)
    {
      var entry = this.__data[source];
      return entry ? entry.format : null;
    },


    /**
     * Returns the size of a previously loaded image
     *
     * @param source {String} Image source to query
     * @return {Map} The dimension of the image. If the image is not yet loaded,
     *    the dimensions are given as nullxnull pixel.
     */
    getSize : function(source) {
      var entry = this.__data[source];
      return entry ? { width: entry.width, height: entry.height } : this.__defaultSize;
    },


    /**
     * Returns the image width
     *
     * @param source {String} Image source to query
     * @return {Boolean} The width or <code>null</code> when the image is not loaded
     */
    getWidth : function(source)
    {
      var entry = this.__data[source];
      return entry ? entry.width : null;
    },


    /**
     * Returns the image height
     *
     * @param source {String} Image source to query
     * @return {Boolean} The height or <code>null</code> when the image is not loaded
     */
    getHeight : function(source)
    {
      var entry = this.__data[source];
      return entry ? entry.height : null;
    },


    /**
     * Loads the given image. Supports a callback which is
     * executed when the image is loaded.
     *
     * This method works asychronous.
     *
     * @param source {String} Image source to load
     * @param callback {Function} Callback function to execute
     *   The first parameter of the callback is the given source url, the
     *   second parameter is the data entry which contains additional
     *   information about the image.
     * @param context {Object} Context in which the given callback should be executed
     */
    load : function(source, callback, context)
    {
      // Shorthand
      var entry = this.__data[source];

      if (!entry) {
        entry = this.__data[source] = {};
      }

      // Normalize context
      if (callback && !context) {
        context = window;
      }

      // Already known image source
      if (entry.loaded || entry.loading || entry.failed)
      {
        if (callback)
        {
          if (entry.loading) {
            entry.callbacks.push(callback, context);
          } else {
            callback.call(context, source, entry);
          }
        }
      }
      else
      {
        // Updating entry
        entry.loading = true;
        entry.callbacks = [];

        if (callback) {
          entry.callbacks.push(callback, context);
        }

        // Create image element
        var el = new Image();

        // Create common callback routine
        var boundCallback = qx.lang.Function.listener(this.__onload, this, el, source);

        // Assign callback to element
        el.onload = boundCallback;
        el.onerror = boundCallback;

        // Start loading of image
        el.src = source;

        // save the element for aborting
        entry.element = el;
      }
    },


    /**
     * Abort the loading for the given url.
     *
     * @param source {String} URL of the image to abort its loading.
     */
    abort : function (source)
    {
      var entry = this.__data[source];

      if (entry && !entry.loaded)
      {
        entry.aborted = true;

        var callbacks = entry.callbacks;
        var element = entry.element;

        // Cleanup listeners
        element.onload = element.onerror = null;

        // Cleanup entry
        delete entry.callbacks;
        delete entry.element;
        delete entry.loading;

        for (var i=0, l=callbacks.length; i<l; i+=2) {
          callbacks[i].call(callbacks[i+1], source, entry);
        }
      }

      this.__data[source] = null;
    },


    /**
     * Internal event listener for all load/error events.
     *
     * @signature function(event, element, source)
     *
     * @param event {Event} Native event object
     * @param element {Element} DOM element which represents the image
     * @param source {String} The image source loaded
     */
    __onload : qx.event.GlobalError.observeMethod(function(event, element, source)
    {
      // Shorthand
      var entry = this.__data[source];

      if (!entry) {
        // return;
      }

      // Store dimensions
      if (event.type === "load")
      {
        entry.loaded = true;
        entry.width = this.__getWidth(element);
        entry.height = this.__getHeight(element);

        // try to determine the image format
        var result = this.__knownImageTypesRegExp.exec(source);
        if (result != null)
        {
          entry.format = result[1];
        }
      }
      else
      {
        entry.failed = true;
      }

      // Cleanup listeners
      element.onload = element.onerror = null;

      // Cache callbacks
      var callbacks = entry.callbacks;

      // Cleanup entry
      delete entry.loading;
      delete entry.callbacks;
      delete entry.element;

      // Execute callbacks
      for (var i=0, l=callbacks.length; i<l; i+=2) {
        callbacks[i].call(callbacks[i+1], source, entry);
      }
    }),


    /**
     * Returns the natural width of the given image element.
     *
     * @param element {Element} DOM element which represents the image
     * @return {Integer} Image width
     */
    __getWidth : qx.core.Environment.select("engine.name",
    {
      "gecko" : function(element) {
        return element.naturalWidth;
      },

      "default" : function(element) {
        return element.width;
      }
    }),


    /**
     * Returns the natural height of the given image element.
     *
     * @param element {Element} DOM element which represents the image
     * @return {Integer} Image height
     */
    __getHeight : qx.core.Environment.select("engine.name",
    {
      "gecko" : function(element) {
        return element.naturalHeight;
      },

      "default" : function(element) {
        return element.height;
      }
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
     * Fabian Jakobs (fjakobs)
     * Sebastian Werner (wpbasti)

************************************************************************ */

/**
 * The background class contains methods to compute and set the background image
 * of a DOM element.
 *
 * It fixes a background position issue in Firefox 2.
 */
qx.Class.define("qx.bom.element.Background",
{
  statics :
  {
    /** {Array} Internal helper to improve compile performance */
    __tmpl :
    [
      "background-image:url(", null, ");",
      "background-position:", null, ";",
      "background-repeat:", null, ";"
    ],


    /** {Map} Empty styles when no image is given */
    __emptyStyles :
    {
      backgroundImage : null,
      backgroundPosition : null,
      backgroundRepeat : null
    },


    /**
     * Computes the background position CSS value
     *
     * @param left {Integer|String} either an integer pixel value or a CSS
     *    string value
     * @param top {Integer|String} either an integer pixel value or a CSS
     *    string value
     * @return {String} The background position CSS value
     */
    __computePosition : function(left, top)
    {
      // Correcting buggy Firefox background-position implementation
      // Have problems with identical values
      var engine = qx.core.Environment.get("engine.name");
      var version = qx.core.Environment.get("engine.version");
      if (engine == "gecko" && version < 1.9 && left == top && typeof left == "number") {
        top += 0.01;
      }

      if (left) {
        var leftCss = (typeof left == "number") ? left + "px" : left;
      } else {
        leftCss = "0";
      }
      if (top) {
        var topCss = (typeof top == "number") ? top + "px" : top;
      } else {
        topCss = "0";
      }

      return leftCss + " " + topCss;
    },


    /**
     * Checks if the given image URL is a base64-encoded one.
     *
     * @param url {String} image url to check for
     * @return {Boolean} whether it is a base64-encoded image url
     */
    __isBase64EncodedImage : function(url)
    {
      var String = qx.lang.String;

      // only check the first 50 characters for performance, since we do not
      // know how long a base64 image url can be.
      var firstPartOfUrl = url.substr(0, 50);
      return String.startsWith(firstPartOfUrl, "data:") && String.contains(firstPartOfUrl, "base64");
    },


    /**
     * Compiles the background into a CSS compatible string.
     *
     * @param source {String?null} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer|String?null} The horizontal offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "center", "left" and "right"
     * @param top {Integer|String?null} The vertical offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "top", "bottom" and "center"
     * @return {String} CSS string
     */
    compile : function(source, repeat, left, top)
    {
      var position = this.__computePosition(left, top);
      var backgroundImageUrl = qx.util.ResourceManager.getInstance().toUri(source);

      if (this.__isBase64EncodedImage(backgroundImageUrl)) {
        backgroundImageUrl = "'" + backgroundImageUrl + "'";
      }

      // Updating template
      var tmpl = this.__tmpl;

      tmpl[1] = backgroundImageUrl;
      tmpl[4] = position;
      tmpl[7] = repeat;

      return tmpl.join("");
    },


    /**
     * Get standard css background styles
     *
     * @param source {String} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer|String?null} The horizontal offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "center", "left" and "right"
     * @param top {Integer|String?null} The vertical offset of the image
     *      inside of the image element. If the value is an integer it is
     *      interpreted as pixel value otherwise the value is taken as CSS value.
     *      CSS the values are "top", "bottom" and "center"
     * @return {Map} A map of CSS styles
     */
    getStyles : function(source, repeat, left, top)
    {
      if (!source) {
        return this.__emptyStyles;
      }

      var position = this.__computePosition(left, top);
      var backgroundImageUrl = qx.util.ResourceManager.getInstance().toUri(source);

      var backgroundImageCssString;
      if (this.__isBase64EncodedImage(backgroundImageUrl)) {
        backgroundImageCssString = "url('" + backgroundImageUrl + "')";
      } else {
        backgroundImageCssString = "url(" + backgroundImageUrl + ")";
      }

      var map = {
        backgroundPosition : position,
        backgroundImage : backgroundImageCssString
      };

      if (repeat != null) {
        map.backgroundRepeat = repeat;
      }
      return map;
    },


    /**
     * Set the background on the given DOM element
     *
     * @param element {Element} The element to modify
     * @param source {String?null} The URL of the background image
     * @param repeat {String?null} The background repeat property. valid values
     *     are <code>repeat</code>, <code>repeat-x</code>,
     *     <code>repeat-y</code>, <code>no-repeat</code>
     * @param left {Integer?null} The horizontal offset of the image inside of
     *     the image element.
     * @param top {Integer?null} The vertical offset of the image inside of
     *     the image element.
     */
    set : function(element, source, repeat, left, top)
    {
      var styles = this.getStyles(source, repeat, left, top);
      for (var prop in styles) {
        element.style[prop] = styles[prop];
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Decorator, which uses the CSS3 border image properties.
 *
 * This decorator can be used as replacement for {@link qx.ui.layout.Grid},
 * {@link qx.ui.layout.HBox} and {@link qx.ui.layout.VBox} decorators in
 * browsers, which support it.
 *
 * Supported browsers are:
 * <ul>
 *   <li>Firefox >= 3.5</li>
 *   <li>Safari >= 4</li>
 *   <li>Chrome >= 3</li>
 * <ul>
 */
qx.Class.define("qx.ui.decoration.css3.BorderImage",
{
  extend : qx.ui.decoration.Abstract,

  /**
   * @param borderImage {String} Base image to use
   * @param slice {Integer|Array} Sets the {@link #slice} property
   */
  construct : function(borderImage, slice)
  {
    this.base(arguments);

    // Initialize properties
    if (borderImage != null) {
      this.setBorderImage(borderImage);
    }

    if (slice != null) {
      this.setSlice(slice);
    }
  },


  statics :
  {
    /**
     * Whether the browser supports this decorator
     */
    IS_SUPPORTED : qx.bom.element.Style.isPropertySupported("borderImage")
  },


  properties :
  {
    /**
     * Base image URL.
     */
    borderImage :
    {
      check : "String",
      nullable : true,
      apply : "_applyStyle"
    },


    /**
     * The top slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceTop :
    {
      check : "Integer",
      init : 0,
      apply : "_applyStyle"
    },


    /**
     * The right slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceRight :
    {
      check : "Integer",
      init : 0,
      apply : "_applyStyle"
    },


    /**
     * The bottom slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceBottom :
    {
      check : "Integer",
      init : 0,
      apply : "_applyStyle"
    },


    /**
     * The left slice line of the base image. The slice properties divide the
     * image into nine regions, which define the corner, edge and the center
     * images.
     */
    sliceLeft :
    {
      check : "Integer",
      init : 0,
      apply : "_applyStyle"
    },


    /**
     * The slice properties divide the image into nine regions, which define the
     * corner, edge and the center images.
     */
    slice :
    {
      group : [ "sliceTop", "sliceRight", "sliceBottom", "sliceLeft" ],
      mode : "shorthand"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled horizontally.
     *
     * Values have the following meanings:
     * <ul>
     *   <li><strong>stretch</strong>: The image is stretched to fill the area.</li>
     *   <li><strong>repeat</strong>: The image is tiled (repeated) to fill the area.</li>
     *   <li><strong>round</strong>: The image is tiled (repeated) to fill the area. If it does not
     *    fill the area with a whole number of tiles, the image is rescaled so
     *    that it does.</li>
     * </ul>
     */
    repeatX :
    {
      check : ["stretch", "repeat", "round"],
      init : "stretch",
      apply : "_applyStyle"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled vertically.
     *
     * Values have the following meanings:
     * <ul>
     *   <li><strong>stretch</strong>: The image is stretched to fill the area.</li>
     *   <li><strong>repeat</strong>: The image is tiled (repeated) to fill the area.</li>
     *   <li><strong>round</strong>: The image is tiled (repeated) to fill the area. If it does not
     *    fill the area with a whole number of tiles, the image is rescaled so
     *    that it does.</li>
     * </ul>
     */
    repeatY :
    {
      check : ["stretch", "repeat", "round"],
      init : "stretch",
      apply : "_applyStyle"
    },


    /**
     * This property specifies how the images for the sides and the middle part
     * of the border image are scaled and tiled.
     */
    repeat :
    {
      group : ["repeatX", "repeatY"],
      mode : "shorthand"
    }
  },


  members :
  {
    __markup : null,


    // overridden
    _getDefaultInsets : function()
    {
      return {
        top : 0,
        right : 0,
        bottom : 0,
        left : 0
      };
    },


    // overridden
    _isInitialized: function() {
      return !!this.__markup;
    },


    /*
    ---------------------------------------------------------------------------
      INTERFACE IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    // interface implementation
    getMarkup : function()
    {
      if (this.__markup) {
        return this.__markup;
      }

      var source = this._resolveImageUrl(this.getBorderImage());
      var slice = [
        this.getSliceTop(),
        this.getSliceRight(),
        this.getSliceBottom(),
        this.getSliceLeft()
      ];

      var repeat = [
        this.getRepeatX(),
        this.getRepeatY()
      ].join(" ")

      this.__markup = [
        "<div style='",
        qx.bom.element.Style.compile({
          "borderImage" : 'url("' + source + '") ' + slice.join(" ") + " " + repeat,
          position: "absolute",
          lineHeight: 0,
          fontSize: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          borderWidth: slice.join("px ") + "px"
        }),
        ";'></div>"
      ].join("");

      // Store
      return this.__markup;
    },


    // interface implementation
    resize : function(element, width, height)
    {
      element.style.width = width + "px";
      element.style.height = height + "px";
    },


    // interface implementation
    tint : function(element, bgcolor) {
      // not implemented
    },



    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // property apply
    _applyStyle : function()
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this._isInitialized()) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }
    },


    /**
     * Resolve the url of the given image
     *
     * @param image {String} base image URL
     * @return {String} the resolved image URL
     */
    _resolveImageUrl : function(image)
    {
      return qx.util.ResourceManager.getInstance().toUri(
        qx.util.AliasManager.getInstance().resolve(image)
      );
    }
  },


  destruct : function() {
    this.__markup = null;
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A very complex decoration using two, partly combined and clipped images
 * to render a graphically impressive borders with gradients.
 *
 * The decoration supports all forms of vertical gradients. The gradients must
 * be stretchable to support different heights.
 *
 * The edges could use different styles of rounded borders. Even different
 * edge sizes are supported. The sizes are automatically detected by
 * the build system using the image meta data.
 *
 * The decoration uses clipped images to reduce the number of external
 * resources to load.
 */
qx.Class.define("qx.ui.decoration.GridDiv",
{
  extend : qx.ui.decoration.Abstract,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param baseImage {String} Base image to use
   * @param insets {Integer|Array} Insets for the grid
   */
  construct : function(baseImage, insets)
  {
    this.base(arguments);

    // Initialize properties
    if (baseImage != null) {
      this.setBaseImage(baseImage);
    }

    if (insets != null) {
      this.setInsets(insets);
    }
  },





  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Base image URL. All the different images needed are named by the default
     * naming scheme:
     *
     * ${baseImageWithoutExtension}-${imageName}.${baseImageExtension}
     *
     * These image names are used:
     *
     * * tl (top-left edge)
     * * t (top side)
     * * tr (top-right edge)

     * * bl (bottom-left edge)
     * * b (bottom side)
     * * br (bottom-right edge)
     *
     * * l (left side)
     * * c (center image)
     * * r (right side)
     */
    baseImage :
    {
      check : "String",
      nullable : true,
      apply : "_applyBaseImage"
    }
  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __markup : null,
    __images : null,
    __edges : null,


    // overridden
    _getDefaultInsets : function()
    {
      return {
        top : 0,
        right : 0,
        bottom : 0,
        left : 0
      };
    },


    // overridden
    _isInitialized: function() {
      return !!this.__markup;
    },


    /*
    ---------------------------------------------------------------------------
      INTERFACE IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    // interface implementation
    getMarkup : function()
    {
      if (this.__markup) {
        return this.__markup;
      }

      var Decoration = qx.bom.element.Decoration;
      var images = this.__images;
      var edges = this.__edges;

      // Create edges and vertical sides
      // Order: tl, t, tr, bl, b, bt, l, c, r
      var html = [];

      // Outer frame
      // Note: Overflow=hidden is needed for Safari 3.1 to omit scrolling through
      // dragging when the cursor is in the text field in Spinners etc.
      html.push('<div style="position:absolute;top:0;left:0;overflow:hidden;font-size:0;line-height:0;">');

      // Top: left, center, right
      html.push(Decoration.create(images.tl, "no-repeat", { top: 0, left: 0 }));
      html.push(Decoration.create(images.t, "scale-x", { top: 0, left: edges.left + "px" }));
      html.push(Decoration.create(images.tr, "no-repeat", { top: 0, right : 0 }));

      // Bottom: left, center, right
      html.push(Decoration.create(images.bl, "no-repeat", { bottom: 0, left:0 }));
      html.push(Decoration.create(images.b, "scale-x", { bottom: 0, left: edges.left + "px" }));
      html.push(Decoration.create(images.br, "no-repeat", { bottom: 0, right: 0 }));

      // Middle: left, center, right
      html.push(Decoration.create(images.l, "scale-y", { top: edges.top + "px", left: 0 }));
      html.push(Decoration.create(images.c, "scale", { top: edges.top + "px", left: edges.left + "px" }));
      html.push(Decoration.create(images.r, "scale-y", { top: edges.top + "px", right: 0 }));

      // Outer frame
      html.push('</div>');

      // Store
      return this.__markup = html.join("");
    },


    // interface implementation
    resize : function(element, width, height)
    {
      // Compute inner sizes
      var edges = this.__edges;
      var innerWidth = width - edges.left - edges.right;
      var innerHeight = height - edges.top - edges.bottom;

      // Set the inner width or height to zero if negative
      if (innerWidth < 0) {innerWidth = 0;}
      if (innerHeight < 0) {innerHeight = 0;}

      // Update nodes
      element.style.width = width + "px";
      element.style.height = height + "px";

      element.childNodes[1].style.width = innerWidth + "px";
      element.childNodes[4].style.width = innerWidth + "px";
      element.childNodes[7].style.width = innerWidth + "px";

      element.childNodes[6].style.height = innerHeight + "px";
      element.childNodes[7].style.height = innerHeight + "px";
      element.childNodes[8].style.height = innerHeight + "px";

      if ((qx.core.Environment.get("engine.name") == "mshtml"))
      {
        // Internet Explorer as of version 6 or version 7 in quirks mode
        // have rounding issues when working with odd dimensions:
        // right and bottom positioned elements are rendered with a
        // one pixel negative offset which results into some ugly
        // render effects.
        if (
          parseFloat(qx.core.Environment.get("engine.version")) < 7 ||
          (qx.core.Environment.get("browser.quirksmode") &&
           parseFloat(qx.core.Environment.get("engine.version")) < 8)
        )
        {
          if (width%2==1)
          {
            element.childNodes[2].style.marginRight = "-1px";
            element.childNodes[5].style.marginRight = "-1px";
            element.childNodes[8].style.marginRight = "-1px";
          }
          else
          {
            element.childNodes[2].style.marginRight = "0px";
            element.childNodes[5].style.marginRight = "0px";
            element.childNodes[8].style.marginRight = "0px";
          }

          if (height%2==1)
          {
            element.childNodes[3].style.marginBottom = "-1px";
            element.childNodes[4].style.marginBottom = "-1px";
            element.childNodes[5].style.marginBottom = "-1px";
          }
          else
          {
            element.childNodes[3].style.marginBottom = "0px";
            element.childNodes[4].style.marginBottom = "0px";
            element.childNodes[5].style.marginBottom = "0px";
          }
        }
      }
    },


    // interface implementation
    tint : function(element, bgcolor) {
      // not implemented
    },



    /*
    ---------------------------------------------------------------------------
      PROPERTY APPLY ROUTINES
    ---------------------------------------------------------------------------
    */


    // property apply
    _applyBaseImage : function(value, old)
    {
      if (qx.core.Environment.get("qx.debug"))
      {
        if (this.__markup) {
          throw new Error("This decorator is already in-use. Modification is not possible anymore!");
        }
      }

      if (value)
      {
        var base = this._resolveImageUrl(value);
        var split = /(.*)(\.[a-z]+)$/.exec(base);
        var prefix = split[1];
        var ext = split[2];

        // Store images
        var images = this.__images =
        {
          tl : prefix + "-tl" + ext,
          t : prefix + "-t" + ext,
          tr : prefix + "-tr" + ext,

          bl : prefix + "-bl" + ext,
          b : prefix + "-b" + ext,
          br : prefix + "-br" + ext,

          l : prefix + "-l" + ext,
          c : prefix + "-c" + ext,
          r : prefix + "-r" + ext
        };

        // Store edges
        this.__edges = this._computeEdgeSizes(images);
      }
    },


    /**
     * Resolve the url of the given image
     *
     * @param image {String} base image URL
     * @return {String} the resolved image URL
     */
    _resolveImageUrl : function(image) {
      return qx.util.AliasManager.getInstance().resolve(image);
    },


    /**
     * Returns the sizes of the "top" and "bottom" heights and the "left" and
     * "right" widths of the grid.
     *
     * @param images {Map} Map of image URLs
     * @return {Map} the edge sizes
     */
    _computeEdgeSizes : function(images)
    {
      var ResourceManager = qx.util.ResourceManager.getInstance();

      return {
        top : ResourceManager.getImageHeight(images.t),
        bottom : ResourceManager.getImageHeight(images.b),
        left : ResourceManager.getImageWidth(images.l),
        right : ResourceManager.getImageWidth(images.r)
      };
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__markup = this.__images = this.__edges = null;
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

#optional(qx.locale.Manager)

************************************************************************ */

/**
 * This mixin contains the methods needed to use the translation features
 * of qooxdoo.
 */
qx.Mixin.define("qx.locale.MTranslation",
{
  members:
  {
    /**
     * Translate a message
     * Mark the message for translation.
     *
     * @param messageId {String} message id (may contain format strings)
     * @param varargs {Object} variable number of arguments applied to the format string
     * @return {String | LocalizedString} The translated message or localized string
     */
    tr : function(messageId, varargs)
    {
      var nlsManager = qx.locale.Manager;
      if (nlsManager) {
        return nlsManager.tr.apply(nlsManager, arguments);
      }

      throw new Error("To enable localization please include qx.locale.Manager into your build!");
    },


    /**
     * Translate a plural message
     * Mark the messages for translation.
     *
     * Depending on the third argument the plural or the singular form is chosen.
     *
     * @param singularMessageId {String} message id of the singular form (may contain format strings)
     * @param pluralMessageId {String} message id of the plural form (may contain format strings)
     * @param count {Integer} if greater than 1 the plural form otherwise the singular form is returned.
     * @param varargs {Object} variable number of arguments applied to the format string
     * @return {String | LocalizedString} The translated message or localized string
     */
    trn : function(singularMessageId, pluralMessageId, count, varargs)
    {
      var nlsManager = qx.locale.Manager;
      if (nlsManager) {
        return nlsManager.trn.apply(nlsManager, arguments);
      }

      throw new Error("To enable localization please include qx.locale.Manager into your build!");
    },


    /**
     * Translate a message with translation hint
     * Mark the messages for translation.
     *
     * @param hint {String} hint for the translator of the message. Will be included in the .po file.
     * @param messageId {String} message id (may contain format strings)
     * @param varargs {Object} variable number of arguments applied to the format string
     * @return {String | LocalizedString} The translated message or localized string
     */
    trc : function(hint, messageId, varargs)
    {
      var nlsManager = qx.locale.Manager;
      if (nlsManager) {
        return nlsManager.trc.apply(nlsManager, arguments);
      }

      throw new Error("To enable localization please include qx.locale.Manager into your build!");
    },


    /**
     * Mark the message for translation but return the original message.
     *
     * @param messageId {String} the message ID
     * @return {String} messageId
     */
    marktr : function(messageId)
    {
      var nlsManager = qx.locale.Manager;
      if (nlsManager) {
        return nlsManager.marktr.apply(nlsManager, arguments);
      }

      throw new Error("To enable localization please include qx.locale.Manager into your build!");
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
 * This interface defines what an application class has to implement.
 */
qx.Interface.define("qx.application.IApplication",
{
  members :
  {
    /**
     * Called when the application relevant classes are loaded and ready.
     *
     * @return {void}
     */
    main : function() {},


    /**
     * Called when the application's main method was executed to handle
     * "final" tasks like rendering or retrieving data.
     *
     * @return {void}
     */
    finalize : function() {},

    /**
     * Called in the document.beforeunload event of the browser. If the method
     * returns a string value, the user will be asked by the browser, whether
     * he really wants to leave the page. The return string will be displayed in
     * the message box.
     *
     * @return {String?null} message text on unloading the page
     */
    close : function() {},


    /**
     * This method contains the last code which is run inside the page and may contain cleanup code.
     *
     * @return {void}
     */
    terminate : function() {}
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
 * Common base class for all native events (DOM events, IO events, ...).
 */
qx.Class.define("qx.event.type.Native",
{
  extend : qx.event.type.Event,

  members :
  {
    /**
     * Initialize the fields of the event. The event must be initialized before
     * it can be dispatched.
     *
     * @param nativeEvent {Event} The DOM event to use
     * @param target {Object} The event target
     * @param relatedTarget {Object?null} The related event target
     * @param canBubble {Boolean?false} Whether or not the event is a bubbling event.
     *     If the event is bubbling, the bubbling can be stopped using
     *     {@link qx.event.type.Event#stopPropagation}
     * @param cancelable {Boolean?false} Whether or not an event can have its default
     *     action prevented. The default action can either be the browser's
     *     default action of a native event (e.g. open the context menu on a
     *     right click) or the default action of a qooxdoo class (e.g. close
     *     the window widget). The default action can be prevented by calling
     *     {@link #preventDefault}
     * @return {qx.event.type.Event} The initialized event instance
     */
    init : function(nativeEvent, target, relatedTarget, canBubble, cancelable)
    {
      this.base(arguments, canBubble, cancelable);

      this._target = target || qx.bom.Event.getTarget(nativeEvent);
      this._relatedTarget = relatedTarget || qx.bom.Event.getRelatedTarget(nativeEvent);

      if (nativeEvent.timeStamp) {
        this._timeStamp = nativeEvent.timeStamp;
      }

      this._native = nativeEvent;
      this._returnValue = null;

      return this;
    },


    // overridden
    clone : function(embryo)
    {
      var clone = this.base(arguments, embryo);

      var nativeClone = {};
      clone._native = this._cloneNativeEvent(this._native, nativeClone);

      clone._returnValue = this._returnValue;

      return clone;
    },


    /**
     * Clone the native browser event
     *
     * @param nativeEvent {Event} The native browser event
     * @param clone {Object} The initialized clone.
     * @return {Object} The cloned event
     */
    _cloneNativeEvent : function(nativeEvent, clone)
    {
      clone.preventDefault = qx.lang.Function.empty;
      return clone;
    },


    /**
     * Prevent browser default behavior, e.g. opening the context menu, ...
     */
    preventDefault : function()
    {
      this.base(arguments);
      qx.bom.Event.preventDefault(this._native);
    },


    /**
     * Get the native browser event object of this event.
     *
     * @return {Event} The native browser event
     */
    getNativeEvent : function() {
      return this._native;
    },


    /**
     * Sets the event's return value. If the return value is set in a
     * beforeunload event, the user will be asked by the browser, whether
     * he really wants to leave the page. The return string will be displayed in
     * the message box.
     *
     * @param returnValue {String?null} Return value
     */
    setReturnValue : function(returnValue) {
      this._returnValue = returnValue;
    },


    /**
     * Retrieves the event's return value.
     *
     * @return {String?null} The return value
     */
    getReturnValue : function() {
      return this._returnValue;
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._native = this._returnValue = null;
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
     * Fabian Jakobs (fjakobs)
     * Christian Hagendorn (chris_schmidt)

************************************************************************ */
/*
 #require(qx.event.type.Native)
 #require(qx.event.Pool)
*/

/**
 * This handler provides event for the window object.
 */
qx.Class.define("qx.event.handler.Window",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




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
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this._manager = manager;
    this._window = manager.getWindow();

    // Initialize observers
    this._initWindowObserver();
  },





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,

    /** {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      error : 1,
      load : 1,
      beforeunload : 1,
      unload : 1,
      resize : 1,
      scroll : 1,
      beforeshutdown : 1
    },

    /** {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_WINDOW,

    /** {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true
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
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },




    /*
    ---------------------------------------------------------------------------
      OBSERVER INIT/STOP
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes the native mouse event listeners.
     *
     * @return {void}
     */
    _initWindowObserver : function()
    {
      this._onNativeWrapper = qx.lang.Function.listener(this._onNative, this);
      var types = qx.event.handler.Window.SUPPORTED_TYPES;

      for (var key in types) {
        qx.bom.Event.addNativeListener(this._window, key, this._onNativeWrapper);
      }
    },


    /**
     * Disconnect the native mouse event listeners.
     *
     * @return {void}
     */
    _stopWindowObserver : function()
    {
      var types = qx.event.handler.Window.SUPPORTED_TYPES;

      for (var key in types) {
        qx.bom.Event.removeNativeListener(this._window, key, this._onNativeWrapper);
      }
    },






    /*
    ---------------------------------------------------------------------------
      NATIVE EVENT SUPPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Native listener for all supported events.
     *
     * @signature function(e)
     * @param e {Event} Native event
     */
    _onNative : qx.event.GlobalError.observeMethod(function(e)
    {
      if (this.isDisposed()) {
        return;
      }

      var win = this._window;
      try {
        var doc = win.document;
      } catch (e) {
        // IE7 sometimes dispatches "unload" events on protected windows
        // Ignore these events
        return;
      }

      var html = doc.documentElement;

      // At least Safari 3.1 and Opera 9.2.x have a bubbling scroll event
      // which needs to be ignored here.
      //
      // In recent WebKit nightlies scroll events do no longer bubble
      //
      // Internet Explorer does not have a target in resize events.
      var target = qx.bom.Event.getTarget(e);
      if (target == null || target === win || target === doc || target === html)
      {
        var event = qx.event.Registration.createEvent(e.type, qx.event.type.Native, [e, win]);
        qx.event.Registration.dispatchEvent(win, event);

        var result = event.getReturnValue();
        if (result != null)
        {
          e.returnValue = result;
          return result;
        }
      }
    })
  },





  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._stopWindowObserver();
    this._manager = this._window = null;
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
     2007-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * This handler provides events for qooxdoo application startup/shutdown logic.
 */
qx.Class.define("qx.event.handler.Application",
{
  extend : qx.core.Object,
  implement : qx.event.IEventHandler,




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
  construct : function(manager)
  {
    this.base(arguments);

    // Define shorthands
    this._window = manager.getWindow();

    this.__domReady = false;
    this.__loaded = false;

    // Initialize observers
    this._initObserver();

    // Store instance (only supported for main app window, this
    // is the reason why this is OK here)
    qx.event.handler.Application.$$instance = this;
  },





  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /** {Integer} Priority of this handler */
    PRIORITY : qx.event.Registration.PRIORITY_NORMAL,


    /** {Map} Supported event types */
    SUPPORTED_TYPES :
    {
      ready : 1,
      shutdown : 1
    },


    /** {Integer} Which target check to use */
    TARGET_CHECK : qx.event.IEventHandler.TARGET_WINDOW,


    /** {Integer} Whether the method "canHandleEvent" must be called */
    IGNORE_CAN_HANDLE : true,


    /**
     * Sends the currently running application the ready signal. Used
     * exclusively by package loader system.
     *
     * @internal
     * @return {void}
     */
    onScriptLoaded : function()
    {
      var inst = qx.event.handler.Application.$$instance;
      if (inst) {
        inst.__fireReady();
      }
    }
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
    canHandleEvent : function(target, type) {},


    // interface implementation
    registerEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },


    // interface implementation
    unregisterEvent : function(target, type, capture) {
      // Nothing needs to be done here
    },

    __isReady : null,
    __domReady : null,
    __loaded : null,
    __isUnloaded : null,





    /*
    ---------------------------------------------------------------------------
      USER ACCESS
    ---------------------------------------------------------------------------
    */

    /**
     * Fires a global ready event.
     *
     * @return {void}
     */
    __fireReady : function()
    {
      // Wrapper qxloader needed to be compatible with old generator
      if (!this.__isReady && this.__domReady && qx.$$loader.scriptLoaded)
      {
        // If qooxdoo is loaded within a frame in IE, the document is ready before
        // the "ready" listener can be added. To avoid any startup issue check
        // for the availability of the "ready" listener before firing the event.
        // So at last the native "load" will trigger the "ready" event.
        if ((qx.core.Environment.get("engine.name") == "mshtml"))
        {
          if (qx.event.Registration.hasListener(this._window, "ready"))
          {
            this.__isReady = true;

            // Fire user event
            qx.event.Registration.fireEvent(this._window, "ready");
          }
        }
        else
        {
          this.__isReady = true;

          // Fire user event
          qx.event.Registration.fireEvent(this._window, "ready");
        }
      }
    },


    /**
     * Whether the application is ready.
     *
     * @return {Boolean} ready status
     */
    isApplicationReady : function() {
      return this.__isReady;
    },




    /*
    ---------------------------------------------------------------------------
      OBSERVER INIT/STOP
    ---------------------------------------------------------------------------
    */

    /**
     * Initializes the native mouse event listeners.
     *
     * @return {void}
     */
    _initObserver : function()
    {
      // in Firefox the loader script sets the ready state
      if (qx.$$domReady || document.readyState == "complete" || document.readyState == "ready")
      {
        this.__domReady = true;
        this.__fireReady();
      }
      else
      {
        this._onNativeLoadWrapped = qx.lang.Function.bind(this._onNativeLoad, this);

        if (
          qx.core.Environment.get("engine.name") == "gecko" ||
          qx.core.Environment.get("engine.name") == "opera" ||
          qx.core.Environment.get("engine.name") == "webkit"
        ) {
          // Using native method supported by Mozilla, Webkits and Opera >= 9.0
          qx.bom.Event.addNativeListener(this._window, "DOMContentLoaded", this._onNativeLoadWrapped);
        }
        else if ((qx.core.Environment.get("engine.name") == "mshtml"))
        {
          var self = this;

          // Continually check to see if the document is ready
          var timer = function()
          {
            try
            {
              // If IE is used, use the trick by Diego Perini
              // http://javascript.nwbox.com/IEContentLoaded/
              document.documentElement.doScroll("left");
              if (document.body) {
                self._onNativeLoadWrapped();
              }
            }
            catch(error) {
              window.setTimeout(timer, 100);
            }
          };

          timer();
        }

        // Additional load listener as fallback
        qx.bom.Event.addNativeListener(this._window, "load", this._onNativeLoadWrapped);
      }

      this._onNativeUnloadWrapped = qx.lang.Function.bind(this._onNativeUnload, this);
      qx.bom.Event.addNativeListener(this._window, "unload", this._onNativeUnloadWrapped);
    },


    /**
     * Disconnect the native mouse event listeners.
     *
     * @return {void}
     */
    _stopObserver : function()
    {
      if (this._onNativeLoadWrapped) {
        qx.bom.Event.removeNativeListener(this._window, "load", this._onNativeLoadWrapped);
      }
      qx.bom.Event.removeNativeListener(this._window, "unload", this._onNativeUnloadWrapped);

      this._onNativeLoadWrapped = null;
      this._onNativeUnloadWrapped = null;
    },





    /*
    ---------------------------------------------------------------------------
      NATIVE LISTENER
    ---------------------------------------------------------------------------
    */

    /**
     * Event listener for native load event
     *
     * @signature function()
     */
    _onNativeLoad : qx.event.GlobalError.observeMethod(function()
    {
      this.__domReady = true;
      this.__fireReady();
    }),


    /**
     * Event listener for native unload event
     *
     * @signature function()
     */
    _onNativeUnload : qx.event.GlobalError.observeMethod(function()
    {
      if (!this.__isUnloaded)
      {
        this.__isUnloaded = true;

        try
        {
          // Fire user event
          qx.event.Registration.fireEvent(this._window, "shutdown");
        }
        catch (e)
        {
          // IE doesn't execute the "finally" block if no "catch" block is present
          throw e;
        }
        finally
        {
          // Execute registry shutdown
          qx.core.ObjectRegistry.shutdown();
        }

      }
    })

  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this._stopObserver();

    this._window = null;
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

************************************************************************ */

/* ************************************************************************

#require(qx.event.handler.Application)
#require(qx.event.handler.Window)
#require(qx.event.dispatch.Direct)

************************************************************************ */

/**
 * This is the base class for all qooxdoo applications.
 */
qx.Class.define("qx.core.Init",
{
  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Returns the instantiated qooxdoo application.
     *
     * @return {qx.core.Object} The application instance.
     */
    getApplication : function() {
      return this.__application || null;
    },


    /**
     * Runs when the application is loaded. Automatically creates an instance
     * of the class defined by the setting <code>qx.application</code>.
     *
     * @return {void}
     */
    ready : function()
    {
      if (this.__application) {
        return;
      }

      if (qx.core.Environment.get("engine.name") == "") {
        qx.log.Logger.warn("Could not detect engine!");
      }
      if (qx.core.Environment.get("engine.version") == "") {
        qx.log.Logger.warn("Could not detect the version of the engine!");
      }
      if (qx.core.Environment.get("os.name") == "") {
        qx.log.Logger.warn("Could not detect operating system!");
      }

      qx.log.Logger.debug(this, "Load runtime: " + (new Date - qx.Bootstrap.LOADSTART) + "ms");

      var app = qx.core.Environment.get("qx.application");
      var clazz = qx.Class.getByName(app);

      if (clazz)
      {
        this.__application = new clazz;

        var start = new Date;
        this.__application.main();
        qx.log.Logger.debug(this, "Main runtime: " + (new Date - start) + "ms");

        var start = new Date;
        this.__application.finalize();
        qx.log.Logger.debug(this, "Finalize runtime: " + (new Date - start) + "ms");
      }
      else
      {
        qx.log.Logger.warn("Missing application class: " + app);
      }
    },


    /**
     * Runs before the document is unloaded. Calls the application's close
     * method to check if the unload process should be stopped.
     *
     * @param e {qx.event.type.Native} Incoming beforeunload event.
     * @return {void}
     */
    __close : function(e)
    {
      var app = this.__application;
      if (app) {
        e.setReturnValue(app.close());
      }
    },


    /**
     * Runs when the document is unloaded. Automatically terminates a previously
     * created application instance.
     *
     * @return {void}
     */
    __shutdown : function()
    {
      var app = this.__application;

      if (app) {
        app.terminate();
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
    qx.event.Registration.addListener(window, "ready", statics.ready, statics);
    qx.event.Registration.addListener(window, "shutdown", statics.__shutdown, statics);
    qx.event.Registration.addListener(window, "beforeunload", statics.__close, statics);
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

#require(qx.core.Init)

************************************************************************ */

/**
 * Abstract base class for GUI applications using qooxdoo widgets.
 */
qx.Class.define("qx.application.AbstractGui",
{
  type : "abstract",
  extend : qx.core.Object,
  implement : [qx.application.IApplication],
  include : qx.locale.MTranslation,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** {qx.ui.core.Widget} The root widget */
    __root : null,


    /**
     * Create the root widget. This method is abstract and must be overridden
     * by sub classes.
     *
     * @return {qx.ui.core.Widget} The root widget. This widget must be configured
     *     with a {@link qx.ui.layout.Basic} or {@link qx.ui.layout.Canvas} layout.
     */
    _createRootWidget : function() {
      throw new Error("Abstract method call");
    },


    /**
     * Returns the application's root widget. The root widgets can act as container
     * for popups. It is configured with a {@link qx.ui.layout.Basic} (if the
     * application is an inline application) layout or a {@link qx.ui.layout.Canvas}
     * (if the application is a standalone application) layout .
     *
     * The root has the same add method as the configured layout
     * ({@link qx.ui.layout.Basic} or {@link qx.ui.layout.Canvas}).
     *
     * @return {qx.ui.core.Widget} The application's root widget.
     */
    getRoot : function() {
      return this.__root;
    },


    // interface method
    main : function()
    {
      // Initialize themes
      qx.theme.manager.Meta.getInstance().initialize();

      // Initialize tooltip manager
      qx.ui.tooltip.Manager.getInstance();

      this.__root = this._createRootWidget();
    },


    // interface method
    finalize : function() {
      this.render();
    },


    /**
     * Updates the GUI rendering
     *
     * @return {void}
     */
    render : function() {
      qx.ui.core.queue.Manager.flush();
    },


    // interface method
    close : function(val)
    {
      // empty
    },


    // interface method
    terminate : function()
    {
      // empty
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function() {
    this.__root = null;
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

#require(qx.core.Init)

************************************************************************ */

/**
 * For a GUI application that looks & feels like native desktop application
 * (often called "RIA" - Rich Internet Application).
 *
 * Such a stand-alone application typically creates and updates all content
 * dynamically. Often it is called a "single-page application", since the
 * document itself is never reloaded or changed. Communication with the server
 * is done with AJAX.
 */
qx.Class.define("qx.application.Standalone",
{
  extend : qx.application.AbstractGui,




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    _createRootWidget : function() {
      return new qx.ui.root.Application(document);
    }
  }
});

