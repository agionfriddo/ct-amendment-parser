const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const { REGION } = require("./constants");
const { generateHTML } = require("./htmlGenerator");

const client = new SESv2Client({ region: REGION });

const sendEmail = async (amendments, chamber) => {
  // Send email
  const command = new SendEmailCommand({
    FromEmailAddress: "example@example.com",
    Destination: {
      ToAddresses: ["example@example.com"],
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
