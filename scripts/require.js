const electron = require("electron");
const { ipcRenderer } = electron;
const db = require("../configs/database/index");
const { dialog } = require("@electron/remote");
const imask = require("imask");
