//Translate This - v1.7.2

// Import the APIs we need.
var contextMenu = require("context-menu");
var request = require("request");
var selection = require("selection");
var widget = require("widget");
var tabs = require("tabs");
var data = require('self').data;
var panels = require('panel');
var simpleStorage = require('simple-storage');
var notifications = require("notifications");
var { Hotkey } = require("hotkeys");
var clipboard = require("clipboard");

//retrieve settings
function settings(setting) {
if ((setting) === "translate_page") {
 return simpleStorage.storage.translate_page;   
}  
if ((setting) === "lang_code") {
 return simpleStorage.storage.lang_code;
}
if ((setting) == "shortcut") {
 return simpleStorage.storage.shortcut;   
}    
}
//check string to see if it is a url
function is_valid_url(string) {
  var url_match = /^http:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?$/i
  return url_match.test(string);
}
 //if running for the first time (or some other problem), set the default language and other stuff. 
if ((settings("lang_code")) === undefined || (settings("shortcut")) === undefined || (settings("translate_page")) === undefined) {
  simpleStorage.storage.lang_code = "en";  //I would like to set this by locale when that API is ready for use
  simpleStorage.storage.shortcut = "t";  
  simpleStorage.storage.translate_page = "New Tab";  
  console.log("Translate This - Setting default settings...");
}
//function used by button and keybord shortcut
function translatePage(url, lang) {
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
     text: "Invalid URL entered. The page to be translated can not be a local file or HTTPS"
    });    
}
}
//translate selected text, or copy translated text to clipboard
function translateText(text, replaceorcopy, lang) {    
  if (lang === "default") { 
    language = settings("lang_code"); 
    } else { 
    language = lang; 
    }               
  if (text.length === 0) {
    throw ("Text to translate must not be empty");
  } else {
    var req = request.Request({
      url: "http://ajax.googleapis.com/ajax/services/language/translate",
      content: {
      v: "1.0",
      q: text,
      langpair: "|" + language
      },
      onComplete: function (response) {
        translated = response.json.responseData.translatedText;
        if (replaceorcopy === "replace") {
          selection.text = translated;
		} else {
          clipboard.set(translated); 
		}
      }
    });
    req.get();
  }
} 

