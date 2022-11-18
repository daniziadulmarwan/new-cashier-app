const electron = require("electron");
const { app, BrowserWindow, ipcMain, screen, webContents, dialog } = electron;
const db = require("./configs/database");
const remote = require("@electron/remote/main");
const fs = require("fs");
const path = require("path");
const url = require("url");
const md5 = require("md5");

remote.initialize();

let mainWindow;
let productWindow;
let cashierWindow;

let editDataModal;
let toPdf;
let printPage;

let salesModal;
let salesNum;
let printSalesPage;
let buyerModal;

let salesWindow;
let salesReportWindow;
let chartWindow;

let buyerWindow;
let generalSettingModal;
let userSettingModal;
let profileSettingModal;
let loginModal;

let login = false;
let idUser;
let firstName;
let position;
let accessLevel;

ipcMain.on(
  "success:login",
  (e, msgIdUser, msgFirstName, msgPosition, msgAccessLevel) => {
    login = true;
    idUser = msgIdUser;
    firstName = msgFirstName;
    position = msgPosition;
    accessLevel = msgAccessLevel;

    mainWindow.webContents.send(
      "unlock:app",
      msgIdUser,
      firstName,
      position,
      accessLevel
    );
    loginModal.hide();
  }
);

ipcMain.on("submit:logout", () => {
  loginModal.show();
});

const modalLogin = () => {
  loginModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar:true,
    width: 250,
    height: 210,
    parent: mainWindow,
    modal: true,
    frame: false,
    minimizable: false,
    maximizable: false,
    resizable: false,
  });

  remote.enable(loginModal.webContents);
  loginModal.loadFile("modals/login.html");
  loginModal.webContents.on("did-finish-load", () => {
    loginModal.focus();
  });
};

const modalGeneralSetting = () => {
  generalSettingModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar:true
    parent: mainWindow,
    modal: true,
    title: "Pengaturan Umum",
    width: 500,
    height: 540,
    resizable: false,
    minimizable: false,
  });

  generalSettingModal.loadFile("modals/general-setting.html");

  let taxPercentage;
  db.all(
    `select * from tax where tax_name = 'pajak' and id = 1`,
    (err, rows) => {
      if (err) throw err;

      if (rows.length < 1) {
        taxPercentage = "";
      } else {
        taxPercentage = rows[0].percentage;
      }
    }
  );

  remote.enable(generalSettingModal.webContents);
  generalSettingModal.webContents.on("dom-ready", () => {
    generalSettingModal.webContents.send("load:config", taxPercentage);
  });
};

const modalUserSetting = () => {
  userSettingModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar:true
    parent: mainWindow,
    modal: true,
    title: "Pengaturan Admin/User",
    width: 500,
    height: 540,
    resizable: false,
    minimizable: false,
  });

  userSettingModal.loadFile("modals/user-setting.html");
  remote.enable(userSettingModal.webContents);
  userSettingModal.webContents.on("dom-ready", () => {
    userSettingModal.webContents.send("load:data", idUser, accessLevel);
  });
};

const modalProfileSetting = () => {
  profileSettingModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar:true
    parent: mainWindow,
    modal: true,
    title: "Profil Toko",
    width: 500,
    height: 555,
    resizable: false,
    minimizable: false,
  });

  remote.enable(profileSettingModal.webContents);
  profileSettingModal.loadFile("modals/profile-setting.html");
};

ipcMain.on("sales-number", (e, msgSalesNumber) => {
  salesNum = msgSalesNumber;
});

const mainWin = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "My Cashier 1.0",
    height: 560,
    resizable: false,
    // autoHideMenuBar: true,
  });

  mainWindow.loadFile("index.html");
  // db.serialize(() => console.log("Connected database"));
  if (!login) {
    mainWindow.webContents.on("did-finish-load", () => {
      mainWindow.webContents.send("load:overlay");
    });
    modalLogin();
  }
};

app.on("ready", () => {
  mainWin();
});

ipcMain.on("close:app", () => {
  app.quit();
});

