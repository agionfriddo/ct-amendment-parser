const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const { REGION } = require("./constants");
const { generateHTML } = require("./htmlGenerator");

const client = new SESv2Client({ region: REGION });

const sendEmail = async (amendments, chamber) => {
  // Get email addresses from environment variables
  const toEmails = process.env.TO_EMAILS
    ? process.env.TO_EMAILS.split(",")
    : [];
  const fromEmail = process.env.FROM_EMAIL;

  if (!fromEmail) {
    console.log("No sender email configured. Skipping email send.");
    return;
  }

  if (toEmails.length === 0) {
    console.log("No recipient emails configured. Skipping email send.");
    return;
  }

  // Send email
  const command = new SendEmailCommand({
    FromEmailAddress: fromEmail,
    Destination: {
      ToAddresses: toEmails,
    },
    Content: {
      Simple: {
        Subject: {
          Data: `New ${chamber} amendments`,
        },
        Body: {
          Html: {
            Data: generateHTML(amendments, chamber),
          },
        },
      },
    },
  });

  try {
    const result = await client.send(command);
    console.log("Email sent");
    return result;
  } catch (err) {
    console.log("Error sending email");
    console.error(err);
  }
};

module.exports = { sendEmail };
