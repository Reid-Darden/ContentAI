$(document).ready(function () {
  // Flag for if pdf is successfully loaded in
  let pdfStatusFlag = false;
  let parsedPDFData;
  let rewrittenContent;

  // upload of pdf event
  $(document).on("change", "#pdfUpload", function () {
    var file = this.files[0];
    var formData = new FormData();
    formData.append("pdf", file);

    $.ajax({
      url: "/uploads", // Your server-side upload route
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (data) {
        $("#pdfMessage .message-body").text(data.message);
        $("#pdfMessage").removeClass("is-hidden");

        if (data.message == "File uploaded successfully.") {
          // Enable the Parse PDF box
          $(".columns .section-container:eq(1)").first().removeClass("disabled-box");

          // Change the icon to check
          $("#pdfStatus .icon i").first().removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");

          $("#pdfFileName").text(data.file);

          pdfStatusFlag = true;
        } else {
          // Disable the Parse PDF box
          $(".columns .section-container:eq(1)").addClass("disabled-box");

          // Change the icon to x-icon
          $("#pdfStatus .icon i").removeClass("fa-check-circle").addClass("fa-times-circle").removeClass("has-text-success").addClass("has-text-danger");

          $("#pdfFileName").text("No file uploaded.");

          pdfStatusFlag = false;
        }
      },
      error: function (err) {
        console.log(err); // Handle errors
      },
    });
  });

  // parse the pdf
  $(document).on("click", "#startParseBtn", () => {
    if (pdfStatusFlag) {
      const filename = $("#pdfFileName")[0].innerText;

      // Show the spinner
      $("#parseLoader").removeClass("is-hidden");

      $.ajax({
        url: "/parsedPDFs",
        method: "POST",
        data: JSON.stringify({
          filename: filename, // Make sure this is dynamic based on the uploaded file's name
        }),
        contentType: "application/json",
        success: function (response) {
          if (response.success) {
            parsedPDFData = JSON.parse(response.parsedData);

            // Enable the Rewrite content box
            $(".columns .section-container:eq(2)").first().removeClass("disabled-box");

            $("#parseResults .message-body").text("PDF Parsed.");
            $("#parseResults").removeClass("is-hidden");

            $("#parseLoader").addClass("is-hidden");
            $("#parseStatus .icon i").first().removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");
          } else {
            $("#parseStatus .icon i").first().removeClass("fa-check-circle").addClass("fa-times-circle").removeClass("has-text-success").addClass("has-text-danger");
            alert("Failed to parse the PDF.");
          }
        },
        error: function () {
          // Hide the spinner
          $("#parseLoader").addClass("is-hidden");

          $("#parseResults .message-body").text("PDF not parsed.");

          alert("Error connecting to the server.");
        },
      });
    }
  });

  // rewrite the content
  $(document).on("click", "#rewriteContent", () => {
    if (parsedPDFData.length > 0) {
      // Show the spinner
      $("#rewriteLoader").removeClass("is-hidden");

      $.ajax({
        url: "/rewrittenContent",
        method: "POST",
        data: JSON.stringify({
          content: parsedPDFData.paragraph,
        }),
        contentType: "application/json",
        success: function (response) {
          if (response.success) {
            rewrittenContent = response.rewrittenContent;

            console.log("1: " + rewrittenContent);

            // do something with the rewritten content

            $("#rewriteResults .message-body").text("PDF Parsed.");
            $("#rewriteResults").removeClass("is-hidden");

            $("#rewriteLoader").addClass("is-hidden");
            $("#rewriteStatus .icon i").first().removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");
          } else {
            $("#rewriteStatus .icon i").first().removeClass("fa-check-circle").addClass("fa-times-circle").removeClass("has-text-success").addClass("has-text-danger");
            alert("Failed to rewrite the content.");
          }
        },
        error: function () {
          // Hide the spinner
          $("#rewriteLoader").addClass("is-hidden");

          $("#rewriteResults .message-body").text("PDF not parsed.");
          alert("Error connecting to the server.");
        },
      });
    }
  });
});