ipcMain.on("load:product-window", () => {
  productWin();
});

const productWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  productWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: width,
    height: height,
    title: "My Cashier | Data Produk",
  });

  remote.enable(productWindow.webContents);

  productWindow.loadFile("windows/product.html");
  productWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  productWindow.on("close", () => {
    mainWindow.show();
  });
};

const editData = (docId, modalForm, modalWidth, modalHeight, rowId) => {
  let parentWin;
  switch (docId) {
    case "product-data":
      parentWin = productWindow;
      break;
    case "buyer-data":
      parentWin = buyerWindow;
      break;
  }

  editDataModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: modalWidth,
    height: modalHeight,
    resizable: false,
    maximizable: false,
    modal: true,
    title: "Edit Data",
    parent: parentWin,
    autoHideMenuBar: true,
  });
  remote.enable(editDataModal.webContents);
  editDataModal.loadFile("modals/edit-data.html");
  editDataModal.webContents.on("did-finish-load", () => {
    editDataModal.webContents.send("res:form", docId, modalForm, rowId);
  });
  editDataModal.on("close", () => {
    editDataModal = null;
    switch (docId) {
      case "product-data":
        productWindow.webContents.send("close:modal");
        break;
      case "buyer-data":
        buyerWindow.webContents.send("close:modal");
        break;
    }
  });
};

ipcMain.on(
  "load:edit",
  (event, msgDocId, msgForm, msgWidht, msgHeight, msgRowId) => {
    editData(msgDocId, msgForm, msgWidht, msgHeight, msgRowId);
  }
);

ipcMain.on("update:success", (e, msgDocId) => {
  switch (msgDocId) {
    case "product-data":
      productWindow.webContents.send("update:success", "Berhasil ubah data");
      break;
    case "buyer-data":
      buyerWindow.webContents.send("update:success", "Berhasil ubah data");
      break;
  }
  editDataModal.close();
});

const writeCsv = (path, content, doc_id) => {
  fs.writeFile(path, content, (err) => {
    if (err) throw err;
    dialog.showMessageBoxSync({
      title: "Alert",
      type: "info",
      message: "Csv file created",
    });

    switch (doc_id) {
      case "product-data":
        productWindow.webContents.send("created:csv");
        break;
      case "buyer-data":
        buyerWindow.webContents.send("created:csv");
        break;
    }
  });
};

ipcMain.on("write:csv", (e, msgPath, msgContent, doc_id) => {
  writeCsv(msgPath, msgContent, doc_id);
});

const loadToPdf = (
  thead,
  tbody,
  file_path,
  totalSales = false,
  ids = false,
  title
) => {
  toPdf = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  let totalObject;
  if (totalSales) {
    totalObject = totalSales;
  } else {
    totalObject = "";
  }

  let d = new Date();
  let day = d.getDate().toString().padStart(2, 0);
  let month = d.getMonth().toString().padStart(2, 0);
  let year = d.getFullYear();

  let today = `${day}/${month}/${year}`;

  let titleObject = {
    title: title,
    date: today,
  };

  db.all("select * from profile order by id asc limit 1", (err, rows) => {
    if (err) throw err;
    if (rows.length < 1) {
      titleObject.storeName = "My Store";
      titleObject.storeAddress = "Address";
      titleObject.storeLogo = "shop.png";
    } else {
      titleObject.storeName = rows[0].store_name;
      titleObject.storeAddress = rows[0].store_address;
      if (rows[0].logo == null || rows[0].logo == "") {
        titleObject.storeLogo = "shop.png";
      } else {
        titleObject.storeLogo = rows[0].logo;
      }
    }
  });

  switch (ids) {
    case "sales-report":
      toPdf.loadFile("export/sales-report-pdf.html");
      break;
    default:
      toPdf.loadFile("export/toPdf.html");
  }

  toPdf.webContents.on("dom-ready", () => {
    toPdf.webContents.send(
      "load:table-to-pdf",
      thead,
      tbody,
      totalObject,
      titleObject,
      file_path
    );
  });
};

