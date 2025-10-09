import { gameConfigSettings } from './config.js';

/**
 * Applies the game configuration settings to the game object.
 * @param {Phaser.Game} game - The Phaser game object.
 * @param {string} task - The task type.
 *  */
export function applyGameConfig(game, task) {
    // Destructure the gameConfigSettings object
    const {
        redirectURL,
        alienSpeed,
        debugPhysics,
        dataSaveInterval,
        MB,
        MBMF,
        MF
    } = gameConfigSettings;

    // Apply basic settings
    game.registry.set("trial", 0);
    game.registry.set("data", {});
    game.registry.set("redirectURL", redirectURL);
    game.registry.set("alienSpeed", alienSpeed);
    game.registry.set("debugPhysics", debugPhysics);
    game.registry.set("dataSaveInterval", dataSaveInterval);

    // Task-specific settings
    switch (task) {
        case "MB":
            applyTaskSpecificSettings(game, MB);
            break;
        case "MBMF":
            applyTaskSpecificSettings(game, MBMF);
            break;
        case "MF":
            applyTaskSpecificSettings(game, MF);
            break;
        default:
            throw new Error("Invalid task type");
    }
}

function applyTaskSpecificSettings(game, taskSettings) {
    Object.keys(taskSettings).forEach(key => {
        // Only set the value if it's not already set in the registry (preserves URL parameters)
        if (!game.registry.has(key) || game.registry.get(key) === null) {
            game.registry.set(key, taskSettings[key]);
        }
    });
}


/**
 * Retrieves the value of a query variable from the current URL.
 *
 * @param {string} variable - The name of the query variable to retrieve.
 * @returns {string|boolean} - The value of the query variable, or false if it is not found.
 */
let getQueryVariable = (variable) => {
    // Get the query string from the current URL
    const query = window.location.search.substring(1);
    
    // Split the query string into individual variables
    const vars = query.split("&");
    
    // Iterate over the variables and check if the variable matches the input
    for (const pair of vars.map(v => v.split("="))) {
        if (pair[0] === variable) return pair[1];
    }
    
    // Return false if the variable is not found
    return false;
};


/**
 * Extracts URL variables from the current window location and returns an object with the extracted values.
 * If a variable is not found in the URL, it assigns a default value.
 *
 * @returns {Object} An object containing the extracted URL variables:
 *  - subjectID: The subject ID from the URL or a random number between 0 and 2000000.
 *  - testing: The testing value from the URL or "FALSE".
 *  - studyID: The study ID from the URL or "NONE".
 *  - session: The session number from the URL or "1".
 *  - saveMethod: The save method from the URL or "firebase".
 *  - trialInfoFile: The trial info file name from the URL or null.
 *  - practice: A boolean indicating whether the "practice" variable is present in the URL.
 *  - debugPhysics: A boolean indicating whether the "debugPhysics" variable is present in the URL.
 *  - short: A boolean indicating whether the "SHORT" variable is present in the URL.
 *  - task: The task type from the URL or "MF".
 */
export function extractUrlVariables() {
    var urlParams = new URLSearchParams(window.location.search);

    // Get subject ID from URL
    var subjectID = urlParams.has('PROLIFIC_PID') ? getQueryVariable('PROLIFIC_PID') : Math.floor(Math.random() * 2000001);

    // Get testing value from URL
    var testing = urlParams.has('TEST') ? getQueryVariable('TEST') : "FALSE";

    // Get study ID from URL
    var studyID = urlParams.has('STUDY') ? getQueryVariable('STUDY') : "NONE";

    // Get session from URL
    var session = urlParams.has('SESSION') ? getQueryVariable('SESSION') : "1";

    // Get save method from URL
    var saveMethod = urlParams.has('saveMethod') ? getQueryVariable('saveMethod') : "firebase";

    // Get trial info file from URL
    var trialInfoFile = urlParams.has('trialInfoFile') ? getQueryVariable('trialInfoFile') : null;

    // Get practice mode from URL
    var practice = urlParams.has('practice');

    // Get debug physics from URL
    var debugPhysics = urlParams.has('debugPhysics');

    // Get speed effect from URL
    var speedEffect = urlParams.has('speedEffect');

    // Check if the "SHORT" variable is present in the URL
    var short = urlParams.has('SHORT');

    // Get task type from URL
    var task = urlParams.has('TASK') ? getQueryVariable('TASK') : "MF";

    return {
        subjectID: subjectID,
        testing: testing,
        studyID: studyID,
        session: session,
        saveMethod: saveMethod,
        trialInfoFile: trialInfoFile,
        practice: practice,
        debugPhysics: debugPhysics,
        speedEffect: speedEffect,
        short: short,
        task: task
    };
}

