import { jest } from "@jest/globals";

const mockSend = jest.fn();
const mockPost = jest.fn();

jest.unstable_mockModule("axios", () => ({
  default: {
    post: mockPost,
  },
}));

jest.unstable_mockModule("../src/bills.js", () => ({
  processNewBill: jest.fn(),
}));

jest.unstable_mockModule("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({
    send: mockSend,
  })),
  ScanCommand: jest.fn((params) => params),
  BatchWriteItemCommand: jest.fn((params) => params),
}));

jest.unstable_mockModule("../src/constants.js", () => ({
  SENATE_AMENDMENTS_TABLE: "test-senate-table",
  HOUSE_AMENDMENTS_TABLE: "test-house-table",
  REGION: "us-east-1",
}));

// Now import the modules
const { fetchAndParse } = await import("../src/amendmentParser.js");
const { processAmendments } = await import("../src/processAmendments.js");
const { processNewBill } = await import("../src/bills.js");

describe("Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should complete full workflow: fetch, parse, and process amendments", async () => {
    const mockHTML = `
      <html>
        <table>
          <tr>
            <td></td>
            <td>123</td>
            <td><a href="/lco1">LCO-456</a></td>
            <td><a href="/bill1">HB-1234</a></td>
            <td>01/15/2024</td>
          </tr>
          <tr>
            <td></td>
            <td>789</td>
            <td><a href="/lco2">LCO-999</a></td>
            <td><a href="/bill2">SB-5678</a></td>
            <td>01/16/2024</td>
          </tr>
        </table>
      </html>
    `;

    mockPost.mockResolvedValue({ data: mockHTML });

    mockSend
      .mockResolvedValueOnce({
        Items: [
          {
            billNumber: { S: "HB-1234" },
            date: { S: "01/15/2024" },
            lcoLink: { S: "https://cga.ct.gov/lco1" },
            billLink: { S: "https://cga.ct.gov/bill1" },
            lcoNumber: { S: "LCO-456" },
            calNumber: { S: "123" },
          },
        ],
      })
      .mockResolvedValueOnce({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    const fetchedAmendments = await fetchAndParse("senate");
    const newAmendments = await processAmendments(fetchedAmendments, "senate");

    expect(fetchedAmendments).toBeInstanceOf(Array);
    expect(fetchedAmendments.length).toBeGreaterThan(0);

    expect(newAmendments).toBeInstanceOf(Array);
    expect(newAmendments.length).toBe(1);
    expect(newAmendments[0].lcoNumber).toBe("LCO-999");

    expect(processNewBill).toHaveBeenCalledWith(
      "SB-5678",
      "https://cga.ct.gov/bill2"
    );
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  test("should handle end-to-end error scenarios", async () => {
    mockPost.mockRejectedValue(new Error("Network error"));

    const fetchedAmendments = await fetchAndParse("senate");

    expect(fetchedAmendments).toBeUndefined();
  });

  test("should process different chambers correctly", async () => {
    const mockHTML = `
      <html>
        <table>
          <tr>
            <td></td>
            <td>456</td>
            <td><a href="/lco3">LCO-789</a></td>
            <td><a href="/bill3">HB-9999</a></td>
            <td>01/17/2024</td>
          </tr>
        </table>
      </html>
    `;

    mockPost.mockResolvedValue({ data: mockHTML });
    mockSend
      .mockResolvedValueOnce({ Items: [] }) // Senate scan
      .mockResolvedValueOnce({ UnprocessedItems: {} }) // Senate write
      .mockResolvedValueOnce({ Items: [] }) // House scan
      .mockResolvedValueOnce({ UnprocessedItems: {} }); // House write
    processNewBill.mockResolvedValue();

    const senateFetch = fetchAndParse("senate");
    const houseFetch = fetchAndParse("house");

    const [senateAmendments, houseAmendments] = await Promise.all([
      senateFetch,
      houseFetch,
    ]);

    expect(mockPost).toHaveBeenCalledWith(
      "https://cga.ct.gov/asp/CGAAmendProc/CGASenateAmendRptDisp.asp",
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    expect(mockPost).toHaveBeenCalledWith(
      "https://cga.ct.gov/asp/CGAAmendProc/CGAHouseAmendRptDisp.asp",
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    const senateProcessed = await processAmendments(senateAmendments, "senate");
    const houseProcessed = await processAmendments(houseAmendments, "house");

    expect(senateProcessed).toBeInstanceOf(Array);
    expect(houseProcessed).toBeInstanceOf(Array);
  });
});