ipcMain.on(
  "load:pdf",
  (e, msgThead, msgTbody, msgFilePath, msgTotalSales, msgDocId, msgTitle) => {
    loadToPdf(
      msgThead,
      msgTbody,
      msgFilePath,
      msgTotalSales,
      msgDocId,
      msgTitle
    );
  }
);

ipcMain.on("create:pdf", (e, file_path) => {
  toPdf.webContents
    .printToPDF({
      marginsType: 0,
      printBackground: true,
      printSelectionOnly: false,
      landscape: true,
    })
    .then((data) => {
      fs.writeFile(file_path, data, (err) => {
        if (err) throw err;
        toPdf.close();
        dialog.showMessageBoxSync({
          title: "Alert",
          type: "info",
          message: "Berhasil export data ke Pdf",
        });
        // productWindow.webContents.send("created:pdf");
        // buyerWindow.webContents.send("created:pdf");
      });
    })
    .catch((err) => console.log(err.message));
});

const loadPrintPage = (thead, tbody, ids = false, title) => {
  printPage = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  let d = new Date();
  let day = d.getDate().toString().padStart(2, 0);
  let month = d.getMonth().toString().padStart(2, 0);
  let year = d.getFullYear();

  let today = `${day}/${month}/${year}`;

  let titleObject = {
    title: title,
    date: today,
  };

  db.all("select * from profile order by id asc limit 1", (err, rows) => {
    if (err) throw err;
    if (rows.length < 1) {
      titleObject.storeName = "My Store";
      titleObject.storeAddress = "Address";
      titleObject.storeLogo = "shop.png";
    } else {
      titleObject.storeName = rows[0].store_name;
      titleObject.storeAddress = rows[0].store_address;
      if (rows[0].logo == null || rows[0].logo == "") {
        titleObject.storeLogo = "shop.png";
      } else {
        titleObject.storeLogo = rows[0].logo;
      }
    }
  });

  switch (ids) {
    case "sales-report":
      printPage.loadFile("export/sales-record-pdf.html");
      break;
    default:
      printPage.loadFile("export/print.html");
  }

  printPage.webContents.on("dom-ready", () => {
    printPage.webContents.send("load:print", thead, tbody, titleObject);
  });
};

ipcMain.on("load:print-page", (e, msgThead, msgTbody, msgDocId, msgTitle) => {
  loadPrintPage(msgThead, msgTbody, msgDocId, msgTitle);
});

ipcMain.on("print:page", (e) => {
  printPage.webContents.print(
    {
      printBackground: true,
    },
    () => {
      printPage.close();
    }
  );
  printPage.on("close", () => {
    printPage = null;
  });
});

const cashierWin = () => {
  cashierWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar:true
    width: 1200,
    height: 720,
    title: "My Cashier | Kasir",
  });

  cashierWindow.loadFile("windows/cashier.html");
  remote.enable(cashierWindow.webContents);
  // cashierWindow.setFullScreen(true);
  cashierWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  cashierWindow.on("close", () => {
    mainWindow.show();
  });
};

ipcMain.on("load:cashier-window", () => {
  cashierWin();
});

ipcMain.on("close:cashier", () => {
  cashierWindow.close();
});

