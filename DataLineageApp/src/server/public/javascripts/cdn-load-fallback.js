//workaround for https://github.com/dolox/fallback/issues/85
function checkCss(urls) {
    var sheets = window.document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i];
        if (urls.indexOf(s.href) >= 0) {
            return true;
        }
    }
    return false;
}

cfg({
    "base": {
        "css": "/stylesheets/",
        "js": "/javascripts/"
    },
    // The list of libraries that we want use for our project.
    "libs": {
        // Include `Twitter Bootstrap CSS`.
        "css$bootstrap": {
            "exports": ".col-xs-12",
            "check": function () {
                return checkCss("https://ajax.aspnetcdn.com/ajax/bootstrap/4.1.1/css/bootstrap.min.css");
            },
            "urls": [
                "https://ajax.aspnetcdn.com/ajax/bootstrap/4.1.1/css/bootstrap.min.css",
                "bootstrap/bootstrap.min.css"
            ]
        },

        // Include "FontAwsome CSS"
        "css$fontawesome": {
            "exports": ".fa-search",
            "check": function () {
                return checkCss("https://use.fontawesome.com/releases/v5.0.13/css/all.css");
            },
            "urls": [
                "https://use.fontawesome.com/releases/v5.0.13/css/all.css",
                "fontawesome/fontawesome-all.min.css"
            ]
        },

        // Include `jQuery`.
        "jquery": {
            "exports": "jQuery",
            "urls": [
                "https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js",
                "jquery/jquery-3.3.1.min.js"
            ]
        },

        // Include `Popper`.
        "popper": {
            "exports": "Popper",
            "urls": [
                "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
                "popper.min.js"
            ]
        },

        // Include `Twitter Bootstrap`.
        "bootstrap": {
            "deps": ["jquery", "popper"],
            "exports": "$.fn.modal",
            "urls": [
                "https://ajax.aspnetcdn.com/ajax/bootstrap/4.1.1/bootstrap.min.js",
                "bootstrap/bootstrap.min.js"
            ]
        },

        // Include `D3js`.
        "d3js": {
            "exports": "d3",
            "urls": [
                "https://d3js.org/d3.v5.min.js",
                "d3.min.js"
            ]
        },

        // Include `D3js`.
        "clientApp": {
            "deps": ["bootstrap", "d3js"],
            "urls": [
                "client-app.js"
            ]
        },
    }
});

// Load libraries
fallback.require(function (css$bootstrap, css$fontawesome, jquery, popper, bootstrap, d3js, clientApp) {
    //all loaded, then load our javascript

});