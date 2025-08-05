import axios from "axios";
import cheerio from "cheerio";
import https from "https";

// NOTE: This is generally bad practice, but we're not sending any sensitive data and we are fetching constant web
// pages, so we're not too worried about it. This is just to get around the SSL certificate issue.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const URL_ROOT = "https://cga.ct.gov";
const SENATE_ENDPOINT = `${URL_ROOT}/asp/CGAAmendProc/CGASenateAmendRptDisp.asp`;
const HOUSE_ENDPOINT = `${URL_ROOT}/asp/CGAAmendProc/CGAHouseAmendRptDisp.asp`;

const filterOptions = new URLSearchParams();
filterOptions.append("optSortby", "D");
filterOptions.append("optSortOrder", "Asc");

const fetchHTML = async (chamber) => {
  console.log("fetching html");
  const endpoint = chamber === "house" ? HOUSE_ENDPOINT : SENATE_ENDPOINT;
  try {
    const response = await axios.post(endpoint, filterOptions, {
      "content-type": "application/x-www-form-urlencoded",
      httpsAgent,
    });
    return response.data;
  } catch (e) {
    console.log("error fetching html");
    console.error(e);
  }
};

export const parseBillsFromHTML = (html) => {
  const bills = [];
  const $ = cheerio.load(html);
  $("table tr").each((i, row) => {
    const tds = $(row).find("td");
    const calNumber = $(tds[1]).text();
    const lcoNumber = $(tds[2]).text();
    const lcoLink = URL_ROOT + $(tds[2]).find("a").attr("href");
    const billNumber = $(tds[3]).text();
    const billLink = URL_ROOT + $(tds[3]).find("a").attr("href");
    const date = $(tds[4]).text();
    bills.push({ lcoNumber, lcoLink, calNumber, billNumber, billLink, date });
  });
  return bills;
};

export const fetchAndParse = async (chamber) => {
  const html = await fetchHTML(chamber);
  if (!html) {
    return undefined;
  }
  const bills = parseBillsFromHTML(html);

  return bills.filter(
    (bill) => bill.lcoNumber !== "" && bill.lcoNumber !== "LCO #"
  );
};