const modalSales = (salesNumber, title, totalSales, buyerInfo) => {
  let width,
    height,
    frameBoolVal,
    titleBar,
    content = "",
    buyerAddress = buyerInfo;

  let tr = "";
  switch (title) {
    case "discount-final":
      (width = 620), (height = 350), (frameBoolVal = true);
      (titleBar = "Potongan Final"),
        db.all(
          `select sum(total) as total from sales where invoice_number = '${salesNumber}'`,
          (err, rows) => {
            if (err) throw err;
            if (rows.length < 1) {
              console.log("No sales with number " + salesNumber);
            } else {
              let total_sales = rows[0].total;
              db.all(
                `select * from discount_final where invoice_number = '${salesNumber}'`,
                (err, rows) => {
                  if (err) throw err;
                  if (rows.length < 1) {
                    content += `<div class="mb-2">
                                  <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau keduannya)</small><br>
                                  <small>* Masukkan presentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small>
                                </div>
                                <div class="mb-2">
                                  <div class="mb-2">
                                    <label>Potongan %</label>
                                    <input type="hidden" id="total-sales" value="${total_sales}" />
                                    <input type="hidden" class="invoice-number" id="invoice-number" value="${salesNumber}" />
                                    <input type="hidden" id="total-discount-final" />
                                    <input type="text" id="discount-final-percent" class="form-control form-control-sm" onkeyup="newDiscountFinal()" />
                                  </div>
                                  <div class="mb-2">
                                    <label>Potongan Tunai (Rp)</label>
                                    <input type="text" id="discount-final-money" class="form-control form-control-sm" onkeyup="newDiscountFinal()" />
                                  </div>
                                </div>`;
                  } else {
                    content += `<div class="mb-2">
                                  <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau keduannya)</small><br>
                                  <small>* Masukkan presentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small>
                                </div>
                                <div class="mb-2">
                                  <div class="mb-2">
                                    <label>Potongan %</label>
                                    <input type="hidden" id="total-sales" value="${total_sales}" />
                                    <input type="hidden" class="invoice-number" id="invoice-number" value="${rows[0].invoice_number}" data-id="${rows[0].id}" />
                                    <input type="hidden" id="total-discount-final" value="${rows[0].total_discount_final}" />
                                    <input type="text" id="discount-final-percent" class="form-control form-control-sm" onkeyup="newDiscountFinal()" value="${rows[0].discount_percent}" />
                                  </div>
                                  <div class="mb-2">
                                    <label>Potongan Tunai (Rp)</label>
                                    <input type="text" id="discount-final-money" class="form-control form-control-sm" onkeyup="newDiscountFinal()" value="${rows[0].discount_money}" />
                                  </div>
                                </div>`;
                  }
                }
              );
            }
          }
        );
      break;
    case "discount":
      (width = 800), (height = 400), (frameBoolVal = true);
      titleBar = "Potongan Produk";
      db.all(
        `select * from sales where invoice_number = '${salesNumber}'`,
        (err, rows) => {
          if (err) throw err;
          if (rows.length < 1) {
            alert("No sales with number " + salesNumber);
          } else {
            let tr = "";
            rows.map((row) => {
              tr += `<tr>
                      <td>
                        <input type="text" class="form-control form-control-sm disable input-product-name" id="input-product-name-${row.id}" value="${row.product_name}" disabled />
                        <input type="hidden" class="input-product-code" id="input-product-code-${row.id}" value="${row.product_code}" data-id="${row.id}" />
                        <input type="hidden" class="input-input-date" id="input-input-date-${row.id}" value="${row.input_date}" data-id="${row.id}" />
                        <input type="hidden" class="input-invoice-number" id="input-invoice-number-${row.id}" value="${row.invoice_number}" data-id="${row.id}" />
                        <input type="hidden" class="input-buyer" id="input-buyer-${row.id}" value="${row.buyer}" data-id="${row.id}" />
                        <input type="hidden" class="input-buyer-id" id="input-buyer-id-${row.id}" value="${row.buyer_id}" data-id="${row.id}" />
                        <input type="hidden" class="input-payment" id="input-payment-${row.id}" value="${row.payment}" data-id="${row.id}" />
                        <input type="hidden" class="input-description" id="input-description-${row.id}" value="${row.description}" data-id="${row.id}" />
                        <input type="hidden" class="input-po-number" id="input-po-number-${row.id}" value="${row.po_number}" data-id="${row.id}" />
                        <input type="hidden" class="input-due-date" id="input-due-date-${row.id}" value="${row.due_date}" data-id="${row.id}" />
                        <input type="hidden" class="input-term" id="input-term-${row.id}" value="${row.term}" data-id="${row.id}" />
                        <input type="hidden" class="input-sales-admin" id="input-sales-admin-${row.id}" value="${row.sales_admin}" data-id="${row.id}" />
                        <input type="hidden" class="input-cost-of-product" id="input-cost-of-product-${row.id}" value="${row.cost_of_product}" data-id="${row.id}" />
                        <input type="hidden" class="input-total" id="input-total-${row.id}" value="${row.total}" data-id="${row.id}" />
                        <input type="hidden" class="input-prd-price" id="input-prd-price-${row.id}" value="${row.price}" data-id="${row.id}" />
                        <input type="hidden" class="input-qty" id="input-qty-${row.id}" value="${row.qty}" data-id="${row.id}" />
                        <input type="hidden" class="input-unit" id="input-unit-${row.id}" value="${row.unit}" data-id="${row.id}" />
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm disable" id="input-product-name-${row.id}" value="${row.product_code}" disabled />
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm input-discount-percent" onkeyup="newTotal(${row.id})" id="input-discount-percent-${row.id}" value="${row.discount_percent}" />
                      </td>
                      <td>
                        <input type="text" class="form-control form-control-sm input-discount-money" onkeyup="newTotal(${row.id})" id="input-discount-money-${row.id}" value="${row.discount_money}" />
                      </td>
                    </tr>`;
            });

            content = `<div class="mb-2">
                        <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau keduannya)</small><br>
                        <small>* Masukkan presentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small>
                      </div>
                      <div class="table-responsive">
                        <table class="table table-sm table-borderless" style="font-size:13px">
                          <thead class="thead-light">
                            <tr>
                              <th>Nama Produk</th>
                              <th>Kode Produk</th>
                              <th>Potongan %</th>
                              <th>Potongan Rp</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${tr}
                          </tbody>
                        </table>
                      </div>`;
          }
        }
      );
      break;
    case "qty":
      (width = 700), (height = 400), (frameBoolVal = true);
      (titleBar = "Edit Qty"),
        db.all(
          `select * from sales where invoice_number = '${salesNumber}'`,
          (err, rows) => {
            if (err) throw err;
            if (rows.length < 1) {
              console.log("No sales with number " + salesNumber);
            } else {
              let tr;
              rows.forEach((row) => {
                tr += `<tr>
                        <td>
                          <input type="text" class="form-control form-control-sm disable input-product-name" id="input-product-name-${row.id}" value="${row.product_name}" disabled />
                          <input type="hidden" class="input-product-code" id="input-product-code-${row.id}" value="${row.product_code}" data-id="${row.id}" />
                          <input type="hidden" class="input-input-date" id="input-input-date-${row.id}" value="${row.input_date}" data-id="${row.id}" />
                          <input type="hidden" class="input-invoice-number" id="input-invoice-number-${row.id}" value="${row.invoice_number}" data-id="${row.id}" />
                          <input type="hidden" class="input-buyer" id="input-buyer-${row.id}" value="${row.buyer}" data-id="${row.id}" />
                          <input type="hidden" class="input-buyer-id" id="input-buyer-id-${row.id}" value="${row.buyer_id}" data-id="${row.id}" />
                          <input type="hidden" class="input-payment" id="input-payment-${row.id}" value="${row.payment}" data-id="${row.id}" />
                          <input type="hidden" class="input-description" id="input-description-${row.id}" value="${row.description}" data-id="${row.id}" />
                          <input type="hidden" class="input-po-number" id="input-po-number-${row.id}" value="${row.po_number}" data-id="${row.id}" />
                          <input type="hidden" class="input-due-date" id="input-due-date-${row.id}" value="${row.due_date}" data-id="${row.id}" />
                          <input type="hidden" class="input-term" id="input-term-${row.id}" value="${row.term}" data-id="${row.id}" />
                          <input type="hidden" class="input-sales-admin" id="input-sales-admin-${row.id}" value="${row.sales_admin}" data-id="${row.id}" />
                          <input type="hidden" class="input-cost-of-product" id="input-cost-of-product-${row.id}" value="${row.cost_of_product}" data-id="${row.id}" />
                          <input type="hidden" class="input-total" id="input-total-${row.id}" value="${row.total}" data-id="${row.id}" />
                          <input type="hidden" class="input-prd-price" id="input-prd-price-${row.id}" value="${row.price}" data-id="${row.id}" />
                          <input type="hidden" class="input-unit" id="input-unit-${row.id}" value="${row.unit}" data-id="${row.id}" />
                          <input type="hidden" class="input-discount-percent" id="input-discount-percent-${row.id}" value="${row.discount_percent}" data-id="${row.id}" />
                          <input type="hidden" class="input-discount-money" id="input-discount-money-${row.id}" value="${row.discount_money}" data-id="${row.id}" />
                        </td>
                        <td>
                          <input type="text" class="form-control form-control-sm disable" value="${row.product_code}" disabled />
                        </td>
                        <td>
                          <input type="text" class="form-control form-control-sm input-qty" onkeyup="newTotal(${row.id})" id="input-qty-${row.id}" value="${row.qty}" data-id="${row.id}" />
                        </td>
                        <td>
                          <input type="text" class="form-control form-control-sm input-unit disable" id="input-unit-${row.id}" value="${row.unit}" disabled />
                        </td>
                      </tr>`;
              });
              content = `<div class="table-responsive">
                          <table class="table table-sm table-borderless" style="font-size:13px">
                            <thead class="thead-light">
                              <tr>
                                <th>Nama Produk</th>
                                <th>Kode Produk</th>
                                <th>Qty</th>
                                <th>Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${tr}
                            </tbody>
                          </table>
                        </div>`;
            }
          }
        );
      break;
    case "checkout":
      (width = 400), (height = 400), (frameBoolVal = true);
      (titleBar = "Checkout"),
        (content += `<div class="table-responsive">
                      <table class="table table-borderless mb-5">
                        <tbody>
                          <tr>
                            <td>Total Belanja</td>
                            <td>
                              <input type="text" id="total-sales" style="text-align:right; font-size:20px" class="form-control" disabled value="${totalSales}" />
                            </td>
                          </tr>
                          <tr>
                            <td>Total Diterima</td>
                            <td>
                              <input type="text" id="total-received" style="text-align:right; font-size:20px" class="form-control" autofocus onkeyup="cashReturn()" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <table class="table table-borderless">
                        <tbody>
                          <tr style="background-color:#e94d4d; color:white">
                            <td>
                            <span style="font-size:18px">Kembali</span>
                            </td>
                            <td>
                              <input type="hidden" id="total-returned" value="0" />
                              <span class="float-end" id="info-total-returned" style="font-size:20px;font-weight:bold">0</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>`);
      break;
  }

  salesModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: width,
    height: height,
    parent: cashierWindow,
    modal: true,
    autoHideMenuBar: true,
    frame: frameBoolVal,
    resizable: false,
    minimizable: false,
  });

  salesModal.loadFile("modals/sales-modal.html");
  remote.enable(salesModal.webContents);
  salesModal.webContents.on("dom-ready", () => {
    salesModal.webContents.send("load:tbody-tr", content, title, buyerAddress);
  });
};

