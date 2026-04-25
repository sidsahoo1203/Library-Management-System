const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Issue = require('../models/Issue');

// Configure the SMTP transport
// Using Ethereal (a fake SMTP service) for development. 
// In production, this would be Gmail, Sendgrid, or Amazon SES.
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
      user: 'estella.stehr76@ethereal.email', // Replace with real account in prod
      pass: 'D45bZQqQ7W8tU2vC9p'
  }
});

const startCronJobs = () => {
  console.log('⏰ Initializing Background Cron Jobs...');

  // Runs every day at 8:00 AM ('0 8 * * *')
  // We'll set it to run every minute for testing purposes if needed, but daily is standard.
  cron.schedule('0 8 * * *', async () => {
    console.log('🔄 Running daily overdue/due-date check...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const today = new Date();

      // Find issues that are actively 'Issued' and haven't been reminded yet
      const activeIssues = await Issue.find({ status: 'Issued', reminderSent: false })
                                      .populate('bookId')
                                      .populate('studentId');

      for (let issue of activeIssues) {
        const dueDate = new Date(issue.dueDate);
        
        // If the book is due tomorrow OR it is already overdue
        if (dueDate <= tomorrow) {
          
          const isOverdue = dueDate < today;
          const subject = isOverdue ? `🚨 OVERDUE NOTICE: Return "${issue.bookId.title}"` : `📚 Reminder: "${issue.bookId.title}" is due tomorrow!`;
          
          const text = `
          Hello ${issue.studentId.name},

          This is an automated notification from the Library Management System.
          
          Book: ${issue.bookId.title}
          Due Date: ${dueDate.toDateString()}
          
          ${isOverdue ? 'This book is currently OVERDUE. Please return it immediately to prevent further fines.' : 'Please return this book by tomorrow to avoid late fines.'}
          
          Thank you!
          `;

          try {
            const info = await transporter.sendMail({
              from: '"Library System" <admin@library.com>',
              to: issue.studentId.email,
              subject: subject,
              text: text,
            });

            console.log(`✉️ Reminder email sent to ${issue.studentId.email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            
            // Mark as reminded so we don't spam them every single day
            issue.reminderSent = true;
            await issue.save();

          } catch (mailError) {
            console.error(`Failed to send email to ${issue.studentId.email}`, mailError);
          }
        }
      }
    } catch (error) {
      console.error('Error during cron job execution:', error);
    }
  });
};

module.exports = startCronJobs;
