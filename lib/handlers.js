/**
 * * File for all routes logic
*/

// Dependencies
const fs = require("fs");
const colors = require("./colors");
const userHelper = require("./helpers/user_helper");
const tokenHelper = require("./helpers/token_helper");
const fileHelper = require("./helpers/file_helper");
const paymentHelper = require("./helpers/payment_helper");


// Create the handlers object
const handlers = {};

// Users handlers container
handlers.users = (data, callback) => {
    const allowedProtocols = ["get","post","put","delete"];
    if (allowedProtocols.indexOf(data.protocol) > -1){
        handlers._users[data.protocol](data, callback);
    } else {
        callback(400)
    }
        

}

// User handler sub methods container
handlers._users = {};

// Post method of the users handlers
handlers._users.post = (data, callback) => {
    // Grabbing the request body from the payload
    const details = data.requestBody;

    // Checking for Typos in the request body
    if(typeof(details) !== "object") {
        callback(400, {"Error": "You have made a typographical error"});
        return;
    }

    const name = typeof(details.name) === "string" && details.name.trim() !== "" ? details.name.trim() : false;
    const emailAddress = typeof(details.emailAddress) === "string" && details.emailAddress.trim() !== "" ? details.emailAddress.trim() : false;
    const streetAddress = typeof(details.streetAddress) === "string" && details.streetAddress.trim() !== "" ? details.streetAddress.trim() : false;
    const password = typeof(details.password) === "string" && details.password.trim() !== "" ? details.password.trim() : false;

    // Credentials checking
    if(name && emailAddress && streetAddress && password){
        // Create the user
        userHelper.createUser(details,(error, user) => {
            if(!error && user) {
                callback(200, user);
            } else {
                callback(503, {"Error": "Could not create user due to: "+error});
            }
        });
    } else {
        callback(400, {"Error": "Invalid credentials supplied!"});
    }
    
}

handlers._users.get = (data, callback) => {
    // Grab the search query
    const userid = data.searchQuery.userid;

    fileHelper.readFile(userid,"users",(err,fileData) => {
        if(!err && fileData){
            // Parse the file data
            const parsedFileData = JSON.parse(fileData);
            
            // Remove the unneccessary data before sending it to the user
            delete parsedFileData.password;
            delete parsedFileData.token;

            // Return the user data to the user
            callback(200, parsedFileData);
        } else {
            callback(400,{"Error": "The user with the queried id doesn't exist"});
        }
    })
}

// Users put method handler
// Prereq: users must be logged in before you can update your data
handlers._users.put = (data,callback) => {
    // Check for token in headers
    const token = data.headers.authtoken;
    if(token) {
        // Verify the token if it valid and has not expired
        fileHelper.readFile(token,"tokens",(err, fileData) => {
            
            if(!err && fileData){
                // Parse the file data
                const parsedFileData = JSON.parse(fileData);

                // Get the user email address
                const userEmailAddress = parsedFileData.user;

                // Grab the new data from the request body
                const updatedData = data.requestBody;
                
                // update the user data
                userHelper.updateUser(userEmailAddress,updatedData,(err) => {
                    if(!err) {
                        callback(200, {"message": "User updated successfully"});
                    } else {
                        callback(503, {"Error": "Error updating user due to: "+err});
                    }
                });
                
            } else {
                callback(400, {"Error": "This token is invalid: doesn't match any user token"});
            }
        })
    } else {
        callback(400, {"Error": "You have to be logged in to perform this operation"});
    }
}

