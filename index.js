/**
 * * Main app file
 * * Author: [Fuad Olatunji](fuadolatunji.me)
 */

// Dependencies
const server = require("./lib/server");

// App object
const app = {};

// Main function
app.init = () => {
    server.init();
}

// Starting the app
app.init();

