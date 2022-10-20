// Max time in seconds that the simulation uses. Basically the time that the simulation runs.
export const max_time = 20;
export const number_of_websites_to_generate = 3;
export const max_number_of_versions_per_website = 4;
export const min_number_of_versions_per_website = 4;

// min and max time it takes to request a website
export const min_request_time = 0;
export const max_request_time = 0;

// timeout to make sure peer number doesn't strictly correlate with request time
export const min_peer_time_before_first_request = 0.5;
export const max_peer_time_before_first_request = 2;

// timeout of peer clients before they go revalidate a website
export const peer_timeout = 1;

// Only trust one version per slot. TODO: Currently not implemented. Should only be set to false.
export const only_most_trusted = false;
// the minimum confidence that a version must have to be trusted
export const minimum_confidence = 0.4;


export const amount_of_pure_peers = 25;
export const amount_of_consistently_malicious_peers = 0;
export const amount_of_sometimes_malicious_peers = 0;

export const chance_of_sometimes_being_malicious = 0.1;


// Logistic function used to calculate trust
export const logistic_L = 1;
export const logistic_k = 1;
export const logistic_x0 = 0;