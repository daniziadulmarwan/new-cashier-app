const openFormAddData = () => {
  $("#form-add-data").addClass("active");
  $("#product_name").focus();
  loadCategoryOption();
  loadUnitsOption();
};

const closeFormAddData = () => {
  $("#form-add-data").removeClass("active");
};

function deleteAction(id = false, data = false) {
  let msg = `Are you sure want to delete ${data}`;
  if (id) {
    let dialogBox = dialog.showMessageBoxSync({
      type: "question",
      title: "Delete records",
      buttons: ["No", "Yes"],
      defaultId: [0, 1],
      message: msg,
    });

    if (dialogBox === 0) {
      $("input.data-checkbox").prop("checked", false);
      $("tbody#data tr").removeClass("blocked");
    } else {
      deleteRecords(id);
    }
  } else {
    let array_ids = [];
    $("input.data-checkbox:checked").each(function () {
      let ids = $(this).attr("id");
      array_ids.push(ids);
    });

    if (array_ids.length < 1) {
      let msgBox = dialog.showMessageBoxSync({
        type: "question",
        title: "ATTENTION!",
        buttons: ["No", "Yes"],
        defaultId: [0, 1],
        message: "Are you sure want to delete all data ?",
      });
      if (msgBox === 0) {
        console.log("No");
      } else {
        deleteAllRecord();
      }
    } else {
      let msgBoxSel = dialog.showMessageBoxSync({
        type: "question",
        title: "ATTENTION!",
        buttons: ["No", "Yes"],
        defaultId: [0, 1],
        message: "Are you sure want to delete selected records ?",
      });
      if (msgBoxSel === 0) {
        console.log("No");
        $("input.data-checkbox").prop("checked", false);
        $("tbody#data tr").removeClass("blocked");
      } else {
        let join_array_ids = array_ids.join(",");
        deleteMultipleRecords(join_array_ids);
      }
    }
  }
}

const selectAll = () => {
  $("input.data-checkbox").prop("checked", true);
  $("tbody#data tr").addClass("blocked");
};

const unselectAll = () => {
  $("input.data-checkbox").prop("checked", false);
  $("tbody#data tr").removeClass("blocked");
};

$("#first-page").on("click", function (e) {
  e.preventDefault();
  let searchValue = $("#search-data").val();
  let total_row_displayed = $("#select_per_page").val();
  $("#page_number").val(1);
  load_data(1, total_row_displayed, searchValue);
});

$("#last-page").on("click", function (e) {
  e.preventDefault();
  let searchValue = $("#search-data").val();

  let total_pages = $("#total_pages").val();
  $("#page_number").val(total_pages);
  let total_row_displayed = $("#select_per_page").val();
  load_data(total_pages, total_row_displayed, searchValue);
});

$("#page_number").keyup(function () {
  let searchValue = $("#search-data").val();

  let page_number = $(this).val();
  let total_row_displayed = $("#select_per_page").val();
  load_data(page_number, total_row_displayed, searchValue);
});

$("#next-page").on("click", function (e) {
  e.preventDefault();
  let searchValue = $("#search-data").val();

  let total_page = $("#total_pages").val();
  let input_val = $("#page_number").val();

  if (input_val === "") {
    input_val = 1;
  }

  let page_no = parseInt(input_val);
  let total_row_displayed = $("#select_per_page").val();
  if (page_no < total_page) {
    $("#page_number").val(page_no + 1);
    load_data(page_no + 1, total_row_displayed, searchValue);
  }
});

$("#prev-page").on("click", function (e) {
  e.preventDefault();
  let searchValue = $("#search-data").val();

  let input_val = $("#page_number").val();
  let page_no = parseInt(input_val);
  if (page_no > 1) {
    $("#page_number").val(page_no - 1);
    let total_row_displayed = $("#select_per_page").val();
    load_data(page_no - 1, total_row_displayed, searchValue);
  }
});

$("#select_per_page").on("change", function () {
  let searchValue = $("#search-data").val();

  let total_row_displayed = $(this).val();
  var page_number = $("#page_number").val();
  let total_page = $("#total_pages").val();
  if (page_number > total_page) {
    var page_number = 1;
    $("#page_number").val(1);
  }
  load_data(page_number, total_row_displayed, searchValue);
});

function search() {
  let searchValue = $("#search-data").val();
  var page_number = $("#page_number").val();
  let total_row_displayed = $("#select_per_page").val();
  load_data(page_number, total_row_displayed, searchValue);
}

$("#search-data").keydown(function (e) {
  if (e.keyCode === 13) {
    search();
  }
});

$("#search-data").keyup(function () {
  let val = $(this).val();
  let page = $("#page_number").val();
  let row = $("#select_per_page").val();
  if (val === "") {
    load_data(page, row);
  }
});

const exportData = (ext) => {
  let array_ids = [];
  $("input.data-checkbox:checked").each(function () {
    let ids = $(this).attr("id");
    array_ids.push(ids);
  });

  let filePath = dialog.showSaveDialogSync({
    title: "Export Data",
    filters: [{ name: ext, extensions: [ext] }],
  });

  if (filePath != undefined) {
    if (array_ids.length < 1) {
      executeExport(filePath, ext);
    } else {
      let join_ids = array_ids.join(",");
      executeExport(filePath, ext, join_ids);
    }
  } else {
    console.log("Something went wrong");
  }
};

const executeExport = (filePath, ext, joinIds = false) => {
  switch (ext) {
    case "csv":
      exportCsv(filePath, ext, joinIds);
      break;
    case "pdf":
      exportPdf(filePath, ext, joinIds);
      break;
  }
};

const exportCsv = (filePath, ext, joinIds = false) => {
  let doc_id = $("body").attr("id");
  switch (doc_id) {
    case "product-data":
      exportCsvProductData(filePath, ext, joinIds);
      break;
  }
};

const exportPdf = (filePath, ext, joinIds = false) => {
  let doc_id = $("body").attr("id");
  switch (doc_id) {
    case "product-data":
      exportPdfProductData(filePath, ext, joinIds);
      break;
    case "sales-report":
      exportPdfSalesReport(filePath, ext, joinIds);
      break;
  }
};

const printData = () => {
  let array_ids = [];
  $("input.data-checkbox:checked").each(function () {
    let ids = $(this).attr("id");
    array_ids.push(ids);
  });

  if (array_ids.length < 1) {
    executePrintData();
  } else {
    let joinArrayIds = array_ids.join(",");
    executePrintData(joinArrayIds);
  }
};

const executePrintData = (join_ids = false) => {
  let doc_id = $("body").attr("id");
  switch (doc_id) {
    case "product-data":
      printProductData(join_ids);
      break;
  }
};
