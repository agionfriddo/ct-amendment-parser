// Mock the AWS SDK first, before any imports
const mockSend = jest.fn();

jest.mock('axios');
jest.mock('../src/bills');

jest.mock('@aws-sdk/client-dynamodb', () => {
  const actualModule = jest.requireActual('@aws-sdk/client-dynamodb');
  return {
    ...actualModule,
    DynamoDBClient: jest.fn(() => ({
      send: mockSend
    })),
    ScanCommand: jest.fn(params => params),
    BatchWriteItemCommand: jest.fn(params => params)
  };
});

jest.mock('../src/constants', () => ({
  SENATE_AMENDMENTS_TABLE: 'test-senate-table',
  HOUSE_AMENDMENTS_TABLE: 'test-house-table',
  REGION: 'us-east-1'
}));

// Now import the modules
const { fetchAndParse } = require('../src/amendmentParser');
const { processAmendments } = require('../src/processAmendments');
const axios = require('axios');
const { processNewBill } = require('../src/bills');

const mockedAxios = axios;

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should complete full workflow: fetch, parse, and process amendments', async () => {
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

    mockedAxios.post.mockResolvedValue({ data: mockHTML });
    
    mockSend
      .mockResolvedValueOnce({
        Items: [
          {
            billNumber: { S: 'HB-1234' },
            date: { S: '01/15/2024' },
            lcoLink: { S: 'https://cga.ct.gov/lco1' },
            billLink: { S: 'https://cga.ct.gov/bill1' },
            lcoNumber: { S: 'LCO-456' },
            calNumber: { S: '123' }
          }
        ]
      })
      .mockResolvedValueOnce({ UnprocessedItems: {} });

    processNewBill.mockResolvedValue();

    const fetchedAmendments = await fetchAndParse('senate');
    const newAmendments = await processAmendments(fetchedAmendments, 'senate');

    expect(fetchedAmendments).toBeInstanceOf(Array);
    expect(fetchedAmendments.length).toBeGreaterThan(0);
    
    expect(newAmendments).toBeInstanceOf(Array);
    expect(newAmendments.length).toBe(1);
    expect(newAmendments[0].lcoNumber).toBe('LCO-999');
    
    expect(processNewBill).toHaveBeenCalledWith('SB-5678', 'https://cga.ct.gov/bill2');
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  test('should handle end-to-end error scenarios', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network error'));

    const fetchedAmendments = await fetchAndParse('senate');
    
    expect(fetchedAmendments).toBeUndefined();
  });

  test('should process different chambers correctly', async () => {
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

    mockedAxios.post.mockResolvedValue({ data: mockHTML });
    mockSend
      .mockResolvedValueOnce({ Items: [] })  // Senate scan
      .mockResolvedValueOnce({ UnprocessedItems: {} })  // Senate write  
      .mockResolvedValueOnce({ Items: [] })  // House scan
      .mockResolvedValueOnce({ UnprocessedItems: {} });  // House write
    processNewBill.mockResolvedValue();

    const senateFetch = fetchAndParse('senate');
    const houseFetch = fetchAndParse('house');

    const [senateAmendments, houseAmendments] = await Promise.all([senateFetch, houseFetch]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://cga.ct.gov/asp/CGAAmendProc/CGASenateAmendRptDisp.asp',
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://cga.ct.gov/asp/CGAAmendProc/CGAHouseAmendRptDisp.asp',
      expect.any(URLSearchParams),
      expect.any(Object)
    );

    const senateProcessed = await processAmendments(senateAmendments, 'senate');
    const houseProcessed = await processAmendments(houseAmendments, 'house');

    expect(senateProcessed).toBeInstanceOf(Array);
    expect(houseProcessed).toBeInstanceOf(Array);
  });
});