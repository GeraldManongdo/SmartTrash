// Cloud Function (Callable) example for securely creating janitor accounts
// Deploy with Firebase Functions (Node 18+). This uses Admin SDK.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.createJanitor = functions.https.onCall(async (data, context) => {
  // Ensure caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated admins can create janitor accounts.",
    );
  }

  // Check caller role
  const callerDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can create janitor accounts.",
    );
  }

  const { email, password, name, phone, area } = data;
  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields",
    );
  }

  // Create auth user
  const userRecord = await admin.auth().createUser({
    email: email,
    password: password,
    displayName: name,
    phoneNumber: phone || undefined,
  });

  // Create Firestore user record
  await db
    .collection("users")
    .doc(userRecord.uid)
    .set({
      name,
      email,
      phone: phone || null,
      area: area || null,
      role: "janitor",
      status: "active",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { uid: userRecord.uid };
});