// Users delete method handler
// Prereq: users must be logged in before you can delete your self
handlers._users.delete = (data,callback) => {
    // Check for token in headers
    const token = data.headers.authtoken;
    if(token) {
        // Verify the token if it valid and has not expired
        fileHelper.readFile(token,"tokens",(err, fileData) => {
            
            if(!err && fileData){
                // Parse the file data
                const parsedFileData = JSON.parse(fileData);

                // Get the user email address
                const userEmailAddress = parsedFileData.user;

                tokenHelper.destroyToken(userEmailAddress,(err) => {
                    if(!err) {
                        userHelper.findUser(userEmailAddress,(err, userId) => {
                            if(!err && userId) {
                                fileHelper.readFile("hashTable","",(err, hashtableData) => {
                                    if(!err && hashtableData) {
                                        // Parse the file Data
                                        const parsedHashTableFile = JSON.parse(hashtableData);
                                        console.log(parsedHashTableFile);
                
                                        // Get the user Id
                                        userHelper.findUser(userEmailAddress,(err, userId) => {
                                            if(!err && userId) {
                                                // Find user entry in hash table
                                                let userIndex = -1;
                                                for (i =0; i < parsedHashTableFile.length; i++) {
                                                    if(parsedHashTableFile[i].id === userId) {
                                                        userIndex = i;
                                                    }
                                                }
                
                                                // Remove user from the hash table array
                                                parsedHashTableFile.splice(userIndex,1);

                                                // Check if the last item in the array is an empty object
                                                if(typeof(parsedHashTableFile[parsedHashTableFile.length -1].email) === "undefined"){

                                                    /// Remove the empty object
                                                    parsedHashTableFile.pop();
                                                } 
                
                                                // Rewrite the hashtable file
                                                fs.writeFile(fileHelper.baseDir+"hashTable.json",JSON.stringify(parsedHashTableFile),(err) => {
                                                    if(!err) {
                                                        // Delete other user database entries
                                                        fileHelper.deleteFile(userId,"users",(err) => {
                                                            if(!err){
                                                                callback(200, {"message": "User deleted successfully"});
                                                            } else {
                                                                callback(503,{"Error": "Could not delete user from database due to: "+err});
                                                            }
                                                        });
                                                    } else {
                                                        callback(500, {"Error": "Could not re write hash table file"});
                                                    }
                                                });
                                            } else {
                                                callback(400, {"Error": "didn't find user id due to: " + err});
                                            }
                                        });  
                                    } else {
                                        callback(500, {"Error": "Could not read hash table file"});
                                    }
                                });
                                
                            } else {
                                callback(503, {"Error": "Could not find user due to: "+err});
                            }
                        });
                    } else {
                        callback(503, {"Error": "Could not destroy token due to: "+err});
                    }
                });
                
            } else {
                callback(400, {"Error": "This token is invalid: doesn't match any user token"});
            }
        })
    } else {
        callback(400, {"Error": "You have to be logged in to perform this operation"});
    }
}

// Login handler
handlers.login = (data, callback) => {
    // Ensuring request method used is post
    if(data.protocol === "post") {
        // Grabbing the user object
        const userDetails = data.requestBody;

        // Grabbing the user password and email
        // Verify email and password is not empty
        const email = typeof(userDetails.emailAddress) === "string" && userDetails.emailAddress.trim() !== "" ? userDetails.emailAddress : false;
        const password = typeof(userDetails.password) === "string" && userDetails.password.trim() !== "" ? userDetails.password : false;

        if(email && password) {
            userHelper.findUser(email, (err, userId) => {
                if(!err && userId){
                    fileHelper.readFile(userId,"users",(err, userData) => {
                        if(!err && userData) {
                            // Parsing the user data
                            const parsedUserData = JSON.parse(userData);

                            // Grabbing the hashed password from the user data
                            const hashedPassword = parsedUserData.password;
                            
                            // Comparing the payload password with the hashed password
                            const PasswordDoMatch = tokenHelper.comparePassword(password, hashedPassword);
                            if(PasswordDoMatch){
                                // Create a token for user operations that expires in one hour
                                const tokenData = tokenHelper.createToken(parsedUserData.emailAddress);

                                // Adding the token to the user data
                                userHelper.updateUser(email,{"token": tokenData},(err) => {
                                    if(!err) {
                                        callback(200, {"token": tokenData});
                                    } else {
                                        callback(503, {"Error": "Could not update the user with token"+err});
                                    }
                                });
                            } else {
                                callback(401, {"Error": "The password entered is incorrect"});
                            }
                        } else {
                            callback(400,{"Error": "didn't find user due to: "+err});
                        }
                    });
                } else {
                    callback(400, {"Error": "Could not find a user with the email address"});
                }
            });
        } else {
            callback(400, {"Error": "Invalid login credentials"});
        }
    } else {
        callback(400, {"Error": "Only post method is available on this route"});
    } 
}

