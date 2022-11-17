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
          // let salt = bcrypt.genSaltSync();
          // let hashedPassword = bcrypt.hashSync(password, salt);
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

const submitEditProfile = (id) => {
  let firstName = $("#first-name").val();
  let lastName = $("#last-name").val();
  let position = $("#position").val();
  let phoneNumber = $("#phone-number").val();
  let employeeNumber = $("#employee-number").val();
  let status = $("#status").val();

  if (firstName == "" || lastName == "" || position == "") {
    dialog.showMessageBoxSync({
      type: "info",
      title: "Alert",
      message: "Semua field harus diisi",
    });
  } else {
    db.run(
      `update user set first_name = '${firstName}', last_name = '${lastName}', position = '${position}', phone_number = '${phoneNumber}', employee_number = '${employeeNumber}', status = '${status}' where id = ${id}`,
      (err) => {
        if (err) throw err;
        ipcRenderer.send("success:update-user");
      }
    );
  }
};
