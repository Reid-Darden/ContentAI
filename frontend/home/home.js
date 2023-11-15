$(document).ready(function () {
  // User info
  let cook = cookies.getCookie("loggedIn");
  let role = cookies.getCookie("role");
  if (cook) {
    $("#logged_in_user").text("Welcome, " + cook);
    if (role == "admin") {
      $("#admin_panel").removeClass("is-hidden");
    }
  }
  // Flag for if pdf is successfully loaded in
  let pdfStatusFlag = false;
  let pdfFileName;
  let pdfTable;

  // variables that get set as we progress through the program
  let parsedPDFData;
  let rewrittenContent;
  let articleContentBuild, articleTableBuild;

  // final output variables
  let finalData;
  let finalParagraph;
  let finalContent;

  // TESTING - get around all the content rewriting. DELETE EVENTUALLY
  let table = `
  [{
    "name": "table",
    "data": [
      {
        "dataPoint": "Hand",
        "values": ["RH/LH", "RH/LH", "RH/LH", "RH/LH", "RH/LH", "RH/LH", "RH/LH", "RH/LH", "RH"]
      },
      {
        "dataPoint": "Club",
        "values": ["4", "5", "6", "7", "8", "9", "PW", "AW", "SW", "LW"]
      },
      {
        "dataPoint": "Loft",
        "values": ["18.5°", "21°", "24°", "28°", "32°", "37°", "43°", "49°", "54°", "59°"]
      },
      {
        "dataPoint": "Lie",
        "values": ["61.5°", "62°", "62.5°", "63°", "63.5°", "64°", "64.5°", "64.5°", "64.5°", "64.5°"]
      },
      {
        "dataPoint": "Offset",
        "values": ["5.8mm", "5mm", "4.6mm", "4.1mm", "3.4mm", "2.9mm", "2.6mm", "2mm", "1.5mm", "1.5mm"]
      },
      {
        "dataPoint": "Bounce",
        "values": ["2.0°", "3.5°", "5.0°", "5.6°", "6.3°", "6.8°", "7.8°", "9.0°", "12.5°", "9.0°"]
      },
      {
        "dataPoint": "Length Men’s",
        "values": ["39.125”", "38.5”", "37.88”", "37.25”", "36.75”", "36.25”", "35.75”", "35.5”", "35.25”", "35”"]
      },
      {
        "dataPoint": "Length Women’s",
        "values": ["38.125”", "37.5”", "36.88”", "36.25”", "35.75”", "35.25”", "34.75”", "34.5”", "34.25”", "34”"]
      },
      {
        "dataPoint": "Swingweight Men’s",
        "values": ["D1/D0", "D1/D0", "D1/D0", "D1/D0", "D1/D0", "D1/D0", "D1/D0", "D1/D0", "D2/D1", "D3/D2"]
      },
      {
        "dataPoint": "Swingweight Women’s",
        "values": ["C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C3"]
      }
    ]
  }]
  `;
  let content = `
  {
    "name": "paragraph",
    "data": [
      {
        "header": "FEATURE CAP BACK™ DESIGN WITH TOE WRAP CONSTRUCTION",
        "content": "The Cap Back™ Design with toe wrap construction is a revolutionary technology that enhances the distance, forgiveness, and feel of the iron. By shifting mass from the extreme high toe of the head to the sole, this advanced engineering feat creates an incredibly low CG. As a result, launching the ball with a hot trajectory throughout the set becomes effortless."
      },
      {
        "header": "FEATURE FAST FORGIVING FACE",
        "content": "The Fast Forgiving Face features a 450SS face with an intelligently positioned sweet spot. This sweet spot spans the most common impact points, ensuring explosive ball speeds and consistent performance. With this innovative design, golfers can experience maximum distance and forgiveness in all the right places."
      },
      {
        "header": "FEATURE THRU-SLOT SPEED POCKET",
        "content": "The Thru-Slot Speed Pocket is a patented TaylorMade® technology that maximizes face flexibility for increased ball speed and forgiveness. Specifically engineered to enhance performance on mis-hits low on the face, this feature ensures that golfers achieve optimal distance and forgiveness even on off-center strikes."
      },
      {
        "header": "FEATURE ECHO DAMPING SYSTEM®",
        "content": "The Echo Damping System® is strategically located behind the face of the iron. By utilizing a soft polymer blend and multiple contact points across the face, this innovative system effectively channels away harsh vibrations. As a result, golfers can enjoy a forged-like feel at impact, enhancing their overall experience with the iron."
      },
      {
        "header": "FEATURE LAUNCH FLIGHT BIAS",
        "content": "The Launch Flight Bias feature offers golfers different options to suit their playing style and preferences."
      },
      {
        "header": "FEATURE High-Launch Neutral",
        "content": "The High-Launch Neutral option is designed to provide golfers with a high launch angle, allowing for maximum carry distance and stopping power on the greens."
      }
    ]
  }`;
  //localStorage.setItem("1", content);
  //localStorage.setItem("table_1", table);
  //window.location.href = "/articledisplay?article=1";
  // END TESTING

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

          pdfFileName = data.file;
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
            parsedPDFData = response.parsedData;
            pdfTable = response.parsedTable;

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

            $("#rewriteLoader").addClass("is-hidden");
            $("#rewriteStatus .icon i").first().removeClass("fa-times-circle").addClass("fa-check-circle").removeClass("has-text-danger").addClass("has-text-success");

            $("#create_article button").removeAttr("disabled");
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

  // create article from the rewritten content JSON structure
  $(document).on("click", "#create_article button", async () => {
    if (articleContentBuild && articleTableBuild) {
      // add spinner
      let $button = $("#create_article button");

      $button.html(`<i class="fas fa-spinner fa-spin fa-2x"></i>`).attr("disabled", true);

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
            console.log(response);
            //let shortened = helpers.trimToArticleDiv(response.data);
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
