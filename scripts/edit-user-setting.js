const submitAdmin = () => {
  let firstName = $("#first-name").val();
  let lastName = $("#last-name").val();
  let position = $("#position").val();
  let username = $("#username").val();
  let password = $("#password").val();

  if (
    firstName == "" ||
    lastName == "" ||
    position == "" ||
    username == "" ||
    password == ""
  ) {
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
            `insert into user (first_name, last_name, position, username, password, access_level) values ('${firstName}', '${lastName}', '${position}', '${username}', '${password}', 'admin')`,
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

const submitEditUsername = (username, id) => {
  let newUsername = $("#new-username").val();

  if (newUsername == "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Username baru harus diisi",
    });
  } else if (newUsername == username) {
    ipcRenderer.send("success:update-user");
  } else {
    db.all(
      `select * from user where username = '${newUsername}'`,
      (err, rows) => {
        if (err) throw err;
        if (rows.length < 1) {
          db.run(
            `update user set username = '${newUsername}' where id = ${id}`,
            (err) => {
              if (err) throw err;
              ipcRenderer.send("success:update-user");
            }
          );
        } else {
          dialog.showErrorBox("Username exist", "Username sudah terdaftar");
        }
      }
    );
  }
};

const submitEditPassword = (id) => {
  let prevPassword = $("#prev-password").val();
  let newPassword = $("#new-password").val();

  if (prevPassword == "" || newPassword == "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Password lama dan baru harus diisi",
    });
  } else {
    db.all(
      `select * from user where id = ${id} and password = '${prevPassword}'`,
      (err, rows) => {
        if (err) throw err;
        if (rows.length < 1) {
          dialog.showErrorBox("Invalid password", "Password salah");
        } else {
          db.run(
            `update user set password = '${newPassword}' where id = ${id}`,
            (err) => {
              if (err) throw err;
              ipcRenderer.send("success:update-user");
            }
          );
        }
      }
    );
  }
};
