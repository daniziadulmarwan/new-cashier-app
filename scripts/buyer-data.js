const totalBuyerPage = (total_row_displayed, searchValue) => {
  let query;
  if (searchValue != "") {
    query = `select count(*) as total_row from buyers where name like '%${searchValue}%' escape '!' or address like '${searchValue}' escape '!' or website like '${searchValue}' escape '!' or telp_one like '${searchValue}' escape '!' or telp_two like '${searchValue}' escape '!' or email like '${searchValue}' escape '!'`;
  } else {
    query = "select count(*) as total_row from buyers";
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

function loadBuyer(page_number, total_row_displayed, searchValue) {
  let row_number;
  if (page_number < 2) {
    row_number = 0;
  } else {
    row_number = (page_number - 1) * total_row_displayed;
  }

  totalPage(total_row_displayed, searchValue);

  let query;
  if (searchValue != "") {
    query = `select * from buyers where name like '%${searchValue}%' escape '!' or address like '${searchValue}' escape '!' or website like '${searchValue}' escape '!' or telp_one like '${searchValue}' escape '!' or telp_two like '${searchValue}' escape '!' or email like '${searchValue}' escape '!' order by id desc limit ${row_number}, ${total_row_displayed}`;
  } else {
    query = `select * from buyers order by id desc limit ${row_number},${total_row_displayed}`;
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
                  <td>${row.name}</td>
                  <td>${row.address}</td>
                  <td>${row.website}</td>
                  <td>${row.telp_one}</td>
                  <td>${row.telp_two}</td>
                  <td>${row.email}</td>
                  <td>
                    <button onclick="editRecord(${row.id})" id="edit-data" class="btn btn-sm btn-light btn-light-bordered"><i class="bi bi-pencil-square"></i></button>
                    <button onclick="deleteAction(${row.id},'${row.name}')" id="delete-data" class="btn btn-sm btn-danger"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>`;
        });
      }
      $("tbody#data").html(tr);
    });
  });
}

const blankBuyerForm = () => {
  $(".buyer-form").val("");
  $("#buyer-name").focus();
};

function insertBuyer() {
  let name = $("#buyer-name").val();
  let address = $("#buyer-address").val();
  let website = $("#buyer-website").val();
  let telpOne = $("#buyer-telp-one").val();
  let telpTwo = $("#buyer-telp-two").val();
  let email = $("#buyer-email").val();

  let required = $("[required]");
  let required_array = [];
  required.each(function () {
    if ($(this).val() != "") {
      required_array.push($(this).val());
    }
  });

  if (required_array.length < 1) {
    dialog.showMessageBoxSync({
      title: "Alert",
      type: "info",
      message: "Nama Buyer/Customer harus diisi",
    });
  } else {
    db.serialize(() => {
      db.each(
        `select count(*) as row_number from buyers where name = '${name}'`,
        (err, res) => {
          if (err) throw err;
          console.log(err);
          if (res.row_number < 1) {
            db.run(
              `insert into buyers(name, address, website, telp_one, telp_two, email) values('${name}','${address}','${website}','${telpOne}','${telpTwo}','${email}')`,
              (err) => {
                if (err) throw err;
                $("#page_number").val(1);
                blankBuyerForm();
                $("#buyer-name").focus();
                let page_number = $("#page_number").val();
                let total_row_displayed = $("#select_per_page").val();
                load_data(page_number, total_row_displayed);
              }
            );
          } else {
            dialog.showMessageBoxSync({
              title: "Alert",
              type: "info",
              message: "Nama buyer sudah terdaftar",
            });
          }
        }
      );
    });
  }
}

const editBuyerData = (id) => {
  let query = `select * from buyers where id = ${id}`;
  db.all(query, (err, result) => {
    if (err) throw err;
    let row = result[0];
    let editForm = `<div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-person"></i></span>
                      <input type="hidden" value="${row.name}" id="buyer-prev-name" />
                      <input type="text" class="form-control form-control-sm buyer-form" placeholder="Name" value="${row.name}" id="buyer-name" required autofocus />
                    </div>
                    <div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-signpost-2"></i></span>
                      <input type="text" class="form-control form-control-sm buyer-form" placeholder="Address" value="${row.address}" id="buyer-address" />
                    </div><div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-globe"></i></span>
                      <input type="text" class="form-control form-control-sm buyer-form" placeholder="Website" value="${row.website}" id="buyer-website" />
                    </div>
                    <div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                      <input type="text" class="form-control form-control-sm buyer-form" placeholder="Telp 1" value="${row.telp_one}" id="buyer-telp-one" />
                    </div>
                    <div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                      <input type="text" class="form-control form-control-sm buyer-form" placeholder="Telp 2" value="${row.telp_two}" id="buyer-telp-two" />
                    </div>
                    <div class="input-group input-group-sm mb-2">
                      <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                      <input type="email" class="form-control form-control-sm buyer-form" placeholder="Email" value="${row.email}" id="buyer-email" />
                    </div>
                    <button class="btn btn-sm btn-primary rounded-1 w-100" onclick="submitEditBuyerData(${row.id})"><i class="bi bi-send"></i> Submit</button>
                    `;

    ipcRenderer.send("load:edit", "buyer-data", editForm, 300, 400, id);
  });
};

ipcRenderer.on("update:success", (e, msg) => {
  alertSuccess(msg);
  let pageNumber = $("#page_number").val();
  let totalRowDisplayed = $("#select_per_page").val();
  load_data(pageNumber, totalRowDisplayed);
});

ipcRenderer.on("close:modal", (e) => {
  unselectAll();
});

const exportCsvBuyerData = (filePath, ext, joinIds = false) => {
  let sql;
  let file_path = filePath.replace(/\\/g, "/");
  if (joinIds) {
    sql = `SELECT * FROM buyers WHERE id IN(${joinIds}) order by id desc`;
  } else {
    sql = `select * from buyers order by id desc`;
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
    ipcRenderer.send("write:csv", file_path, content, "buyer-data");
  });
};

ipcRenderer.on("created:csv", (e) => {
  unselectAll();
});

const exportPdfBuyerData = (filePath, ext, joinIds = false) => {
  let sql;
  let file_path = filePath.replace(/\\/g, "/");
  if (joinIds) {
    sql = `select * from buyers where id in(${joinIds}) order by id desc`;
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>Website</th>
                    <th>Telp 1</th>
                    <th>Telp 2</th>
                    <th>Email</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.address}</td>
                    <td>${item.website}</td>
                    <td>${item.telp_one}</td>
                    <td>${item.telp_two}</td>
                    <td>${item.email}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:pdf",
        thead,
        tbody,
        file_path,
        "buyer-data",
        "Data Customer"
      );
    });
  } else {
    sql = `select * from buyers order by id desc`;
    db.all(sql, (err, rows) => {
      if (err) throw err;
      let tbody;
      let thead = `<tr>
                    <th>Id</th>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>Website</th>
                    <th>Telp 1</th>
                    <th>Telp 2</th>
                    <th>Email</th>
                  </tr>`;
      rows.forEach((item) => {
        tbody += `<tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.address}</td>
                    <td>${item.website}</td>
                    <td>${item.telp_one}</td>
                    <td>${item.telp_two}</td>
                    <td>${item.email}</td>
                  </tr>`;
      });
      ipcRenderer.send(
        "load:pdf",
        thead,
        tbody,
        file_path,
        "buyer-data",
        "Data Customer"
      );
    });
  }
};

// ipcRenderer.on("created:pdf", (e) => {
//   unselectAll();
// });
