/**
 * * Library for file operations
 * 
*/

// Dependencies
const fs = require("fs");
const path = require("path");

// Instantiate the object
const fileHelper = {};

// Instantiate the base directory
fileHelper.baseDir = path.join(__dirname,"../../.data/");


// Create file function
/**
 * 
 * @param { the unique name or id of file } filename 
 * @param {the data folder where you are trying to create a file } dir
 * @param { the data to be written to the file in object form } data 
 * @param { the callback function returns only error } callback 
 */
fileHelper.createFile = (filename,dir,data, callback) => {
    const stringData = JSON.stringify(data);
    fs.open(fileHelper.baseDir+dir+"/"+filename+".json", "w",(err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.writeFile(fileDescriptor,stringData,(err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if(!err) {
                            callback(false);
                        } else {
                            callback("Error closing the file!");
                        }
                    })
                } else {
                    callback("Error: Could not write to file!");
                }
            })
        } else {
            callback("Error: Could not open file for editing!");
        }
    })
}

// Read file function
/**
 * 
 * @param {the unique filename(id)} filename 
 * @param {the data folder from which you are trying to read} dir
 * @param {callback returns error and data in file in string form} callback 
 */
fileHelper.readFile = (filename,dir,callback) => {
    fs.open(fileHelper.baseDir+dir+"/"+filename+".json", "r", (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            fs.readFile(fileDescriptor,{encoding: "utf8"},(err, fileData) => {
                if(!err && fileData){
                    const data = fileData;
                    fs.close(fileDescriptor,(err) => {
                        if(!err) {
                            callback(false, data);
                        } else {
                            console.log("Couldn't close file");
                        }
                    })
                } else {
                    callback("Error reading the file", false);
                }
            })
        } else {
            callback("Error: Could not open file for reading",false);
        }
    })
}

// Delete file function
/**
 * 
 * @param {the unique name or id of file} filename 
 * @param {the data folder where you are trying to create a file} dir
 * @param { the callback function returns only error} callback 
 */
fileHelper.deleteFile = (filename,dir,callback) => {
    fs.unlink(fileHelper.baseDir+dir+"/"+filename+".json",(err) => {
        if(!err) {
            callback(false);
        } else {
            callback("Error: File could not delete");
        }
    })
}


// Update file function
// Todo: repair this stupid function
fileHelper.updateFile = (filename,dir,data,callback) => {
    fileHelper.readFile(filename,dir,(err,fileData) => {
        if(!err && fileData) {
            let parsedFileData = JSON.parse(fileData);
            const newFileData = Object.assign({},parsedFileData,data);
            fileHelper.createFile(filename,dir,newFileData,(err) => {
                if(!err){
                    callback(false);
                } else {
                    callback("Error overwriting file");
                }
            })
        } else {
            callback("Error: could not read file");
        }
    });
}

module.exports = fileHelper;