// Logout handler
handlers.logout = (data,callback) => {
    // Ensuring request method used is post
    if(data.protocol === "post"){
        // Check headers if token exist
        const token = data.headers.authtoken;
        if(token) {
            // Find user with corresponding token
            fileHelper.readFile(token,"tokens",(err,fileData) => {
                if(!err && fileData){
                    const parsedFileData = JSON.parse(fileData);
                    tokenHelper.destroyToken(parsedFileData.user,(err) => {
                        if(!err) {
                            callback(200,{"message": "Token has been destroyed"});
                        } else {
                            callback(500, {"Error": "Could not destroy token due to: "+err});
                        }
                    })
                } else {
                    callback(500, {"Error": "could not identify token due to: "+err});
                }
            })
            
        } else {
            callback(400, {"Error": "You are not logged in: Couldn't find a token"});
        }
    } else {
        callback(400, {"Error": "Only post method is available on this route"});
    }
}

// Products handlers
// Returns all products that can be purchased
// Only get methods work on the products route
handlers.products = (data, callback) => {
    // Checking the request method
    if(data.protocol === "get"){
        // Verify for token in headers
        const token = data.headers.authtoken;
        if(token) {
            // Verify if token exists
            fs.readdir(fileHelper.baseDir+"tokens",{encoding: "utf8", withFileTypes: false},(err,files) => {
                if(!err && files && files.length > 0) {
                    // Allow user to get list of products
                    const tokenDoExist = files.includes(token+".json");
                    if(tokenDoExist) {
                        // Allow user to see list of products
                        fileHelper.readFile("menuItems","",(err, fileData) => {
                            if(!err && fileData) {
                                // Parse the file data
                                const parsedFileData = JSON.parse(fileData);
                    
                                // Send the list of products to the user
                                callback(200, parsedFileData);
                            } else {
                                callback(500, {"Error": "Could not get available products due to: "+err});
                            }
                        });
                    } else {
                        callback(404,{"Error": "Token was not found in the database"});
                    }
                } else {
                    callback({"Error": "Invalid token in headers"});
                }
            });
        } else {
            callback(400, {"Error": "Only logged in users can see list of products"});
        }
    } else {
        callback(400, {"Error": "Only get method is available on this route"});
    }
    
}

// Cart handler
// This handler performs cart operations based on the request method used
// Get for getting items in the cart
// Post for adding items to the cart
handlers.cart = (data,callback) => {
    // Checking the method used and redirecting it to the respective sub method
    const allowedProtocols = ["get","post","delete"];
    if (allowedProtocols.indexOf(data.protocol) > -1){
        handlers._cart[data.protocol](data, callback);
    } else {
        callback(400, {"Error": "Only get ,post and delete methods are allowed on this route"});
    }
}

// Cart submethods container
handlers._cart = {};

// Cart handler get method
handlers._cart.get = (data,callback) => {
    // Verify for token in headers
    const token = data.headers.authtoken;
    if(token) {
        // Verify if token exists
        fs.readdir(fileHelper.baseDir+"tokens",{encoding: "utf8", withFileTypes: false},(err,files) => {
            if(!err && files && files.length > 0) {
                const tokenDoExist = files.includes(token+".json");
                if(tokenDoExist) {
                    // Find the user with the token and update the user with a cart object containing the added product
                    fileHelper.readFile(token,"tokens",(err,fileData) => {
                        if(!err && fileData) {
                            // parse the file data
                            const parsedFileData = JSON.parse(fileData);
                            // Grab the userr email address
                            const { user } = parsedFileData;

                            // find the user in the database
                            userHelper.findUser(user,(err,userId) => {
                                if(!err && userId) {
                                    fileHelper.readFile(userId,"users",(err,userData) => {
                                        if(!err && userData) {
                                            // parse the user data
                                            let parsedUserData = JSON.parse(userData);
                                            // Check for items in cart
                                            const cart = typeof(parsedUserData.cart) !== "undefined" ? parsedUserData.cart : [];
                                            callback(200, {"cart": cart});
                                            
                                        } else {
                                            callback(500, {"Error": "Could not read the user file"});
                                        }
                                    });
                                } else {
                                    callback(500, {"Error": "Could not find the user"});
                                }
                            });
                        } else {
                            
                        }
                    })
                }
            } else {
                callback(404, {"Error": "Token not found in the database: token doesn't exist"});
            }
        }); 
    } else {
        callback(400, {"Error": "You are not logged in: can't find token in headers"});
    }
};

