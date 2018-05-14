import debug = require("debug");
import express = require("express");
import path = require("path");
import logger = require("morgan");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import globalTunnel = require("global-tunnel");
import index from "./routes/index";
import address from "./routes/address";
import config from "./server-config";

if (config.proxy) {
    globalTunnel.initialize({
        host: config.proxy.host,
        port: config.proxy.port
    });
}

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", index);
app.use("/api/address", address);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error("Not Found");
    (err as any).status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use(<any>((err, req, res, next) => {
        res.status(err.status || 500);
        res.render("error",
            {
                message: err.message,
                error: err
            });
    }));
}

// production error handler
// no stacktraces leaked to user
app.use(<any>((err, req, res, next) => {
    res.status(err.status || 500);
    res.render("error",
        {
            message: err.message,
            error: {}
        });
}));

app.set("port", process.env.PORT || 3000);

const server = app.listen(app.get("port"), () => {
    debug("Express server listening on port " + server.address().port);
});
