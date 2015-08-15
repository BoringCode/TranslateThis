"use script";

(function() {
	var contentScript = "window.googleTranslateElementInit = function() {" +
							"new google.translate.TranslateElement({pageLanguage: 'auto', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');" +
						"}";

	//Create element for google translate to hook into 
	var e = document.createElement("div");
	e.id = "google_translate_element";
	e.style = "display:none";
	var z = document.getElementsByTagName("body")[0];
	z.appendChild(e);

	//Load the google translate loader
	var c = document.createElement("script");
	c.type = "text/javascript";
	c.innerHTML = contentScript;
	z.appendChild(c);

	//Add google translate API to page
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
	z.appendChild(s);
})();