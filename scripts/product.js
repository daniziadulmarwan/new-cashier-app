let inputPrdPrice = IMask(document.getElementById("product_price"), {
  mask: "Rp num",
  blocks: {
    num: {
      mask: Number,
      thousandsSeparator: ".",
      scale: 3,
      radix: ",",
      mapToRadix: ["."],
      padFractionalZeros: false,
      signed: false,
    },
  },
});

let inputPrdCost = IMask(document.getElementById("product_cost"), {
  mask: "Rp num",
  blocks: {
    num: {
      mask: Number,
      thousandsSeparator: ".",
      scale: 3,
      radix: ",",
      mapToRadix: ["."],
      padFractionalZeros: false,
      signed: false,
    },
  },
});

let inputPrdInitQty = IMask(document.getElementById("product_intial_qty"), {
  mask: "num",
  blocks: {
    num: {
      mask: Number,
      thousandsSeparator: ".",
      padFractionalZeros: false,
      signed: false,
    },
  },
});

const totalProductPage = (total_row_displayed, searchValue) => {
  let query;
  if (searchValue != "") {
    query = `select count(*) as total_row from products where product_name like '%${searchValue}%' escape '!' or product_code like '${searchValue}' escape '!' or barcode like '${searchValue}' escape '!' or category like '${searchValue}' escape '!' or selling_price like '${searchValue}' escape '!' or cost_of_product like '${searchValue}' escape '!'`;
  } else {
    query = "select count(*) as total_row from products";
  }

  db.serialize(() => {
    db.each(query, (err, result) => {
      if (err) throw err;
      let total_page;
      if (result.total_row % total_row_displayed == 0) {
        total_page = parseInt(result.total_row) / parseInt(total_row_displayed);
      } else {
        total_page = parseInt(result.total_row / total_row_displayed) + 1;
      }

      $("#total_pages").val(total_page);
    });
  });
};

function loadProduct(page_number, total_row_displayed, searchValue) {
  let row_number;
  if (page_number < 2) {
    row_number = 0;
  } else {
    row_number = (page_number - 1) * total_row_displayed;
  }

  totalPage(total_row_displayed, searchValue);

  let query;
  if (searchValue != "") {
    query = `select * from products where product_name like '%${searchValue}%' escape '!' or product_code like '${searchValue}' escape '!' or barcode like '${searchValue}' escape '!' or category like '${searchValue}' escape '!' or selling_price like '${searchValue}' escape '!' or cost_of_product like '${searchValue}' escape '!' order by id desc limit ${row_number}, ${total_row_displayed}`;
  } else {
    query = `select * from products order by id desc limit ${row_number},${total_row_displayed}`;
  }

  db.serialize(() => {
    db.all(query, (err, rows) => {
      let tr = "";

      if (err) {
        tr += `<tr>
                <td>${err.message}</td>
              </tr>`;
      }

      if (rows.length < 1) {
        tr += "";
      } else {
        rows.forEach((row) => {
          tr += `<tr data-id="${row.id}">
                  <td data-colname='Id'>
                    ${row.id}
                    <input type='checkbox' id='${row.id}' class='data-checkbox' style="visibility:hidden" />
                  </td>
                  <td>${row.product_name}</td>
                  <td>${row.product_code}</td>
                  <td>${row.barcode}</td>
                  <td>${row.category}</td>
                  <td>${row.unit}</td>
                  <td>${row.selling_price}</td>
                  <td>${row.cost_of_product}</td>
                  <td>${row.product_initial_qty}</td>
                  <td>
                    <button onclick="editRecord(${row.id})" id="edit-data" class="btn btn-sm btn-light btn-light-bordered"><i class="bi bi-pencil-square"></i></button>
                    <button onclick="deleteAction(${row.id},'${row.product_name}')" id="delete-data" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>`;
        });
      }
      $("tbody#data").html(tr);
    });
  });
}

function blankForm() {
  $("#product_name").val("");
  $("#product_barcode").val("");
  $("#product_price").val("");
  $("#product_cost").val("");
  $("#product_intial_qty").val("");
  $("#product_category").val("");
  $("#product_unit").val("");
}

function resetFormAddData() {
  blankForm();
  $("#product_name").focus();
}

