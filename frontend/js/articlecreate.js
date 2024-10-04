$(document).ready(function () {
  // user info
  let cook = cookies.getCookie("loggedIn");
  let role = cookies.getCookie("role");
  if (cook) {
    $("#logged_in_user").text("Welcome, " + decodeURIComponent(cook));
    if (role == "admin") {
      $("#admin_panel").removeClass("is-hidden");
    }
    $("#model_name_section, #columns_section, #create_article").show();
  } else {
    window.location.href = "/";
  }

  // flag for if pdf is successfully loaded in
  let pdfStatusFlag = false;

  // variables that get set as we progress through the program
  let parsedPDFData,
    rewrittenContent,
    articleContentBuild,
    articleTableBuild,
    pdfTable;

  var pdfFileName = "";
  var pdfURL = "";

  // set cursor position to last character
  $("#articleModelInput").on("focus", function () {
    var input = this;
    setTimeout(function () {
      var length = input.value.length;
      input.setSelectionRange(length, length);
    }, 1);
  });

  // on focus out, send model name change to backend
  $("#articleModelInput").on("change blur", function () {
    var currentValue = $(this).val().trim();

    $.ajax({
      url: "/updateModelName",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ value: currentValue }),
      success: function (response) {
        if (response.updated) {
          $("#model_name_label").text("Model Name Updated.");
          $("#columns_section > div").first().removeClass("disabled-box");
          setTimeout(() => {
            $("#model_name_label").text(
              "Enter the Model (w/ Brand Name) for the Article"
            );
          }, 1000 * 3);
        }
      },
      error: function (error) {
        console.error("Error sending data to the server: ", error);
      },
    });
  });

  // These next  2 event listeners handle the pdf upload via file upload or url entry

  // upload of pdf event
  $(document).on("change", "#pdfUpload", function () {
    var file = this.files[0];
    var formData = new FormData();
    formData.append("pdf", file);

    $.ajax({
      url: "/uploads",
      type: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (data) {
        $("#pdfMessage .message-body").text(data.message);
        $("#pdfMessage").removeClass("is-hidden");

        if (data.message == "File uploaded successfully.") {
          $(".columns .section-container:eq(1)")
            .first()
            .removeClass("disabled-box");
          $("#pdfStatus .icon i")
            .first()
            .removeClass("fa-times-circle")
            .addClass("fa-check-circle")
            .removeClass("has-text-danger")
            .addClass("has-text-success");
          $("#pdfFileName").text(data.file);

          pdfFileName = data.file;
          pdfStatusFlag = true;
        } else {
          $(".columns .section-container:eq(1)").addClass("disabled-box");
          $("#pdfStatus .icon i")
            .removeClass("fa-check-circle")
            .addClass("fa-times-circle")
            .removeClass("has-text-success")
            .addClass("has-text-danger");
          $("#pdfFileName").text("No file uploaded.");

          pdfStatusFlag = false;
        }
      },
      error: function (err) {
        console.log(err);
      },
    });
  });

  // upload url
  $(document).on("change", "#urlInput", function () {
    let url = $("#urlInput").val();
    if (url.length > 0) {
      $.ajax({
        url: "/uploadURL",
        type: "POST",
        data: JSON.stringify({
          url: url,
        }),
        contentType: "application/json",
        success: function (data) {
          $("#pdfMessage .message-body").text(data.message);
          $("#pdfMessage").removeClass("is-hidden");

          if (data.message == "URL uploaded successfully.") {
            $(".columns .section-container:eq(1)")
              .first()
              .removeClass("disabled-box");
            $("#pdfStatus .icon i")
              .first()
              .removeClass("fa-times-circle")
              .addClass("fa-check-circle")
              .removeClass("has-text-danger")
              .addClass("has-text-success");

            pdfURL = data.url;
            pdfStatusFlag = true;
          } else {
            $(".columns .section-container:eq(1)").addClass("disabled-box");
            $("#pdfStatus .icon i")
              .removeClass("fa-check-circle")
              .addClass("fa-times-circle")
              .removeClass("has-text-success")
              .addClass("has-text-danger");
            $("#pdfFileName").text("No file uploaded.");

            pdfStatusFlag = false;
          }
        },
        error: function (err) {
          console.log(err);
        },
      });
    }
  });

  // parse the pdf
  $(document).on("click", "#startParseBtn", () => {
    if (pdfStatusFlag) {
      if (pdfFileName.length > 0) {
        $("#startParseBtn")
          .parent()
          .find("#parseLoader")
          .removeClass("is-hidden");
        $.ajax({
          url: "/parsedPDFURL",
          method: "GET",
          contentType: "application/json",
          success: function (response) {
            if (response.success) {
              parsedPDFData = response.parsedData;
              pdfTable = response.parsedTable;
              $(".columns .section-container:eq(2)")
                .first()
                .removeClass("disabled-box");
              $("#startParseBtn").attr("disabled", "disabled");
              $("#pdfUpload")
                .first()
                .next()
                .first()
                .attr("disabled", "disabled");
              $("#parseResults .message-body").text("PDF Parsed.");
              $("#parseResults").removeClass("is-hidden");
              $("#parseLoader").addClass("is-hidden");
              $("#parseStatus .icon i")
                .first()
                .removeClass("fa-times-circle")
                .addClass("fa-check-circle")
                .removeClass("has-text-danger")
                .addClass("has-text-success");

              $("#rewriteContent").click();
            } else {
              $("#parseStatus .icon i")
                .first()
                .removeClass("fa-check-circle")
                .addClass("fa-times-circle")
                .removeClass("has-text-success")
                .addClass("has-text-danger");
              alert("Failed to parse the PDF.");
            }
          },
          error: function (err) {
            $("#parseLoader").addClass("is-hidden");
            $("#parseResults .message-body").text("PDF not parsed.");
            console.log(err);
          },
        });
      } /*else if (pdfFileName.length > 0) {
        const filename = $("#pdfFileName")[0].innerText;

        $("#parseLoader").removeClass("is-hidden");

        $.ajax({
          url: "/parsedPDFs",
          method: "POST",
          data: JSON.stringify({
            filename: filename,
          }),
          contentType: "application/json",
          success: function (response) {
            if (response.success) {
              parsedPDFData = response.parsedData;
              pdfTable = response.parsedTable;
              $(".columns .section-container:eq(2)")
                .first()
                .removeClass("disabled-box");
              $("#startParseBtn").attr("disabled", "disabled");
              $("#pdfUpload")
                .first()
                .next()
                .first()
                .attr("disabled", "disabled");
              $("#parseResults .message-body").text("PDF Parsed.");
              $("#parseResults").removeClass("is-hidden");
              $("#parseLoader").addClass("is-hidden");
              $("#parseStatus .icon i")
                .first()
                .removeClass("fa-times-circle")
                .addClass("fa-check-circle")
                .removeClass("has-text-danger")
                .addClass("has-text-success");

              $("#rewriteContent").click();
            } else {
              $("#parseStatus .icon i")
                .first()
                .removeClass("fa-check-circle")
                .addClass("fa-times-circle")
                .removeClass("has-text-success")
                .addClass("has-text-danger");
              alert("Failed to parse the PDF.");
            }
          },
          error: function (err) {
            $("#parseLoader").addClass("is-hidden");
            $("#parseResults .message-body").text("PDF not parsed.");
            console.log(err);
          },
        });
      }*/
    }
  });

  // rewrite the content
  $(document).on("click", "#rewriteContent", () => {
    if (parsedPDFData.length > 0) {
      $("#rewriteLoader").removeClass("is-hidden");

      console.log(parsedPDFData);

      $.ajax({
        url: "/rewrittenContent",
        method: "POST",
        data: JSON.stringify({
          content: parsedPDFData,
        }),
        contentType: "application/json",
        success: function (response) {
          if (response.success) {
            rewrittenContent = response.rewrittenContent;

            articleContentBuild = rewrittenContent;
            articleTableBuild = pdfTable;

            $("#rewriteResults .message-body").text("Content Rewritten.");
            $("#rewriteResults").removeClass("is-hidden");

            $("#rewriteContent").attr("disabled", "disabled");

            $("#rewriteLoader").addClass("is-hidden");
            $("#rewriteStatus .icon i")
              .first()
              .removeClass("fa-times-circle")
              .addClass("fa-check-circle")
              .removeClass("has-text-danger")
              .addClass("has-text-success");

            $("#create_article button").removeAttr("disabled").click();
          } else {
            $("#rewriteStatus .icon i")
              .first()
              .removeClass("fa-check-circle")
              .addClass("fa-times-circle")
              .removeClass("has-text-success")
              .addClass("has-text-danger");
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

  // create article from the rewritten content JSON structure
  $(document).on("click", "#create_article button", async () => {
    if (articleContentBuild && articleTableBuild) {
      let $button = $("#create_article button");

      $button.addClass("is-loading").attr("disabled", true);

      $.ajax({
        url: "/buildarticle",
        method: "POST",
        data: JSON.stringify({
          content: articleContentBuild,
          table: articleTableBuild,
        }),
        contentType: "application/json",
        success: function (response) {
          if (response.success) {
            let imaged = helpers.updateImageSource(response.data);
            localStorage.setItem(pdfFileName, imaged);
            window.location.href = "/articledisplay?article=" + pdfFileName;
          }
        },
        error: function () {
          alert("Error creating article.");
        },
      });
    }
  });
});
