import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import randomInteger from 'random-int';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/*
let testUrls = [
    'testUrl1',
    'testUrl2',
    'testUrl3',
    'testUrl4'
]

let websites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>bold</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>italic</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? asked bob</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look really good in that outfit</p></body></html>'
]

let maliciouswebsites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>italic</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>bold</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? bob violently asked</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look absolutely terrible</p></body></html>'
]
*/


// https://stackoverflow.com/questions/10049557/reading-all-files-in-a-directory-store-them-in-objects-and-send-the-object

export class WebsiteManager{

    constructor(simulation_parameters, timeManager) {
        this.timeManager = timeManager;
        this.simulation_parameters = simulation_parameters;
        this.fakedPlaintextWebsites = null;
        this.localMode = true;


    }

    /**
     * @description Read files synchronously from a folder, with natural sorting
     * @param {String} dir Absolute path to directory
     * @returns {Object[]} List of object, each object represent a file
     * structured like so: `{ filepath, name, ext, stat }`
     */
    readFilesSync(dir) {
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

    waitforme(milisec) {
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, milisec);
        })
    }

    getAllCorrectWebsitesForUrl = async(url) => {
        let webFiles = await this.GetWebsiteFakedPlaintext();
        let websites = webFiles.get(url);
        let correctWebsites = new Set();
        for (let i = 0; i < websites.length; i++){
            correctWebsites.add(websites[i].data);
        }
        return Array.from(correctWebsites);
    }

    getWebsiteFaked = async (url, withDelay = true, specificSlot = -1) => {
        let webFiles = await this.GetWebsiteFakedPlaintext();



        if (withDelay && !((this.simulation_parameters.max_request_time === 0) && (this.simulation_parameters.min_request_time === 0))){
            const randomDelay = 1000 * (Math.random() * (this.simulation_parameters.max_request_time - this.simulation_parameters.min_request_time) + this.simulation_parameters.min_request_time)
            await this.waitforme(randomDelay);
        }
        let currentTime;
        if(specificSlot === -1){
            currentTime = this.timeManager.getTime();
        }
        else{
            currentTime = specificSlot;
        }

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

        //console.log(closestWebsite + " : " + closestTime + " : " + currentTime);

        return closestWebsite;
    }

    initWebsiteFakedActualWebsites = async () => {

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

    initWebsiteFakedRandomGeneratedWebsite = async () => {
        // TODO: IMPLEMENT
        throw err;
    }

    SetWebsiteFakedPlaintext = async (fakedPlaintextWebsites) => {
        this.fakedPlaintextWebsites = fakedPlaintextWebsites;
    }

    GetWebsiteFakedPlaintext = async () => {

        if (this.fakedPlaintextWebsites !== null){
            //console.log("Using cached faked websites");
            return this.fakedPlaintextWebsites;
        }

        //console.log("generating faked websites");

        let webFiles = new Map();

        for(let i = 0; i < this.simulation_parameters.number_of_websites_to_generate; i++){
            let url = "url" + i;
            let data = "correctHash" + i;

            //Close to random :)
            //let versions = Math.max(Math.floor(min_number_of_versions_per_website + (Math.random() * (max_number_of_versions_per_website - min_number_of_versions_per_website + 0.9999))), min_number_of_versions_per_website);
            let versions = randomInteger(this.simulation_parameters.min_number_of_versions_per_website, this.simulation_parameters.max_number_of_versions_per_website);
            let timestamps = new Set();

            // A website always starts with a version.
            // Even if a website theoretically isnt available on the web, that would still count as a version :)
            timestamps.add(0);

            // Generate random timestamps
            for(let j = 0; j < versions; j++){
                let unique = false;

                // This is bad very smelly code. I'm sorry.
                while (!unique){
                    let randomVal = Math.floor(Math.random() * this.simulation_parameters.max_time)

                    if (!timestamps.has(randomVal)){
                        timestamps.add(randomVal)
                        unique = true;
                    }
                }

            }

            // Deconstruct sett to array
            timestamps = [...timestamps];

            timestamps.sort((a, b) => a - b)

            // Generate corresponding version and put it into website

            let websites = []
            for(let j = 0; j < timestamps.length; j++){
                let versionData = data + "_version" + j;
                websites.push({timeStart: timestamps[j], data: versionData});
            }


            webFiles.set(url, websites);
        }

        this.fakedPlaintextWebsites = webFiles;
        return webFiles;
    }



    getWebsiteLive = async (url) => {

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


    get_requestable_urls = async () => {
        if (this.localMode == false){
            // some shit here TODO: Fill out
        }
        else{
            let sites = await this.GetWebsiteFakedPlaintext();

            let val =  Array.from( sites.keys() );

            return val;
        }
    }

    request_website = async (url) => {
        if (this.localMode == false){
            let val = await this.getWebsiteLive(url)
            return val;
        }
        else{
            let val = await this.getWebsiteFaked(url);
            return val;
        }
    }
}



//let test = await request_website("https://www.google.com")
//console.log(test)
