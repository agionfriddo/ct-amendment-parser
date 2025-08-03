// Mock the AWS SDK first, before any imports
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  const actualModule = jest.requireActual("@aws-sdk/client-dynamodb");
  return {
    ...actualModule,
    DynamoDBClient: jest.fn(() => ({
      send: mockSend,
    })),
    ScanCommand: jest.fn((params) => params),
    BatchWriteItemCommand: jest.fn((params) => params),
  };
});

jest.mock("../src/bills");
jest.mock("../src/constants", () => ({
  SENATE_AMENDMENTS_TABLE: "test-senate-table",
  HOUSE_AMENDMENTS_TABLE: "test-house-table",
  REGION: "us-east-1",
}));

// Now import the modules
const { processAmendments } = require("../src/processAmendments");
const { processNewBill } = require("../src/bills");

describe("processAmendments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should process new amendments and write to DynamoDB", async () => {
    const mockAllAmendments = [
      {
        billNumber: "HB-1234",
        date: "01/15/2024",
        lcoLink: "https://example.com/lco1",
        billLink: "https://example.com/bill1",
        lcoNumber: "LCO-456",
        calNumber: "123",
      },
      {
        billNumber: "HB-5678",
        date: "01/16/2024",
        lcoLink: "https://example.com/lco2",
        billLink: "https://example.com/bill2",
        lcoNumber: "LCO-789",
        calNumber: "456",
      },
    ];

    const mockExistingAmendments = [
      {
        billNumber: "HB-1234",
        date: "01/15/2024",
        lcoLink: "https://example.com/lco1",
        billLink: "https://example.com/bill1",
        lcoNumber: "LCO-456",
        calNumber: "123",
      },
    ];

    // Mock the scan call to return existing amendments
    mockSend
      .mockResolvedValueOnce({
        Items: mockExistingAmendments.map((item) => ({
          billNumber: { S: item.billNumber },
          date: { S: item.date },
          lcoLink: { S: item.lcoLink },
          billLink: { S: item.billLink },
          lcoNumber: { S: item.lcoNumber },
          calNumber: { S: item.calNumber },
        })),
      })
      // Mock the batch write call
      .mockResolvedValueOnce({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    const result = await processAmendments(mockAllAmendments, "senate");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      billNumber: "HB-5678",
      date: "01/16/2024",
      lcoLink: "https://example.com/lco2",
      billLink: "https://example.com/bill2",
      lcoNumber: "LCO-789",
      calNumber: "456",
    });

    expect(processNewBill).toHaveBeenCalledWith(
      "HB-5678",
      "https://example.com/bill2"
    );
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  test("should return empty array when no new amendments", async () => {
    const mockAllAmendments = [
      {
        billNumber: "HB-1234",
        date: "01/15/2024",
        lcoLink: "https://example.com/lco1",
        billLink: "https://example.com/bill1",
        lcoNumber: "LCO-456",
        calNumber: "123",
      },
    ];

    mockSend.mockResolvedValueOnce({
      Items: [
        {
          billNumber: { S: "HB-1234" },
          date: { S: "01/15/2024" },
          lcoLink: { S: "https://example.com/lco1" },
          billLink: { S: "https://example.com/bill1" },
          lcoNumber: { S: "LCO-456" },
          calNumber: { S: "123" },
        },
      ],
    });

    const result = await processAmendments(mockAllAmendments, "senate");

    expect(result).toHaveLength(0);
    expect(processNewBill).not.toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should handle DynamoDB scan errors gracefully", async () => {
    const mockAllAmendments = [
      {
        billNumber: "HB-1234",
        date: "01/15/2024",
        lcoLink: "https://example.com/lco1",
        billLink: "https://example.com/bill1",
        lcoNumber: "LCO-456",
        calNumber: "123",
      },
    ];

    // Mock the scan to fail, then write to succeed
    mockSend
      .mockRejectedValueOnce(new Error("DynamoDB scan error"))
      .mockResolvedValueOnce({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await processAmendments(mockAllAmendments, "senate");

    // When scan fails, it returns empty array, so all amendments are considered new
    expect(result).toHaveLength(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });

  test("should process amendments in chunks of 25", async () => {
    const mockAmendments = Array.from({ length: 30 }, (_, i) => ({
      billNumber: `HB-${1000 + i}`,
      date: "01/15/2024",
      lcoLink: `https://example.com/lco${i}`,
      billLink: `https://example.com/bill${i}`,
      lcoNumber: `LCO-${100 + i}`,
      calNumber: `${i}`,
    }));

    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValue({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    const result = await processAmendments(mockAmendments, "house");

    expect(result).toHaveLength(30);
    // 1 scan + 2 batch writes (30/25 = 2 chunks)
    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(processNewBill).toHaveBeenCalledTimes(30);
  });

  test("should use correct table name for house chamber", async () => {
    const mockAmendments = [
      {
        billNumber: "HB-1234",
        date: "01/15/2024",
        lcoLink: "https://example.com/lco1",
        billLink: "https://example.com/bill1",
        lcoNumber: "LCO-456",
        calNumber: "123",
      },
    ];

    mockSend
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    await processAmendments(mockAmendments, "house");

    expect(mockSend).toHaveBeenCalledWith({
      TableName: "test-house-table",
    });
  });
});
