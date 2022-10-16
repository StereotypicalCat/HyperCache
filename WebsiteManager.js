import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {getBestAndWorstTrustRatios} from "./TestHelpers.js";
import {max_request_time, max_time, min_request_time} from "./SimulationParameters.js";
import {getTime} from "./TimeManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// https://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object
/**
 * @description Read files synchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {Object[]} List of object, each object represent a file
 * structured like so: `{ filepath, name, ext, stat }`
 */
function readFilesSync(dir) {
    const files = [];

    fs.readdirSync(dir).forEach(filename => {
        const name = path.parse(filename).name;
        const ext = path.parse(filename).ext;
        const filepath = path.resolve(dir, filename);
        const stat = fs.statSync(filepath);
        const isFile = stat.isFile();

        if (isFile) files.push({ filepath, name, ext, stat });
    });

    files.sort((a, b) => {
        // natural sort alphanumeric strings
        // https://stackoverflow.com/a/38641281
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return files;
}

function waitforme(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

let getWebsiteFaked = async (url) => {
    let webFiles = await GetWebsiteFakedPlaintext();


    const randomDelay = 1000 * (Math.random() * (max_request_time - min_request_time) + min_request_time)

    await waitforme(randomDelay);

    let currentTime = getTime();

    //console.log(currentTime)

    // Find a website with a timestamp earlier than the current time yet closest to the current time
    let website = webFiles.get(url);
    let closestTime = -1;
    let closestWebsite = null;
    for (let i = 0; i < website.length; i++){
        if (website[i].timeStart <= currentTime && website[i].timeStart > closestTime){
            closestTime = website[i].timeStart;
            closestWebsite = website[i].data;
        }
    }

    return closestWebsite;
}

let initWebsiteFakedActualWebsites = async () => {

    let webFiles = new Map();

    let filespath = path.join(__dirname, 'websiteFiles');

    await readFilesSync(filespath).forEach(file => {
        let split = file.name.split("-");
        let url = split[0];
        let timestamp = split[1];

        if (!webFiles.has(url)){
            webFiles.set(url, []);
        }

        webFiles.get(url).push({timeStart: timestamp, data: fs.readFileSync(file.filepath, 'utf8')})

    });

    return webFiles;
}

let initWebsiteFakedRandomGeneratedWebsite = async () => {
    // TODO: IMPLEMENT
    throw err;
}

let fakedPlaintextWebsites = null;
let GetWebsiteFakedPlaintext = async () => {

    if (fakedPlaintextWebsites !== null){
        //console.log("Using cached faked websites");
        return fakedPlaintextWebsites;
    }

    let webFiles = new Map();

    for(let i = 0; i < 3; i++){
        let url = "url" + i;
        let data = "correctHash" + i;

        // Generate between 1 and 10 versions for each hash

        let versions = Math.floor(Math.random() * 10) + 1;
        let timestamps = [];

        // Generate random timestamps
        for(let j = 0; j < versions; j++){
            timestamps.push(Math.floor(Math.random() * max_time))
        }
        timestamps = [...new Set(timestamps)];

        timestamps.sort((a, b) => a - b)

        // Generate corresponding version and put it into website

        let websites = []
        for(let j = 0; j < timestamps.length; j++){
            let versionData = data + "_version" + j;
            websites.push({timeStart: timestamps[j], data: versionData});
        }


        webFiles.set(url, websites);
    }

    fakedPlaintextWebsites = webFiles;
    return webFiles;
}


let localMode = true;

let getWebsiteLive = async (url) => {

    const response = await axios.get(url);
    return response.data;

    /*    let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                console.log(xmlHttp.responseText);
        }
        xmlHttp.open("GET", url, true); // true for asynchronous
        xmlHttp.send(null);*/
}


let get_requestable_urls = async () => {
    if (localMode == false){
        // some shit here TODO: Fill out
    }
    else{
        let sites = await GetWebsiteFakedPlaintext();

        let val =  Array.from( sites.keys() );

        return val;
    }
}

let request_website = async (url) => {
    if (localMode == false){
        let val = await getWebsiteLive(url)
        return val;
    }
    else{
        let val = await getWebsiteFaked(url);
        return val;
    }
}


/*
let test = async () => {
    setTimeout(async () => {
    let res = await request_website('site1');
        console.log(res);
        await test();
    }, 800)
}
*/

//await test();


export {request_website, get_requestable_urls, GetWebsiteFakedPlaintext}


//let test = await request_website("https://www.google.com")
//console.log(test)
