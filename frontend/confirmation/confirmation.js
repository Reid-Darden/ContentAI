$(document).ready(function () {
  // User info
  let cook = cookies.getCookie("loggedIn");
  let role = cookies.getCookie("role");
  if (cook && role) {
    $("#logged_in_user").text("Welcome, " + decodeURIComponent(cook));
    if (role == "admin") {
      $("#admin_panel").removeClass("is-hidden");
    }
    $("#confirmation_display").show();
  }

  $("#homeButton").click(function () {
    window.location.href = "/home";
  });
});
