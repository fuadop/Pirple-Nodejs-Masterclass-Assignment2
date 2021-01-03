/**
 * * Library for all mail related operations
*/

// Dependencies
const https = require("https");
const querystring = require("querystring");
const { StringDecoder } = require("string_decoder");
const config = require("../config");
const colors = require("../colors");

// Create the decoder to decode buffers
const decoder = new StringDecoder("utf8");

// Create the payment helper object
const mailHelper = {};

// Constants for the mail helper function
mailHelper.baseUrl = "api.mailgun.net";
mailHelper.domain = "sandboxdf982759e06045f59495d894a0b7d9f6.mailgun.org";

// Send mail function
mailHelper.sendMail = (userEmail, HtmlMessage, callback) => {

    // Data to be sent to the mailgun api
    const mailData = {
        from: "Fuad <mailgun@"+mailHelper.domain+">",
        to: userEmail,
        subject: "Payment receipt of purchase",
        html: HtmlMessage
    };

    // stringify the payload data
    const payload = querystring.stringify(mailData);

    // Create the https requst optioins
    const options = {
        method: "post",
        hostname: mailHelper.baseUrl,
        port: 443,
        path: "/v3/"+mailHelper.domain+"/messages",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(payload),
            "Authorization": "Basic "+ Buffer.from("api:"+config.MAILGUN_API_KEY).toString("base64")
        }
    };

    let responsePayload = "";
    // Send the https post requerst
    const req = https.request(options, res => {

        res.on("data",data => {
            responsePayload += decoder.write(data);
        });

        res.on("end", () => {
            responsePayload += decoder.end();
            console.log(colors.green,"Mail Sent: "+responsePayload);
            callback(false);
        });
    });

    // Listen to error events
    req.on("error", err => {
        callback("Error: Could not send mail due to: "+err);
    });

    // Writing the payload to the request
    req.write(payload);
    req.end();
};

// Export the mail helper object
module.exports = mailHelper;

