const stripe = require('stripe')(process.env.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);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { email, uid } = JSON.parse(event.body);

    // OPTIONAL: Add logic here to check if this user (by uid) has already paid.
    // If so, return a redirect URL to premium directly.

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: process.env.prod_SeqPg4SL3aTRoS, // Stripe Price ID from env variable
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://unpacked.today/Paid/Atlas.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://unpacked.today/index.html',
      metadata: {
        firebase_uid: uid,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message }),
    };
  }
};