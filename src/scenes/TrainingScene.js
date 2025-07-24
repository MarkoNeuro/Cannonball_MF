import GameScene from "./GameScene.js";
import InstructionBox from "../classes/instructionBox.js";

class TrainingScene extends GameScene {
    constructor(key) {
        super("TrainingScene");
    }

    init(data) {
        super.init(data);
        this.trainingPhase = 0;
        
        // Get task type
        this.task = this.game.registry.get("task");
    }

    preload() {
        super.preload();
        
    }

    create() {
        super.create();                

        // Set cannon movement flag
        this.cannonMoving = true;

        // Instruction box for cannon aiming
        this.instructionBoxCannon = new InstructionBox(
            this,
            250,
            350,
            300,
            100,
            250,
            1,
            17,
            "down", 
            "Click to continue" 
        );
        this.instructionBoxCannon.setText("Use the mouse to aim the cannon at the moving alien spaceship.\n\n");
        this.instructionBoxCannon.hide();

        // Instruction boxes for containers (left and right)
        this.instructionBoxContainerLeft = new InstructionBox(
            this,
            100,
            400,
            150,
            100,
            100,
            1,
            17,
            "down",
            "Choose one!"
        );
        this.instructionBoxContainerLeft.setText(
            "Press 1 to fire from the left container\n\n"
        );

        this.instructionBoxContainerRight = new InstructionBox(
            this,
            400,
            400,
            150,
            100,
            400,
            1,
            17,
            "down",
            "Choose one!"
        );
        this.instructionBoxContainerRight.setText(
            "Press 2 to fire from the right container\n\n"
        );
        this.instructionBoxContainerLeft.hide();
        this.instructionBoxContainerRight.hide();

        // Instruction box for balls
        this.instructionBoxBalls = new InstructionBox(
            this,
            250,
            350,
            350,
            170,
            250,
            1,
            18,
            "down",
            "\n\nClick to continue"
        );
        if (this.task === "MB") {
            this.instructionBoxBalls.setText(
                "The two containers have a different chance to fire pink or purple balls, which changes from time to time"
            );
        }
        else if (this.task === "MBMF") {
            this.instructionBoxBalls.setText(
                "The two containers have a different chance to fire pink or purple balls, depending on how many of each colour there are"
            );
        }
        else if (this.task === "MF") {
            this.instructionBoxBalls.setText(
                "Both containers will fire grey coloured balls.\n\nIf the ball is good, it will start burning and continue moving towards the target.\n\n"
            );
        }
        this.instructionBoxBalls.hide();

        // Instruction box for balls
        this.instructionBoxBalls2 = new InstructionBox(
            this,
            250,
            350,
            350,
            140,
            250,
            1,
            18,
            "down",
            "Click to continue"
        );
        if (this.task === "MF") {
            this.instructionBoxBalls2.setText(
                "Some balls will explode before reaching the spaceship—when this happens, you lose points!\n\n"
            );
        }
        else
            this.instructionBoxBalls2.setText(
                "If one container is shooting one colour, this means the other one is more likely to shoot the other colour"
            );
            this.instructionBoxBalls2.hide();

        // Instruction box for explosions
        this.instructionBoxExplosions = new InstructionBox(
            this,
            250,
            350,
            350,
            180,
            250,
            1,
            17,
            "down",
        );
        if (this.task === "MB") {
            this.instructionBoxExplosions.setText(
                "Some balls will explode and you will lose points!\n\nThe fuller the bar, the MORE likely the ball will be safe"
            );
        }
        else if (this.task === "MBMF") {
            this.instructionBoxExplosions.setText(
                "Some balls will explode and you will lose points!\n\nPink and purple balls have different chances of exploding, which changes from time to time"
            );
        }
        else if (this.task === "MF") {
            this.instructionBoxExplosions.setText(
                "The left and right container have different chances of firing exploding (bad) balls or good balls. This will change during the game.\n\nSometimes, it will be easy to figure out which container is the better one, but sometimes it will be hard!"
            );
        }
        this.instructionBoxExplosions.hide();

        if (this.task === "MF") {
            this.instructionBoxExplosions2 = new InstructionBox(
                this,
                250,
                350,
                350,
                150,
                250,
                1,
                17,
                "down",
            );
            this.instructionBoxExplosions2.setText(
                "If one container is likely to have the good ball, the other is equally likely to have the bad one, and vice versa.\n\nBut every turn, only ONE container has the good ball, and the other has the bad one."
            );
            this.instructionBoxExplosions2.hide();
        }

        // Instruction box for alien
        this.instructionBoxAlien = new InstructionBox(
            this,
            250,
            360,
            300,
            200,
            250,
            1,
            15,
            "up"
        );
        this.instructionBoxAlien.setText(
            "Your goal is to score points by hitting the spaceship with a good ball.\n\nDon’t worry about missing.\nIf you fire a good ball but miss the spaceship, that’s okay—you won’t lose any points.\n\nThe most important thing is to learn which container has the good ball more often."
        );
        this.instructionBoxAlien.hide();

        // Instruction box for asteroid
        this.instructionBoxAsteroid = new InstructionBox(
            this,
            250,
            290,
            300,
            70,
            250,
            0.7,
            15,
            "up"
        );
        this.instructionBoxAsteroid.setText(
            "Your goal is to hit the alien spaceships with the balls!"
        );
        this.instructionBoxAsteroid.hide();

        // Ball number instruction box
        this.instructionBoxBallNumber = new InstructionBox(
            this,
            250,
            105,
            300,
            70,
            250,
            0.7,
            15,
            "up"
        );
        this.instructionBoxBallNumber.setText(
            "The number at the top shows how many balls you have left"
        );
        this.instructionBoxBallNumber.hide();

        // Good luck instruction box
        this.instructionBoxGoodLuck = new InstructionBox(
            this,
            250,
            105,
            300,
            70,
            250,
            0,
            20,
            "up",
            "Click to continue"
        );
        this.instructionBoxGoodLuck.setText(
            "Good luck!\n"
        );
        this.instructionBoxGoodLuck.hide();

        // Bonus round instruction box
        this.instructionBoxBonusRound = new InstructionBox(
            this,
            250,
            175,
            300,
            70,
            250,
            0.7,
            15,
            "down"
        );
        this.instructionBoxBonusRound.setText(
            "On bonus rounds, earn extra points by matching the colours of the ball and asteroids"
        );
        this.instructionBoxBonusRound.hide();

        

        // Asteroid bonus instruction box
        this.instructionBoxAsteroidBonus = new InstructionBox(
            this,
            300,
            200,
            300,
            70,
            400,
            0,
            15,
            "down"
        );
        this.instructionBoxAsteroidBonus.setText(
            "If the ball colour matches, you win the bonus amount. If not, you lose the amount!"
        );
        this.instructionBoxAsteroidBonus.hide();

        // Variable to keep track of timing
        this.timeSinceStepShown = 0;

        // Prevent training step from being clicked too quickly
        this.trainingStepLocked = false;

        // Start training step
        this.stepTraining();

        // Increment training phase on click
        this.input.on(
            "pointerdown",
            function (pointer) {
                this.handleClick();
            },
            this
        );


        // Watch for "fired" event from the balls and step training when fired
        this.ball_pink.on(
            "offScreen",
            function () {
                this.stepTraining();
            },
            this
        );

        this.ball_purple.on(
            "offScreen",
            function () {
                this.stepTraining();
            },
            this
        );

        this.ball_pink.on(
            "exploded",
            function () {
                this.stepTraining();
            },
            this
        );

        this.ball_purple.on(
            "exploded",
            function () {
                this.stepTraining();
            },
            this
        );

        

        // Set balls for training
        this.trialInfo[0]["pinkExplode"] = 1;
        this.trialInfo[0]["purpleExplode"] = 1;
        this.trialInfo[1]["pinkExplode"] = 0;
        this.trialInfo[1]["purpleExplode"] = 0;
    }

