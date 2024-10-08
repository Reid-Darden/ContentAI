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

  _helpers.trimToArticleDiv = function (string) {
    return string.replace(/^[\s\S]*?(<div id="Article">)/, "$1").replace(/(<\/div>)[\s\S]*?$/, "$1");
  };

  _helpers.updateImageSource = function (htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const images = doc.querySelectorAll(".conseg.outer.s-fit img");

    images.forEach((img, index) => {
      const imageName = "article_img" + (index + 1) + ".jpg";
      const imagePath = "frontend/img/article_img/" + imageName;
      img.setAttribute("src", imagePath);
    });

    const updatedHtmlString = doc.body.innerHTML;

    return updatedHtmlString;
  };

  return _helpers;
})();

$(document).ready(function () {
  $(document).on("click", "h1", () => {
    if (confirm("Go to home page?")) {
      let url = window.location.href;

      if (url.includes("/articledisplay/")) {
        if (confirm("By going home, the all current files that have been uploaded will be deleted from the current session. Do you want to continue?")) {
          $.ajax({
            url: "/wipefolders",
            type: "POST",
            contentType: "application/json",
            success: function (response) {
              if (response.wiped) {
                completeLocationCheck();
              } else {
                alert("Error with file wiping.");
              }
            },
            error: function (error) {
              console.error("Error sending data to the server: ", error);
            },
          });
        }
      } else {
        completeLocationCheck();
      }

      function completeLocationCheck() {
        let cook = cookies.getCookie("loggedIn");
        if (cook) {
          window.location.href = "/home";
        } else {
          window.location.href = "/";
        }
      }
    }
  });
});
