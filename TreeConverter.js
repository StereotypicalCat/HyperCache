import {JSDOM} from "jsdom";
import prettier from 'prettier';
import crypto from 'node:crypto'

function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((bytes) => bytes.toString(16).padStart(2, '0'))
            .join('');
        return hashHex;
    });
}

let HTMLtoJSDOM = async (plaintext) => {
    const dom = new JSDOM(plaintext);
    const resultHtml = dom.serialize();
    const formattedHtml = prettier.format(resultHtml, { parser: "html" });

    console.log("Formatted:")
    console.log(formattedHtml)

    return dom;
}

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
    print(spaces = 0) {
        // print the value of this node with a max of 8 characters
        //console.log(this.value.substring(0, 8));
        console.log(' '.repeat(spaces) +  this.value.substring(0, 32))

        // print the value of each child node
        this.children.forEach(child => child.print(spaces = 4));
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


async function convertTreeToHashTree (tree) {


    async function hashNonRootTreeRecursive(tree){

        let promises = []

        if(!tree.children === undefined){
            for (const child of tree.children) {
                promises.push(hashNonRootTreeRecursive(child))
            }
        }

        return new Promise(async (resolve) => {
            tree.value = (await hash(tree.value)).substring(0, 4)

            for (const promise in promises) {
                await promise
            }
            resolve()
        })

    }

    let promises = []

    //console.log(tree)

    for (const child of tree.children) {
        promises.push(hashNonRootTreeRecursive(child))
    }
    tree.value = await hash(tree.value)


    for (const promise in promises) {
        await promise
    }

    return tree;
}


async function convertPlaintextToHashTree(plaintext){
    let jsdom = await HTMLtoJSDOM(plaintext);
    let tree = await convertToTree(jsdom.window.document.body);

    let hashTree = await convertTreeToHashTree(tree);

    return hashTree;

}


export {Tree, convertPlaintextToHashTree, hash }