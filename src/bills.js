const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");
const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { REGION, BILLS_TABLE } = require("./constants");

// NOTE: This is generally bad practice, but we're not sending any sensitive data and we are fetching constant web
// pages, so we're not too worried about it. This is just to get around the SSL certificate issue.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const client = new DynamoDBClient({ region: REGION });

const checkBillExists = async (billNumber) => {
  const command = new GetItemCommand({
    TableName: BILLS_TABLE,
    Key: {
      billNumber: { S: billNumber },
    },
  });

  try {
    const result = await client.send(command);
    return !!result.Item;
  } catch (err) {
    console.error("Error checking if bill exists:", err);
    throw err;
  }
};

const scrapeBillPDFs = async (billLink) => {
  try {
    const response = await axios.get(billLink, { httpsAgent });
    const $ = cheerio.load(response.data);
    const pdfLinks = [];

    // Find the table with summary="Status of bills"
    $('table[summary="Status of bills"] tbody tr').each((_, row) => {
      // Get all links in the row
      $(row)
        .find("a")
        .each((_, link) => {
          const href = $(link).attr("href");
          // Only add PDF links
          if (href && href.endsWith(".PDF")) {
            // If the link starts with /, add the base URL
            const fullLink = href.startsWith("/")
              ? `https://cga.ct.gov${href}`
              : href;
            pdfLinks.push(fullLink);
          }
        });
    });

    return pdfLinks;
  } catch (err) {
    console.error("Error scraping bill PDFs:", err);
    throw err;
  }
};

const writeBillToDynamo = async (billData) => {
  const command = new PutItemCommand({
    TableName: BILLS_TABLE,
    Item: {
      billNumber: { S: billData.billNumber },
      billLink: { S: billData.billLink },
      pdfLinks: { SS: billData.pdfLinks },
    },
  });

  try {
    await client.send(command);
    console.log(`Successfully wrote bill ${billData.billNumber} to DynamoDB`);
  } catch (err) {
    console.error("Error writing bill to DynamoDB:", err);
    throw err;
  }
};

const processNewBill = async (billNumber, billLink) => {
  try {
    const billExists = await checkBillExists(billNumber);
    if (!billExists) {
      console.log(`Processing new bill: ${billNumber}`);
      const pdfLinks = await scrapeBillPDFs(billLink);
      if (pdfLinks.length > 0) {
        await writeBillToDynamo({
          billNumber,
          billLink,
          pdfLinks,
        });
        console.log(
          `Added new bill ${billNumber} with ${pdfLinks.length} PDFs`
        );
      } else {
        console.log(`No PDFs found for bill ${billNumber}`);
      }
    }
  } catch (err) {
    console.error(`Error processing bill ${billNumber}:`, err);
  }
};

module.exports = { processNewBill };
