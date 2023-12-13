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
    alert("hi");
    window.location.href = "/";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const articleContent = urlParams.get("article");

  let article = localStorage.getItem(articleContent);

  if (article.length > 0) {
    // rendered content (right side)
    $("#rendered_content").html(article);

    // article updating build (left side)
    buildArticleEditBoxes(article);
  }

  // update the content that was changed
  $(document).on("click", "#card_update", function () {
    let $this = $(this);

    let cardToUpdateNumber = $this.attr("card-num");
    let cardToUpdate = $this.closest(".card");

    let updatedHeader = cardToUpdate.find("#card_header")[0].innerHTML;
    let updatedParagraph = cardToUpdate.find("#card_paragraph")[0].value;

    // update the article on the right
    let articleToUpdate = $("#Article .conseg.outer.s-fit").eq(cardToUpdateNumber - 1);

    articleToUpdate.find("h3")[0].innerText = updatedHeader;
    articleToUpdate.find("p")[0].innerHTML = updatedParagraph;
  });

  // add image to paragraph
  $(document).on("click", "#card_add_image", () => {});

  // begin article submission process
  $(document).on("click", "#confirm_content", () => {
    if (confirm("CONFIRM: Ready to submit the article?")) {
      let article = $("#Article").wrap("<p/>").parent().html();
      $("#Article").unwrap();

      $.ajax({
        url: "/confirmArticle",
        type: "POST",
        data: JSON.stringify({
          user: cook,
          content: article,
        }),
        contentType: "application/json",
        processData: false,
        success: function (data) {
          if (data.success) {
            window.location.href = "/confirmation";
          } else {
            alert("Error confirming article.");
          }
        },
        error: function (err) {},
      });
    }
  });

  function buildArticleEditBoxes(article) {
    // extract paragraphs from input article
    let tempElement = $(article);

    let extractedHeaders = tempElement.find(".conseg.outer.s-fit h3");
    let extractedParagraphs = tempElement.find(".conseg.outer.s-fit p");

    let contentMap = [];

    if (extractedHeaders.length == extractedParagraphs.length) {
      for (let i = 0; i < extractedHeaders.length; i++) {
        contentMap[i] = {
          header: extractedHeaders[i].innerText,
          paragraph: extractedParagraphs[i].innerText,
        };
      }
    }

    for (let i = 0; i < contentMap.length; i++) {
      let header = contentMap[i].header;
      let paragraph = contentMap[i].paragraph;

      let template = `
      <div class="card m-2">
        <header class="card-header">
          <div class="card-header-title" contentEditable="true" id="card_header">${header}</div>
        </header>
        <div class="card-content">
          <div class="content">
            <textarea class="textarea" id="card_paragraph">${paragraph}</textarea>
          </div>
        </div>
        <footer class="card-footer">
          <a class="card-footer-item" id="card_update" card-num="${i + 1}">Update</a>
          <a class="card-footer-item" id="card_add_image">Add Image</a>
        </footer>
      </div>`;

      $("#content_edit_cards").append(template);
    }
  }
});
