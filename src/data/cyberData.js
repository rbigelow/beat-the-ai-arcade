// Safe, fictional messages. The example.test domains are reserved and non-operational.
export const CYBER_ROUNDS = [
  {
    from: 'security-team@georgian-secure-login.example.test',
    subject: 'URGENT: Your account will be locked in 1 hour',
    body: 'Dear user, we noticed suspicious activity. Verify your password immediately at http://georgian-login.example.test/verify or your account will be suspended.',
    isPhishing: true,
  },
  {
    from: 'library@campus-library.example.test',
    subject: 'Reminder: book due Friday',
    body: 'Hi Sam, a friendly reminder that "Intro to Robotics" is due this Friday. You can renew it from the library desk or from your account page after you sign in as usual.',
    isPhishing: false,
  },
  {
    from: 'prizes@winner-center.example.test',
    subject: 'You won a free gift card!!!',
    body: 'Congratulations! Claim your $500 gift card now. Send your student number and login details to claim. Offer expires today! http://free-gift.example.test/claim',
    isPhishing: true,
  },
  {
    from: 'events@appliedai.example.test',
    subject: 'Open house tour times',
    body: 'Thanks for registering for the Applied AI open house. Tours run at 10:00 and 1:00 in the main lobby. No action is needed. We look forward to seeing you!',
    isPhishing: false,
  },
  {
    from: 'it-helpdesk@pay-roll-update.example.test',
    subject: 'Action required: confirm banking details',
    body: 'Payroll is changing systems. Reply with your bank account number and password to avoid a delay in your pay. Act now at http://payroll-check.example.test/login',
    isPhishing: true,
  },
]
