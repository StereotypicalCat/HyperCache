export const defaultTrustParameters = {
    trust_for_new_resource: 4,
    trust_for_validating_resource: 1,
    popolous_multiplier: (1/10),
    minimum_confidence: 0.65,
    // Logistic function used to calculate trust
    logistic_L: 1,
    logistic_k: 2.5,
    logistic_x0: 1,
}

export const defaultSimulationParameters = {
    amount_of_pure_peers: 15,
    amount_of_consistently_malicious_peers: 2,
    amount_of_sometimes_malicious_peers: 3,
    // Max time in seconds that the simulation uses. Basically the time that the simulation runs.
    max_time: 30,
    number_of_websites_to_generate: 10,
    // Meaning EXTRA versions. All websites have at least 1 version, that being at time 0.
    max_number_of_versions_per_website: 4,
    min_number_of_versions_per_website: 2,
    // min and max time it takes to request a website
    min_request_time: 0.1,
    max_request_time: 0.2,
    // timeout to make sure peer number doesn't strictly correlate with request time
    min_peer_time_before_first_request: 0.2,
    max_peer_time_before_first_request: 0.2,
    chance_a_peer_churns: 0.05,
    // timeout of peer clients before they go revalidate a website
    peer_timeout: 1,
    chance_of_sometimes_being_malicious: 0.05,
}

