const {AutoWARCParser} = require("node-warc");
const {JSDOM} = require("jsdom");
var prettier = require('prettier');

const tweets_warc_path = './test-files/test-file.warc'
// Parse the WARC file

// Javascript Tree Implementation
class Tree {
    constructor(value) {
        this.value = value;
        this.children = [];
    }
    addChild(value) {
        this.children.push(value);
    }
    removeChild(value) {
        this.children = this.children.filter(child => child)
    }

    // Print inorder tree walk
    print() {
        // print the value of this node with a max of 8 characters
        //console.log(this.value.substring(0, 8));
        console.log(this.value.substring(0, 32))

        // print the value of each child node
        this.children.forEach(child => child.print());
    }
}


function convertWarcToJSDOM(warc_doc, debug=false){
    // debug dom


    if (debug){
        const dom = new JSDOM('<!DOCTYPE html><html><body class="test" otherAttribute="hello"><p class="Helloitsme">Element1</p><p>Element2</p><p>Element3</p></body></html>');
        const resultHtml = dom.serialize();
        const formattedHtml = prettier.format(resultHtml, { parser: "html" });
        console.log(formattedHtml)

        return dom;
    }
    else{
        const dom = new JSDOM(warc_doc);
        return dom;
    }

}

// Convert content from WARC file to tree
function convertToTree(jsdomObject){

    // Create the value of this node.
    // The value consist of this objects element type and its attribtues concatenated together

    let attributesConcatedTogether = "";
    let innerText = "";

    let seperator = '£§'

    // safety check if attributes is not undefined

    //console.log(jsdomObject)
    //console.log("Hello, I am " + jsdomObject.nodeName)


    // print out innerhtml of child nodes of jsdom if there are any

    // safety check if jsdomobject has any childnodes



    if (jsdomObject.attributes !== undefined){
        // Loop through the attributes of the body
        for (let i = 0; i < jsdomObject.attributes.length; i++) {
            // Concatenate the attribute name and value together
            attributesConcatedTogether += jsdomObject.attributes[i].name + seperator + jsdomObject.attributes[i].value + seperator;
        }
    }

    // get innerhtml of jsdom node or empty string if there is none

    if (jsdomObject.innerText !== undefined){
        innerText = jsdomObject.innerText;
    }
    else{
        innerText = "";
    }


    let valueOfObject = jsdomObject.nodeName + seperator + innerText + seperator + attributesConcatedTogether;

    const tree = new Tree(valueOfObject);

    //console.log("new value" + valueOfObject)

    // Add the children to the tree
    if (jsdomObject.childNodes !== undefined){
        if (jsdomObject.childNodes.length > 0){
            for (let i = 0; i < jsdomObject.childNodes.length; i++){
                //console.log(jsdomObject.childNodes[i].innerHTML)
                //console.log(jsdomObject.childNodes[i].nodeName)
                let newTreeMember = convertToTree(jsdomObject.childNodes[i])
                tree.addChild(newTreeMember)
            }
        }
    }

    // Return the tree
    return tree;
}



// Make sure only 1 record is parsed
let documents_to_get = 1

const parser = new AutoWARCParser(tweets_warc_path)
parser.on('record', record => {


    // If there are no more documents to get, skip the rest
    if (documents_to_get === 0){
        return;
    }

    // Safety check warctargetURI isnt undefined
    if(record.warcTargetURI !== undefined){
        // check WRAC content length is greater than 0
        if(record.content.length > 0){
            // If the warcTargetURI is from twitter
            if(record.warcTargetURI.includes("twitter.com")){
                // decrement the number of documents to get
                documents_to_get -= 1;

                // Convert the content to a tree
                let jsdom = convertWarcToJSDOM(record.content.toString(), debug=false);
                let tree = convertToTree(jsdom.window.document.body)

                console.log("Printing Tree.")
                // Print the tree
                tree.print();
            }
        }

    }


});

// start parser
parser.start();

