import * as express from "express";
import config from "../server-config";
import SpeedTester from "../../cmds/SpeedTester";

export const router = express.Router();
export const routerApi = express.Router();

router
    .get("/", async (req, res) => {
        res.render("performance", { title: "IOTA Performance Test" });
    });

routerApi
    .post("/test/:testAddress?",async (req, res) => {
        try {
            const body = req.body;
            if (!body || !body.urls) {
                res.end(400);
                return;
            }
            await SpeedTester.test(body.urls,
                oneTest => {
                    res.json(oneTest);
                },
                req.params["testAddress"]);
        } catch (e) {
            res.end(500);
        }
    });

