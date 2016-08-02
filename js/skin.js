// Dynamically set the css background images for all the sprites
import SKIN_SPRITES from './skin-sprites';
import JSZip from '../node_modules/jszip/dist/jszip'; // Hack

module.exports = {
  init: function() {
    this._createNewStyleNode();
    return this;
  },

  // For sprites that tile, we need to use just the sprite, not the whole image
  _skinSprites: SKIN_SPRITES,

  // Given a file of an original Winamp WSZ file, set the current skin
  setSkinByFile: function(file, completedCallback) {
    this.completedCallback = completedCallback;
    file.processBuffer(this._setSkinByBuffer.bind(this));
  },

  // Given a bufferArray containing a Winamp WSZ file, set the current skin
  // Gets passed as a callback, so don't have access to `this`
  _setSkinByBuffer: function(buffer) {
    var zip = new JSZip(buffer);
    var promisedCssRules = this._skinSprites.map(function(spriteObj) {
      var file = this._findFileInZip(spriteObj.img, zip);
      if (file) {
        var src = 'data:image/bmp;base64,' + btoa(file.asBinary());
        return this._spriteCssRule(spriteObj.img, src, spriteObj);
      }
    }, this);

    // Extract sprite images
    Promise.all(promisedCssRules).then(function(newCssRules) {
      this._createNewStyleNode();
      var cssRules = newCssRules.join('\n');
      this.styleNode.appendChild(document.createTextNode(cssRules));
      this._parseVisColors(zip);
      if (this.completedCallback !== void 0) {
        this.completedCallback(this.colors);
      }
    }.bind(this));
  },

  _parseVisColors: function(zip) {
    var entries = this._findFileInZip('VISCOLOR.TXT', zip).asText().split('\n');
    var regex = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;
    var colors = [];
    // changed to a hard number to deal with empty lines at the end...
    // plus its only meant to be an exact amount of numbers anywayz
    // - @PAEz
    for (var i = 0; i < 24; i++) {
      var matches = regex.exec(entries[i]);
      if (matches) {
        colors[i] = 'rgb(' + matches.slice(1, 4).join(',') + ')';
      } else {
        console.error('Error in VISCOLOR.TXT on line', i);
      }
    }
    this.colors = colors;
  },

  _findFileInZip: function(name, zip) {
    // Note: "."s in file names are actually treated as wildcards
    return zip.file(new RegExp('(/|^)' + name, 'i'))[0];
  },

  _createNewStyleNode: function() {
    if (this.styleNode) {
      document.head.removeChild(this.styleNode);
    }
    this.styleNode = document.createElement('style');
    document.head.appendChild(this.styleNode);
  },

  // Given an image URL and coordinates, returns a data url for a sub-section
  // of that image
  _spriteCssRule: function(img, src, spriteObj) {
    return new Promise(function(resolve) {
      var imageObj = new Image();
      imageObj.src = src;

      imageObj.onload = function() {
        var skinImage = this;
        var cssRules = '';
        var canvas = document.createElement('canvas');
        spriteObj.sprites.forEach(function(sprite) {
          canvas.height = sprite.height;
          canvas.width = sprite.width;

          var context = canvas.getContext('2d');
          context.drawImage(skinImage, -sprite.x, -sprite.y);
          var value = 'background-image: url(' + canvas.toDataURL() + ')';
          sprite.selectors.forEach(function(selector) {
            cssRules += '#winamp2-js ' + selector + '{' + value + '}\n';
          });
        });
        if (img === 'NUMS_EX') {
          // This alternate number file requires that the minus sign be
          // formatted differently.
          cssRules += '#winamp2-js .status #time #minus-sign { top: 0px; left: -1px; width: 9px; height: 13px; }\n';
        }
        resolve(cssRules);
      };
    });
  }
};
