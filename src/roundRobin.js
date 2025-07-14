import { getFirestore, doc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

const db = getFirestore();

async function initializeRoundRobin() {
    const conditionsRef = doc(db, "conditions", "round_robin");

    const initialData = {
        current_index: 0,
        files: [
            "trial_info_model-free_LW_SF_7525.json",
            "trial_info_model-free_LW_VF_7525.json",
            "trial_info_model-free_RW_SF_7525.json",
            "trial_info_model-free_RW_VF_7525.json",
        ],        
    };

    try {
        await setDoc(conditionsRef, initialData, { merge: true });
        console.log("Round-robin document initialized successfully!");
    } catch (error) {
        console.error("Error initializing round-robin document:", error);
    }
}

//initializeRoundRobin();

// Function to assign conditions using round-robin logic
export async function assignTrialInfoRoundRobinFirestore() {
    const conditionsRef = doc(db, "conditions", "round_robin");

    try {
        // Use a Firestore transaction to ensure atomic updates
        const assignedCondition = await runTransaction(db, async (transaction) => {
            const conditionsDoc = await transaction.get(conditionsRef);

            if (!conditionsDoc.exists()) {
                console.warn("Round-robin document missing. Initializing...");
                await initializeRoundRobin(); // Initialize if missing
                throw new Error("Document was missing; initialized. Please retry.");
            }

            const data = conditionsDoc.data();
            const conditionList = data.files;
            let currentIndex = data.current_index;

            // Validate condition list and current index
            if (!Array.isArray(conditionList) || conditionList.length === 0) {
                throw new Error("condition_list is not defined or is empty!");
            }
            // Ensure `current_index` exists and is a valid number            
            if (typeof currentIndex !== "number" || currentIndex < 0) {
                console.warn("Invalid current_index detected. Resetting to 0.");
                currentIndex = 0;
            }

            // Assign the condition based on the current index
            const assignedCondition = conditionList[currentIndex];

            // Increment the index and wrap around if it exceeds the list length
            currentIndex = (currentIndex + 1) % conditionList.length;

            // Update the index back in Firestore
            transaction.update(conditionsRef, { current_index: currentIndex });

            return assignedCondition;
        });

        return assignedCondition;
    } catch (error) {
        console.error("Error in round-robin assignment:", error);
        throw error;
    }
}
