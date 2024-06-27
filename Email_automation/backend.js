require("dotenv").config();
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const natural = require("natural");
const { OAuth2 } = google.auth;

// OAuth2 credentials
const CLIENT_ID = process.env.CLIENT_ID;
// console.log(process.env.CLIENT_ID);
const CLIENT_SECRET = process.env.CLIENT_SECRET;
// console.log(process.env.CLIENT_SECRET);
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
// console.log(process.env.REFRESH_TOKEN);


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

    // console.log("here", res);
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

        // Categorize email based on content
        const category = categorizeEmail(body);

        // Suggest response based on category
        const response = suggestResponse(category);

        // Send automatic reply
        await sendMail(
          from,
          "RE: " + emailData.snippet,
          response.subject,
          response.message
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

// Function to categorize email based on content
function categorizeEmail(content) {
  // Example logic - using natural language processing library 'natural' for demo
  // Implement your own logic based on content analysis requirements
  if (content.includes("interested")) {
    return "Interested";
  } else if (content.includes("more information")) {
    return "More information";
  } else {
    return "Not interested";
  }
}

// Function to suggest response based on email category
function suggestResponse(category) {
  switch (category) {
    case "Interested":
      return {
        subject: "Interested in Demo Call",
        message:
          "Dear Customer,\n\nThank you for your interest. Would you be available for a demo call? Please suggest a convenient time.\n\nBest regards,\nYour Company",
      };
    case "More information":
      return {
        subject: "More Information Request",
        message:
          "Dear Customer,\n\nThank you for your inquiry. Could you please specify what additional information you need?\n\nBest regards,\nYour Company",
      };
    case "Not interested":
    default:
      return {
        subject: "Thank you for your Inquiry",
        message:
          "Dear Customer,\n\nThank you for reaching out. If you have any further questions in the future, feel free to contact us.\n\nBest regards,\nYour Company",
      };
  }
}

// Function to send email using nodemailer
async function sendMail(to, subject, text) {
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
      from: " chandler <samplemail7843370@gmail.com>", // Replace with your name and Gmail address
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

// Interval to process emails every 5 minutes (adjust as needed)
setInterval(() => {
  processEmails();
  console.log("Checking Email", Date.now());
},5* 1000);

// Initial call to start processing emails
processEmails();