    handleClick() {
        // Block clicks in phase 2
        if (this.trainingPhase === 3 || this.trainingPhase === 5) return;
        if (this.trainingStepLocked) return;
        if (this.timeSinceStepShown > 1000) {
            this.trainingStepLocked = true;
            this.stepTraining();
            this.time.delayedCall(300, () => {
                this.trainingStepLocked = false;
            });
        }
    }

    

    update() {
        // Run cannon updates
        this.cannon.update();

        // Run ball updates
        this.ball_pink.update();
        this.ball_purple.update();

        if (this.trainingPhase === 3 || this.trainingPhase === 5) {
            this.alien.visible = false;
            this.alien.moving = false; // Ensure alien is hidden before firing
            // if the 1 key is pressed
            this.handleKeyPress("ONE", 0);
            // if the 2 key is pressed
            this.handleKeyPress("TWO", 1);
        }

        // Increment time since step shown
        this.timeSinceStepShown += this.game.loop.delta;
    }

    saveData() {
        // Don't save data during training
    }

    stepTraining() {
        // Reset time since step shown
        this.timeSinceStepShown = 0;

        // Increment training phase
        this.trainingPhase += 1;

        // Perform different actions based on the training phase
        switch (this.trainingPhase) {
            case 1:
                // Show cannon instruction box
                this.instructionBoxCannon.show();

                // Stop alien from moving
                this.alien.setMoving(true);
                this.alien.visible = true;
                break;
            case 2:
                // Make sure we don't show a confidence trial somehow
                this.hideConfidence();

                // Hide container instruction boxes and show balls instruction box
                this.instructionBoxCannon.hide();
                this.instructionBoxContainerLeft.hide();
                this.instructionBoxContainerRight.hide();
                this.instructionBoxBalls.show();

                // Stop alien from moving
                this.alien.setMoving(false);
                this.alien.visible = false;

                break;
            case 3:
                this.alien.setMoving(false);
                this.alien.visible = false;
                this.instructionBoxBalls.hide();
                // Hide cannon instruction box and show container instruction boxes
                
                this.instructionBoxContainerLeft.show();
                this.instructionBoxContainerRight.show();
                break;
            case 4:
                // Hide container instruction boxes and show balls instruction box
                this.instructionBoxCannon.hide();
                this.instructionBoxContainerLeft.hide();
                this.instructionBoxContainerRight.hide();
                this.instructionBoxBalls2.show();

                // Stop alien from moving
                this.alien.setMoving(false);
                this.alien.visible = false;

                break;
            case 5:
                this.alien.setMoving(false);
                this.alien.visible = false;
                if (this.task === "MF") {
                    this.instructionBoxBalls2.hide();
                    
                    this.instructionBoxContainerLeft.show();
                    this.instructionBoxContainerRight.show();
                    break;
                }
                else {
                        this.instructionBoxBallNumber.hide();
                        this.trainingPhase = 6;
                        this.stepTraining();
                        break;
                }

            case 6:
                // Hide balls instruction box and show explosions instruction box if MB
                if (this.task === "MB") {
                    this.instructionBoxBalls.hide();
                    this.instructionBoxBalls2.show();
                    break;
                }
                // Otherwise step training again
                else {
                    this.alien.visible = false;
                    this.instructionBoxContainerLeft.hide();
                    this.instructionBoxContainerRight.hide();
                    
                    this.stepTraining();
                    break;
                }
            case 7:
                this.instructionBoxBalls2.hide();
                this.instructionBoxExplosions.show();

                
                break;


            case 8:
                this.instructionBoxExplosions.hide();
                if (this.task === "MF" && this.instructionBoxExplosions2) {
                    this.instructionBoxExplosions2.show();
                }
                break;



            case 9:
                this.instructionBoxExplosions.hide();
                if (this.task === "MF" && this.instructionBoxExplosions2) {
                    this.instructionBoxExplosions2.hide();
                    this.instructionBoxAlien.show();
                }
                else {
                    this.instructionBoxAsteroid.show();
                }

                // reset alien position and make it visible
                this.alien.setPosition(250, 200);
                this.alien.setMoving(false);
                this.alien.visible = true;
                break;
            case 10:
                // Show ball number instruction box
                this.instructionBoxAsteroid.hide();
                this.instructionBoxAlien.hide();
                this.instructionBoxBallNumber.show();
                break;
            case 11:
                //Show good luck instruction box
                this.instructionBoxBallNumber.hide();
                this.instructionBoxGoodLuck.show();
                break;

            case 12:
                // Show confidence instructions if MB
                if (this.task === "MB") {
                    this.showConfidence();
                    this.instructionBoxBallNumber.hide();
                    this.instructionBoxBonusRound.show();
                    break;
                }
                else {
                    this.instructionBoxBallNumber.hide();
                    this.trainingPhase = 13;
                    this.stepTraining();
                    break;
                }
            case 13:
                // Hide confidence instruction box and show ball number instruction box
                this.instructionBoxBonusRound.hide();
                if (this.task !== "MF") {
                    this.instructionBoxAsteroidBonus.show();
                }
                break;
            case 14:
                // Move to the ready scene
                this.instructionBoxBallNumber.hide();
                this.scene.start("ReadyScene");
                break;
        }
    }
}

export default TrainingScene;
