const submitEditPrdData = (rowId) => {
  let prdName = $("#edit-form").find("#editPrdName").val();
  let prevPrdName = $("#edit-form").find("#prevPrdName").val();
  let prdBarcode = $("#edit-form").find("#editPrdBarcode").val();
  let prevPrdBarcode = $("#edit-form").find("#prevPrdBarcode").val();
  let prdPrice = $("#edit-form").find("#editPrdPrice").val();

  if (prdName === "" || prdPrice === "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Nama dan Harga produk harus diisi!",
    });
  } else {
    if (prdName === prevPrdName) {
      if (prdBarcode === "" || prdBarcode === prevPrdBarcode) {
        executeEditPrdData(rowId);
      } else {
        let sql = `select count(*) as count from products where barcode = '${prdBarcode}'`;
        db.all(sql, (err, rows) => {
          if (err) console.log(err.message);
          let rowNumber = rows[0].count;
          if (rowNumber < 1) {
            executeEditPrdData(rowId);
          } else {
            dialog.showMessageBoxSync({
              type: "info",
              title: "Alert",
              message: `Barcode ${prdBarcode} already existed in table`,
            });
          }
        });
      }
    } else {
      let sqlPrdName = `select count(*) as count from products where product_name='${prdName}'`;
      db.all(sqlPrdName, (err, result) => {
        if (err) {
          console.log(err.message);
        } else {
          let rowNumb = result[0].count;
          if (rowNumb < 1) {
            if (prdBarcode === "" || prdBarcode === prevPrdBarcode) {
              executeEditPrdData(rowId);
            } else {
              let sqlBrd = `select count(*) as count from products where barcode = ${prdBarcode}`;
              db.all(sqlBrd, (err, rows) => {
                if (err) {
                  console.log(err.message);
                } else {
                  let rowNumbr = rows[0].count;
                  if (rowNumbr < 1) {
                    executeEditPrdData(rowId);
                  } else {
                    dialog.showMessageBoxSync({
                      type: "info",
                      title: "Alert",
                      message: `Barcode ${prdBarcode} already existed in table`,
                    });
                  }
                }
              });
            }
          } else {
            dialog.showMessageBoxSync({
              type: "info",
              title: "Alert",
              message: `${prdName} already existed in table`,
            });
          }
        }
      });
    }
  }
};

const executeEditPrdData = (rowId) => {
  let prdName = $("#edit-form").find("#editPrdName").val();
  let prdBarcode = $("#edit-form").find("#editPrdBarcode").val();
  let prdCategory = $("#edit-form").find("#editPrdCategory").val();
  let prdUnit = $("#edit-form").find("#editPrdUnit").val();
  let prdPrice = $("#edit-form").find("#editPrdPrice").val();
  let prdCost = $("#edit-form").find("#editPrdCost").val();
  let prdInitQty = $("#edit-form").find("#editPrdQty").val();

  if (prdPrice === "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Harga jual harus diisi",
    });
  } else if (prdCost === "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Harga pokok harus diisi",
    });
  } else if (prdPrice < prdCost) {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Harga jual harus lebih besar dari harga pokok",
    });
  } else {
    let query = `update products set product_name='${prdName}', barcode='${prdBarcode}', category='${prdCategory}', unit='${prdUnit}', selling_price=${prdPrice}, cost_of_product=${prdCost}, product_initial_qty='${prdInitQty}' where id=${rowId}`;

    db.serialize(() => {
      db.all(query, (err) => {
        if (err) console.log(err.message);
        ipcRenderer.send("update:success", doc_id);
      });
    });
  }
};
