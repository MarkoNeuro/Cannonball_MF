import InstructionBox from "../classes/instructionBox.js";
import Cannon from "../classes/cannon.js";
import Ball from "../classes/ball.js";
import TwinklingStars from "../classes/twinklingStars.js";
import Alien from "../classes/alien.js";
import {
    TopUI,
    BonusText,
    BonusRoundText,
    ScoreAnnouncementText,
} from "../classes/ui.js";
import Asteroids from "../classes/asteroids.js";
import { saveData } from "../data_RL.js";
import { gameConfigSettings } from "../config.js";
import triggerService from "../triggerService.js";

class GameScene extends Phaser.Scene {
    constructor(key) {
        super({
            key: key,
        });
    }

    init(data) {
        // STARTING VALUES
        // Keep track of trial number
        this.trialNumber = -1;

        // Score
        this.score = 0;

        // Number of times they hit the alien
        this.nHits = 0;

        // Probability of balls exploding - these variables are set later based on trial info
        this.pinkBallExplodeChance = 0;
        this.purpleBallExplodeChance = 0;

        // Confidence rating value
        this.confidence = 0.5;

        // The amount bet on confidence trials
        this.pinkBet = -999;
        this.purpleBet = -999;

        // Track whether they have hit something on confidence trials
        this.confidenceTargetHit = false;

        // Score increase variable
        this.scoreIncrease = 0;

        // Ball start position
        this.ballStartY = 560;

        // Track trial type
        this.trialType = "trial";

        // Scaling of the reward values on confidence trials
        this.betScaling = -999;

        // Set side that is blocked (when blocked)
        this.blockedSide = -1;

        // Whether this is a "broken" trial
        this.brokenTrial = false;

        // Flag to indicate whether we can currently fire balls
        this.cannonActive = true;

        // Whether the instructions for the "broken" trials have been shown
        this.brokenInstructionsShown = false;

        // Colours for the balls
        this.ballColours = ["pink", "purple", "grey"];

        // Score announcement interval
        this.scoreAnnouncementInterval = 1000;

        // variable to track whether confidence box is shown
        this.confidenceShown = true;

        // variables to track responses and task events
        this.response = -999;
        this.ballColour = "";
        this.exploded = false;
        this.trialOutcome = 1; // 1 = successful (no explosion), 0 = failed (exploded)

        // variable to track RTs
        this.startTime = this.game.loop.time;
        this.RT = -999;

        // Retrieve the speed with which the alien moves
        this.alienSpeed = this.registry.get("alienSpeed");
        
        // Track alien speed progression for engagement
        this.baseAlienSpeed = this.alienSpeed; // Store original speed
        this.lastSpeedIncreaseScore = 0; // Track when we last increased speed
        this.speedIncreaseInterval = 1000; // Increase speed every 1000 points
        this.speedIncreaseAmount = 12.5; // Increase speed by 12.5 units each time
        this.speedDecreaseAmount = 15; // Decrease speed by 15 units when going below milestone

        // Retrieve the physics debugging status
        this.debugPhysics = this.registry.get("debugPhysics");

        // Retrieve how often to save data
        this.dataSaveInterval = this.registry.get("dataSaveInterval");
        
        // Track last saved trial number to avoid sending duplicates
        this.lastSavedTrialNumber = 0;

        // Retrieve whether to show explode chance bars
        this.showExplodeChanceBars = this.registry.get("showExplodeChanceBars");

        // Retrieve whether the cannon balls should be grey instead of coloured
        this.ballsAreGrey = this.registry.get("ballsAreGrey");

        // Retrieve whether to show the probability of pink/purple balls
        this.showBallColourProbabilities = this.registry.get(
            "showBallColourProbabilities"
        );

        // Retrieve the fixed ball colour probabilities - would be better to set these in trial info
        this.leftPinkChance = this.registry.get("leftPinkChance");
        this.rightPinkChance = this.registry.get("rightPinkChance");

        // Retrieve whether to show instructions on the first "broken" trial
        this.showBrokenInstructions = this.registry.get(
            "showBrokenInstructions"
        );

        // Retrieve the file containing trial info
        this.trialInfoFile = this.registry.get("trialInfoFile");
    }

    /**
     * Preloads all the necessary assets for the game.
     */
    preload() {
        // Preload assets for the TwinklingStars class
        TwinklingStars.preloadAssets(this, "./assets/star.png");

        // Load cannonballs
        Ball.preloadAssets(
            this,
            this.ballColours,
            "./assets",
            { frameWidth: 100, frameHeight: 100 },
            { frameWidth: 100, frameHeight: 100 }
        );

        // Load cannon
        Cannon.preloadAssets(this, "./assets");

        // Load alien
        Alien.preloadAssets(this, "./assets");

        // UI elements preload
        TopUI.preloadAssets(this, "./assets");

        // Load asteroids for confidence trials
        Asteroids.preloadAssets(this, "./assets");

        // load trial info
        // this.load.json("trial_info", "./src/trial_info/trial_info_TU.json");
        // this.load.json("trial_info", "./src/trial_info/trial_info_two-step.json");
        console.log(`Loading trial info file: ${this.trialInfoFile}`);
        this.load.json("trial_info", `./src/trial_info/${this.trialInfoFile}`);

        // Load planet image
        this.load.image("planet", "./assets/planet.png");

        // Load background image
        this.load.image("background", "./assets/BG1_resized.png");
    }

    /**
     * Set up the background and planet images.
     */
    setBackground() {
        // Set up the background image
        this.background = this.add.image(0, 0, "background");
        this.background.setOrigin(0);
        this.background.setDepth(-10);

        // Set up the planet image
        this.planet = this.add.image(250, 615, "planet");
        this.planet.setScale(0.12);
    }

