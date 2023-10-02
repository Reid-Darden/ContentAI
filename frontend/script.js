$(document).ready(function () {
  // upload of pdf event
  $("#pdfUpload").on("change", function () {
    var file = this.files[0];
    var formData = new FormData();
    formData.append("pdf", file);

    $.ajax({
      url: "/upload", // Your server-side upload route
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (data) {
        $("#pdfMessage .message-body").text(data.message);
        $("#pdfMessage").removeClass("is-hidden");

        if (data.message === "File uploaded successfully") {
          // Enable the Parse PDF box
          $(".columns .section-container:eq(1)").removeClass("disabled-box");

          // Change the icon to check
          $("#pdfStatus .icon i").removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");
        } else {
          // Disable the Parse PDF box
          $(".columns .section-container:eq(1)").addClass("disabled-box");

          // Change the icon to x-icon
          $("#pdfStatus .icon i").removeClass("fa-check-circle").addClass("fa-times-circle").removeClass("has-text-success").addClass("has-text-danger");
        }
      },
      error: function (err) {
        console.log(err); // Handle errors
      },
    });
  });
});
