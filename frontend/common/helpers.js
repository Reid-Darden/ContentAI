// HELPERS
var cookies = (function () {
  var _cookies = {};

  _cookies.setCookie = function (name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  };

  _cookies.getCookie = function (name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  _cookies.deleteCookie = function (name) {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  };

  _cookies.clearAllCookies = function () {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

  return _cookies;
})();

var helpers = (function () {
  var _helpers = {};

  _helpers.removeWhiteSpaceToFirstChar = function (string) {
    return string.replace(/^\s+/, "");
  };

  _helpers.updateImageSource = function (htmlString) {
    // Parse the HTML string into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // Find all the img tags in the parsed HTML
    const images = doc.querySelectorAll(".conseg.outer.s-fit img");

    // Update the src for each img tag
    images.forEach((img, index) => {
      // Assuming the images are named sequentially as article_img1.jpg, article_img2.jpg, etc.
      const imageName = "article_img" + (index + 1) + ".jpg";
      const imagePath = "frontend/img/article_img/" + imageName;
      img.setAttribute("src", imagePath);
    });

    // Serialize the updated HTML back into a string
    const serializer = new XMLSerializer();
    const updatedHtmlString = serializer.serializeToString(doc);

    // Remove the doctype (added by XMLSerializer) if present
    return updatedHtmlString.replace(/<!DOCTYPE html>/, "");
  };

  return _helpers;
})();
