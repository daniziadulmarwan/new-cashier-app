let doc_id = $("body").attr("id");

const totalPage = (total_row_displayed, searchValue = "") => {
  switch (doc_id) {
    case "product-data":
      totalProductPage(total_row_displayed, searchValue);
      break;
  }
};

const load_data = (page_number, total_row_displayed, searchValue = "") => {
  switch (doc_id) {
    case "product-data":
      loadProduct(page_number, total_row_displayed, searchValue);
      break;
  }
};

let page_number = $("#page_number").val();
let total_row_displayed = $("#select_per_page").val();
let searchValue = $("#search-data").val();
load_data(page_number, total_row_displayed, searchValue);

const deleteRecords = (id) => {
  let table;
  switch (doc_id) {
    case "product-data":
      table = "products";
      break;
  }
  let sql = `delete from ${table} where id='${id}'`;
  db.run(sql, (err) => {
    if (err) throw err;
    load_data(page_number, total_row_displayed);
  });
};

const deleteAllRecord = () => {
  let table;
  switch (doc_id) {
    case "product-data":
      table = "products";
      break;
  }
  let sql = `delete from ${table}`;
  db.run(sql, (err) => {
    if (err) console.log(err.message);

    load_data(page_number, total_row_displayed);
  });
};

const deleteMultipleRecords = (ids) => {
  let table;
  switch (doc_id) {
    case "product-data":
      table = "products";
      break;
  }
  let sql = `delete from ${table} where id in(${ids})`;
  db.run(sql, (err) => {
    if (err) {
      console.log(err.message);
    }
    load_data(page_number, total_row_displayed);
  });
};

$("tbody#data").on("click", "tr", function () {
  let data_id = $(this).attr("data-id");
  let checkBox = $('input[type="checkbox"]#' + data_id);
  checkBox.prop("checked", !checkBox.prop("checked"));
  $(this).toggleClass("blocked");
});

const editRecord = (id) => {
  switch (doc_id) {
    case "product-data":
      editPrdData(id);
      break;
  }
};

const alertSuccess = (msg) => {
  let alert = `<div class="alert alert-success">${msg}</div>`;
  $("#alert").html(alert);
  function clearAlert() {
    $("#alert").html("");
  }
  setTimeout(clearAlert, 4000);
};

// Function Caller
deleteRecords();
