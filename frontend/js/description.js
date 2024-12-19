$(document).ready(async function () {
  // User info
  let cook = cookies.getCookie("loggedIn");
  if (cook) {
    $("#logged_in_user").text("Welcome, " + decodeURIComponent(cook));
  } else {
    window.location.href = "/";
  }

  // send the description to gpt api
  $(document).on("click", "#send_description", () => {
    $("#send_description").addClass("is-loading").attr("disabled", true);

    let description = $("#rewrite_description_start")[0].value;

    $.ajax({
      url: "/rewritedescription",
      method: "POST",
      data: JSON.stringify({
        description: description,
      }),
      contentType: "application/json",
      success: function (response) {
        if (response.success) {
          // get each description
          let gg = response.descriptions.desc1;
          let fs = response.descriptions.desc2;
          let wgs = response.descriptions.desc3;

          $("#rewrite_description_gg").val(gg);
          $("#rewrite_description_fs").val(fs);
          $("#rewrite_description_wgs").val(wgs);

          $("#starting_desc").addClass("is-hidden");

          $("#rewritten_descriptions").removeClass("is-hidden");

          $("#send_description").removeClass("is-loading").removeAttr("disabled");

          $("#update_description_form").removeClass("is-hidden");
        }
      },
      error: function () {
        alert("Error rewriting description.");
      },
    });
  });
});

$(document).on("click", "#update_description_form", () => {
  window.location.href = "/descriptionrewrite";
});