    /**
     * Calculates the increase in score based on the bet color, bet amount, alien color,
     * and score color.
     *
     * @param {string} betColor - The color of the bet.
     * @param {number} betAmount - The amount of the bet.
     * @param {string} alienColor - The color of the alien.
     * @param {string} scoreColor - The color of the score.
     * @returns {number} - The increase in score.
     */
    calculateScoreIncrease = (betColor, betAmount, alienColor, scoreColor) => {
        // If the bet amount is -999, return 0 indicating no valid bet
        if (betAmount === -999) {
            return 0;
        }

        // Calculate the score modifier based on whether the alien color matches the bet color
        const scoreModifier = alienColor === betColor ? 1 : -1;

        // Set the bonus text to display the bet amount with a '+' sign if the score modifier is positive
        this.bonusText.setBonusText(
            `${scoreModifier > 0 ? "+" : "-"}${betAmount}`
        );

        // Calculate the score increase by multiplying the bet amount with the score modifier
        const scoreIncrease = betAmount * scoreModifier;

        // Set the bonus text color to the specified score color
        this.bonusText.setBonusTextColour(scoreColor);

        // Return the calculated score increase
        return scoreIncrease;
    };

    /**
     * Retrieves the bet information from the asteroid and ball objects.
     * Updates the confidence and the specific bet property based on the color of the ball.
     * @param {Phaser.GameObjects.Sprite} asteroid - The asteroid object.
     * @param {Phaser.GameObjects.Sprite} ball - The ball object.
     */
    getBetInfo(asteroid, ball) {
        // Retrieve the bet amount from the asteroid object
        const betAmount = asteroid.getData("betAmount");

        // Retrieve the color of the ball and asteroid objects
        const ballColour = ball.getData("colour");
        const asteroidColour = asteroid.getData("colour");

        // Update the confidence based on the color of the asteroid
        this.confidence =
            asteroid.getData("baseValue") *
            (asteroidColour === "pink" ? -1 : 1);

        // Update the specific bet property based on the color of the ball
        if (ballColour === "pink") {
            this.pinkBet = betAmount;
        } else {
            this.purpleBet = betAmount;
        }
    }

    /**
     * Handles the overlap between the ball and the alien.
     * @param {Ball} ball - The ball object.
     */
    handleBallAlienOverlap(ball) {
        // Send EEG trigger for alien hit
        triggerService.send('game.alienHit');
        
        // Reset the position of the ball
        ball.resetPosition();

        // Move the ball to the bottom (TODO: Evaluate if necessary)
        ball.moveToBottom();

        // Update the score
        this.updateScore();

        // Reset the alien
        this.alien.reset();
    }

    /**
     * Handles the overlap between a ball and an asteroid.
     * @param {Phaser.GameObjects.Sprite} asteroid - The asteroid sprite.
     * @param {Phaser.GameObjects.Sprite} ball - The ball sprite.
     */
    handleBallAsteroidOverlap(asteroid, ball) {
        // Check if the confidence target hit flag is false
        if (!this.confidenceTargetHit) {
            // Set the confidence target hit flag to true
            this.confidenceTargetHit = true;

            // Hide the cannon pointer
            this.cannon.hidePointer();

            // Get the bet info
            this.getBetInfo(asteroid, ball);

            // Calculate the score increase if there's a valid bet
            if (this.pinkBet !== -999 || this.purpleBet !== -999) {
                // Determine the bet type
                const betType = this.pinkBet !== -999 ? "pink" : "purple";

                // Calculate the score increase
                this.scoreIncrease = this.calculateScoreIncrease(
                    betType,
                    asteroid.getData("betAmount"),
                    asteroid.getData("colour"),
                    asteroid.getData("colour") === "pink"
                        ? "#FF0180"
                        : "#6A00FF"
                );

                // Show the bonus text after a delay
                this.bonusText.show(1000, 1.5, 400);
            }

            // Reset the ball position
            ball.resetPosition();

            // Explode the asteroid
            asteroid.explode();
        }
    }

    /**
     * Create the UI elements for the game.
     */
    createUI() {
        // Create the UI element at the top of the screen
        this.topUI = new TopUI(
            this,
            this.totalTrials,
            this.showExplodeChanceBars
        );

        // Create the bonus text element
        this.bonusText = new BonusText(this, 250, 320, "+100");

        // Listen to the "shown" event of the bonus text element to trigger score update and start a new trial
        this.bonusText.on("shown", () => {
            this.score += this.scoreIncrease; // Update the score
            this.checkAndUpdateAlienSpeed(); // Check if alien speed should increase
            this.hideConfidence(); // Hide the confidence element
            this.startNewTrial(); // Start a new trial
        });

        // Create the bonus round text element
        this.bonusRoundText = new BonusRoundText(this);
    }

    /**
     * Load trial information from cache and set properties.
     */
    loadTrialInfo() {
        // Load trial info from cache
        this.trialInfo = this.cache.json.get("trial_info");
        
        console.log(`✓ Trial info file successfully loaded: ${this.trialInfoFile}`);
        console.log(`Total trials available: ${Object.keys(this.trialInfo).length}`);

        // Set totalTrials based on registry value
        if (this.registry.get("short")) {
            this.totalTrials = 5;
            console.log(`Using short mode: ${this.totalTrials} trials`);
        } else {
            this.totalTrials = Object.keys(this.trialInfo).length;
            console.log(`Using full mode: ${this.totalTrials} trials`);
        }
    }

    /**
     * Creates the background with twinkling stars.
     */
    createBackground() {
        // Set background
        this.setBackground();

        // Create twinkling stars
        new TwinklingStars(this, {
            numberOfStars: 30, // Number of stars to create
            minX: 0, // Minimum x-coordinate for star position
            maxX: 500, // Maximum x-coordinate for star position
            minY: 0, // Minimum y-coordinate for star position
            maxY: 600, // Maximum y-coordinate for star position
            initialScale: 0.2, // Initial scale of stars
            initialAlpha: 0.5, // Initial opacity of stars
            endScale: 0.3, // End scale of stars
            endAlpha: 0.9, // End opacity of stars
            minDuration: 1000, // Minimum duration of animation
            maxDuration: 3000, // Maximum duration of animation
            ease: "Quad", // Easing function for animation
        });
    }

