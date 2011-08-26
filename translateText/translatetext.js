self.on("message", function onMessage(activate) {
var settingsArray = [];
var lang_code = document.getElementById('lang_code');
var text = document.getElementById('text');
//check for a click on the save button
$("#translate").unbind("click").click(function(event) {
    event.stopImmediatePropagation();    
    event.stopPropagation();
    event.preventDefault();       
    settingsArray[0] = text.value;     
    if (lang_code.value === "") {
        settingsArray[1] = "default";
    } else {
       settingsArray[1] = lang_code.value;
    }        
    //set everything to zero again
    text.value = "";
    lang_code.value  = "";    
    //send the new value to the addon
    self.postMessage(settingsArray); 
})
})