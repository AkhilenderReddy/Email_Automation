require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.apiKey,
});

const app = express();
app.use(bodyParser.json());

async function extractEmailDetails(emailDetails) {
  const { from, to, subject, body } = emailDetails;

  const emailString = `
    "from": "${from}",
    "to": "${to}",
    "subject": "${subject}",
    "body": "${body}"
  `;

  const fromMatch = emailString.match(/"from": "(.*?)"/);
  const toMatch = emailString.match(/"to": "(.*?)"/);
  const subjectMatch = emailString.match(/"subject": "(.*?)"/);
  const bodyMatch = emailString.match(/"body": "(.*?)"/s);

  const extractedDetails = {
    from: fromMatch ? fromMatch[1] : "",
    to: toMatch ? toMatch[1] : "",
    subject: subjectMatch ? subjectMatch[1] : "",
    body: bodyMatch ? bodyMatch[1] : "",
  };

  console.log(extractedDetails);

  return extractedDetails;
}

async function generateReply(emailDetails) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            'Write an email for me. I will provide you the subject and give it in JSON format. This should follow this format: {from: sender email, to: receiver email, subject: "", body: ""}',
        },
        {
          role: "user",
          content: `{
            "from": "${emailDetails.from}",
            "to": "${emailDetails.to}",
            "subject": "${emailDetails.subject}",
            "body": "${emailDetails.body}"
          }`,
        },
        {
          role: "assistant",
          content:
            "Categorize the email based on the content and assign a label as follows: Interested, NotInterested, More information.",
        },
        {
          role: "user",
          content: "Categorize and suggest an appropriate response.",
        },
        {
          role: "user",
          content:
            'the output should not contain any extra text except this json object\n {"categorization": "Interested/NotInterested/More Information","response":{"subject": "Response Email Subject","body": "Response Email Body"}}\n',
        },
        {
          role: "assistant",
          content:
            'It seems like you forgot to provide the JSON data again.\n\nPlease paste the JSON data in the format:\n{\n    "from": "sender@example.com",\n    "to": "receiver@example.com",\n    "subject": "Email Subject",\n}\n\nI\'ll generate the output in the specified format:\n{"categorization": "Interested/NotInterested/More Information",\n    "response": {\n        "subject": "Response Email Subject",\n        "body": "Response Email Body"\n    }\n}',
        },
      ],
      model: "llama3-8b-8192",
      temperature: 1,
      max_tokens: 8192,
      top_p: 1,
      stream: false,
      stop: null,
    });

    const reply = chatCompletion.choices[0]?.message?.content?.trim();

    function extractValues(jsonString) {
      try {
        const jsonObject = JSON.parse(jsonString);

        const categorization = jsonObject.categorization;
        const subject = jsonObject.response.subject;
        const body = jsonObject.response.body;

        return { categorization, subject, body };
      } catch (error) {
        console.error("Failed to parse JSON string:", error);
        return null;
      }
    }

    const extractedValues = extractValues(reply);

    const output = {
      categorization: "",
      response: {
        subject: "",
        body: reply,
      },
    };

    if (extractedValues) {
      output.categorization = extractedValues.categorization;
      output.response.subject = extractedValues.subject;
      output.response.body = extractedValues.body;
    } else {
      console.log("Failed to extract values.");
    }

    return output;
  } catch (error) {
    console.error("Error during Groq request:", error);
    return { error: "Failed to generate reply" };
  }
}

async function main(inputEmail) {
  try {
    const emailDetails = await extractEmailDetails(inputEmail);
    const automatedReply = await generateReply(emailDetails);
    return automatedReply;
  } catch (error) {
    console.error("Error in main function:", error);
    return { error: "Failed to process email" };
  }
}

app.post("/process-email", async (req, res) => {
  try {
    const { from, to, subject, body } = req.body;

    if (!from || !to || !subject || !body) {
      return res.status(400).json({ error: "Missing email details" });
    }

    const inputEmail = {
      from: from,
      to: to,
      subject: subject,
      body: body.replace(/\n/g, " "),
    };

    console.log(inputEmail);

    const response = await main(inputEmail);
    res.json(response);
  } catch (error) {
    console.error("Error in /process-email route:", error);
    res.status(500).json({ error: "Failed to process email" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
