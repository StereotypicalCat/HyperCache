// Max time in seconds that the simulation uses. Basically the time that the simulation runs.
export let max_time = 20;
export let number_of_websites_to_generate = 3;
export let max_number_of_versions_per_website = 4;
export let min_number_of_versions_per_website = 4;

// min and max time it takes to request a website
export let min_request_time = 0;
export let max_request_time = 0;

// timeout to make sure peer number doesn't strictly correlate with request time
export let min_peer_time_before_first_request = 0.5;
export let max_peer_time_before_first_request = 2;

// timeout of peer clients before they go revalidate a website
export let peer_timeout = 1;

// Only trust one version per slot. TODO: Currently not implemented. Should only be set to false.
export let only_most_trusted = false;
// the minimum confidence that a version must have to be trusted
export let minimum_confidence = 0.4;

export let amount_of_pure_peers = 25;
export let amount_of_consistently_malicious_peers = 0;
export let amount_of_sometimes_malicious_peers = 0;

export let chance_of_sometimes_being_malicious = 0.1;

// Logistic function used to calculate trust
export let logistic_L = 1;
export let logistic_k = 2.5;
export let logistic_x0 = 1;

export const updateValue = (key, value) => {
    if (key === "max_time"){
        max_time = parseFloat(value);
    }
    if (key === "number_of_websites_to_generate"){
        number_of_websites_to_generate = parseInt(value);
    }
    if (key === "max_number_of_versions_per_website"){
        max_number_of_versions_per_website = parseInt(value);
    }
    if (key === "min_number_of_versions_per_website"){
        min_number_of_versions_per_website = parseInt(value);
    }
    if (key === "min_request_time"){
        min_request_time = parseFloat(value);
    }
    if (key === "max_request_time"){
        max_request_time = parseFloat(value);
    }
    if (key === "min_peer_time_before_first_request"){
        min_peer_time_before_first_request = parseFloat(value);
    }
    if (key === "max_peer_time_before_first_request"){
        max_peer_time_before_first_request = parseFloat(value);
    }
    if (key === "peer_timeout"){
        peer_timeout = parseFloat(value);
    }
    if (key === "only_most_trusted"){
        only_most_trusted = value === "true";
    }
    if (key === "minimum_confidence"){
        minimum_confidence = parseFloat(value);
    }
    if (key === "amount_of_pure_peers"){
        amount_of_pure_peers = parseInt(value);
    }
    if (key === "amount_of_consistently_malicious_peers"){
        amount_of_consistently_malicious_peers = parseInt(value);
    }
    if (key === "amount_of_sometimes_malicious_peers"){
        amount_of_sometimes_malicious_peers = parseInt(value);
    }
    if (key === "chance_of_sometimes_being_malicious"){
        chance_of_sometimes_being_malicious = parseFloat(value);
    }
    if (key === "logistic_L"){
        logistic_L = parseFloat(value);
    }
    if (key === "logistic_k"){
        console.log("logistic_k", value);
        logistic_k = parseFloat(value);
    }
    if (key === "logistic_x0"){
        console.log("logistic_x0", value);
        logistic_x0 = parseFloat(value);
    }
}

// Optionally overwrite the default parameters with ones from CLI
if (process.argv.length > 2){
    for (let i = 2; i <= process.argv.length; i++){
        let parameter = process.argv[i];
        if (parameter === undefined){
            continue;
        }
        parameter = parameter.split("=");
        if (parameter.length !== 2){
            continue;
        }
        let key = parameter[0];
        let value = parameter[1];

        updateValue(key, value);
    }
}


