const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Issue = require('../models/Issue');
const Student = require('../models/Student');
const Book = require('../models/Book');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or use Ethereal for testing
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOverdueReminders = async () => {
  try {
    const today = new Date();
    // Find active issues that are past due and haven't had a reminder sent yet
    const overdueIssues = await Issue.find({
      status: 'Issued',
      dueDate: { $lt: today },
      reminderSent: false
    }).populate('studentId').populate('bookId');

    console.log(`[Cron] Checking for overdue books. Found ${overdueIssues.length} candidates.`);

    for (const issue of overdueIssues) {
      if (issue.studentId && issue.studentId.email) {
        const mailOptions = {
          from: `"University Library" <${process.env.EMAIL_USER}>`,
          to: issue.studentId.email,
          subject: '⚠️ Overdue Book Reminder',
          text: `Dear ${issue.studentName},\n\nThe book "${issue.bookId.title}" was due on ${issue.dueDate.toDateString()}. Please return it immediately to avoid further fines.\n\nCurrent fine: $${issue.fineAmount || 0}\n\nThank you!`
        };

        await transporter.sendMail(mailOptions);
        issue.reminderSent = true;
        await issue.save();
        console.log(`[Cron] Reminder sent to ${issue.studentId.email} for "${issue.bookId.title}"`);
      }
    }
  } catch (error) {
    console.error('[Cron Error] Failed to process overdue reminders:', error);
  }
};

const startCronJobs = () => {
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('[Cron] Running daily overdue check...');
    sendOverdueReminders();
  });
  
  // Initial run for testing (optional, usually disabled in prod)
  // sendOverdueReminders();
};

module.exports = startCronJobs;
