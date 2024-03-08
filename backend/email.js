const nodemailer = require("nodemailer");
const fs = require("fs");

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
async function sendEmail(textContent, title, comments, user) {
  // create html attachment
  fs.writeFile(`./frontend/files/html/${title.replace(/\s/g, "")}.html`, textContent, () => {});

  const mailOptions = {
    from: "gvcontentai@gmail.com",
    to: "reiddarden@gmail.com",
    subject: `GVContentAI: New Article (${title}) by ${user}`,
    text: "NOTES:" + comments,
    attachments: [
      {
        filename: `${title.replace(/\s/g, "")}.html`,
        path: `./frontend/files/html/${title.replace(/\s/g, "")}.html`,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);

  return info;
}

module.exports = sendEmail;
