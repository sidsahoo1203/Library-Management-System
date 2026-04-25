const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Issue = require('../models/Issue');
const { authMiddleware } = require('../middleware/authMiddleware');

// Initialize Stripe with environment variable check
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Payments will be disabled.');
}

// ────────────────────────────────────────────────────────────
// CREATE CHECKOUT SESSION — POST /payment/create-checkout-session
// ────────────────────────────────────────────────────────────
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Payment gateway is currently offline. Please contact admin.' });
    }
    const { issueId } = req.body;
    const issue = await Issue.findById(issueId).populate('bookId');

    if (!issue || issue.fineAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No fine due for this record.' });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Late Fine: ${issue.bookId.title}`,
              description: `Library penalty for late return.`,
            },
            unit_amount: issue.fineAmount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Redirect to a backend route that clears the fine, then redirects to frontend
      success_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/payment/success/${issue._id}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-books?payment=cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment initiation failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// PAYMENT SUCCESS WEBHOOK/REDIRECT — GET /payment/success/:issueId
// ────────────────────────────────────────────────────────────
// This acts as a simple hook. When Stripe redirects here on success,
// we clear the debt and bounce the user back to their dashboard.
router.get('/success/:issueId', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (issue) {
      issue.fineAmount = 0;
      await issue.save();
    }
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/payment-success`);
  } catch (error) {
    res.status(500).send('Payment successful, but database update failed. Please contact admin.');
  }
});

module.exports = router;
