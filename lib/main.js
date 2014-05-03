//Translate This - v3.0.2

// Import the APIs we need.
var contextMenu = require("sdk/context-menu");
var widget = require("sdk/widget");
//var { ActionButton } = require("sdk/ui/button/action");
var tabs = require("sdk/tabs");
var data = require('sdk/self').data;
var notifications = require("sdk/notifications");
var { Hotkey } = require("sdk/hotkeys");
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
  translateButton: null,
  //called by the browser
  init: function() {
    //keyboard shortcut for translating whole entire page
    main.translateHotkey = Hotkey({
      combo: main.modifier + main.settings("keyCode"),
      onPress: function() {
        main.translatePage(tabs.activeTab.url);
      }
    });
    //set button in addon bar
    //BUG: Events will stop working when button is moved around. Will continue working again when browser is restarted
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
    /*
    //For use with Firefox 29+
    main.translateButton = ActionButton({
      id: "translate-button",
      label: main.name = " - Translate Page",
      icon: {
        "16": main.iconSmall,
        "32": main.icon
      },
      onClick: function(state) {
          main.translatePage(tabs.activeTab.url, main.settings("language"));
      }
    });
    */
    //Translate selection
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
    //Translate current page
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
    //Translate links
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
    var urlRe = /^http:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?$/i
    return urlRe.test(string);
  },
  //function used by button and keybord shortcut
  translatePage: function(url) {
    var lang = main.settings("language");
    if (main.validURL(url)) {
        var translateUrl = "https://translate.google.com/translate?js=n&prev=_t&ie=UTF-8&tl=" + encodeURIComponent(lang) + "&u=" + encodeURIComponent(url);
        if (main.settings("newTab")) {
             tabs.open(translateUrl);
        } else {
            tabs.activeTab.url = translateUrl;
        }
    //error, invalid url
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
        var url = "https://translate.google.com/#auto/" + encodeURIComponent(lang) + "/" + encodeURIComponent(text);
        if (main.settings("newTab")) {
            tabs.open(url);
        } else {
            tabs.activeTab.url = url;
        }
    }
  },
  //wrapper for notification API
  notify: function(title, text) {
    notifications.notify({
     title: main.name + " - " + title,
     text: text,
     iconURL: main.icon
    });
  },
  //error checking for updating preferences
  updatePrefs: function(p) {
    //update hotkey
    if (prefs.prefs[p].length === 1 && prefs.prefs[p] !== "") {
      main.translateHotkey.destroy();
      main.translateHotkey = Hotkey({
        combo: main.modifier + prefs.prefs[p],
        onPress: function() {
          main.translatePage(tabs.activeTab.url);
        }
      });
    } else {
      main.notify("Settings Error", "Make sure you enter a valid key code that is one character.");
    }
  }
}

//Start the fun!
exports.main = main.init;
prefs.on("keyCode", main.updatePrefs);