// Cart handler post method
// Add an item to cart by posting to the cart route with an id query parmeter of the product you wish to add to the cart
handlers._cart.post = (data, callback) => {
    // Verify for token in headers
    const token = data.headers.authtoken;

    // Check if search query is valid
    if(!(["1","2","3"].includes(data.searchQuery.id))) {
        callback(400, {"Error": "Invalid product id"});

        // End the function flow
        return;
    } 

    if(token) {
        // Verify if token exists
        fs.readdir(fileHelper.baseDir+"tokens",{encoding: "utf8", withFileTypes: false},(err,files) => {
            if(!err && files && files.length > 0) {
                const tokenDoExist = files.includes(token+".json");
                if(tokenDoExist) {
                    // Find the user with the token and update the user with a cart object containing the added product
                    fileHelper.readFile(token,"tokens",(err,fileData) => {
                        if(!err && fileData) {
                            // parse the file data
                            const parsedFileData = JSON.parse(fileData);
                            // Grab the userr email address
                            const { user } = parsedFileData;

                            // find the user in the database
                            userHelper.findUser(user,(err,userId) => {
                                if(!err && userId) {
                                    fileHelper.readFile(userId,"users",(err,userData) => {
                                        if(!err && userData) {
                                            // parse the user data
                                            let parsedUserData = JSON.parse(userData);
                                            // Check if cart exists and if not. create an empty cart array
                                            const cart = typeof(parsedUserData.cart) !== "undefined" ? parsedUserData.cart : [];

                                            // Find item in itemlist file
                                            fileHelper.readFile("menuItems","",(err,products) => {
                                                // Parse the products
                                                const parsedProductsData = JSON.parse(products);
                                                
                                                // Add product selected in the search query to cart
                                                const selectedProduct = parsedProductsData[data.searchQuery.id - 1];
                                                cart.push(selectedProduct);

                                                // Update the user with new cart data
                                                userHelper.updateUser(user,{cart: cart},(err) => {
                                                    if(!err) {
                                                        callback(200, {"message": "Item: " + selectedProduct.product+" - Price: "+ selectedProduct.price +" successfully added to cart"})
                                                    } else {
                                                        callback(500, {"Error": "Could not update the user with the cart data"});
                                                    }
                                                });

                                            });
                                        } else {
                                            callback(500, {"Error": "Could not read the user file"});
                                        }
                                    });
                                } else {
                                    callback(500, {"Error": "Could not find the user"});
                                }
                            });
                        } else {

                        }
                    })
                }
            } else {
                callback(404, {"Error": "Token not found in the database: token doesn't exist"});
            }
        }); 
    } else {
        callback(400, {"Error": "You are not logged in: can't find token in headers"});
    }
};