    /**
     * Creates pink and purple cannonballs.
     * Sets up event listeners for exploded, offScreen, and missed events.
     */
    createBalls() {
        // Create grey cannonball
        this.ball_grey = new Ball(this, 300, 800, "grey", 0.05, this.tailEmitter);
        if (this.ballsAreGrey == true) {
            this.ball_pink = new Ball(this, 300, 800, "grey", 0.05, this.tailEmitter);
            this.ball_purple = new Ball(this, 300, 800, "grey", 0.05, this.tailEmitter);
        }
        else {
        // Create pink cannonball
        this.ball_pink = new Ball(this, 300, 800, "pink", 0.05, this.tailEmitter);
        // Create purple cannonball
        this.ball_purple = new Ball(this, 300, 800, "purple", 0.05, this.tailEmitter);
        }        
        // Listen for the 'exploded' event
        this.ball_pink.on("exploded", (ball) => {
            this.handleBallExplosion(ball);
        });

        this.ball_purple.on("exploded", (ball) => {
            this.handleBallExplosion(ball);
        });

        // Set up the listener for the ball going off-screen
        this.ball_pink.on("offScreen", (ball) => {
            this.startNewTrial();
        });

        this.ball_purple.on("offScreen", (ball) => {
            this.startNewTrial();
        });

        // Handle missing the target on confidence trials
        // This represents a response in the middle of the scale
        this.ball_pink.on("missed", (ball) => {
            if (this.confidenceShown & !this.confidenceTargetHit) {
                this.handleMissedConfidenceTrial(ball);
            }
        });

        this.ball_purple.on("missed", (ball) => {
            if (this.confidenceShown & !this.confidenceTargetHit) {
                this.handleMissedConfidenceTrial(ball);
            }
        });
    }

    /**
     * Creates an alien sprite and sets up overlap for pink and purple balls.
     */
    createAlien() {
        // Create alien sprite
        this.alien = new Alien(this, 250, 200, this.alienSpeed);
        this.alien.setMoving(true);

        // Setup overlap for pink ball and alien
        this.physics.add.overlap(this.alien, this.ball_pink, () => {
            this.handleBallAlienOverlap(this.ball_pink);
        });

        // Setup overlap for purple ball and alien
        this.physics.add.overlap(this.alien, this.ball_purple, () => {
            this.handleBallAlienOverlap(this.ball_purple);
        });
    }

    /**
     * Create a broken instruction box for grey trials.
     */
    createBrokenInstructionBox() {
        // Create instruction box for grey trials
        this.instructionBoxGrey = new InstructionBox(
            this, // Parent scene
            250, // X position
            610, // Y position
            300, // Width
            50, // Height
            250, // Background color
            0.5, // Transparency
            15, // Font size
            "up", // Arrow direction
            "", // Text content
            15 // Z-order
        );

        // Set the text content of the instruction box
        this.instructionBoxGrey.setText(
            "Uh oh! Looks like the colour ball generator is broken!"
        );

        // Hide the instruction box
        this.instructionBoxGrey.hide();
    }

    /**
     * Initializes the game.
     */
    create() {
        // Load trial info
        this.loadTrialInfo();

        // TESTING - SET TRIALS 2-10 to confidence
        // for (let i = 1; i <= 20; i++) {
        //     // this.trialInfo[i]['confidence'] = 1;
        //     // this.trialInfo[i]["purpleExplode"] = 1;
        //     // this.trialInfo[i]["pinkExplode"] = 1;

        //     // if i is divisible by 2, set purple explode to 2
        //     if (i % 2 == 0) {
        //         this.trialInfo[i]["purpleExplodeChance"] = 2;
        //         this.trialInfo[i]["pinkExplodeChance"] = 2;
        //     }

        // }

        // Create a debug graphic to show the physics bodies
        if (this.debugPhysics) {
            this.physics.world.createDebugGraphic();
        }

        // Background
        this.createBackground();

        // Cannon
        this.cannon = new Cannon(
            this,
            250,
            545,
            this.showBallColourProbabilities
        );
        
        
        this.tailEmitter = this.add.particles(0, 0, "tail_particle", {
            angle: { min: 180, max: 180 },      // Will be dynamically set in update()
            speed: { min: 30, max: 40 },        // Shorter trail, barely extends past ball
            scale: { start: 0.09, end: 0.00 },  // Small particle, about 50% of the ball’s diameter
            alpha: { start: 0.55, end: 0.01 },  // Gentle fade-out
            lifespan: 120,                      // Short time = short trail
            frequency: 10,                      // 1 particle every 20ms, keeps it smooth but not dense
            quantity: 2,                        // Single particle, no stacking
            blendMode: "ADD"                    // Soft glow, but not overwhelming
        });

        // Do not start following anything yet
        this.tailEmitter.stop();

        // Balls
        this.createBalls();

        // Alien
        this.createAlien();

        // Create UI
        this.createUI();

        // Create asteroids for confidence trials
        this.asteroids = new Asteroids(
            this,
            250,
            590,
            300,
            5,
            this.handleBallAsteroidOverlap
        );

        // Instruction box for broken trials
        this.createBrokenInstructionBox();

        // Big text to show announcements about score
        this.scoreAnnouncementText = new ScoreAnnouncementText(
            this,
            250,
            300,
            "1000 points!"
        );

        // Send EEG trigger for game start
        triggerService.send('game.start');

        // Start the first trial
        this.startNewTrial();
    }

