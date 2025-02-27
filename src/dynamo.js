const {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
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

const writeAmendments = async (data, chamber) => {
  // Write data to DynamoDB

  const dataToWrite = data.map((amendment) => ({
    PutRequest: {
      Item: {
        billNumber: { S: amendment.billNumber },
        date: { S: amendment.date },
        lcoLink: { S: amendment.lcoLink },
        billLink: { S: amendment.billLink },
        lcoNumber: { S: amendment.lcoNumber },
        calNumber: { S: amendment.calNumber },
      },
    },
  }));

  const command = new BatchWriteItemCommand({
    RequestItems: {
      [tableNamesMap[chamber]]: dataToWrite,
    },
  });

  try {
    const result = await client.send(command);
    return result;
  } catch (err) {
    console.error("Error writing amendments to DynamoDB");
    console.error(err);
  }
};

const batchGetAmendments = async (chamber) => {
  const command = new ScanCommand({
    TableName: tableNamesMap[chamber],
  });

  try {
    const result = await client.send(command);
    return result.Items.map((item) => ({
      billNumber: item.billNumber.S,
      date: item.date.S,
      lcoLink: item.lcoLink.S,
      billLink: item.billLink.S,
      lcoNumber: item.lcoNumber.S,
      calNumber: item.calNumber.S,
    }));
  } catch (err) {
    console.error(err);
  }
};

const processAmendments = async (allAmendments, chamber) => {
  try {
    const existingAmendments = await batchGetAmendments(chamber);
    const newAmendments = allAmendments.filter(
      (amendment) =>
        !existingAmendments.some(
          (existingAmendment) =>
            existingAmendment.lcoNumber === amendment.lcoNumber
        )
    );
    console.log(
      `Found ${newAmendments.length} new amendments for the ${chamber}`
    );
    if (newAmendments.length > 0) {
      const chunksNeeded = Math.ceil(newAmendments.length / 25);
      for (let i = 0; i < chunksNeeded; i++) {
        const chunk = newAmendments.slice(i * 25, (i + 1) * 25);
        await writeAmendments(chunk, chamber);
      }
      console.log("Wrote new amendments to DynamoDB");
    } else {
      console.log("Skipping write because there are no new amendments");
    }
    return newAmendments;
  } catch (err) {
    console.log("Error processing amendments to dynamoDB: ");
    console.error(err);
  }
};

module.exports = { processAmendments };
