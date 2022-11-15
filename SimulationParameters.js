export const defaultTrustParameters = {
    trust_for_new_resource: 4,
    trust_for_validating_resource: 1,
    popolous_multiplier: (1/10),
    minimum_confidence: 0.65,
    // Logistic function used to calculate trust
    logistic_L: 1,
    logistic_k: 3,
    logistic_x0: 1,
}

export const defaultSimulationParameters = {
    amount_of_pure_peers: 10,
    amount_of_grouped_consistently_malicious_peers: 0,
    amount_of_solo_consistently_malicious_peers: 0,
    amount_of_grouped_sometimes_malicious_peers: 0,
    amount_of_solo_sometimes_malicious_peers: 0,
    amount_of_grouped_sometimes_malicious_specific_site_peers: 0,
    amount_of_solo_sometimes_malicious_specific_site_peers: 0,
    amount_of_past_focused_one_version_peers: 0,
    amount_of_past_focused_last_version_peers: 0,
    amount_of_new_version_spammer_peers: 0,
    // Max time in seconds that the simulation uses. Basically the time that the simulation runs.
    max_time: 40,
    number_of_websites_to_generate: 6,
    // Meaning EXTRA versions. All websites have at least 1 version, that being at time 0.
    max_number_of_versions_per_website: 4,
    min_number_of_versions_per_website: 2,
    // min and max time it takes to request a website
    min_request_time: 0,
    max_request_time: 0,
    // timeout to make sure peer number doesn't strictly correlate with request time
    min_peer_time_before_first_request: 0,
    max_peer_time_before_first_request: 0.3,
    chance_a_peer_churns: 0,
    // timeout of peer clients before they go revalidate a website
    peer_timeout: 1,
    chance_of_sometimes_being_malicious: 0.05,
    // In percent.
    amount_of_websites_to_post_bad_info_on: 0.5
}

