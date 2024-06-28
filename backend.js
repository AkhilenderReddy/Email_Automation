require("dotenv").config();
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const { OAuth2 } = google.auth;
const axios = require("axios");

// OAuth2 credentials
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// Create an OAuth2 client
const oAuth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Set refresh token
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Function to fetch and process emails
async function processEmails() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
    });

    if (res.data.messages && res.data.messages.length) {
      for (const message of res.data.messages) {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        const emailData = msg.data;
        const fromHeader = emailData.payload.headers.find(
          (header) => header.name === "From"
        );
        const from = fromHeader ? fromHeader.value : "";
        const toHeader = emailData.payload.headers.find(
          (header) => header.name === "To"
        );
        const to = toHeader ? toHeader.value : "";
        const subjectHeader = emailData.payload.headers.find(
          (header) => header.name === "Subject"
        );
        const subject = subjectHeader ? subjectHeader.value : "";

        let body = "";
        if (emailData.payload.parts) {
          for (const part of emailData.payload.parts) {
            if (part.mimeType === "text/plain" && part.body.data) {
              body = Buffer.from(part.body.data, "base64").toString("utf8");
              break;
            }
          }
        } else if (emailData.payload.body && emailData.payload.body.data) {
          body = Buffer.from(emailData.payload.body.data, "base64").toString(
            "utf8"
          );
        }

        console.log("Email From:", from);
        console.log("Email Body:", body);

        // Call the new API to get automated reply
        const response = await generateAutomatedReply(from, to, subject, body);

        // Send automatic reply
        await sendMail(
          from,
          "RE: " + response.response.subject,
          response.response.body,
          response.response.body
        );

        // Mark email as read
        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          requestBody: {
            removeLabelIds: ["UNREAD"],
          },
        });
      }
    } else {
      console.log("No new emails found.");
    }
  } catch (error) {
    console.error("Error processing emails:", error);
  }
}

// Function to call the new API and generate an automated reply
async function generateAutomatedReply(from, to, subject, body) {
  try {
    const response = await axios.post("http://localhost:3000/process-email", {
      from,
      to,
      subject,
      body: body.replace(/\n/g, " "),
    });
    return response.data;
  } catch (error) {
    console.error("Error generating automated reply:", error);
    throw error;
  }
}

// Function to send email using nodemailer
async function sendMail(to, subject, text) {

  console.log("Subject");
  console.log("+++++++++++++++++");
  console.log(subject);
  console.log("+++++++++++++++++");
  console.log("body");
  console.log("+++++++++++++++++");
  console.log(text);

  try {
    // Get access token
    const accessToken = await oAuth2Client.getAccessToken();

    // Create nodemailer transport using OAuth2
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "samplemail7843370@gmail.com", // Replace with your Gmail address
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Email options
    const mailOptions = {
      from: "chandler <samplemail7843370@gmail.com>", // Replace with your name and Gmail address
      to: to,
      subject: subject,
      text: text,
    };

    // Send mail
    const result = await transport.sendMail(mailOptions);
    console.log("Email sent...", result);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Interval to process emails every 10 seconds
setInterval(() => {
  processEmails();
  console.log("Checking Email", Date.now());
}, 10 * 1000);

// Initial call to start processing emails
processEmails();