    handleMissedConfidenceTrial(ball) {
        this.confidence = 0;
        this.pinkBet = 0;
        this.purpleBet = 0;
        this.confidenceTargetHit = true;
        this.startNewTrial();
        this.hideConfidence();
        ball.resetPosition();
    }

    handleBallExplosion(ball) {
        // Send EEG trigger for ball explosion
        triggerService.send('game.ballExplode');
        
        // Reset the ball's position or handle it being off-screen
        ball.y = 620;

        // Update the score
        this.score -= 50;
        this.checkAndUpdateAlienSpeed(); // Check if alien speed should increase

        this.topUI.updateScore(this.score);

        // Set exploded state
        this.exploded = true;
        this.trialOutcome = 0; // Ball exploded, so trial outcome is 0 (failed)

        // Update trial counter
        this.startNewTrial();

        // Optionally update explode chance bars
        // this.updateExplodeChanceBars(true);
    }

    start() {}

    /**
     * Handles the response after a player selects a side.
     * @param {number} side - The side selected by the player (0 for left, 1 for right).
     */
    handleResponse(side) {
        // After a delay, hide the instruction box
        this.time.delayedCall(
            1000,
            this.instructionBoxGrey.hide,
            [],
            this.instructionBoxGrey
        );

        // Flash the container
        this.cannon.flashContainer(side);

        // Check if the selected side is not blocked and the cannon is active
        if (this.blockedSide !== side && this.cannonActive) {
            // Send EEG trigger for response
            triggerService.send('game.response');
            
            // Record the response
            this.response = side + 1;

            // Get the side string
            const sideString = side === 0 ? "left" : "right";

            // Calculate the response time in milliseconds
            this.RT = this.game.loop.time - this.startTime;

            // Record button press time
            this.choiceTime = this.game.loop.time; 

            // Set the cannon as inactive to prevent firing again
            this.cannonActive = false;

            // Fire the ball based on the selected option
            if (
                this.trialInfo[this.trialNumber][`purpleOption${side + 1}`] ===
                1
            ) {
                this.ball_purple.fire(
                    sideString,
                    this.trialInfo[this.trialNumber]["purpleExplode"] === 0
                );
            } else {
                this.ball_pink.fire(
                    sideString,
                    this.trialInfo[this.trialNumber]["pinkExplode"] === 0
                );
            }
        }
    }

    /**
     * Handles key press events.
     *
     * @param {string} key - The key that was pressed ("LEFT" or "RIGHT").
     * @param {number} response - The response to handle (0 or 1).
     */
    handleKeyPress(key, response) {
        // Check if the key is pressed for at least 500 milliseconds
        if (
            this.input.keyboard.checkDown(
                this.input.keyboard.addKey(key),
                500
            ) &&
            !this.ball_pink.visible &&
            !this.ball_purple.visible
        ) {
            // Handle the response
            this.handleResponse(response);
        }
    }

    // Update - runs constantly
    update() {
        // Run cannon updates
        this.cannon.update();

        // Run ball updates
        this.ball_pink.update();
        this.ball_purple.update();

        // if the 1 key is pressed
        this.handleKeyPress("ONE", 0);
        // if the 2 key is pressed
        this.handleKeyPress("TWO", 1);
    }

