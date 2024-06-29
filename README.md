# Email Automation Using - llama3-8b-8192

The goal of this project is to minimize the manual effort involved in managing emails by offering a robust, efficient, and dependable solution for email automation. By automating email responses, it ensures prompt replies, boosts productivity, and enhances communication efficiency. This system parses and checks emails from Google email accounts, automatically responding based on their context using AI. Integrated with Gmail, it retrieves unread emails, categorizes them using the Groq SDK with LLM (Llama), generates automated replies, and sends responses via Nodemailer.

## Work Flow

<div align="center">
  <img src="https://github.com/AkhilenderReddy/Email_Automation/assets/99494371/5c5c8f68-4110-4454-8586-6cdcb69fa3b5" alt="Mind map" width="330" height="630">
</div>

## Requirements

- Node.js (version 14.x or later)
- npm (version 6.x or later)
- Google API credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
- Groq SDK API key
- A Gmail account for testing

## Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/AkhilenderReddy/Email_Automation.git

2. **Install Dependencies**

   Install the project dependencies using npm:

   ```sh
   npm install 
   ```

   This command installs the necessary Node.js packages:

   - `googleapis`: Official Node.js client library for Google APIs (including Gmail API).
   - `nodemailer`: Module for sending emails using Node.js.
   - `axios`: Promise-based HTTP client for making HTTP requests.
   - `express`: Web framework for Node.js used to create the API server.
   - `body-parser`: Middleware to parse incoming request bodies in Express.
   - `groq-sdk`: SDK for using Groq API, including LLM (Llama), for natural language processing.
   - `dotenv`: Module to load environment variables from a `.env` file into `process.env`.

## Setup

1. **Create a `.env` File**

   Create a `.env` file in the root directory of your project and add the following environment variables:

   ```sh
   CLIENT_ID=your-google-client-id
   CLIENT_SECRET=your-google-client-secret
   REDIRECT_URI=https://developers.google.com/oauthplayground
   REFRESH_TOKEN=your-google-refresh-token
   apiKey=your-groq-api-key
   PORT=3000
   ```

   Replace `your-google-client-id`, `your-google-client-secret`, `your-google-refresh-token`, and `your-groq-api-key` with your actual credentials and API key obtained from Google and Groq SDK.

2. **Configure Google API Credentials**

   Follow [Google's guide](https://developers.google.com/gmail/api/quickstart/nodejs) to obtain your CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN. These credentials are necessary for accessing the Gmail API.

3. **Start the Backend Server**

   The backend server is responsible for fetching unread emails, categorizing them, generating replies, and sending responses.

   ```sh
   node backend.js
   ```

4. **Start the Express API Server**

   The Express API server processes emails, extracts details, and generates replies using the Groq SDK.

   ```sh
   node analysis.js
   ```


## Testimonials

### Input Email 

  <img src="https://github.com/AkhilenderReddy/Email_Automation/assets/99494371/a29012fc-1052-4cac-a585-734fb0a62b8b" alt="WhatsApp Image 2024-06-29 at 05 19 49_d387d1f9" width="300" height="550">

### AI Generated Email

   <img src="https://github.com/AkhilenderReddy/Email_Automation/assets/99494371/93e59735-d82a-4730-802b-e66b2634e3fc" alt="WhatsApp Image 2024-06-29 at 05 19 49_d387d1f9"  width="300" height="550">