ipcMain.on(
  "load:sales-modal",
  (e, msgSalesNumber, msgTitle, msgTotalSales, msgBuyerInfo) => {
    modalSales(msgSalesNumber, msgTitle, msgTotalSales, msgBuyerInfo);
  }
);

ipcMain.on("update-success:sales-edit", () => {
  salesModal.close();
  cashierWindow.webContents.send("update-success:sales-edit");
});

ipcMain.on(
  "print:sales",
  (
    e,
    msgTotalSales,
    msgTotalReceived,
    msgTotalRetuned,
    msgBuyerInfo,
    msgDocId
  ) => {
    printSales(
      salesNum,
      msgTotalSales,
      msgTotalReceived,
      msgTotalRetuned,
      msgBuyerInfo,
      msgDocId
    );
  }
);

const numberFormat = (number) => {
  let numberFrmt = Intl.NumberFormat("de-DE").format(number);
  return numberFrmt;
};

const printSales = (
  salesNumber,
  totalSales,
  totalReceived,
  totalReturned,
  buyerAddress,
  docId
) => {
  printSalesPage = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    autoHideMenuBar: true,
  });

  let salesDate;
  let date = new Date();
  let day = date.getDate().toString().padStart(2, 0);
  let month = date.getMonth().toString().padStart(2, 0);
  let year = date.getFullYear();
  salesDate = `${day}/${month}/${year}`;

  let storeInfo = {};
  db.all(`select * from profile order by id asc limit 1`, (err, rows) => {
    if (err) throw err;
    if (rows.length < 1) {
      storeInfo.name = "My Store";
      storeInfo.address = "Address";
      storeInfo.taxNumber = "";
      storeInfo.telp = "";
      storeInfo.logo = "shop.png";
    } else {
      storeInfo.name = rows[0].store_name;
      storeInfo.address = rows[0].store_address;
      if (rows[0].store_tax_id == "" || rows[0].store_tax_id == null) {
        storeInfo.taxNumber = "";
      } else {
        storeInfo.taxNumber = `NPWP. ${rows[0].store_tax_id}`;
      }

      if (rows[0].phone_number == "" || rows[0].phone_number == null) {
        storeInfo.telp = "";
      } else {
        storeInfo.telp = `| Telp. ${rows[0].phone_number}`;
      }

      if (rows[0].logo == "") {
        storeInfo.logo = "shop.png";
      } else {
        storeInfo.logo = rows[0].logo;
      }
    }
  });

  let salesHeader = {
    date: salesDate,
    number: salesNumber,
    buyerAddress: buyerAddress,
  };

  let salesRecord = "";
  db.all(
    `select * from sales where invoice_number = '${salesNumber}'`,
    (err, rows) => {
      if (err) throw err;
      if (rows.length < 1) {
        alert("no sales to print");
      } else {
        let subtotal = 0;
        salesHeader.admin = rows[0].sales_admin;
        rows.map((row) => {
          let discountPercent = row.discount_percent;
          let discountMoney = row.discount_money;
          let discountInfo;

          if (discountPercent == "" && discountMoney == "") {
            discountInfo = "";
          } else if (discountPercent != "" && discountMoney == "") {
            discountInfo = `${discountPercent}%`;
          } else if (discountPercent != "" && discountMoney != "") {
            discountInfo = `${discountPercent}%+${numberFormat(discountMoney)}`;
          } else if (discountPercent == "" && discountMoney != "") {
            discountInfo = `${numberFormat(discountMoney)}`;
          }

          subtotal += parseFloat(row.total);
          salesRecord += `<tr>
                            <td>${row.product_name} (${row.qty}x${numberFormat(
            row.price
          )})
                            </td>
                            <td>${discountInfo}</td>
                            <td><span class="float-end">${row.total}</span></td>
                          </tr>`;

          salesFooter.subTotal = numberFormat(subtotal);
        });
      }
    }
  );

  let salesFooter = {
    grandTotal: numberFormat(totalSales),
    totalCashReceived: numberFormat(totalReceived),
    totalCashReturned: numberFormat(totalReturned),
  };

  db.all(
    `select * from discount_final where invoice_number = '${salesNumber}'`,
    (err, rows) => {
      if (err) throw err;
      if (rows.length < 1) {
        salesFooter.discountFinal = "";
      } else {
        let discountPercent = rows[0].discount_percent;
        let discountMoney = rows[0].discount_money;
        let discountFinalInfo;

        if (discountPercent == "" && discountMoney == "") {
          discountFinalInfo = "";
        } else if (discountPercent != "" && discountMoney == "") {
          discountFinalInfo = `${discountPercent}%`;
        } else if (discountPercent != "" && discountMoney != "") {
          discountFinalInfo = `${discountPercent}%+${numberFormat(
            discountMoney
          )}`;
        } else if (discountPercent == "" && discountMoney != "") {
          discountFinalInfo = `${numberFormat(discountMoney)}`;
        }

        salesFooter.discountFinal = discountFinalInfo;
      }

      db.all(
        `select * from sales_tax where invoice_number = '${salesNumber}'`,
        (err, rows) => {
          if (err) throw err;
          if (rows.length < 1) {
            salesFooter.tax = "";
          } else {
            salesFooter.tax = numberFormat(rows[0].total_tax);
          }
        }
      );
    }
  );

  remote.enable(printSalesPage.webContents);
  printSalesPage.loadFile("windows/receipt.html");

  printSalesPage.webContents.on("dom-ready", () => {
    printSalesPage.webContents.send(
      "load:print",
      salesRecord,
      storeInfo,
      salesHeader,
      salesFooter
    );
  });
};

