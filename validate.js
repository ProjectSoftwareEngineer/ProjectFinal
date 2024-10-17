const axios = require('axios');
const cheerio = require('cheerio');

// Function to perform an HTTP request
async function curl(method, url, headers, data = null, cookie = null) {
    const options = {
        method: method,
        url: url,
        headers: {
            ...headers,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
        },
        validateStatus: false, // Allow handling of non-200 responses
    };

    if (data) {
        options.data = data;
    }

    if (cookie) {
        options.headers.Cookie = cookie;
    }

    try {
        const response = await axios(options);
        // Convert the response data from windows-874 to utf-8 if necessary
        return response.data; // Assuming it's already UTF-8, if needed use iconv-lite
    } catch (error) {
        console.error('Error during HTTP request:', error);
        return null;
    }
}

// Function to get the value of BUILDKEY
function getBuildKey(html) {
    const $ = cheerio.load(html);
    const buildKey = $('input[name="BUILDKEY"]').val(); // Use jQuery-like syntax to select the input
    return buildKey || null; // Return the value or null if not found
}

// Main function to execute the request and get the BUILDKEY
async function main() {
    const headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Cache-Control": "no-cache",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        'Cookie': 'ASPSESSIONIDCCRAQDCB=PDJBJGDCJPBNHJEKJDNAAKAL',
    };

    const res = await curl("GET", "https://reg4.sut.ac.th/registrar/login.asp", headers);
    
    if (res) {
        const buildKey = getBuildKey(res);
        if (buildKey !== null) {
            console.log("The value of BUILDKEY is:", buildKey); // Properly output the string
        } else {
            console.log("BUILDKEY not found.");
        }
    } else {
        console.log("Failed to retrieve the page.");
    }
}

// Execute the main function
main();