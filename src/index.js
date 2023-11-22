// Scenes
import experimentMonitor from "./experimentProgressMonitor.js";

// Firebase
import { signInAndGetUid, db } from "./firebaseSetup.js";
import {
    doc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Other things
import { extractUrlVariables, applyGameConfig } from "./utils.js";
import gameConfig from './gameConfig.js';

/**
 * Function to check the start of the game.
 *
 * @param {string} uid - The user ID.
 */
var startGame = function (uid) {
    // Get URL variables
    let { subjectID, testing, studyID, short, task } = extractUrlVariables();

    // Clear start element and scroll to top
    document.getElementById("start").innerHTML = "";
    window.scrollTo(0, 0);

    // Wait a bit before starting
    setTimeout(function () {
        // Init experiment monitor
        // experimentMonitor.init(
        //     'https://us-central1-experiment-tracker-a7632.cloudfunctions.net',
        //     'zmDccA_O3wpKLy5EeoS_g',
        //     'cannonball_TU',
        //     true
        // )

        // experimentMonitor.registerSubject('cannonball_game', subjectID);

        // Create the game with the configuration object defined above
        let game = new Phaser.Game(gameConfig);

        // Apply configuration settings to the game (given in config.js)
        applyGameConfig(game, task);

        // Set testing flag
        game.config.testing = testing === "FALSE" ? false : true;

        // Set study ID
        game.config.studyID = studyID;

        // Short version for testing?
        game.registry.set("short", short);

        // Subject and study IDs stored in registry
        game.registry.set("subjectID", subjectID);
        game.registry.set("studyID", studyID.toLowerCase());

        // Store task type in registry
        game.registry.set("task", task);

        // Update firebase data
        const docRef = doc(
            db,
            "cannonball_TU",
            game.config.studyID,
            "subjects",
            uid
        );

        setDoc(docRef, {
            subjectID: subjectID,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            trial_data: [],
            attention_checks: [],
        })
            .then(() => {
                console.log("Data successfully written!");
            })
            .catch((error) => {
                console.error("Error writing document: ", error);
            });

        // Store the database and uid in the game config
        game.config.db = db;
        game.config.uid = uid;

        // Store the start time in the registry
        game.registry.set("start_time", new Date());

        // Create an object within the game to store responses
        game.registry.set("data", {});
        
    }, 1000);
};

// Sign in and start the game
signInAndGetUid()
    .then((uid) => {
        console.log("Signed in with UID:", uid);
        startGame(uid); // Pass uid as an argument to startGame
    })
    .catch((error) => {
        console.error("Sign-in failed:", error);
    });
