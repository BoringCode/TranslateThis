/*
 * TranslateThis
 * Translate the whole entire page or just a selection using Google Translate
 * version 4.1.0
 */

"use strict";

// Import the APIs we need.
var cm = require("sdk/context-menu");
var ui = require("sdk/ui");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var notifications = require("sdk/notifications");
var { Hotkey } = require("sdk/hotkeys");
var prefs = require("sdk/simple-prefs");
var sprintf = require("sprintf-js").sprintf;

//Simple addon configuration options
var config = {
  name: "Translate This!",
  modifier: "ctrl-alt-",
  urls: {
    page: "https://translate.google.com/translate?ie=UTF-8&tl=%s&u=%s",
    text: "https://translate.google.com/#auto/%s/%s",
  },
  icons: {
    default: {
      "16": data.url("icon/icon-16.png"),
      "32": data.url("icon/icon-32.png"),
      "64": data.url("icon/icon-64.png"),
    }
  },
  toolbar: {
    id: "translatebutton",
    tooltip: "Translate This! - Page",
  }
};

var main = {
  translateHotkey: null,
  translateButton: null,
  /*
   * init()
   * Load preferences and create addon UI
   */
  init: function() {
    var self = this;

    //Watch for changes to prefs (just the hotkey)
    prefs.on("", self.prefChange.bind(self));
    //Create the hotkey (default ctrl-alt-t)
    self.translateHotkey = self.makeHotkey();
    //Generate button and context menu items
    self.createUI();

    return self;
  },
  /*
   * cleanup()
   * Called when the addon is unloaded
   * @param string reason
   */
  cleanup: function(reason) {
    //console.log(reason);
  },
  /*
   * createUI()
   * Creates the addon button and context menu items
   */
  createUI: function() {
    var self = this;

    //Create addon button
    self.translateButton = ui.ActionButton({
      id: config.toolbar.id,
      label: config.toolbar.tooltip,
      icon: config.icons.default,
      onClick: function() {
        self.translatePage(tabs.activeTab.url);
      }
    });

    //Translate links
    cm.Item({
      label: config.name + " - Link",
      image: config.icons.default["16"],
      // Show this item when a selection exists.
      context: cm.SelectorContext("a[href]"),
      // When this item is clicked, post a message to the item with the link's URL
      contentScript: 'self.on("click", function (node) {' +
        'self.postMessage(node.href);' +
        '});',
      onMessage: function(url) {
        self.translatePage(url);
      }
    });
    //Translate the current page
    cm.Item({
      label: config.name + " - Page",
      image: config.icons.default["16"],
      contentScript: 'self.on("click", function() {' +
        'self.postMessage(document.URL);' +
        '});',
      onMessage: function(url) {
        self.translatePage(url);
      }
    });
    //Translate a selection
    cm.Item({
      label: config.name + " - Selection",
      image: config.icons.default["16"],
      // Show this item when a selection exists.
      context: cm.SelectionContext(),
      // When this item is clicked, post a message to the item with the text
      contentScript: 'self.on("click", function() {' +
        'self.postMessage(window.getSelection().toString());' +
        '});',
      //Translate text
      onMessage: function(text) {
        self.translateText(text);
      }
    });
    return self;
  },
  /*
   * makeHotkey()
   * Inits the addon hotkey and returns it
   * @return object hotkey
   */
  makeHotkey: function() {
    var self = this;
    var hotkey = Hotkey({
      combo: config.modifier + self.settings("keyCode"),
      onPress: function() {
        self.translatePage(tabs.activeTab.url);
      }
    });
    return hotkey;
  },
  /*
   * settings()
   * Returns the value of the passed setting
   * @param string setting
   * @return bool or value
   */
  settings: function(setting) {
    var self = this;
    if (setting in prefs.prefs) {
      return prefs.prefs[setting];
    } else {
      return false;
    }
  },
  /*
   * open()
   * Opens the URL in a new tab or the current tab depending upon the user setting
   * @param string url
   */
  open: function(url) {
    var self = this;
    if (self.settings("newTab")) {
      tabs.open(url);
    } else {
      tabs.activeTab.url = url;
    }
    return self;
  },
  /*
   * translatePage()
   * Translates the page inline or opens the translated page depending upon user setting
   * @param string url
   */
  translatePage: function(url) {
    var self = this;
    var lang = self.settings("language");

    if (!self.settings("inlineTranslate") || url !== tabs.activeTab.url) {
      var translateURL = sprintf(config.urls.page, encodeURIComponent(lang), encodeURIComponent(url));
      self.open(translateURL);
    } else {
      tabs.activeTab.attach({
        contentScriptFile: data.url("inlineTranslate.js"),
        contentScriptOptions: {
          lang: lang
        }
      })
    }

    return self;
  },
  /*
   * translateText()
   * Passes text to Google Translate website for translation
   * @param string text
   */
  translateText: function(text) {
    var self = this;

    var lang = self.settings("language");
    if (text.trim().length === 0) {
      self.notify("Uh Oh!", "Looks like you selected empty text, try again");
    } else {
      var translateURL = sprintf(config.urls.text, encodeURIComponent(lang), encodeURIComponent(text));
      self.open(translateURL);
    }

    return self;
  },
  /*
   * notify()
   * Wrapper for notifications API
   * @param string title
   * @param string text
   */
  notify: function(title, text) {
    var self = this;

    notifications.notify({
      title: config.name + " - " + title,
      text: text,
      iconURL: config.icons.default["64"]
    });

    return self;
  },
  /*
   * prefChange()
   * Called whenever a preference changes
   * Handles actions depending upon changed preference
   * @param string name
   */
  prefChange: function(name) {
    var self = this;
    var pref = prefs.prefs[name];

    switch (name) {
      case "keyCode":
        if (pref.length === 1 && pref.trim() !== "") {
          self.translateHotkey.destroy();
          self.translateHotkey = self.makeHotkey();
        } else {
          self.notify("Settings Error", "Make sure you enter a valid key code that is one character.");
        }
        break;
    }

    return self;
  },
}

//Start the fun!
exports.main = function(options, callback) {
  main.init(options, callback);
}

exports.onUnload = function(reason) {
  main.cleanup(reason);
}