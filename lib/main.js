//Translate This - v3.0

// Import the APIs we need.
var contextMenu = require("context-menu");
var widget = require("widget");
var tabs = require("tabs");
var data = require('self').data;
var panels = require('panel');
var simpleStorage = require('simple-storage');
var notifications = require("notifications");
var { Hotkey } = require("hotkeys");
var unload = require("unload");
var icon = data.url("icon.png");
var smallIcon = data.url("icon-small.png");


var main = {
  menuItem: null,
  link: null,
  translateHotkey: null,
  translateWidget: null,
  init: function() {
    var that = this;
    //if running for the first time (or some other problem), set the default language and other stuff.
    if ((settings("lang_code")) === undefined || (settings("shortcut")) === undefined || (settings("translate_page")) === undefined) {
          simpleStorage.storage.lang_code = "en";  //I would like to set this by locale when that API is ready for use
          simpleStorage.storage.shortcut = "t";
          simpleStorage.storage.translate_page = "New Tab";
          console.log("Translate This - Setting default settings...");
    }
    //keyboard shortcut for translating whole entire page
    that.translateHotkey = Hotkey({
      combo: "control-alt-" + settings("shortcut"),
      onPress: function() {
        translatePage(tabs.activeTab.url, settings("lang_code"));
      }
    });
    //set button to click
    that.translateWidget = widget.Widget({
        id: "translate-button",
        label: "Translate This!",
        contentURL: smallIcon,
        contentScriptWhen: 'ready',
        contentScriptFile: data.url('widget.js')
    });

    //check for left click, if there is a left click open a new tab with the translated version of the page
    that.translateWidget.port.on('left-click', function() {
        that.translatePage(tabs.activeTab.url, settings("lang_code"));
    });
    //if the user right clicks on the translate button a translate text window will open.
    that.translateWidget.port.on('right-click', function() {
        that.settingsPanel.show();
    });

    //menu item for small groups of text, run the translate function if clicked
    that.menuItem = contextMenu.Item({
        label: "Translate This - Selection",
        image: smallIcon,
        // Show this item when a selection exists.
        context: contextMenu.SelectionContext(),
        // When this item is clicked, post a message to the item with the
        // selected text and current URL.
        contentScript: 'self.on("click", function () {' +
                       '  var text = window.getSelection().toString();' +
                       '  self.postMessage(text);' +
                       '});',
        // When we receive the message, call the Google Translate API with the
        // selected text and replace it with the translation.
        onMessage: function(text) {
          that.translateText(text);
        }
    });

    //menu item for links, run the translate page function if clicked
    that.link = contextMenu.Item({
        label: "Translate This! - Link",
        image: smallIcon,
        // Show this item when a selection exists.
        context: contextMenu.SelectorContext("a[href]"),
        // When this item is clicked, post a message to the item with the link's URL
        contentScript: 'on("click", function (node) {' +
                        '  var url = node.href;' +
                        'postMessage({ url: url });' +
                        '});',
        onMessage: function (url) {
          that.translatePage(url.url, settings("lang_code"));
        }
    });
  },
  //retrieve settings
  settings: function(setting) {
      if (setting === "translate_page") {
          return simpleStorage.storage.translate_page;
      }
      if (setting === "lang_code") {
          return simpleStorage.storage.lang_code;
      }
      if (setting === "shortcut") {
          return simpleStorage.storage.shortcut;
      }
  },
  //check string to see if it is a url
  validURL: function(string) {
      var url_match = /^http:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?$/i
      return url_match.test(string);
  },
  //function used by button and keybord shortcut
  translatePage: function(url, lang) {
      if (is_valid_url(url) === true) {
          url = encodeURIComponent(url);
          var translateUrl = "http://translate.google.com/translate?js=n&prev=_t&ie=UTF-8&tl=" + lang + "&u=" + url;
          if ((settings("translate_page")) === "New Tab") {
               tabs.open(translateUrl);
          } else {
              tabs.activeTab.url = translateUrl;
          }
      } else {
          notifications.notify({
           title: "Translate This - Uh Oh!",
           text: "Invalid URL entered. The page to be translated can not be a local file or HTTPS",
           iconURL: icon
          });
      }
  },
  //translate selected text, this is a workaround since the API has been disabled.
  translateText: function(text) {
      language = settings("lang_code");
      if (text.length === 0) {
          throw ("Text to translate must not be empty");
      } else {
          text = encodeURIComponent(text);
          url = "http://translate.google.com/#auto|" + language +"|" + text;
          if (settings("translate_page") === "New Tab") {
              tabs.open(url);
          } else {
              tabs.activeTab.url = url;
          }
      }
  },
  //be nice, if uninstalled remove the local storage values (this should work, but it doesn't appear to work like it should)
  unload: function (reason) {
    if ((reason) === "uninstall") {
       simpleStorage.storage.translate_page = undefined;
       simpleStorage.storage.lang_code = undefined;
       simpleStorage.storage.shortcut = undefined;
    }
  }
}

exports.main = main.init();
unload.when = main.unload(reason);