require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: "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",
});
// console.log(groq.apiKey);

const app = express();
app.use(bodyParser.json());


async function extractEmailDetails(emailDetails) {
  const { from, to, subject, body } = emailDetails;

  // Constructing valid JSON object
  const extractedDetails = {
    from: from || "",
    to: to || "",
    subject: subject || "",
    body: body || "",
  };

  console.log("Extracted Details:", extractedDetails);

  return extractedDetails;
}


async function generateReply(emailDetails) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: 'Write an email for me. I will provide you the subject and give it in JSON format. This should follow this format: {from: sender email, to: receiver email, subject: "", body: ""}',
        },
        {
          role: "user",
          content: JSON.stringify(emailDetails),
        },
        {
          role: "assistant",
          content: "Categorize the email based on the content and assign a label as follows: Interested, NotInterested, More information.",
        },
        {
          role: "user",
          content: "Categorize and suggest an appropriate response.",
        },
        {
          role: "user",
          content: 'the output should not contain any extra text except this json object\n {"categorization": "Interested/NotInterested/More Information","response":{"subject": "Response Email Subject","body": "Response Email Body"}}\n',
        },
        {
          role: "assistant",
          content: 'It seems like you forgot to provide the JSON data again.\n\nPlease paste the JSON data in the format:\n{\n    "from": "sender@example.com",\n    "to": "receiver@example.com",\n    "subject": "Email Subject",\n}\n\nI\'ll generate the output in the specified format:\n{"categorization": "Interested/NotInterested/More Information",\n    "response": {\n        "subject": "Response Email Subject",\n        "body": "Response Email Body"\n    }\n}',
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
    console.log("Raw reply from Groq:", reply);

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
    if (!extractedValues) {
      throw new Error("Failed to extract values from Groq response.");
    }

    const output = {
      categorization: extractedValues.categorization,
      response: {
        subject: extractedValues.subject,
        body: extractedValues.body,
      },
    };

    console.log("Output:", output);
    return output;
  } catch (error) {
    console.error("Error during Groq request:", error);
    return { error: "Failed to generate reply" };
  }
}


async function main(inputEmail) {
  try {
    const emailDetails = await extractEmailDetails(inputEmail);
    // console.log(emailDetails);
    const automatedReply = await generateReply(emailDetails);
    return automatedReply;
  } catch (error) {
    console.error("Error in main function:", error);
    return { error: "Failed to process email" };
  }
}

// main(inputEmail)
//   .then((response) => {
//     console.log("Final Response:");
//     console.log(response);
//   })
//   .catch((error) => {
//     console.error("Error in main function:", error);
//   });

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
