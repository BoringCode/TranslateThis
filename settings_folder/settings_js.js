var settingsArray = [];
//create a var for the language code input
var lang_code = document.getElementById('lang_code');
var shortcut = document.getElementById('shortcut');

//check for a message from the addon
self.on("message", function onMessage(settings_translate) {

//set the language code, whether to translate on same page or new tab, and keyboard shortcut input to what is currently in local storage    
lang_code.value = settings_translate[0];
$('input:radio[value="' + settings_translate[1] + '"]').attr('checked', "checked");
shortcut.value = settings_translate[2];

//check for a click on the save button
$("#save").unbind("click").click(function(event) {
    event.stopImmediatePropagation();    
    event.stopPropagation();
    event.preventDefault();   
    
    //take the values of the stuff and put in an array
    settingsArray[0] = lang_code.value;
    settingsArray[1] = $('input:radio[name=translate_page]:checked').val(); 
    settingsArray[2] = shortcut.value;   
    
    //set everything to zero again
    lang_code.value = "";
    shortcut.value = "";  
    $('input:radio[name=translate_page]:checked').attr('checked', false);    
    //send the new value to the addon
    self.postMessage(settingsArray);
});

//open the lang code page
$('a').unbind("click").click(function (event) {
    event.stopImmediatePropagation();    
    event.stopPropagation();
    event.preventDefault();
    self.postMessage("open_lang_page");
});

});