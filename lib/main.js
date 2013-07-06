//Translate This - v3.0

// Import the APIs we need.
var contextMenu = require("sdk/context-menu");
var widget = require("sdk/widget");
var tabs = require("sdk/tabs");
var data = require('self').data;
var notifications = require("sdk/notifications");
var { Hotkey } = require("sdk/hotkeys");
var unload = require("sdk/unload");
var prefs = require("sdk/simple-prefs");

console.log(prefs.prefs["language"]);

var main = {
  //settings
  name: "Translate This!"
  keyCode: "t",
  modifier: "ctrl-alt-",
  icon: data.url("icon.png"),
  iconSmall: data.url("icon-small.png"),
  widget: data.url('widget.js')

  //set up interactions
  pageItem: null,
  menuItem: null,
  linkItem: null,
  translateHotkey: null,
  translateWidget: null,

  //Called by browser
  init: function() {
    var that = this;
    //keyboard shortcut for translating whole entire page
    that.translateHotkey = Hotkey({
      //combo: "control-alt-" + that.settings("shortcut"),
      combo: that.modifier + that.settings("keyCode")
      onPress: function() {
        that.translatePage(tabs.activeTab.url);
      }
    });
    //set button to click
    that.translateWidget = widget.Widget({
        id: "translate-button",
        label: that.name + " - Translate Page",
        contentURL: that.smallIcon,
        contentScriptWhen: 'ready',
        contentScriptFile: that.widget
    });
    //check for left click, if there is a left click open a new tab with the translated version of the page
    that.translateWidget.port.on('left-click', function() {
        that.translatePage(tabs.activeTab.url, that.settings("language"));
    });
    //This used to open a settings panel, now direct users to about:addons
    that.translateWidget.port.on('right-click', function() {
        tabs.open("about:addons");
    });

    //menu item for small groups of text, run the translate function if clicked
    that.menuItem = contextMenu.Item({
        label: that.title + " - Selection",
        image: that.smallIcon,
        // Show this item when a selection exists.
        context: contextMenu.SelectionContext(),
        // When this item is clicked, post a message to the item with the text
        contentScript: 'self.on("click", function () {' +
                       '  self.postMessage(window.getSelection().toString());' +
                       '});',
        //Translate text
        onMessage: function(text) {
          that.translateText(text);
        }
    });
    //translate current page
    that.pageItem = contextMenu.Item({
        label: that.title + " - Page",
        image: that.smallIcon,
        // Show this item when a selection exists.
        context: contextMenu.pageContext(),
        // When this item is clicked, post a message to the item with the text
        contentScript: 'self.on("click", function () {' +
                       '  self.postMessage(document.url);' +
                       '});',
        //Translate text
        onMessage: function(url) {
          that.translatePage(url);
        }
    });

    //menu item for links, run the translate page function if clicked
    that.linkItem = contextMenu.Item({
        label: that.title + " - Link",
        image: that.smallIcon,
        // Show this item when a selection exists.
        context: contextMenu.SelectorContext("a[href]"),
        // When this item is clicked, post a message to the item with the link's URL
        contentScript: 'on("click", function (node) {' +
                       '   postMessage(node.href);' +
                       '});',
        onMessage: function (url) {
          that.translatePage(url);
        }
    });
  },
  //retrieve settings
  settings: function(setting) {
    var that = this;
    if (setting === "") {
      that.notify("Uh Oh!", "Your settings are not set correctly, please fix them.");
      return false;
    }
    if (setting in prefs.prefs) {
      return prefs.prefs[settting];
    } else {
      return false;
    }
  },
  //check string to see if it is a url
  validURL: function(string) {
      var url_match = /^http:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?$/i
      return url_match.test(string);
  },
  //function used by button and keybord shortcut
  translatePage: function(url) {
      var that = this;
      var lang = that.settings("language");
      if (lang) {
        if (is_valid_url(url) === true) {
            var translateUrl = encodeURIComponent("http://translate.google.com/translate?js=n&prev=_t&ie=UTF-8&tl=" + lang + "&u=" + url);
            if (that.settings("newTab")) {
                 tabs.open(translateUrl);
            } else {
                tabs.activeTab.url = translateUrl;
            }
        } else {
          that.notify("Uh Oh!", "Invalid URL entered. The page to be translated can not be a local file or HTTPS")
        }
      }
  },
  //translate selected text, this is a workaround since the API has been disabled.
  translateText: function(text) {
    var that = this;
    var lang = that.settings("language");
    if (lang) {
      if (text.length === 0) {
        that.notify("Uh Oh!", "Looks like you selected empty text, try again");
      } else {
          var url = encodeURIComponent("http://translate.google.com/#auto|" + language + "|" + text);
          if (that.settings("newTab")) {
              tabs.open(url);
          } else {
              tabs.activeTab.url = url;
          }
      }
    }
  },
  notify: function(title, text) {
    var that = this;
    notifications.notify({
     title: that.title + " " + title,
     text: text,
     iconURL: that.icon
    });
  },
  updatePrefs: function(p) {
    console.log(p);
  },
  //be nice, if uninstalled remove the local storage values (this should work, but it doesn't appear to work like it should)
  unload: function (reason) {
    console.log("Unload: " + reason);
  }
}

exports.main = main.init();
//prefs.on("", main.updatePrefs);
unload.when = main.unload(reason);