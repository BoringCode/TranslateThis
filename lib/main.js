//Translate This - v3.0

// Import the APIs we need.
var contextMenu = require("context-menu");
var widget = require("widget");
var tabs = require("sdk/tabs");
var data = require('self').data;
var notifications = require("notifications");
var { Hotkey } = require("hotkeys");
var prefs = require("sdk/simple-prefs");

var main = {
  //settings
  name: "Translate This!",
  modifier: "ctrl-alt-",
  icon: data.url("icon.png"),
  iconSmall: data.url("icon-small.png"),
  widget: data.url('widget.js'),

  //set up interactions
  pageItem: null,
  menuItem: null,
  linkItem: null,
  translateHotkey: null,
  translateWidget: null,

  //called by the browser
  init: function() {
    //keyboard shortcut for translating whole entire page
    main.translateHotkey = Hotkey({
      //combo: "control-alt-" + main.settings("shortcut"),
      combo: main.modifier + main.settings("keyCode"),
      onPress: function() {
        main.translatePage(tabs.activeTab.url);
      }
    });
    //set button to click
    main.translateWidget = widget.Widget({
        id: "translate-button",
        label: main.name + " - Translate Page",
        contentURL: main.iconSmall,
        contentScriptWhen: 'ready',
        contentScriptFile: main.widget
    });
    //check for left click, if there is a left click open a new tab with the translated version of the page
    main.translateWidget.port.on('left-click', function() {
        main.translatePage(tabs.activeTab.url, main.settings("language"));
    });
    //This used to open a settings panel, now direct users to about:addons
    main.translateWidget.port.on('right-click', function() {
        main.notify("Just a note...", "The settings panel has moved, you can find it under the addons area.")
        tabs.open("about:addons");
    });
    //menu item for small groups of text, run the translate function if clicked
    main.menuItem = contextMenu.Item({
        label: main.name + " - Selection",
        image: main.iconSmall,
        // Show this item when a selection exists.
        context: contextMenu.SelectionContext(),
        // When this item is clicked, post a message to the item with the text
        contentScript: 'self.on("click", function () {' +
                       '  self.postMessage(window.getSelection().toString());' +
                       '});',
        //Translate text
        onMessage: function(text) {
          main.translateText(text);
        }
    });
    //translate current page
    main.pageItem = contextMenu.Item({
      label: main.name + " - Page",
      image: main.iconSmall,
      contentScript: 'self.on("click", function () {' +
                     '  self.postMessage(document.URL);' +
                     '});',
      onMessage: function(url) {
        main.translatePage(url);
      }
    });
    //menu item for links, run the translate page function if clicked
    main.linkItem = contextMenu.Item({
      label: main.name + " - Link",
      image: main.iconSmall,
      // Show this item when a selection exists.
      context: contextMenu.SelectorContext("a[href]"),
      // When this item is clicked, post a message to the item with the link's URL
      contentScript: 'self.on("click", function (node) {' +
                     '   self.postMessage(node.href);' +
                     '});',
      onMessage: function (url) {
        main.translatePage(url);
      }
    });
    return this;
  },

  //retrieve settings
  settings: function(setting) {
    if (setting in prefs.prefs) {
      return prefs.prefs[setting];
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
    var lang = main.settings("language");
    if (main.validURL(url)) {
        var translateUrl = "http://translate.google.com/translate?js=n&prev=_t&ie=UTF-8&tl=" + encodeURIComponent(lang) + "&u=" + encodeURIComponent(url);
        if (main.settings("newTab")) {
             tabs.open(translateUrl);
        } else {
            tabs.activeTab.url = translateUrl;
        }
    } else {
      main.notify("Uh Oh!", "Invalid URL entered. The page to be translated can not be a local file or HTTPS")
    }
  },
  //translate selected text, this is a workaround since the API has been disabled.
  translateText: function(text) {
    var lang = main.settings("language");
    if (text.length === 0) {
      main.notify("Uh Oh!", "Looks like you selected empty text, try again");
    } else {
        var url = "http://translate.google.com/#ga/" + encodeURIComponent(lang) + "/" + encodeURIComponent(text);
        if (main.settings("newTab")) {
            tabs.open(url);
        } else {
            tabs.activeTab.url = url;
        }
    }
  },
  notify: function(title, text) {
    notifications.notify({
     title: main.name + " - " + title,
     text: text,
     iconURL: main.icon
    });
  },
  //error checking
  updatePrefs: function(p) {
    if (prefs.prefs[p] === "") {
      main.notify("Settings Error", "Please make sure you provide a valid setting.")
    }
  }
}

exports.main = main.init;
prefs.on("", main.updatePrefs);