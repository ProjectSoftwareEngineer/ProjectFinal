<?php

function Curl($method, $url, $header, $data, $cookie)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36');
    //curl_setopt($ch, CURLOPT_USERAGENT, 'okhttp/3.8.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    }
    if ($cookie) {
        curl_setopt($ch, CURLOPT_COOKIESESSION, true);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    }
    return @iconv("windows-874", "utf-8", curl_exec($ch));
}
function DOMXPath($html, $qry)
{
    $doc = new DOMDocument();
    @$doc->loadHTML($html);
    $xpath = new DOMXPath($doc);
    $nodeList = $xpath->query($qry);

    return $nodeList;
}

function getBuildKey($html)
{
    // XPath query to find the input element with name "BUILDKEY"
    $qry = '//input[@name="BUILDKEY"]/@value';
    $nodeList = DOMXPath($html, $qry);

    // Check if a node was found and return the value
    if ($nodeList->length > 0) {
        return $nodeList->item(0)->nodeValue; // Return the value as a string
    }

    return null; // Handle the case where BUILDKEY is not found
}
$header = array(
    "accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "cache-control: no-cache",
    "sec-fetch-dest: document",
    "sec-fetch-mode: navigate",
    "sec-fetch-site: same-origin",
    "sec-fetch-user: ?1",
    "upgrade-insecure-requests: 1",
    'Cookie: ASPSESSIONIDCCRAQDCB=PDJBJGDCJPBNHJEKJDNAAKAL',
    "user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36"
);
$res = Curl("GET", "https://reg4.sut.ac.th/registrar/login.asp", $header, false, false);
// Usage
$buildKey = getBuildKey($res);

if ($buildKey !== null) {
    echo "The value of BUILDKEY is: " . $buildKey; // Properly output the string
} else {
    echo "BUILDKEY not found.";
}
