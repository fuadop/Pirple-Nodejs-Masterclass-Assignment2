# Documentation

## <u>Usage</u>

### Starting the server

```shell
# start the server from the index.js file

node index.js
```

## <u>Endpoints</u>

_Note: The token to be added to perfrom some operations is to be added with the name __authtoken__._

### User Operatioins

<span style="color: yellow">[post]:</span> __/users__ - _creates new user using the input payload below_

```json
{
    "name": "<Your full name>",
    "emailAddress": "<Your email address>",
    "streetAddress": "<Your delivery address>",
    "password": "<Your password>"
}
```

<span style="color: green">[get]:</span> __/users?id={id}__ - _returns the details of the user with the id_

<span style="color: blue">[put]:</span> __/users__ - _updates the user in the database by sending in a payload of the fields to be edited in json format just like when creating a user. 
Note: To edit a user account the user must be logged in(i.e an authtoken header must be present)_


### Token Operations

<span style="color: yellow">[post]:</span> __/login__ - _logs in a user by creating a token and returns back the token to the user. Payload of the below format must be supplied to login_

```json
{
    "emailAddress": "<Email address linked to your account>",
    "password": "<Your account password>"   
}
```

<span style="color: yellow">[post]:</span> __/logout__ - _logs out the user by destroying the user token. Note: Token must be supplied to the header to logout the user._

### Product Operations

<span style="color: green">[get]:</span> __/products__ - _returns the list of available products. Note: user must be logged in to access the products list._

### __Cart Operations__

<span style="color: green">[post]:</span> __/cart__ - _gets the list of products in the user's cart. Note: Token must be supplied to the header._

<span style="color: yellow">[post]:</span> __/cart?id={id}__ - _add a product to the logged in user's cart by specifying the product id in the id query string parameter. Note: Token must be supplied to the header._

<span style="color: red">[delete]:</span> __/cart__ - _clears the cart of the logged in user. Note: Token must be supplied to the header._

### __Payment Operations__

<span style="color: yellow">[post]:</span> __/checkout__ - _calculates the total price of the products in the logged in user's cart and makes payment, payment receipt is sent to the user's email address. Note: Token must be supplied to the header._


## Folder Structure
* __root__ - contains the main application file

    * __.data__ - acts as database, it contains user's data and product's data 

    * __lib__ - contains libraries for the application
        
        * __helpers__ - contains helper libraries for the application eg. libraries to help integate with stripe and mailgun