ipcMain.on("print:sales-evidence", (e, docId) => {
  switch (docId) {
    case "cashier":
      cashierWindow.webContents.send("load:blank-sales");
      salesModal.close();
      break;
  }

  printSalesPage.webContents.print({
    printBackground: true,
  }),
    () => {
      db.run(
        `insert into sales_evidence_info(invoice_number, print_status) values('${salesNumber}', 'printed')`,
        (err) => {
          if (err) throw err;
        }
      );
      printSalesPage.close();
      salesNum = "";
    };

  printSalesPage.on("close", () => {
    printSalesPage = null;
    salesNum = "";
  });
});

const modalBuyer = () => {
  buyerModal = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    autoHideMenuBar: true,
    width: 300,
    height: 400,
    parent: cashierWindow,
    modal: true,
    resizable: false,
    title: "Add Buyer | Customer",
  });

  remote.enable(buyerModal.webContents);
  buyerModal.loadFile("modals/buyer-form.html");
  buyerModal.on("close", () => {
    cashierWindow.webContents.send("load:buyer-select");
  });
};

ipcMain.on("load:buyer-form", () => {
  modalBuyer();
});

const salesWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  salesWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    autoHideMenuBar: true,
    title: "My Cashier | Data Penjualan",
    width: width,
    height: height,
  });

  remote.enable(salesWindow.webContents);
  salesWindow.loadFile("windows/sales-data.html");
  salesWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  salesWindow.on("close", () => {
    mainWindow.show();
  });
};

