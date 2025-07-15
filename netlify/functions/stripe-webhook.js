const Stripe = require("stripe");
const admin = require("firebase-admin");

// Use process.env for secrets
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin SDK from JSON in env variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

exports.handler = async function(event, context) {
  const sig = event.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return { statusCode: 400, body: "Webhook Error: " + err.message };
  }

  // Only act on successful checkout session
  if (
    stripeEvent.type === "checkout.session.completed" &&
    stripeEvent.data.object.metadata &&
    stripeEvent.data.object.metadata.uid
  ) {
    const uid = stripeEvent.data.object.metadata.uid;
    try {
      await db.collection("users").doc(uid).set({ paid: true }, { merge: true });
      console.log(`User ${uid} marked as paid!`);
      return { statusCode: 200, body: "Success!" };
    } catch (e) {
      console.error("Error updating user:", e);
      return { statusCode: 500, body: "Database update failed" };
    }
  }

  return { statusCode: 200, body: "Event ignored" };
};