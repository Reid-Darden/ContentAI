$(document).ready(function () {
  // TESTING
  /*
  $("#username").val("rdarden");
  $("#password").val("gvc0224");
  */
  // END TESTING

  // wipe all cookies
  cookies.clearAllCookies();

  // Function to handle login
  function attemptLogin() {
    let username = $("#username").val();
    let password = $("#password").val();

    if (username && password) {
      $.ajax({
        url: "/login",
        type: "POST",
        data: JSON.stringify({
          username: username,
          password: password,
        }),
        contentType: "application/json",
        processData: false,
        success: function (data) {
          if (data.loggedIn) {
            cookies.setCookie("loggedIn", data.username, 1);
            window.location.href = "../home";
          } else {
            alert("Login failed. Provide correct login/password.");
          }
        },
        error: function (err) {
          // Handle error
        },
      });
    }
  }

  // Event listener for click on the login button
  $(document).on("click", "#login", (e) => {
    attemptLogin();
  });

  // Event listener for keydown on the entire document
  $(document).keydown((e) => {
    if (e.key === "Enter") {
      attemptLogin();
    }
  });
});