function insertProduct() {
  let prd_name = $("#product_name").val();
  let prd_barcode = $("#product_barcode").val();
  let prd_category = $("#product_category").val();
  let prd_price = inputPrdPrice.unmaskedValue;
  let prd_cost = inputPrdCost.unmaskedValue;
  let prd_init_qty = inputPrdInitQty.unmaskedValue;
  let prd_unit = $("#product_unit").val();

  let required = $("[required]");
  let required_array = [];
  required.each(function () {
    if ($(this).val() != "") {
      required_array.push($(this).val());
    }
  });

  if (required_array.length < 4) {
    dialog.showMessageBoxSync({
      title: "Alert",
      type: "info",
      message: "Nama produk, Harga jual, Harga pokok dan Satuan harus diisi",
    });
  } else if (parseInt(prd_price) < parseInt(prd_cost)) {
    dialog.showMessageBoxSync({
      title: "Alert",
      type: "info",
      message: "Harga jual tidak boleh lebih kecil dari harga pokok",
    });
  } else {
    db.serialize(() => {
      db.each(
        `select count(*) as row_number from products where product_name='${prd_name}'`,
        (err, res) => {
          if (err) console.log(err.message);

          if (res.row_number < 1) {
            db.run(
              `insert into products(product_name, barcode, category,selling_price, cost_of_product, product_initial_qty, unit) values('${prd_name}','${prd_barcode}','${prd_category}','${prd_price}','${prd_cost}','${Number(
                prd_init_qty
              )}','${prd_unit}')`,
              (err) => {
                if (err) console.log(err.message);
                db.each(
                  `select id from products where product_name = '${prd_name}'`,
                  (err, row) => {
                    if (err) console.log(err.message);
                    db.run(
                      `update products set product_code = 'PR'||substr('0000'||${row.id},-6,6) where product_name ='${prd_name}'`,
                      (err) => {
                        if (err) console.log(err.message);

                        blankForm();
                        $("#product_name").focus();
                        let page_number = $("#page_number").val();
                        let total_row_displayed = $("#select_per_page").val();
                        load_data(page_number, total_row_displayed);
                      }
                    );
                  }
                );
              }
            );
          } else {
            dialog.showMessageBoxSync({
              title: "Alert",
              type: "info",
              message: "Nama produk sudah terdaftar",
            });
          }
        }
      );
    });
  }
}

function loadCategoryOption() {
  db.all("select * from categories order by id desc", (err, rows) => {
    if (err) console.log(err.message);
    let option = '<option hidden values="">Kategori</option>';
    rows.map((row) => {
      option += `<option value="${row.category}">${row.category}</option>`;
    });
    $("#product_category").html(option);
  });
}

function loadUnitsOption() {
  db.all("select * from units order by id desc", (err, rows) => {
    if (err) console.log(err.message);
    let option = '<option hidden values="">Units</option>';
    rows.map((row) => {
      option += `<option value="${row.unit}">${row.unit}</option>`;
    });
    $("#product_unit").html(option);
  });
}

function selectUnitOption(unitOpt, unit) {
  let options = unitOpt.replace(
    `value="${unit}">`,
    `value="${unit}" selected>`
  );
  return options;
}

function selectCategoryOption(categoryOpt, category) {
  let options = categoryOpt.replace(
    `value="${category}">`,
    `value="${category}" selected>`
  );
  return options;
}

function editPrdData(id) {
  let sqlUnit = "select * from units";
  let sqlCategory = "select * from categories";
  let sql = `select * from products where id = ${id}`;

  db.all(sqlUnit, (err, result) => {
    if (err) {
      console.log(err.message);
    } else {
      let unitOption;
      let unitOpts = "<option></option>";
      result.forEach((res) => {
        unitOpts += `<option value="${res.unit}">${res.unit}</option>`;
      });
      unitOption = unitOpts;

      db.all(sqlCategory, (err, items) => {
        if (err) {
          console.log(err.message);
        } else {
          let categoryOption;
          let categoryOpts = "<option></option>";
          items.forEach((item) => {
            categoryOpts += `<option value="${item.category}">${item.category}</option>`;
          });
          categoryOption = categoryOpts;

          db.all(sql, (err, datas) => {
            if (err) {
              console.log(err.message);
            } else {
              let row = datas[0];
              let editForm = "";
              editForm += `
                          <div class="form-group mb-2">
                            <input type="text" value="${
                              row.product_name
                            }" id="editPrdName" class="form-control form-control-sm" placeholder="Nama Produk" />
                            <input type="hidden" value="${
                              row.product_name
                            }" id="prevPrdName" />  
                            <input type="hidden" value="${id}" id="rowId" />
                          </div>
                          <div class="form-group mb-2">
                            <input type="text" value="${
                              row.barcode
                            }" id="editPrdBarcode" class="form-control form-control-sm" placeholder="Barcode" />
                            <input type="hidden" value="${
                              row.barcode
                            }" id="prevPrdBarcode" />  
                          </div>
                          <div class="form-group mb-2">
                            <select class="form-select form-select-sm" id="editPrdCategory">
                              ${selectCategoryOption(
                                categoryOption,
                                row.category
                              )}
                            </select>
                          </div>
                          <div class="form-group mb-2">
                            <select class="form-select form-select-sm" id="editPrdUnit">
                              ${selectUnitOption(unitOption, row.unit)}
                            </select>
                          </div>
                          <div class="form-group mb-2">
                            <input type="text" value="${
                              row.selling_price
                            }" id="editPrdPrice" class="form-control form-control-sm" placeholder="Harga jual" /> 
                          </div>
                          <div class="form-group mb-2">
                            <input type="text" value="${
                              row.cost_of_product
                            }" id="editPrdCost" class="form-control form-control-sm" placeholder="Harga pokok" /> 
                          </div>
                          <div class="form-group mb-2">
                            <input type="text" value="${
                              row.product_initial_qty
                            }" id="editPrdQty" class="form-control form-control-sm" placeholder="Stock awal" /> 
                          </div>
                          <div class="form-group mb-2">
                            <button class="btn btn-sm btn-primary w-100 rounded-1" onclick="submitEditPrdData(${id})" id="btn-submit-edit">
                              <i class="bi bi-send"></i> Update
                            </button>
                          </div>
                          `;

              ipcRenderer.send(
                "load:edit",
                "product-data",
                editForm,
                300,
                350,
                id
              );
            }
          });
        }
      });
    }
  });
}

