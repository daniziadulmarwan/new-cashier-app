const submitAdmin = () => {
  let firstName = $("#first-name").val();
  let lastName = $("#last-name").val();
  let username = $("#usernme").val();
  let password = $("#password").val();

  if (firstName == "" || lastName == "" || username == "" || password == "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Semua field harus diisi",
    });
  } else {
    db.all(
      `select * from user where username = '${username}'`,
      (err, result) => {
        if (err) throw err;

        if (result.length < 1) {
          db.run(
            `insert into user (first_name, last_name, username, password, access_level) values ('${firstName}', '${lastName}', '${username}', '${password}', 'admin')`,
            (err) => {
              if (err) throw err;
              ipcRenderer.send("success:update-user");
            }
          );
        } else {
          dialog.showErrorBox(
            "User already existed",
            "Username sudah terdaftar"
          );
        }
      }
    );
  }
};
