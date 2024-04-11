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

    console.log(newSenateAmendments);
    console.log(newHouseAmendments);

    await sendEmail(newSenateAmendments, "senate");
  } catch (e) {
    console.error(e);
  }
};

main();