ipcRenderer.on("update:success", (e, msg) => {
  alertSuccess(msg);
  let page_number = $("#page_number").val();
  let total_row_displayed = $("#select_per_page").val();
  load_data(page_number, total_row_displayed);
});

ipcRenderer.on("close:modal", (e) => {
  unselectAll();
});

const exportCsvProductData = (filePath, ext, joinIds = false) => {
  let sql;
  let file_path = filePath.replace(/\\/g, "/");
  if (joinIds) {
    sql = `SELECT * FROM products WHERE id IN(${joinIds}) order by id desc`;
  } else {
    sql = `select * from products order by id desc`;
  }

  db.all(sql, (err, result) => {
    if (err) throw err;
    const convertToCsv = (arr) => {
      let array = [Object.keys(arr[0])].concat(arr);
      return array
        .map((item) => {
          return Object.values(item).toString();
        })
        .join("\r\n");
    };
    let content = convertToCsv(result);
    ipcRenderer.send("write:csv", file_path, content);
  });
};

ipcRenderer.on("created:csv", (e) => {
  unselectAll();
});

const exportPdfProductData = (filePath, ext, joinIds = false) => {
  let sql;
  let file_path = filePath.replace(/\\/g, "/");
  if (joinIds) {
    sql = `select * from products where id in(${joinIds}) order by id desc`;
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama Produk</th>
                    <th>Kode Produk</th>
                    <th>Barcode</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Harga Pokok</th>
                    <th>Satuan</th>
                    <th>Stok Awal</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.product_name}</td>
                    <td>${item.product_code}</td>
                    <td>${item.barcode}</td>
                    <td>${item.category}</td>
                    <td>${item.selling_price}</td>
                    <td>${item.cost_of_product}</td>
                    <td>${item.unit}</td>
                    <td>${item.product_initial_qty}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:pdf",
        thead,
        tbody,
        file_path,
        "product-data",
        "Data Produk"
      );
    });
  } else {
    sql = `select * from products order by id desc`;
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama Produk</th>
                    <th>Kode Produk</th>
                    <th>Barcode</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Harga Pokok</th>
                    <th>Satuan</th>
                    <th>Stok Awal</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.product_name}</td>
                    <td>${item.product_code}</td>
                    <td>${item.barcode}</td>
                    <td>${item.category}</td>
                    <td>${item.selling_price}</td>
                    <td>${item.cost_of_product}</td>
                    <td>${item.unit}</td>
                    <td>${item.product_initial_qty}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:pdf",
        thead,
        tbody,
        file_path,
        "product-data",
        "Data Produk"
      );
    });
  }
};

ipcRenderer.on("created:pdf", (e) => {
  unselectAll();
});

const printProductData = (joinIds = false) => {
  let sql;
  if (joinIds) {
    sql = `select * from products where id in(${joinIds}) order by id desc`;
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama Produk</th>
                    <th>Kode Produk</th>
                    <th>Barcode</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Harga Pokok</th>
                    <th>Satuan</th>
                    <th>Stok Awal</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.product_name}</td>
                    <td>${item.product_code}</td>
                    <td>${item.barcode}</td>
                    <td>${item.category}</td>
                    <td>${item.selling_price}</td>
                    <td>${item.cost_of_product}</td>
                    <td>${item.unit}</td>
                    <td>${item.product_initial_qty}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:print-page",
        thead,
        tbody,
        "product-data",
        "Data Produk"
      );
    });
  } else {
    sql = "select * from products order by id desc";
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama Produk</th>
                    <th>Kode Produk</th>
                    <th>Barcode</th>
                    <th>Kategori</th>
                    <th>Harga Jual</th>
                    <th>Harga Pokok</th>
                    <th>Satuan</th>
                    <th>Stok Awal</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.product_name}</td>
                    <td>${item.product_code}</td>
                    <td>${item.barcode}</td>
                    <td>${item.category}</td>
                    <td>${item.selling_price}</td>
                    <td>${item.cost_of_product}</td>
                    <td>${item.unit}</td>
                    <td>${item.product_initial_qty}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:print-page",
        thead,
        tbody,
        "product-data",
        "Data Produk"
      );
    });
  }
};
