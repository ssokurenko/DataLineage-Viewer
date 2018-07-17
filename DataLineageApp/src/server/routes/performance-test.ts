import * as express from "express";
import config from "../server-config";
import SpeedTester from "../../cmds/SpeedTester";
import io from "../socket.io-server";

const router = express.Router();
const routerApi = express.Router();

router
    .get("/", async (req, res) => {
        res.render("performance", { title: "IOTA Performance Test" });
    });

routerApi
    .post("/test/:testAddress?",
        async (req, res) => {
            try {
                const body = req.body;
                if (!body || !body.urls) {
                    res.end(400);
                    return;
                }
                const clientId = body.socketClientId;
                io.server.sendMessage(clientId, "PerformanceTest", { message: "Starting performance testing on server" });
                const result = await SpeedTester.test(body.urls,
                    oneTest => {
                        io.server.sendMessage(clientId, "PerformanceTest", { message: "One iota provider test is finished.", testResult: oneTest });
                    },
                    req.params["testAddress"]);
                res.json(result);
            } catch (e) {
                console.error(`Server errro for performance test, exception is ${e}`);
                res.end(500);
            }
    })
    .post("/config/iotaProviders", (req, res) => {
        const body = req.body;
        if (!body || body.password !== "dnvgliota" || !Array.isArray(body.iota)) {
            res.end(404);
            return;
        }
        config.iotaProviders = body.iota;
        res.json(config.iotaProviders);
    });

const init = { router, routerApi };
export default init;