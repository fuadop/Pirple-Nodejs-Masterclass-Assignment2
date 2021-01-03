/**
 * * File for server setup
 * 
 */

 // Dependencies
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const colors = require("./colors");
const config = require("./config");
const handlers = require("./handlers");

// Create the server object
const server = {};

server.init = () => {

    const httpServer = http.createServer((req,res) => {
        server.reqHandler(req,res);
    });

    httpServer.listen(config.port, () => {
        console.log(colors.green,"Server started on https://localhost:"+config.port);
    })
}

server.reqHandler = (req,res) => {
    const pathMetaData = url.parse(req.url,true);
    const path = pathMetaData.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,"");
    let chosenHandler = typeof(routes[trimmedPath]) !== "undefined" ? routes[trimmedPath] : routes.error;


    // Error event
    req.on("error",(error) => {
        console.log("A very stupid error occured",error);
    });

    // Create the buffer decoder
    const decoder = new StringDecoder("utf8");
    let requestBody = "";
    req.on("data",(data) => {
        requestBody += decoder.write(data);
    });
    
   
    req.on("end",() => {
        requestBody += decoder.end();

        // Convert request body to object
        let requestBodyParsed = ""
        // Catching errors in request body syntax
        try{
            requestBodyParsed = JSON.parse(requestBody);
        } catch(error) {
            console.log(colors.red,"There was a syntax error in the request body!");
        }

        // Create the payload object
        const requestData = {
            "path": trimmedPath,
            "searchQuery": pathMetaData.query,
            "protocol": req.method.toLowerCase(),
            "headers": req.headers,
            "requestBody": requestBodyParsed
        }

        /**
         * @param statusCode Sets the default status code to 200
         * @param payload Sets the default value for payload to an empty object
        */
        chosenHandler(requestData, (statusCode=200, payload={}) => {
            // stringify payload
            let stringPayload = JSON.stringify(payload);
            
            // Set headers and application type
            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            res.end(stringPayload);
        });
    });
}

const routes = {
    "users": handlers.users,
    "login": handlers.login,
    "logout": handlers.logout,
    "products": handlers.products,
    "cart": handlers.cart,
    "checkout": handlers.checkout,
    "error": handlers.error
}

module.exports = server;
