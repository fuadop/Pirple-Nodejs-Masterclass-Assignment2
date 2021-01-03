/**
 * * Library for user operations
 * 
*/

// Dependencies
const fs = require("fs");
const colors = require("../colors");
const fileHelper = require("./file_helper");
const tokenHelper = require("./token_helper");

// Instantiate the object
const usersHelper = {};

// Create user function
/**
 * 
 * @param {The new user Details in object form} userDetails 
 * @param {The callback function returns error and the user object} callback 
 */
usersHelper.createUser = (userDetails,callback) => {
    // Check if user already exists with the entered email address 
    // Getting the id from the email address if not found an empty string is returned
    usersHelper.findUser(userDetails.emailAddress,(err,id) => {
        if(!err && userId) {
            callback("Error: user already exists",false);

            // Ending the create user function
            return;
        }
    });

    // Generating the user specific id
    let userId = tokenHelper.createUniqueId();

    // Hashing the user password
    let passwordHash = tokenHelper.hashPassword(userDetails.password);
    
    // Adding the user id to the user object
    userDetails.id = userId;
    // Converting password to hashed version before being stored
    userDetails.password = passwordHash;

    fileHelper.createFile(userId,"users",userDetails,(err) => {
        if(!err) {
            usersHelper._createUserHashTable(userDetails.emailAddress, userDetails.id);
            callback(false,userDetails);
        } else {
            callback("Error creating the user file",false);
        }
    })
}

// Create log file for user emails and their unique id
usersHelper._createUserHashTable = (userEmail, userId) => {
    const newUser = {
        email: userEmail,
        id: userId
    };

    const fileDescriptor = fileHelper.baseDir+"hashTable.json";

    fs.readFile(fileDescriptor,{encoding: "utf8"},(err,fileData) => {
        console.log("Previous file data: \n",fileData)
        if(!err) {
            let prevData = {};
            if(fileData){
                prevData = JSON.parse(fileData);
            }
            let userArray = [];
            userArray.push(newUser);
            let hashTableArray = userArray.concat(prevData);
            
            // Stringifying the hash table array
            let newDataStringified = JSON.stringify(hashTableArray);

            fs.writeFile(fileDescriptor,"",(err) => {
                if(!err) {
                    fs.writeFile(fileDescriptor,newDataStringified,(err) => {
                        if(!err) {
                            console.log(colors.green, "hash table file was updated successfully");
                            console.table(hashTableArray);
                        } else {
                            console.log(colors.red, "Error writing to hash table file");
                        }
                    });
                } else {
                    console.log(colors.red, "Error truncating file");
                }
            })
        } else {
            console.log(colors.red, "Error reading hash table file"+err);
        }
    });
       
}

// Function to find a particular user
// The callback function returns error (if any) and the user id
usersHelper.findUser = (userEmailAddress, callback) => {
    let userId = "";
    fileHelper.readFile("hashTable","",(err, fileData) => {
        if(!err && fileData) {
            const hashTableParsed = JSON.parse(fileData);
            if(typeof(hashTableParsed) !== "undefined" && hashTableParsed.length > 0) {
                for(i = 0; i < hashTableParsed.length; i ++) {
                    if(hashTableParsed[i].email === userEmailAddress) {
                        userId = hashTableParsed[i].id;
                        break;
                    }
                }
                callback(false, userId);
            } else {
                callback("Error: There is currently no user in the database", false);
            }   
        } else {
            callback("Error: Could not read the hashtable file",false);
        }
    })
}

// User update method
// Callback returns error
usersHelper.updateUser = (userEmail, update, callback) => {
    usersHelper.findUser(userEmail, (err, userId) => {
        if(!err && userId) {
            fileHelper.updateFile(userId,"users", update, (err) => {
                if(!err) {
                    callback(false);
                } else {
                    callback("Error: Couldn't update the user data file due to:  "+ err);
                }
            })
        } else {
            callback("Error: Couldn't find the user with the enterered email");
        }
    });    
}
// Export the library
module.exports = usersHelper;