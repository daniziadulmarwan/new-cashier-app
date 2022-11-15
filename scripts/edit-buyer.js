const submitEditBuyerData = (idBuyer) => {
  let name = $("#edit-form").find("#buyer-name").val();
  let prevName = $("#edit-form").find("#buyer-prev-name").val();

  if (name === "") {
    dialog.showMessageBoxSync({
      title: "Alert",
      type: "info",
      message: "Nama Customer harus diisi",
    });
  } else {
    if (name === prevName) {
      executeEditBuyerData(idBuyer);
    } else {
      let Query = `select count(*) as count from buyers where name='${name}'`;

      db.all(Query, (err, rows) => {
        if (err) throw err;
        let rowNumber = rows[0].count;
        if (rowNumber < 1) {
          executeEditBuyerData(idBuyer);
        } else {
          let Msg = `${name} has been existed in the table`;
          dialog.showMessageBoxSync({
            title: "Alert",
            type: "info",
            message: Msg,
          });
        }
      });
    }
  }
};

const executeEditBuyerData = (idBuyer) => {
  let name = $("#edit-form").find("#buyer-name").val();
  let address = $("#edit-form").find("#buyer-address").val();
  let website = $("#edit-form").find("#buyer-website").val();
  let telpOne = $("#edit-form").find("#buyer-telp-one").val();
  let telpTwo = $("#edit-form").find("#buyer-telp-two").val();
  let email = $("#edit-form").find("#buyer-email").val();

  let Query = `update buyers set name = '${name}', address = '${address}', website = '${website}', telp_one = '${telpOne}', telp_two = '${telpTwo}',
  email = '${email}' where id = ${idBuyer}`;
  db.run(Query, (err) => {
    if (err) throw err;
    ipcRenderer.send("update:success", doc_id);
  });
};
