// Load environment variables
require("dotenv").config();

const { processAmendments } = require("./src/processAmendments");
const { fetchAndParse } = require("./src/amendmentParser");
const { sendEmail } = require("./src/mailer");

async function main() {
  console.log("Starting...");
  try {
    const senateAmendments = await fetchAndParse("senate");
    const houseAmendments = await fetchAndParse("house");

    const newSenateAmendments = await processAmendments(
      senateAmendments,
      "senate"
    );
    const newHouseAmendments = await processAmendments(
      houseAmendments,
      "house"
    );

    if (newSenateAmendments.length > 0) {
      console.log("Sending email for senate amendments");
      await sendEmail(newSenateAmendments, "senate");
    }
    if (newHouseAmendments.length > 0) {
      console.log("Sending email for house amendments");
      await sendEmail(newHouseAmendments, "house");
    }
    return "Success!";
  } catch (e) {
    console.log("ERROR: ");
    console.error(e);
  }
}

exports.handler = main;

// main();