exports.main = function() {    
  //keyboard shortcut for translating whole entire page
    var translateHotkey = Hotkey({
      combo: "control-alt-" + settings("shortcut"),
      onPress: function() {
        translatePage(tabs.activeTab.url, settings("lang_code"));
      }
    }); 
  //set button to click
  var translateWidget = widget.Widget({
  id: "translate-button",
  label: "Translate This!",
  contentURL: data.url('icon-small.png'),
  contentScriptWhen: 'ready',
  contentScriptFile: data.url('widget.js')
  });  
  
  //check for left click, if there is a left click open a new tab with the translated version of the page
  translateWidget.port.on('left-click', function() {
    translatePage(tabs.activeTab.url, settings("lang_code"));
  });  
 //if the user right clicks on the translate button a translate text window will open.
  translateWidget.port.on('right-click', function() {
		translateTextPanel.show();
  });
 //why do I do it like this? There is no real way to handle settings, so the only good way to open up the settings panel is by clicking the widget in the addon bar
 //I want to change this in the future though, it is not very user friendly.
 //if the user presses shift and then clicks on the button the settings window will open.
 translateWidget.port.on('shift-click', function() {
        settingsPanel.show();
  });  
  
  //menu item for small groups of text, run the translate function if clicked
  var menuItem = contextMenu.Item({ 
    label: "Translate This - Selection", 
    image: data.url('icon-small.png'),
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
    onMessage: function(text) { translateText(text, "replace", "default"); }
  });  
  
  //menu item for links, run the translate page function if clicked
  var link = contextMenu.Item({
  label: "Translate This! - Link",
  image: data.url('icon-small.png'),
  // Show this item when a selection exists.
  context: contextMenu.SelectorContext("a[href]"),
  // When this item is clicked, post a message to the item with the link's URL
  contentScript: 'on("click", function (node) {' +
   '  var url = node.href;' +
   'postMessage({ url: url });' +
  '});',
  onMessage: function (url) { translatePage(url.url, settings("lang_code")); }
});
 //settings panel  
  var settingsPanel = panels.Panel({
    width: 560,
    height: 320,
    contentURL: data.url('settings_folder/settings.html'),
    contentScriptFile: [data.url('settings_folder/settings_js.js'), data.url('jquery-1.6.2.min.js')],
    contentScriptWhen: 'ready',
    onShow: function() {
        //tell the content script what is in the local storage
    var settingsArray = [];   
    settingsArray[0] = settings("lang_code");
    settingsArray[1] = settings("translate_page"); 
    settingsArray[2] = settings("shortcut");
        
     this.postMessage(settingsArray);
    },
    onMessage: function(message) {        
     //open the lang code reference if it was clicked
    if ((message) === "open_lang_page") {
        tabs.open("http://code.google.com/apis/language/translate/v1/reference.html#translatableLanguages");
    } else {    
    var notifytext = "";  
    
    //don't do extra work, make sure that changes were actually made
    if ((settings("lang_code")) !== message[0]) {
        simpleStorage.storage.lang_code = message[0];
        notifytext += "Your language is now set to: " + message[0] + ". ";
    } else {
     var didnotchange1 = 1;
    }    
    if ((settings("translate_page")) !== message[1]) {
    simpleStorage.storage.translate_page = message[1];
    notifytext += "Page translations will now open in: " + message[1] + ". ";
    } else {
     var didnotchange2 = 1;
    }
    if ((settings("shortcut")) !== message[2]) {
        //reset the hotkey
    var translateHotkey = Hotkey({
      combo: "control-alt-" + message[2],
      onPress: function() {
        translatePage(tabs.activeTab.url, settings("lang_code"));
      }
    });
    simpleStorage.storage.shortcut = message[2];    
    notifytext += "Your keyboard shortcut is now set to: Ctrl + Alt + " + message[2] + ".";
    } else {
     var didnotchange3 = 1;
    }    
    //if no changes are made, set the notify text to something that will tell the people that.
    if (didnotchange1 && didnotchange2 && didnotchange3) {
        notifytext = "But, you didn't actually change anything."
    }      
     //hide the panel
     settingsPanel.hide();        
     //hurray! Tell the people what happened
      notifications.notify({
       title: "Translate This - Settings Saved!",
       text: notifytext
      });
    } 
    }
});   
 //translate text panel  
  var translateTextPanel = panels.Panel({
    width: 560,
    height: 410,
    contentURL: data.url('translateText/translatetext.html'),
    contentScriptFile: [data.url('translateText/translatetext.js'), data.url('jquery-1.6.2.min.js')],
    contentScriptWhen: 'ready',
    onShow: function() {
      this.postMessage("activate");
    },
    onMessage: function(message) { 
    //check to see if the text entered was a url
    if (is_valid_url(message[0]) === true) {    
      translatePage(message[0], message[1]);
      var notifytext = "URL was entered, translating page...";
    }  else {    
    //translate the text entered and copy to clipboard
    translateText(message[0], "copy", message[1]);
    var notifytext = "Text translated and copied to the clipboard!";   
    }   
    //hide the panel
    translateTextPanel.hide();        
    //hurray! Tell the people what happened
    notifications.notify({
     title: "Translate This - Success!",
     text: notifytext
    });
    } 
    
  });    
 
}; 
//be nice, if uninstalled remove the local storage values (this should work, but it doesn't appear to work like it should)
exports.onUnload = function (reason) {
  if ((reason) === "uninstall") {
     simpleStorage.storage.translate_page = undefined; 
     simpleStorage.storage.lang_code = undefined; 
     simpleStorage.storage.shortcut = undefined;
  }};
