/* 
 * inlineTranslate.js
 * Loads Google Website Translator on any website you want
 */

"use script";
(function() {
	var id = "google_translate_element";

	//Check if it's already loaded on this page, cleanup
	var element = document.getElementById(id);
	if (element) {
		element.parentNode.removeChild(element);
		//Remove content script
		var cS = document.getElementById("translateThisContentScript");
		cS.parentNode.removeChild(cS);
		//Remove google translate script
		var gTS = document.getElementById("translateThisScript");
		gTS.parentNode.removeChild(gTS);
		//Remove google translate elements from page
		var translateEl = document.querySelectorAll(".skiptranslate");
		for (var i = 0; i < translateEl.length; i++) {
			translateEl[i].parentNode.removeChild(translateEl[i]);
		}
	}

	var contentScript = "window.googleTranslateElementInit = function() {" +
							"new google.translate.TranslateElement({pageLanguage: 'auto', autoDisplay: true, multilanguagePage: true, layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, '" + id + "');" +
						"}";

	//Google translate looks for this cookie when selecting the language to translate to
	document.cookie = "googtrans=/auto/" + self.options.lang;

	var z = document.getElementsByTagName("body")[0];

	//Create element for google translate to hook into 
	var e = document.createElement("div");
	e.id = id;
	e.style = "display:none";
	z.appendChild(e);

	//Load the google translate loader
	var c = document.createElement("script");
	c.type = "text/javascript";
	c.innerHTML = contentScript;
	c.id = "translateThisContentScript";
	z.appendChild(c);

	//Add google translate API to page
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.id = "translateThisScript";
	s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
	z.appendChild(s);
})();