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

    // paragraph data
    let extractedHeaders = tempElement.find(".conseg.outer.s-fit h3");
    let extractedParagraphs = tempElement.find(".conseg.outer.s-fit p");

    // table data
    let extractedTable = tempElement.find(".table-content");
    let extractedTableHeaders = extractedTable.find("thead tr");
    let extractedTableData = extractedTable.find("tbody tr");

    // build structure for table headers - in the event there is more than 1 row of <th>, this checks that the headers pulled match the length of the data it maps too
    let tableHeaderStructure = [];
    for (let header of extractedTableHeaders) {
      let headerRowLength = $(header).find("th").length;
      let headerRowTh = $(header).find("th");

      let headerRowValue = [];
      for (let val of headerRowTh) {
        headerRowValue.push(val.innerHTML);
      }

      tableHeaderStructure.push({
        headerRowLength: headerRowLength,
        headerRowValue: headerRowValue,
      });
    }

    let tableStructureMaxLength = tableHeaderStructure.reduce((max, obj) => Math.max(max, obj.headerRowLength), 0);
    let filteredTableStructure = tableHeaderStructure.filter((obj) => obj.headerRowValue.length == tableStructureMaxLength);

    // build structure for table data that can be edited
    let contentMap = [];

    if (extractedHeaders.length == extractedParagraphs.length) {
      for (let i = 0; i < extractedHeaders.length; i++) {
        contentMap[i] = {
          header: extractedHeaders[i].innerText,
          paragraph: extractedParagraphs[i].innerText,
        };
      }
    }

    // h3 to start paragraph data edits
    $("#content_edit_cards").append(`<h3 class="m-3 title is-3 is-align-items-center">Paragraph Data</h3>`);

    for (let i = 0; i < contentMap.length; i++) {
      let header = contentMap[i].header;
      let paragraph = contentMap[i].paragraph;

      let template = `
      <div class="card m-2">
        <header class="card-header">
          <div class="card-header-title" contenteditable id="card_header">${header}</div>
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

    // h3 to start table data
    $("#content_edit_cards").append(`<h3 class="mr-3 ml-3 mt-5 mb-5 title is-3 is-align-items-center">Table Data</h3>`);

    // build header card from filtered data structure
    let thOut = "";
    for (var i = 0; i < filteredTableStructure[0].headerRowLength; i++) {
      let headerRow = filteredTableStructure[0].headerRowValue[i];
      thOut += `<td contenteditable style="width: 75px;">${headerRow}</td>`;
    }

    // append headers card
    $("#content_edit_cards").append(`
      <div class="card m-2">
        <div class="card-content">
          <div class="content">
            <table>
              <tbody>
                <tr>
                  ${thOut}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`);

    for (let i = 0; i < extractedTableData.length; i++) {
      let $row = $(extractedTableData[i]);

      let td = $row.find("td");

      let tdOut = "";
      for (let j = 0; j < td.length; j++) {
        let rowValue = td[j].innerText;
        tdOut += `<td contenteditable style="width: 75px;">${rowValue}</td>`;
      }

      let template = `
      <div class="card m-2">
        <div class="card-content">
          <div class="content">
            <table>
              <tbody>
                <tr>
                  ${tdOut}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

      $("#content_edit_cards").append(template);
    }

    $("#content_edit_cards").append(`
    <div class="card m-2 has-text-centered">
      <button class="button m-3 is-dark is-align-items-center" id="card_update_table">Update Table Data</button>
    </div>`);
  }
});
