class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: "PauseScene" });
    }

    create() {
        // Set the background color to match the game rectangle
        this.cameras.main.setBackgroundColor("rgb(2,0,50)");

        const padding = 20; // Add padding to ensure text fits within bounds
        const maxWidth = this.cameras.main.width - padding * 2;

        // Add the break message
        this.breakMessage = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, "Take a little break!", {
            fontSize: "20px",
            fill: "#ffffff",
            fontFamily: "Rubik, sans-serif",
        });
        this.breakMessage.setOrigin(0.5, 0.5);

        // Animate the break message to fade in and out
        this.tweens.add({
            targets: this.breakMessage,
            duration: 1000,
            alpha: 0.5, // Fade to 50% transparency
            ease: "Linear",
            yoyo: true,
            repeat: -1,
        });

        // Add the pause message
        this.message = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "When you are ready, press any key or click to continue", {
            fontSize: "22px",
            fill: "#ffffff",
            fontFamily: "Rubik, sans-serif",
            wordWrap: { width: maxWidth - 40, useAdvancedWrap: true },
        });
        this.message.setOrigin(0.5, 0.5);

        // Animate the pause message to grow and shrink
        this.tweens.add({
            targets: this.message,
            duration: 1000,
            scaleX: 1.1,
            scaleY: 1.1,
            ease: "Linear",
            yoyo: true,
            repeat: -1,
        });

        // Add a refractory period of 3 seconds before enabling input listeners
        this.time.delayedCall(3000, () => {
            // Emit an event to indicate the pause screen is ready
            this.events.emit("pauseReady");

            // Listen for any key press to resume the game
            this.input.keyboard.once("keydown", () => {
                this.resumeGame();
            });

            // Listen for a mouse click to resume the game
            this.input.once("pointerdown", () => {
                this.resumeGame();
            });
        });
    }

    resumeGame() {
        // Resume the game
        this.scene.stop(); // Stop the PauseScene
        this.scene.resume("GameScene"); // Resume the main game scene

        // Emit an event to re-enable cannon firing
        const gameScene = this.scene.get("GameScene");
        gameScene.events.emit("resumeGame");
    }
}

export default PauseScene;