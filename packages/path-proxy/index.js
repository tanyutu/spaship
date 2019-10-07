const express = require('express');
const proxy = require('http-proxy-middleware');
const fsp = require('fs').promises;

let spaPaths = [];

/**
 * Converts a flattened path to a URL path
 * @param flatPath
 */
function flatToUri(flatPath) {
    let urlPath = flatPath;

    // Replace _ with /
    urlPath = urlPath.replace(/_/g, "/");

    // Replace UNDRSCR token with _
    urlPath = urlPath.replace(/UNDRSCR/g, "_");

    // Prepend /
    urlPath = "/" + urlPath;

    console.log('[flatToUrl] urlPath:', urlPath);

    return urlPath;
}

async function getDirectoryNames() {
    spaPaths = await fsp.readdir('/var/www/spaship');
    spaPaths.sort((a, b) => b.length - a.length);
    // return spaPaths;
}

getDirectoryNames();

const uriToFlat = function(req) {
    let path = req.url;
    let flatPath;
    let match;
    let spaUri;
    let matchedFlatPath;

    console.log('[router] incoming path:', path);

    // See if this URL is hosted by SPAship
    for (let spaPath of spaPaths) {
        spaUri = flatToUri(spaPath);
        let regEx = new RegExp('^' + spaUri + '(\\/+.*)?');
        console.log('regEx:', regEx);

        match = path.match(regEx);
        if (match) {
            matchedFlatPath = spaPath;
            break;  // found a match
        }
    }

    if (match) {
        console.log('This path is hosted by spaship: ', path, ' spaPath: ', spaUri, 'flatPath: ', matchedFlatPath);
    }
    else {
        console.log('This path is not hosted by spaship: ', path);
        return 'https://access.redhat.com:443';
    }

    // handle root path
    if (path === "/") {
        flatPath = "root"
    }
    else {
        let extraStuff = "";
        if (match[1]) {
            extraStuff = match[1];
        }
        flatPath = matchedFlatPath + extraStuff;
    }

    // Now proxy to flat path
    req.url = flatPath;
    let route = 'http://localhost:8008/';
    console.log("Routing to: ", route + req.url);
    return route;
};

// proxy middleware options
let options = {
    // target: 'http://localhost:8008', // target host
    target: 'https://access.redhat.com:443', // target host
    changeOrigin: true,
    router: uriToFlat,
    logLevel: 'debug'
};

// create the proxy (without context)
let pathProxy = proxy(options);

// Start proxy server on port
let app = express();
app.use('/', pathProxy);
app.listen(3000);