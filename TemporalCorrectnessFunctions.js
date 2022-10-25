// distance_from_slot is greater than 0 if the version is newer than the slot and smaller than 0 if the version is older than the slot
// Returns a scalar that determines how important a specific validation/submission is.
// 0 is least important, 1 is most important
export const getTemporalScaleFactor = (distance_from_slot, trust_settings) => {
    return inverseLogsticFunction(Math.abs(distance_from_slot), trust_settings);
}

const inverseLogsticFunction = (x, trust_settings) => {

    // Curves maximum value
    const L = trust_settings.logistic_L;

    // The logistic growth rate of the curve
    const k = trust_settings.logistic_k;

    // The x value of the sigmoid's midpoint on the x axis
    // Basically controls the bias of future versions vs previous versions
    let x0 = trust_settings.logistic_x0;

    let logisticPart = (L / (1 + Math.exp((-k) * (x - x0))));

    return 1 - logisticPart;
}