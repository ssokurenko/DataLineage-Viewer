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
routerApi.post("/:seed/:value", (req, res) => {
    const seed = req.params["seed"];
    const value = req.param["valie"];
    res.render("about", { title: "About Data Lineage" });
});

export {routerUI, routerApi};