ipcMain.on("load:sales-data-window", () => {
  salesWin();
});

const salesReportWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  salesReportWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar: true,
    title: "My Cashier | Laporan Penjualan",
    width: width,
    height: height,
  });

  remote.enable(salesReportWindow.webContents);
  salesReportWindow.loadFile("windows/sales-report.html");
  salesReportWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  salesReportWindow.on("close", () => {
    mainWindow.show();
  });
};

ipcMain.on("load:sales-report-window", () => {
  salesReportWin();
});

const chartWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  chartWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar: true,
    title: "My Cashier | Diagram Penjualan",
    width: width,
    height: height,
  });

  remote.enable(chartWindow.webContents);
  chartWindow.loadFile("windows/chart.html");
  chartWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  chartWindow.on("close", () => {
    mainWindow.show();
  });
};

ipcMain.on("load:chart-window", () => {
  chartWin();
});

const buyerWin = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  buyerWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },

    // autoHideMenuBar: true,
    title: "My Cashier | Data Customer",
    width: width,
    height: height,
  });

  remote.enable(buyerWindow.webContents);
  buyerWindow.loadFile("windows/buyer.html");
  buyerWindow.webContents.on("did-finish-load", () => {
    mainWindow.hide();
  });
  buyerWindow.on("close", () => {
    mainWindow.show();
  });
};

ipcMain.on("load:buyer-window", () => {
  buyerWin();
});

ipcMain.on("load:setting", (e, msgParam) => {
  switch (msgParam) {
    case "general":
      modalGeneralSetting();
      break;
    case "user":
      modalUserSetting();
      break;
    default:
      modalProfileSetting();
      break;
  }
});

ipcMain.on("success:update-user", () => {
  editDataModal.close();
  userSettingModal.webContents.send("success:update-user");
});
