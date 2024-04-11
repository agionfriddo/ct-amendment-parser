const { processAmendments } = require("./src/dynamo");
const { fetchAndParse } = require("./src/parser");
const { sendEmail } = require("./src/ses");

exports.handler = async function () {
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
};
