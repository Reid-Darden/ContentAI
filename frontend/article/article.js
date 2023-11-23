$(document).ready(async function () {
  // onload

  // User info
  let cook = cookies.getCookie("loggedIn");
  let role = cookies.getCookie("role");
  if (cook) {
    $("#logged_in_user").text("Welcome, " + cook);
    if (role == "admin") {
      $("#admin_panel").removeClass("is-hidden");
    }
  } else {
    window.location.href = "/";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const articleContent = urlParams.get("article");

  let article = localStorage.getItem(articleContent);

  if (article.length > 0) {
    console.log(article);
    $("#rendered_content").html(article);
    $("#raw_html").val(article);
  }
  // Updates the rendered content with the new content
  $(document).on("click", "#update_content", () => {
    let newHTML = $("#raw_html").val();
    $("#rendered_content").html(newHTML);
  });

  // Replaces left side with image entry form
  $(document).on("click", "#add_images", () => {
    if (!$("#image_entry").html()) {
      let imageCount = $(".conseg.outer.s-fit img").length;

      for (let i = 0; i < imageCount; i++) {
        // generate the wrapping div
        let wrapper = $("<div>", { id: `image_${i + 1}` });

        // header input
        let headerInput = $(`<h3>Image ${i + 1}</h3>`, {
          id: "image" + (i + 1) + "-header",
        });

        // alt input
        let altInput = $("<input>", {
          type: "text",
          id: "image" + (i + 1) + "-alt",
          placeholder: "Image " + (i + 1) + " Alt Text",
          class: "is-normal is-focused mb-2 mr-2 ml-2",
        });

        // src input
        let srcInput = $("<input>", {
          type: "text",
          id: "image" + (i + 1) + "-src",
          placeholder: "Image " + (i + 1) + " URL",
          class: "is-normal is-focused mb-2 mr-2 ml-2",
        });

        wrapper.append(headerInput, srcInput, altInput);

        // add the wrapper div to the image entry
        $("#image_entry").append(wrapper);
      }

      $("#raw_html, #raw_html_buttons").hide();
      $("#image_entry").show();

      $("#image_entry").append(
        $("<button>", {
          text: "Cancel",
          id: "cancel_image_links",
          class: "button is-danger mt-5 ml-2 mr-2",
        })
      );

      $("#image_entry").append(
        $("<button>", {
          text: "Update Images",
          id: "update_image_links",
          class: "button is-warning mt-5 ml-2 mr-2",
        })
      );
    } else {
      $("#raw_html, #raw_html_buttons").hide();
      $("#image_entry").show();
    }
  });

  // update image links
  $(document).on("click", "#update_image_links", () => {
    $("#Article .conseg.outer.s-fit img").each(function (index, imgElement) {
      // Update src and alt for each image
      let srcValue = $("#image" + (index + 1) + "-src").val();
      let altValue = $("#image" + (index + 1) + "-alt").val();
      if (srcValue.length > 0 && altValue.length > 0) {
        $(imgElement).attr("src", srcValue);
        $(imgElement).attr("alt", altValue);
      }
    });

    $("#image_entry").hide();
    $("#raw_html, #raw_html_buttons").show();

    let output = $("#Article").wrap("<p/>").parent().html();
    $("#Article").unwrap();
    $("#raw_html").val(output);
  });

  $(document).on("click", "#cancel_image_links", () => {
    $("#raw_html, #raw_html_buttons").show();
    $("#image_entry").hide();
  });
});
