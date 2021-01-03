/**
 * * Library for customizing terminal(console) colors
 */


// Function to return color strings
function createColorString(colorCode){
    return "\x1b["+colorCode+"m%s\x1b[0m"
}

// Function to create the colors object
function createColorsObject(arrayOfColorCodes, arrayOfCorrespondingColors){
    
    let object = {};
    arrayOfColorCodes.forEach((colorCode, index) => {
        let codeString = createColorString(colorCode);
        let colorName = arrayOfCorrespondingColors[index];
        object[colorName] = codeString;
    });
    return object;
}

// Array of color names
const colorsArray = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white"
];

// Array of color codes
const colorCodesArray = [
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37"
];


// Colors objects
const colors = createColorsObject(colorCodesArray, colorsArray);


module.exports = colors;