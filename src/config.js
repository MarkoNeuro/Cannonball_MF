// This function returns a random trial info file for the model-free task on each run
// (You can implement for the other tasks as well)
function getRandomTrialInfoFile(array) {
    if (array.length === 0) {
        throw new Error("The array is empty.");
    }
    const randomFile = files[Math.floor(Math.random() * files.length)];
    console.log("Selected file:", randomFile); // Log the selected trial info file
    return randomFile;
}
const files = [
    "trial_info_model-free_LW_SF_7525.json",
    "trial_info_model-free_LW_VF_7525.json",
    "trial_info_model-free_RW_SF_7525.json",
    "trial_info_model-free_RW_VF_7525.json"
]; // Add the trial info files here
const gameConfigSettings = {

    // UPDATE TASK SETTINGS HERE
    // IMPORTANT - THE ORDER OF THESE SETTINGS MUST NOT BE CHANGED

    // General settings

    // URL to redirect to after the game is complete
    redirectURL: "https://app.prolific.com/submissions/complete?cc=CC6FNRFD",

    // Settings for game play
    alienSpeed: 120,
    debugPhysics: false,
    dataSaveInterval: 5,

    // Task-specific settings - Transition Learning Task
    MB: {
        showExplodeChanceBars: true,
        showBallColourProbabilities: false,
        ballsAreGrey: false,
        leftPinkChance: 0.7,
        rightPinkChance: 0.3,
        showBrokenInstructions: true,
        trialInfoFile: "trial_info_transition-learning.json"
    },

    // Task-specific settings - Two-Step Task
    MBMF: {
        showExplodeChanceBars: false,
        showBallColourProbabilities: true,
        ballsAreGrey: false,
        leftPinkChance: 0.7,
        rightPinkChance: 0.3,
        showBrokenInstructions: false,
        trialInfoFile: "trial_info_two-step.json"
    },

    // Task-specific settings - Model-Free Task
    MF: {
        showExplodeChanceBars: false,
        showBallColourProbabilities: false,
        ballsAreGrey: true,
        leftPinkChance: -1,
        rightPinkChance: -1,
        showBrokenInstructions: false,
        trialInfoFile: "trialinfo_MF_reversal_20segments.json" //getRandomTrialInfoFile(files)
    }
    
};

export { gameConfigSettings };