    /**
     * Check if alien speed should be increased or decreased based on score milestones
     */
    checkAndUpdateAlienSpeed() {
        // Check if alien speed progression is enabled in config
        if (!gameConfigSettings.enableAlienSpeedProgression) {
            return; // Exit early if speed progression is disabled
        }
        
        // Calculate how many 1000-point milestones have been reached
        const currentMilestone = Math.floor(this.score / this.speedIncreaseInterval);
        const lastMilestone = Math.floor(this.lastSpeedIncreaseScore / this.speedIncreaseInterval);
        
        // If we've crossed a new milestone upward, increase alien speed
        if (currentMilestone > lastMilestone) {
            this.lastSpeedIncreaseScore = this.score;
            this.alienSpeed += this.speedIncreaseAmount;
            
            // Update the alien's actual speed if it exists and is moving
            if (this.alien && this.alien.moving) {
                this.alien.speed = this.alienSpeed;
                this.alien.setVelocity(this.alienSpeed, this.alienSpeed);
            }
            
            console.log(`🚀 SPEED BOOST! Score: ${this.score} - Alien speed increased to: ${this.alienSpeed}`);
            
            // Show visual feedback for speed increase (red tint flash)
            if (this.alien) {
                this.tweens.add({
                    targets: this.alien,
                    tint: 0xff0000, // Red tint
                    duration: 150,
                    ease: "Power2",
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        this.alien.clearTint(); // Remove tint after animation
                    }
                });
            }
        }
        // If we've gone below a milestone, decrease alien speed
        else if (currentMilestone < lastMilestone) {
            this.lastSpeedIncreaseScore = this.score;
            this.alienSpeed = Math.max(this.baseAlienSpeed, this.alienSpeed - this.speedDecreaseAmount);
            
            // Update the alien's actual speed if it exists and is moving
            if (this.alien && this.alien.moving) {
                this.alien.speed = this.alienSpeed;
                this.alien.setVelocity(this.alienSpeed, this.alienSpeed);
            }
            
            console.log(`📉 SPEED DECREASE! Score: ${this.score} - Alien speed decreased to: ${this.alienSpeed}`);
            
            // Show visual feedback for speed decrease (alpha flash)
            if (this.alien) {
                this.tweens.add({
                    targets: this.alien,
                    alpha: 0.3,
                    duration: 100,
                    ease: "Power2",
                    yoyo: true,
                    repeat: 2
                });
            }
        }
    }

    updateScore() {
        this.score += 100;
        this.nHits += 1;
        this.checkAndUpdateAlienSpeed(); // Check if alien speed should increase
        this.topUI.updateScore(this.score);
        this.topUI.updateAlienCount(this.nHits);

        // update trial counter
        this.startNewTrial();
    }

    storeData() {
        // DATA
        // Calculate outcome interval (time from choice to outcome)
        const outcomeInterval = this.outcomeTime && this.choiceTime ? 
            Math.round(this.outcomeTime - this.choiceTime) : -999;
        
        var trialData = {
            trial: this.trialNumber,
            trialType: this.trialType,
            score: this.score,
            nHits: this.nHits,
            response: this.response,
            ballColour: this.ballColour,
            exploded: this.exploded,
            trialOutcome: this.trialOutcome,
            
            RT: this.RT,
            confidence: this.confidence,
            pinkBet: this.pinkBet,
            purpleBet: this.purpleBet,
            betScaling: this.betScaling,
            alienSpeed: this.alienSpeed, // Track current alien speed for analysis
            trialStartTimestamp: this.trialStartTimestamp, // Actual epoch timestamp
            outcomeInterval: outcomeInterval, // Time from choice to outcome (ms)
        };

        // Store data
        this.game.registry.values.data[this.trialNumber] = trialData;
    }

    /**
     * Handle a broken trial.
     *
     * @param {object} currentTrialInfo - Information about the current trial.
     */
    handleBrokenTrial(currentTrialInfo) {
        // Check if the trial is broken
        this.brokenTrial = currentTrialInfo["pinkExplodeChance"] > 1;

        // Update the UI
        this.topUI.setBlocked(this.brokenTrial);

        if (this.brokenTrial) {
            // Set grey color for pink and purple balls
            [this.ball_pink, this.ball_purple].forEach((ball) =>
                ball.setGrey()
            );

            // Show grey instruction box if not already shown
            if (!this.brokenInstructionsShown && this.showBrokenInstructions) {
                this.instructionBoxGrey.show();
                this.brokenInstructionsShown = true;
            }
        } else {
            // Set original textures for pink and purple balls
            [this.ball_pink, this.ball_purple].forEach((ball) =>
                ball.setColoured()
            );

            // Hide grey instruction box
            this.instructionBoxGrey.hide();

            // Update explode chance bars
            this.updateExplodeChanceBars(true);

            // Reset the instruction box shown flag
            this.brokenInstructionsShown = false;
        }
    }

    /**
     * Handle the confidence trial based on the current trial information.
     *
     * @param {object} currentTrialInfo - The information about the current trial.
     */
    handleConfidenceTrial(currentTrialInfo) {
        // Don't show if this is also a broken trial
        if (
            currentTrialInfo["confidence"] === 1 &&
            currentTrialInfo["pinkExplodeChance"] <= 1
        ) {
            // Make sure balls don't explode
            currentTrialInfo["pinkExplode"] = 1;
            currentTrialInfo["purpleExplode"] = 1;

            // Show the pink and purple balls
            [this.ball_pink, this.ball_purple].forEach((ball) => {
                ball.visible = true;
                ball.alpha = 0;
            });

            // Delayed call to hide the balls and show the confidence
            this.time.delayedCall(
                500,
                () => {
                    [this.ball_pink, this.ball_purple].forEach((ball) => {
                        ball.visible = false;
                        ball.alpha = 1;
                    });
                    this.showConfidence();
                },
                [],
                this
            );
        } else {
            // Hide the confidence and set the trial type to "trial"
            this.hideConfidence();
            this.trialType = "trial";
        }
    }

    startNewTrial() {
        // increment trial number
        this.trialNumber += 1;

        // store data locally (but not on the 0th trial before we have any data)
        if (this.trialNumber != 0) {
            this.storeData();
        }

        

        // Go to end scene if all trials completed
        let end = this.handleEndScene();

        if (!end) {
            console.log("Starting new trial...", this.trialNumber);
            
            // Send EEG trigger for new trial
            triggerService.send('game.newTrial');

            // Update trial counter
            this.topUI.updateTrial(this.totalTrials, this.trialNumber);

            // Reset bets
            this.pinkBet = this.purpleBet = -999;

            // Reset trial outcome variables
            this.exploded = false;
            this.trialOutcome = 1; // Default to successful outcome (no explosion)

            // Save data every 5 trials
            if (
                this.trialNumber != 0 &&
                this.trialNumber % this.dataSaveInterval == 0
            ) {
                this.saveData();
            }

            // Get trial info
            const currentTrialInfo = this.trialInfo[this.trialNumber];

            // Set explode chance bar values
            this.updateExplodeChanceBars(true);

            // Update ball colour probabilities if showing
            this.cannon.updateBallColourProbabilities(
                this.leftPinkChance,
                this.rightPinkChance
            );

            // Handle the broken trial
            this.handleBrokenTrial(currentTrialInfo);

            // Set blocked container side
            this.handleCannonBlocking(currentTrialInfo);

            // Show confidence UI with probability
            this.handleConfidenceTrial(currentTrialInfo);

            // Show score announcement if score is % 1000
            this.handleScoreAnnouncement();

            // Record time at which the trial started
            this.startTime = this.game.loop.time;
            this.trialStartTimestamp = Date.now(); // Actual epoch timestamp for data saving

            // Set cannon active
            this.cannonActive = true;

            // Check if the halfway point is reached (skip in practice mode)
            if (this.trialNumber === Math.floor(this.totalTrials / 2) && !this.registry.get("practice")) {
                console.log("Halfway point reached, preparing to trigger pause...");
                this.triggerPause();
                return; // Stop further trial setup during the pause
            }

            // Listen for the resumeGame event
            this.events.on("resumeGame", () => {
                console.log("Game resumed, reactivating cannons...");
                this.cannonActive = true; // Reactivate cannons
            });
        }
    }

    triggerPause() {
        // Disable input handling and cannon firing
        this.input.enabled = false;
        this.cannonActive = false;

        // Launch the PauseScene after a delay
        this.time.delayedCall(750, () => {
            this.scene.launch("PauseScene");
            this.scene.pause(); // Pause the game

            // Re-enable input handling in the PauseScene
            const pauseScene = this.scene.get("PauseScene");
            pauseScene.events.once("pauseReady", () => {
                this.input.enabled = true;
                this.cannonActive = true; // Reactivate cannon firing
            });
        });
    }    

    /**
     * Handles the blocking of the cannon containers based on the current trial information.
     * @param {Object} currentTrialInfo - The current trial information.
     */
    handleCannonBlocking(currentTrialInfo) {
        // Get the blocked side from the current trial information
        this.blockedSide = currentTrialInfo["blockedSide"];

        // Check if there is a blocked side
        if (this.blockedSide > -1) {
            // Block the corresponding container
            this.cannon.blockContainer(this.blockedSide);
        } else {
            // Unblock both containers
            this.cannon.unblockContainers();
        }
    }

    handleScoreAnnouncement() {
        if (
            this.score % this.scoreAnnouncementInterval === 0 &&
            this.score > 0
        ) {
            this.scoreAnnouncementText.flash(this.score);
        }
    }

    handleEndScene() {
        if (this.trialNumber === this.totalTrials) {
            console.log("Ending game...");
            
            // Send EEG trigger for game end
            triggerService.send('game.end');
            
            this.saveData();
            this.scene.start("EndScene");
            return true;
        }
        {
            return false;
        }
    }

    /**
     * Update the explode chance bars based on the given show value.
     *
     * @param {boolean} show - Flag indicating whether to show or hide the bars.
     */
    updateExplodeChanceBars(show) {
        if (show) {
            // Show probability
            this.topUI.updateExplodeChanceBars(
                this.trialInfo[this.trialNumber]["pinkExplodeChance"],
                this.trialInfo[this.trialNumber]["purpleExplodeChance"]
            );
        } else {
            // Hide probability
            this.topUI.updateExplodeChanceBars(0, 0);
        }
    }

    /**
     * Saves the trial data to the appropriate destination based on save method.
     */
    saveData() {
        // Skip saving in practice mode
        if (this.registry.get("practice")) {
            console.log("Practice mode: skipping data save");
            return;
        }
        
        const saveMethod = this.registry.get("saveMethod");
        
        if (saveMethod === "firebase") {
            // Check the init_subject_failed flag in the registry
            if (this.registry.get("init_subject_failed")) {
                // Log a warning if the flag is set
                console.warn(
                    "Failed to save data because subject initialization failed."
                );
                // Return early
                return;
            }
            // Otherwise, save to Firebase
            else {
                // Use the saveData function from data_RL.js
                saveData(this.game);
            }
        } else if (saveMethod === "http") {
            // Save to HTTP server
            this.saveToHttpServer();
        } else {
            console.warn("Unknown save method:", saveMethod);
        }
    }

    /**
     * Saves data to HTTP server in EEG-task-data-server format.
     */
    saveToHttpServer() {
        console.log("🚨 saveToHttpServer() STARTED - Line by line debugging:");
        console.log("🚨 Step 1: Function entry");
        
        try {
            // Get URL parameters for server configuration
            console.log("🚨 Step 2: Getting URL parameters");
            const urlParams = new URLSearchParams(window.location.search);
            const apiURL = urlParams.get('apiURL') || '127.0.0.1';
            const apiPort = urlParams.get('apiPort') || '5000';
            const apiEndpoint = urlParams.get('apiEndpoint') || '/submit_data';
            
            console.log("🚨 Step 3: URL params obtained:", { apiURL, apiPort, apiEndpoint });
            
            const serverURL = `http://${apiURL}:${apiPort}${apiEndpoint}`;
            console.log("🚨 Step 4: Server URL:", serverURL);
            
            // Get trial data from registry
            console.log("🚨 Step 5: Getting registry data");
            const allTrialData = this.registry.get("data");
            console.log("🚨 Step 6: allTrialData obtained:", !!allTrialData);
            
            // Validate required registry values
            console.log("🚨 Step 7: Getting registry values");
            const subjectID = this.registry.get("subjectID");
            const session = this.registry.get("SESSION");
            const task = this.registry.get("task");
            console.log("🚨 Step 8: Registry values obtained");
            
            console.log("Registry validation:");
            console.log("- subjectID:", subjectID, "(type:", typeof subjectID, ")");
            console.log("- session:", session, "(type:", typeof session, ")");
            console.log("- task:", task, "(type:", typeof task, ")");
        console.log("- allTrialData keys:", allTrialData ? Object.keys(allTrialData).length : "null/undefined");
        
        if (!subjectID || subjectID === "undefined" || subjectID === "null") {
            console.error("❌ Missing or invalid subjectID in registry:", subjectID);
            return;
        }
        if (!session || session === "undefined" || session === "null") {
            console.error("❌ Missing or invalid SESSION in registry:", session);
            return;
        }
        if (!task || task === "undefined" || task === "null") {
            console.error("❌ Missing or invalid task in registry:", task);
            return;
        }
        if (!allTrialData || Object.keys(allTrialData).length === 0) {
            console.error("❌ No trial data found in registry:", allTrialData);
            return;
        }
        
        // Convert trial data to EEG-task-data-server format
        const dataPoints = [];
        const currentTime = Date.now(); // Base timestamp in milliseconds
        
        // Process only new trials (not previously saved)
        const newTrialKeys = Object.keys(allTrialData).filter(trialKey => {
            const trialNumber = parseInt(trialKey);
            return trialNumber > this.lastSavedTrialNumber;
        });
        
        console.log(`🚨 Step 9: Processing ${newTrialKeys.length} new trials (last saved: ${this.lastSavedTrialNumber})`);
        
        // Process each new trial
        newTrialKeys.forEach((trialKey, index) => {
            const trial = allTrialData[trialKey];
            
            // Validate trial data
            if (!trial) {
                console.warn("⚠️ Skipping null/undefined trial:", trialKey);
                return;
            }
            
            // Use actual trial timestamp if available, otherwise fallback to current time
            const trialTimestamp = trial.trialStartTimestamp || currentTime;
            
            // Create data point with all trial information
            // The 'time' field is required by EEG-task-data-server
            // Avoid duplicates by being explicit about which fields to include
            const dataPoint = {
                time: trialTimestamp, // Required: epoch milliseconds (actual trial start time)
                trial: trial.trial || 0,
                trial_type: trial.trialType || "unknown",
                score: trial.score || 0,
                n_hits: trial.nHits || 0,
                response: trial.response || "none",
                ball_colour: trial.ballColour || "unknown",
                exploded: trial.exploded ? 1 : 0, // Convert boolean to numeric
                trial_outcome: trial.trialOutcome !== undefined ? trial.trialOutcome : "incomplete",
                rt: trial.RT || 0,
                confidence: trial.confidence || 0,
                pink_bet: trial.pinkBet || 0,
                purple_bet: trial.purpleBet || 0,
                bet_scaling: trial.betScaling || 1.0,
                marker: `trial_${trial.trial || 0}_${trial.trialType || "unknown"}`,
                
                // Add specific additional fields that might be useful
                asteroid_speed: trial.asteroidSpeed,
                cannon_angle: trial.cannonAngle,
                hit_position: trial.hitPosition,
                alien_position: trial.alienPosition,
                ball_trajectory: trial.ballTrajectory,
                trial_start_time: trial.trialStartTime,
                trial_end_time: trial.trialEndTime,
                user_input_time: trial.userInputTime,
                alien_speed: trial.alienSpeed || 0, // Track alien speed progression
                outcome_interval: trial.outcomeInterval || 0 // Time from choice to outcome (ms)
            };
            
            dataPoints.push(dataPoint);
        });
        
        // Format according to EEG-task-data-server API specification
        // Required fields: id, session, data
        // Optional fields: task, write_mode
        const dataToSend = {
            id: String(subjectID), // Required
            session: String(session), // Required  
            data: dataPoints, // Required
            task: "Cannonball_MF_reversal", // Fixed task name
            write_mode: "append", // Optional
            // Add configuration metadata for research analysis
            config_metadata: {
                alien_speed_progression_enabled: gameConfigSettings.enableAlienSpeedProgression,
                base_alien_speed: this.baseAlienSpeed,
                speed_increase_interval: this.speedIncreaseInterval,
                speed_increase_amount: this.speedIncreaseAmount,
                speed_decrease_amount: this.speedDecreaseAmount
            }
        };
        
        // CRITICAL DEBUGGING - Check for missing required fields
        console.log("🚨 CRITICAL VALIDATION:");
        console.log("dataToSend object keys:", Object.keys(dataToSend));
        console.log("Required field 'id':", dataToSend.hasOwnProperty('id'), "Value:", dataToSend.id);
        console.log("Required field 'session':", dataToSend.hasOwnProperty('session'), "Value:", dataToSend.session);
        console.log("Required field 'data':", dataToSend.hasOwnProperty('data'), "Value:", Array.isArray(dataToSend.data) ? `Array[${dataToSend.data.length}]` : dataToSend.data);
        
        // Check if any required fields are empty strings or falsy
        if (!dataToSend.id || dataToSend.id === 'undefined' || dataToSend.id === 'null') {
            console.error("❌ CRITICAL: 'id' field is missing or invalid:", dataToSend.id);
            console.error("❌ STOPPING: Cannot send data without valid 'id' field");
            return;
        }
        if (!dataToSend.session || dataToSend.session === 'undefined' || dataToSend.session === 'null') {
            console.error("❌ CRITICAL: 'session' field is missing or invalid:", dataToSend.session);
            console.error("❌ STOPPING: Cannot send data without valid 'session' field");
            return;
        }
        if (!dataToSend.data || !Array.isArray(dataToSend.data)) {
            console.error("❌ CRITICAL: 'data' field is missing or not an array:", dataToSend.data);
            console.error("❌ STOPPING: Cannot send data without valid 'data' array");
            return;
        }
        
        // Final check - create a minimal test object to ensure the structure is correct
        const minimalTestData = {
            id: dataToSend.id,
            session: dataToSend.session,
            data: dataToSend.data
        };
        
        console.log("🔬 MINIMAL TEST STRUCTURE:");
        console.log("Keys in minimal object:", Object.keys(minimalTestData));
        console.log("JSON.stringify test:", JSON.stringify(minimalTestData).substring(0, 200) + "...");
        
        // Try parsing the JSON to ensure it's valid
        try {
            const testParse = JSON.parse(JSON.stringify(dataToSend));
            console.log("✅ JSON is valid and parseable");
        } catch (e) {
            console.error("❌ JSON PARSE ERROR:", e);
            return;
        }
        
        console.log(`🚀 Sending ${dataPoints.length} trial data points to EEG-task-data-server`);
        console.log("📡 Server URL:", serverURL);
        console.log("� API Requirements Check:");
        console.log("  - id (required):", dataToSend.id);
        console.log("  - session (required):", dataToSend.session);
        console.log("  - data (required):", Array.isArray(dataToSend.data) ? `Array[${dataToSend.data.length}]` : dataToSend.data);
        console.log("  - task (optional):", dataToSend.task);
        console.log("  - write_mode (optional):", dataToSend.write_mode);
        console.log("🔍 First data point sample:", dataToSend.data[0] || "none");
        console.log("📋 Full payload:", JSON.stringify(dataToSend, null, 2));

        // BACKUP APPROACH - Try with minimal required fields only first
        // Using exact format from EEG-task-data-server test_api.py
        const minimalPayload = {
            "id": String(subjectID),
            "session": String(session),
            "task": "Cannonball_MF_reversal", // Fixed task name
            "data": dataPoints
        };
        
        console.log("🚨 TRYING MINIMAL PAYLOAD (exact API format):");
        console.log("Payload keys:", Object.keys(minimalPayload));
        console.log("Payload values:");
        console.log("  id:", typeof minimalPayload.id, "=", minimalPayload.id);
        console.log("  session:", typeof minimalPayload.session, "=", minimalPayload.session);
        console.log("  task:", typeof minimalPayload.task, "=", minimalPayload.task);
        console.log("  data:", Array.isArray(minimalPayload.data), "length =", minimalPayload.data ? minimalPayload.data.length : "null");
        console.log("Full minimal payload:");
        console.log(JSON.stringify(minimalPayload, null, 2));

        fetch(serverURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(minimalPayload) // Try minimal payload first
        })
        .then(response => {
            console.log("📨 Server response status:", response.status, response.statusText);
            if (response.ok) {
                console.log("✅ Data successfully sent to EEG-task-data-server!");
                return response.json();
            } else {
                // Try to get the error details from the response
                return response.text().then(errorText => {
                    console.error("❌ Server error response:", errorText);
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                });
            }
        })
        .then(data => {
            console.log('EEG-task-data-server response:', data);
            if (data.success) {
                console.log(`✅ ${data.message}`);
                console.log(`📁 File: ${data.filename}`);
                console.log(`📊 Records added: ${data.records_added}, Total: ${data.total_records}`);
                
                // Update last saved trial number to prevent duplicates in future saves
                this.lastSavedTrialNumber = this.trialNumber;
                console.log(`🔄 Updated lastSavedTrialNumber to: ${this.lastSavedTrialNumber}`);
            }
        })
        .catch(error => {
            console.error("❌ Error sending data to EEG-task-data-server:", error);
            console.error("🔍 Error details:");
            console.error("  - Message:", error.message);
            console.error("  - Stack:", error.stack);
            
            // Check if it's a network error
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.error("🌐 Network Error: Server might not be running or accessible");
                console.error("📡 Attempted URL:", serverURL);
            } else if (error.message.includes('400')) {
                console.error("📋 Bad Request: Check the data format and required fields");
                console.error("💡 Common causes:");
                console.error("   - Missing required fields (id, session, task, data)");
                console.error("   - Invalid data types");
                console.error("   - Malformed JSON");
            }
        });
        
        } catch (error) {
            console.error("🚨 CRITICAL ERROR in saveToHttpServer:", error);
            console.error("🚨 Error stack:", error.stack);
        }
    }
    
    // Test function to verify HTTP server communication
    testHttpServer() {
        const urlParams = new URLSearchParams(window.location.search);
        const apiURL = urlParams.get('apiURL') || '127.0.0.1';
        const apiPort = urlParams.get('apiPort') || '5000';
        const apiEndpoint = urlParams.get('apiEndpoint') || '/submit_data';
        const serverURL = `http://${apiURL}:${apiPort}${apiEndpoint}`;
        
        const testData = {
            id: "test_subject",
            session: "test_session",
            task: "Cannonball_MF_reversal",
            write_mode: "append",
            data: [
                {
                    time: Date.now(),
                    value: 0.5,
                    marker: "test_marker"
                }
            ]
        };
        
        console.log("🧪 Testing HTTP server with minimal data...");
        console.log("Test data:", JSON.stringify(testData, null, 2));
        
        fetch(serverURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        })
        .then(response => {
            console.log("🧪 Test response status:", response.status, response.statusText);
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(errorText => {
                    console.error("🧪 Test error response:", errorText);
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                });
            }
        })
        .then(data => {
            console.log("🧪 Test successful:", data);
        })
        .catch(error => {
            console.error("🧪 Test failed:", error);
        });
    }
    showConfidence() {
        // // block one side
        // this.blockedSide = this.trialInfo[this.trialNumber]["blockedSide"];
        
        // // show corresponding blocked tape image
        // this.cannon.blockContainer(this.blockedSide);

        // Record trial type
        if (this.brokenTrial) {
            this.trialType = "forced_choice";
        } else {
            this.trialType = "confidence";

            // move balls to bottom of screen
            this.ball_pink.moveToBottom();
            this.ball_purple.moveToBottom();

            // Get bet scaling - select from either 5, 10, or 15
            this.betScaling =
                this.trialInfo[this.trialNumber]["confidenceScaling"];

            // Hide alien
            this.alien.visible = false;

            // show confidence UI
            this.asteroids.show(this.betScaling);

            // show pointer
            this.cannon.showPointer();

            // grow bonus round text and fade out
            this.bonusRoundText.flash();

            // set confidenceShown to true
            this.confidenceShown = true;

            // stop the alien moving
            this.alien.setMoving(false);

            // set explode chance bars
            this.updateExplodeChanceBars(false);

            // reset confidence alien hit flag
            this.confidenceTargetHit = false;
        }
    }

    /**
     * Hides the confidence UI and resets various game elements.
     */
    hideConfidence() {

        // Update score text
        this.topUI.updateScore(this.score);

        // Reset bonus text
        this.bonusText.reset();

        // Show alien
        this.alien.visible = true;

        // Set alien moving
        this.alien.setMoving(true);

        // Hide pointer
        this.cannon.hidePointer();

        // Hide asteroids
        this.asteroids.hide();

        // Set confidenceShown to false
        this.confidenceShown = false;

        // Reset ball positions
        this.ball_pink.resetPosition();
        this.ball_purple.resetPosition();
    }
}
export default GameScene;