// The clear cart handler
handlers._cart.delete = (data, callback) => {
    // Verify for token in headers
    const token = data.headers.authtoken;
    if(token) {
        // Verify if token exists
        fs.readdir(fileHelper.baseDir+"tokens",{encoding: "utf8", withFileTypes: false},(err,files) => {
            if(!err && files && files.length > 0) {
                const tokenDoExist = files.includes(token+".json");
                if(tokenDoExist) {
                    // Find the user with the token and update the user with a cart object containing the added product
                    fileHelper.readFile(token,"tokens",(err,fileData) => {
                        if(!err && fileData) {
                            // parse the file data
                            const parsedFileData = JSON.parse(fileData);
                            // Grab the userr email address
                            const { user } = parsedFileData;

                            // find the user in the database
                            userHelper.findUser(user,(err,userId) => {
                                if(!err && userId) {
                                    fileHelper.readFile(userId,"users",(err,userData) => {
                                        if(!err && userData) {
                                            // parse the user data
                                            let parsedUserData = JSON.parse(userData);
                                            // Check for items in cart
                                            const cart = typeof(parsedUserData.cart) !== "undefined" ? parsedUserData.cart : [];
                                            
                                            if(cart.length > 0){
                                                // Delete the cart entry from the user object
                                                delete parsedUserData.cart;

                                                fs.writeFile(fileHelper.baseDir+"users/"+userId+".json",JSON.stringify(parsedUserData),(err) => {
                                                    if(!err){
                                                        callback(200, {"message": "Your cart has been cleared"});
                                                    } else {
                                                        callback(500, {"Error": "Cart couldn't be cleared due to: "+ err});
                                                    }
                                                });
                                            } else {
                                                callback(200, {"message": "Cart is empty"});
                                            }
                                        } else {
                                            callback(500, {"Error": "Could not read the user file"});
                                        }
                                    });
                                } else {
                                    callback(500, {"Error": "Could not find the user"});
                                }
                            });
                        } else {
                            
                        }
                    })
                }
            } else {
                callback(404, {"Error": "Token not found in the database: token doesn't exist"});
            }
        }); 
    } else {
        callback(400, {"Error": "You are not logged in: can't find token in headers"});
    }
};


// The check out handler
handlers.checkout = (data,callback) => {
    // Grabbing token from the headers
    const token = data.headers.authtoken;

    // Checking request method
    if(data.protocol === "post") {
        // Verify token in headers
        if(token) {
            // Verify if token exists
            fs.readdir(fileHelper.baseDir+"tokens",{encoding: "utf8", withFileTypes: false},(err,files) => {
                if(!err && files && files.length > 0) {
                    const tokenDoExist = files.includes(token+".json");
                    if(tokenDoExist) {
                        // Find the user with the token and update the user with a cart object containing the added product
                        fileHelper.readFile(token,"tokens",(err,fileData) => {
                            if(!err && fileData) {
                                // parse the file data
                                const parsedFileData = JSON.parse(fileData);
                                // Grab the userr email address
                                const { user } = parsedFileData;
    
                                // find the user in the database
                                userHelper.findUser(user,(err,userId) => {
                                    if(!err && userId) {
                                        fileHelper.readFile(userId,"users",(err,userData) => {
                                            if(!err && userData) {
                                                // parse the user data
                                                let parsedUserData = JSON.parse(userData);
                                                // Check if cart exists and if not. create an empty cart array
                                                const cart = typeof(parsedUserData.cart) !== "undefined" ? parsedUserData.cart : [];
                                                
                                                // Check if there are products in the cart
                                                if(cart.length > 0) {
                                                    console.log(cart);
                                                    // Get the total price of the items in the cart
                                                    let totalPrice = 0;

                                                    for (i = 0; i < cart.length; i++) {
                                                        totalPrice += cart[i].price;
                                                    }

                                                    console.log(colors.yellow, "Total price is",totalPrice);
                                                    // Make payment
                                                    paymentHelper.pay(totalPrice,parsedUserData,(err) => {
                                                        if(!err) {
                                                            callback(200, {"message": "payment successfull"});
                                                        } else {
                                                            callback(500, {"Error": "Could not make payment due to: "+err});
                                                        }
                                                    })
                                                } else {
                                                    callback(400, {"Error": "Your cart is currently empty"});
                                                }
                                            } else {
                                                callback(500, {"Error": "Could not read the user file"});
                                            }
                                        });
                                    } else {
                                        callback(500, {"Error": "Could not find the user"});
                                    }
                                });
                            } else {
    
                            }
                        })
                    }
                } else {
                    callback(404, {"Error": "Token not found in the database: token doesn't exist"});
                }
            }); 
        } else {
            callback(400, {"Error": "You are not logged in: can't find token in headers"});
        }
    } else {
        callback(400, {"Error": "Only post method is available on this route"});
    }
};

// Error handler
handlers.error = (data, callback) => {
    callback(404, {"Error": "This is not a valid endpoint"});
}


// Export the object
module.exports = handlers;