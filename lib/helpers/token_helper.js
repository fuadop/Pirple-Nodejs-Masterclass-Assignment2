/**
 * * Library for token and verification operations
*/

// Dependencies
const colors = require("../colors");
const crypto = require("crypto");
const fileHelper = require("./file_helper");
const { findUser } = require("./circular_fix");

// Globals for password management
const secret = "passwordHasher";

// Create the file object
const tokenHelper = {};

// Create user id function
tokenHelper.createUniqueId = () => {
    return crypto.randomBytes(16).toString("hex");
}

// Create token for user operations function
tokenHelper.createToken = (userEmailAddress) => {
    const token = crypto.randomBytes(16).toString("hex");

    // Token expiry date: token expires in one hour
    const expires = Date.now() * 1000 * 60 * 60;
    
    const tokenObject = {
        token,
        "user": userEmailAddress
    }
    // create a file containing user of each token
    fileHelper.createFile(token,"tokens", tokenObject,(err) => {
        if(!err){
            console.log(colors.green, "Token file for user:"+userEmailAddress+" created");
        } else {
            console.log(colors.red, "Token file for user:"+userEmailAddress+" was not created due to: 0"+err);
        }
    });

    return {
        "value": token,
        expires
    };
}

// Destroying token function: returns a callback
tokenHelper.destroyToken = (userEmail,callback) => {
    findUser(userEmail,(err,userId) => {
        if(!err && userId){
            fileHelper.readFile(userId,"users",(err,userData) => {
                if(!err && userData) {
                    const parsedUserData = JSON.parse(userData);

                    // Storing the token value
                    const tokenObject = Object.assign(parsedUserData.token);
                    const token = tokenObject.value;

                    // REmoving the token from the user data
                    delete parsedUserData.token;
        
                    // Update the user data with the new user object
                    fileHelper.createFile(parsedUserData.id,"users",parsedUserData,(err) => {
                        if(!err) {
                            fileHelper.deleteFile(token,"tokens",(error) => {
                                if(!error){
                                    callback(false);
                                } else {
                                    callback("Error deleting the token file"+error);
                                }
                            })
                        } else {
                            callback("Error updating the user due to: "+err);
                        }   
                    })
        
                } else {
                    callback("Error: Couldn't destroy token due to: "+err);
                }
            });
        } else {
            callback("Error: Couldn't find user with the provided email");
        }
    });
}

// Password hashing function : returns sha256 hash
tokenHelper.hashPassword = (password) => {
    if(password !== "string" && password.trim() === "") {
        console.log(colors.red,"Error: Could not hash password, password is invalid")
        return;
    }
    const hash = crypto.createHmac("sha256",secret)
                       .update(password)
                       .digest("hex");

    return hash;
}

// Password comparison function : returns boolean
// Returns true if the password is correct and vice versa
tokenHelper.comparePassword = (password,hashedPassword) => {
    if(password !== "string" && password.trim() === "") {
        console.log(colors.red,"Error: Could not compare passwords, password is invalid")
        return false;
    }
    const hash = crypto.createHmac("sha256",secret)
                       .update(password)
                       .digest("hex");

    if(hash === hashedPassword) {
        return true;
    } else {
        return false;
    }
}

module.exports = tokenHelper;