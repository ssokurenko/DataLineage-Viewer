import * as express from "express";

const router = express.Router();

/* GET home page. */
router.get("/:address", (req, res) => {
    res.json({
        address: req.param("address")
    });
});

export default router;