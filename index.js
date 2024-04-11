const { processAmendments } = require("./src/dynamo");
const { fetchAndParse } = require("./src/parser");
const { sendEmail } = require("./src/ses");

const main = async () => {
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
      await sendEmail(newSenateAmendments, "senate");
    }
    if (newHouseAmendments.length > 0) {
      await sendEmail(newHouseAmendments, "house");
    }
  } catch (e) {
    console.error(e);
  }
};

exports.handler = main;
