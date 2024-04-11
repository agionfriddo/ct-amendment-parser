const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  REGION,
  SENATE_AMENDMENTS_TABLE,
  HOUSE_AMENDMENTS_TABLE,
} = require("./constants");

const tableNamesMap = {
  senate: SENATE_AMENDMENTS_TABLE,
  house: HOUSE_AMENDMENTS_TABLE,
};

const client = new DynamoDBClient({ region: REGION });

const writeAmendment = async (data, chamber) => {
  // Write data to DynamoDB
  const command = new PutItemCommand({
    TableName: tableNamesMap[chamber],
    Item: {
      calNumber: { S: data.calNumber },
      lcoNumber: { S: data.lcoNumber },
      lcoLink: { S: data.lcoLink },
      billNumber: { S: data.billNumber },
      billLink: { S: data.billLink },
      date: { S: data.date },
    },
  });

  try {
    const result = await client.send(command);
    return result;
  } catch (err) {
    console.error(err);
  }
};

const getAmendment = async (lcoNumber, chamber) => {
  const command = new GetItemCommand({
    TableName: tableNamesMap[chamber],
    Key: {
      lcoNumber: { S: lcoNumber },
    },
  });

  try {
    const result = await client.send(command);
    return result.Item;
  } catch (err) {
    console.error(err);
  }
};

const processAmendments = async (amendments, chamber) => {
  const newAmendments = [];
  try {
    for (const amendment of amendments) {
      const amendmentData = await getAmendment(amendment.lcoNumber, chamber);
      if (!amendmentData) {
        console.log(
          `Amendment does not exist in ${tableNamesMap[chamber]} table: ${amendment.lcoNumber}`
        );
        newAmendments.push(amendment);
        await writeAmendment(amendment, chamber);
        console.log(
          `Successfully wrote ammendment ${amendment.lcoNumber} to table ${tableNamesMap[chamber]}`
        );
      } else {
        console.log(
          `Amendment already exists in ${tableNamesMap[chamber]}: ${amendment.lcoNumber}`
        );
      }
    }
    return newAmendments;
  } catch (err) {
    console.log("Error processing amendments to dynamoDB: ");
    console.error(err);
  }
};

module.exports = { processAmendments };
