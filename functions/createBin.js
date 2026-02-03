// Bin creation function - extracted from bins.js
// Assumes Firebase is initialized and db is available

async function createBin(binData) {
  try {
    // Validate required fields
    if (!binData.name || !binData.location) {
      throw new Error("Bin name and location are required.");
    }

    // Set defaults for levels if not provided
    const wetLevel = parseInt(binData.wetLevel || 0);
    const dryLevel = parseInt(binData.dryLevel || 0);

    // Calculate status based on wet and dry level
    let status;
    if (wetLevel + dryLevel >= 95) {
      status = "urgent";
    } else if (wetLevel + dryLevel >= 75) {
      status = "critical";
    } else if (wetLevel + dryLevel >= 50) {
      status = "warning";
    } else {
      status = "normal";
    }

    const dataToSave = {
      name: binData.name,
      location: binData.location,
      wetLevel,
      dryLevel,
      status,
      lastCollected: new Date().toLocaleString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await db.collection("bins").add(dataToSave);
    console.log("Bin created with ID:", docRef.id);
    return { success: true, id: docRef.id, message: "Bin created successfully!" };
  } catch (error) {
    console.error("Error creating bin:", error);
    return { success: false, message: error.message };
  }
}

// Make it global for use in other scripts
window.createBin = createBin;