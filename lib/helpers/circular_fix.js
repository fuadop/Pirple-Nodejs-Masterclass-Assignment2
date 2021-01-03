/**
 * * Library to store all circular depencies affected functions 
*/

// Dependencies
const fileHelper = require("./file_helper");


/**
 * @param {string} userEmailAddress - The email address of the user you are trying to find
 * @param {function @returns (boolean| string) | (boolean | string)} callback - The callback function
 * @returns {void} 
*/
findUser = (userEmailAddress, callback) => {
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

// Export the functions
module.exports = {
    findUser
}
