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

    // update paragraph data
    let articleToUpdate = $("#Article .conseg.outer.s-fit").eq(cardToUpdateNumber - 1);

    articleToUpdate.find("h3")[0].innerText = updatedHeader;
    articleToUpdate.find("p")[0].innerHTML = updatedParagraph;
  });

  // show add image card
  $(document).on("click", "#card_show_image", function () {
    let $this = $(this);

    $this.closest("div.card").find("#edit_textarea_card").addClass("is-hidden");
    $this.closest("div.card").find("#add_image_card").removeClass("is-hidden");

    $this.parent().addClass("is-hidden").next().removeClass("is-hidden");
  });

  // update image
  $(document).on("click", "#card_add_image", function () {
    let $this = $(this);

    let imageNumber2Update = $this.attr("card-num");

    let imageURL2Update = $this.parent().prev().prev().find("#image_url").val();
    let imageAlt2Update = $this.parent().prev().prev().find("#image_alt").val();

    let article = $("#Article").find(".conseg.outer.s-fit");

    let articleImg = $(article[imageNumber2Update - 1]).find("img");

    articleImg.attr("src", imageURL2Update);
    articleImg.attr("alt", imageAlt2Update);

    $this.closest("div.card").find("#add_image_card").addClass("is-hidden");
    $this.closest("div.card").find("#edit_textarea_card").removeClass("is-hidden");

    $this.parent().addClass("is-hidden").prev().removeClass("is-hidden");
  });

  // cancel image add screen and go back to text edit
  $(document).on("click", "#card_cancel", function () {
    let $this = $(this);

    $this.parent().addClass("is-hidden").prev().removeClass("is-hidden");
    $this.closest("div.card").find("#add_image_card").addClass("is-hidden");
    $this.closest("div.card").find("#edit_textarea_card").removeClass("is-hidden");
  });

  // add a new row to the table data
  $(document).on("click", "#card_add_row", function () {
    let copiedRow = $(`[card-type="table_data"]`).first().clone();

    // clear the content of the cloned row
    let copiedRowTd = copiedRow.find("td");
    for (let i = 0; i < copiedRowTd.length; i++) {
      copiedRowTd[i].innerText = i + 1;
    }

    $(`[card-type="table_data"]`).last().after(copiedRow);
  });

  // begin article submission process
  $(document).on("click", "#card_confirm_article", () => {
    let comments = prompt("Add comments or notes related to this article. They will be added to the confirmation email sent with the article.");
    if (confirm("CONFIRM: Ready to submit the article?")) {
      $("#card_confirm_article").addClass("is-loading").attr("disabled", true);

      let article = $("#Article").wrap("<p/>").parent().html();
      $("#Article").unwrap();

      let title = $("#Article h3").first().text();

      $.ajax({
        url: "/confirmArticle",
        type: "POST",
        data: JSON.stringify({
          user: cook,
          content: article,
          title: title,
          comments: comments,
        }),
        contentType: "application/json",
        processData: false,
        success: function (data) {
          if (data.success) {
            $("#card_confirm_article").removeClass("is-loading").removeAttr("disabled");
            localStorage.clear();

            // if problem with confirm, enable this alert
            //alert(data.alert);

            alert("Article successfully submitted. Confirm this alert to return home.");
            window.location.href = "/home";
          } else {
            alert("Error confirming article.");
          }
        },
        error: function (err) {},
      });
    }
  });

  // update table data
  $(document).on("click", "#card_update_table", () => {
    let tableHeaders = $(`[card-type="table_headers"] td`);
    let tableData = $(`[card-type="table_data"] td`);

    // holder for article table
    let table2Update = $("#Article .table-content");

    // headers to update - watch this later - could need to be changed depending on how gpt outputs the table
    let table2UpdateHeaders = table2Update
      .find("thead tr")
      .filter((index, el) => {
        return $(el).children().length > 1;
      })
      .first()
      .children();

    // row tds to update - will be updated L -> R *next row* L -> R  *next row* and so on...
    let table2UpdateRows = table2Update.find("tbody tr td");

    if (tableHeaders.length === table2UpdateHeaders.length && tableData.length === table2UpdateRows.length) {
      // update changed headers
      for (let i = 0; i < tableHeaders.length; i++) {
        if (tableHeaders[i].innerText != table2UpdateHeaders[i].innerText) {
          table2UpdateHeaders[i].innerText = tableHeaders[i].innerText;
        }
      }

      // update changed row data
      for (let i = 0; i < tableData.length; i++) {
        if (tableData[i].innerText != table2UpdateRows[i].innerText) {
          table2UpdateRows[i].innerText = tableData[i].innerText;
        }
      }
    }
  });

  // add a row to the table for later
  $(document).on("click", "#card_add_row", function () {});

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
      <div class="card m-4" card-type="data">
        <header class="card-header">
          <div class="card-header-title" contenteditable id="card_header">${header}</div>
        </header>
        <div class="card-content has-background-grey-light" id="edit_textarea_card">
          <div class="content">
            <textarea class="textarea mb-2" id="card_paragraph">${paragraph}</textarea>
          </div>
        </div>
        <div class="card-content has-background-grey-light is-hidden" id="add_image_card">
          <div class="content">
            <div class="field">
                <label class="label">Image URL</label>
                <div class="control">
                    <input class="input is-small" type="text" id="image_url" placeholder="Enter image URL">
                </div>
            </div>
            <div class="field">
              <label class="label">Image Alt Tag</label>
              <div class="control">
                  <input class="input is-small" type="text" id="image_alt" placeholder="Enter image alt tag">
              </div>
            </div>
          </div>
        </div>
        <footer class="card-footer">
          <a class="card-footer-item" id="card_update" card-num="${i + 1}">Update Paragraph</a>
          <a class="card-footer-item" id="card_show_image" card-num="${i + 1}">Add Image</a>
        </footer>
        <footer class="card-footer is-hidden">
          <a class="card-footer-item" id="card_cancel" card-num="${i + 1}">Cancel</a>
          <a class="card-footer-item" id="card_add_image" card-num="${i + 1}">Confirm Image</a>
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
      <div class="card m-2" card-type="table_headers">
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
      <div class="card m-2" card-type="table_data">
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
    <div class="card m-2 has-text-centered" id="table_update">
      <button class="button m-3 is-dark is-align-items-center" id="card_update_table">Update Table Data</button>
      <button class="button m-3 is-dark is-align-items-center" id="card_add_row">Add Table Row</button>
    </div>`);

    // add confirm article button that sends to confrimation screen
    $("#content_edit_cards").append(`
    <br />
    <div class="m-2 has-text-centered">
      <button class="button m-3 is-dark is-align-items-center is-large" id="card_confirm_article">CONFIRM ARTICLE</button>
    </div>
    `);
  }
});
