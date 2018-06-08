import express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
    res.render("index", { title: "Data Lineage Viewer" });
});

router.get("/about", (req, res) => {
    res.render("about", { title: "About Data Lineage" });
});

export default router;
