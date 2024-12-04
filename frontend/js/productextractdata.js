$(document).ready(async function () {
  // User info
  let cook = cookies.getCookie("loggedIn");
  let role = cookies.getCookie("role");
  if (cook) {
    $("#logged_in_user").text("Welcome, " + decodeURIComponent(cook));
    if (role == "admin") {
      $("#admin_panel").removeClass("is-hidden");
    }
    $("#article_display").show();
  } else {
    window.location.href = "/";
  }

  $(document).on("change", "#pdfUpload", function () {
    let file = this.files[0];
    let formData = new FormData();

    formData.append("pdf", file);

    $.ajax({
      type: "POST",
      url: "/uploadPDF_PDE",
      data: formData,
      contentType: false,
      processData: false,
      success: function (response) {
        if (response.success) {
          $("#pdfStatus .icon i").first().removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");

          $("#pdfFileName").text(response.file);
          $("#pdfMessage .message-body").text(response.message);

          $("#send_extract_product_data").removeAttr("disabled");
        } else {
          alert("Error uploading PDF.");
        }
      },
      error: function (response) { },
    });
  });

  $(document).on("click", "#send_extract_product_data", function () {
    $("#send_extract_product_data").addClass("is-loading");
    $.ajax({
      type: "GET",
      url: "/extractProductData",
      success: function (resp) {
        if (resp.success) {
          $("#send_extract_product_data").removeClass("is-loading");
          if (confirm("Product data extracted successfully. By clicking OK, a new tab will open with the PRIV Base SKU entry page and will start prepopulating data.")) {
            window.open(resp.url, "_blank");
          }
        }
      },
      error: function (resp) { },
    });
  });
});
