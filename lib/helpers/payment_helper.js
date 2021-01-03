/**
 * * Library for all payment related operations
*/

// Dependencies
const https = require("https");
const querystring = require("querystring");
const { StringDecoder } = require("string_decoder");
const config = require("../config");
const colors = require("../colors");
const mailHelper = require("./mail_helper");

// Create the decoder to decode buffers
const decoder = new StringDecoder("utf8");

// Create the payment helper object
const paymentHelper = {};


// Configuration for the payment helper object
paymentHelper.baseUrl = "api.stripe.com";
paymentHelper.secretKey = config.STRIPE_SECRET_KEY;

// Make payment helper
/**
 * 
 * @param {number} totalAmount - The total amount of products in cart 
 * @param {Object} userInformation - The user details 
 * @param {void} callback - Callback returns err
 */
paymentHelper.pay = (totalAmount, userInformation, callback) => {
    // Initialize the charge data
    const chargeData = {
        amount: totalAmount,
        currency: "usd",
        source: "tok_mastercard_debit",
    };

    // Stringify the charge data
    const payload = querystring.stringify(chargeData);

    // Https request configuration
    const options = {
        method: "post",
        hostname: paymentHelper.baseUrl,
        port: 443,
        path: "/v1/charges",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(payload),
            "Authorization": "Bearer "+paymentHelper.secretKey
        }
    };
    
    // Create variable to store response data (leaving it on the payment scope)
    let responseData = "";

    // Send the http post request
    const req = https.request(options, (res) => {

        res.on("data", data => {
            responseData += decoder.write(data);
        });

        res.on("end",() => {
            responseData += decoder.end();

            // Parse the response data
            const parsedResponseData = JSON.parse(responseData);
            
            // Grab the payment recipt from the post response
            const recieptUrl = parsedResponseData.receipt_url.split("://")[1];
            console.log(recieptUrl);
            
            // Get receipt in html format
            paymentHelper._printReceipt(recieptUrl,(err, receiptHtml) => {
                if(!err && receiptHtml){
                    // Send the receipt html to the user's email address
                    mailHelper.sendMail(userInformation.emailAddress, receiptHtml ,err => {
                        if(!err){
                            callback(false);
                        } else {
                            callback("Error sending receipt to the client's email address: "+err);
                        }
                    });
                } else {
                    callback("Error printing transaction receipt: "+err);
                }
            });
        });
    });

    // Listen to error event
    req.on("error", err => {
        console.log(colors.red,"An Error Occured while making payment: "+err);  
        callback("Error occured: "+err);  
    });

    // Write the payload to the requst stream
    req.write(payload);
    req.end();
};


// The reciept printer funciton
//  Callback returns error and html data
paymentHelper._printReceipt = (url, callback) => {
    let htmlString = "";

    const req = https.request({
        method: "get",
        hostname: "pay.stripe.com",
        path: url.substr(13),
        port: 443,
    },(res) => {
        res.on("data", data => {
            htmlString += decoder.write(data);
        });

        res.on("end", () => {
            htmlString += decoder.end();
            callback(false, htmlString);
        })
    });
    
    req.on("error", err => {
        console.log("Error occured due to: "+err);
        callback("Error occured due to: "+err, false);
    });
    
    req.end();
}
// export the object
module.exports = paymentHelper;
