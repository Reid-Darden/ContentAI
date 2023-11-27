const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: "gvcontentai@gmail.com",
    pass: "uipz yzoo dttw ljkv",
  },
});

// Function to send the email
async function sendEmail(textContent, user) {
  const mailOptions = {
    from: "gvcontentai@gmail.com",
    to: "reiddarden@gmail.com",
    subject: `GVContentAI: New Article Submission by ${user}`,
    html: textContent,
  };

  const info = await transporter.sendMail(mailOptions);

  return info;
}

module.exports = sendEmail;
