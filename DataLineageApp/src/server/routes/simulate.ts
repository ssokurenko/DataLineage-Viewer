import express = require("express");
const routerUI = express.Router();
const routerApi = express.Router();

/* GET simulate UI. */
routerUI.get("/publisher", (req, res) => {
    res.render("simulate-publisher", { title: "Simulate" });
});

/**
 * api for add package
 */
routerApi.post("/", (req, res) => {
    res.render("about", { title: "About Data Lineage" });
});

export {routerUI, routerApi};
