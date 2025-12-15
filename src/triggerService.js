/**
 * Trigger Service for EEG trigger server communication
 * Sends triggers via HTTP POST to the EEG trigger server
 */

// Trigger mappings (matching triggerMappings.json)
const triggerMappings = {
    "system.test": 99,
    "system.initialized": 1,
    "system.error": 2,
    "game.start": 10,
    "game.end": 11,
    "game.response": 12,
    "game.ballFired": 13,
    "game.alienHit": 14,
    "game.ballMissed": 15,
    "game.asteroidHit": 16,
    "game.ballExplode": 17,
    "game.newTrial": 18
};

class TriggerService {
    constructor() {
        this.serverURL = 'http://127.0.0.1:5000/set_data';
        this.enabled = false;
        this.triggerMappings = triggerMappings;
    }

    /**
     * Initialize the trigger service with configuration
     * @param {object} config - Configuration object
     * @param {string} config.serverURL - The trigger server URL (optional)
     * @param {boolean} config.enabled - Whether triggers are enabled
     */
    init(config = {}) {
        if (config.serverURL) {
            this.serverURL = config.serverURL;
        }
        this.enabled = config.enabled !== false; // Default to true if not specified
        console.log(`🎯 Trigger Service initialized: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🎯 Trigger Server URL: ${this.serverURL}`);
    }

    /**
     * Send a trigger to the EEG trigger server
     * @param {string|number} trigger - Either a trigger name (e.g., 'game.response') or a numeric trigger value
     * @returns {Promise} - Resolves when trigger is sent
     */
    async send(trigger) {
        if (!this.enabled) {
            console.log(`🎯 [DISABLED] Trigger: ${trigger}`);
            return;
        }

        // Get the trigger value
        let triggerValue;
        if (typeof trigger === 'string') {
            triggerValue = this.triggerMappings[trigger];
            if (triggerValue === undefined) {
                console.warn(`⚠️ Unknown trigger name: ${trigger}`);
                return;
            }
        } else {
            triggerValue = trigger;
        }

        console.log(`🎯 Sending trigger: ${trigger} (value: ${triggerValue})`);

        try {
            const response = await fetch(this.serverURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trigger_value: triggerValue }),
            });

            if (!response.ok) {
                console.error(`❌ Trigger server error: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Failed to send trigger: ${error.message}`);
        }
    }

    /**
     * Send a test trigger to verify connection
     */
    async test() {
        console.log('🎯 Testing trigger server connection...');
        await this.send('system.test');
    }
}

// Export singleton instance
const triggerService = new TriggerService();
export default triggerService;
