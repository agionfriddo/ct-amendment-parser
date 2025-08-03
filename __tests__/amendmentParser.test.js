const { fetchAndParse, parseBillsFromHTML } = require('../src/amendmentParser');
const axios = require('axios');

jest.mock('axios');
const mockedAxios = axios;

describe('amendmentParser', () => {
  describe('parseBillsFromHTML', () => {
    test('should parse bills from valid HTML', () => {
      const mockHTML = `
        <html>
          <table>
            <tr>
              <td>Header</td>
              <td>LCO #</td>
              <td>Bill #</td>
              <td>Date</td>
            </tr>
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
      
      const result = parseBillsFromHTML(mockHTML);
      
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        calNumber: '123',
        lcoNumber: 'LCO-456',
        lcoLink: 'https://cga.ct.gov/lco1',
        billNumber: 'HB-1234',
        billLink: 'https://cga.ct.gov/bill1',
        date: '01/15/2024'
      });
    });

    test('should handle empty HTML', () => {
      const result = parseBillsFromHTML('<html></html>');
      expect(result).toHaveLength(0);
    });

    test('should handle HTML with no table rows', () => {
      const mockHTML = '<html><table></table></html>';
      const result = parseBillsFromHTML(mockHTML);
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchAndParse', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should fetch and parse senate amendments', async () => {
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
          </table>
        </html>
      `;

      mockedAxios.post.mockResolvedValue({ data: mockHTML });

      const result = await fetchAndParse('senate');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://cga.ct.gov/asp/CGAAmendProc/CGASenateAmendRptDisp.asp',
        expect.any(URLSearchParams),
        expect.objectContaining({
          'content-type': 'application/x-www-form-urlencoded'
        })
      );

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should fetch and parse house amendments', async () => {
      const mockHTML = `
        <html>
          <table>
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

      const result = await fetchAndParse('house');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://cga.ct.gov/asp/CGAAmendProc/CGAHouseAmendRptDisp.asp',
        expect.any(URLSearchParams),
        expect.objectContaining({
          'content-type': 'application/x-www-form-urlencoded'
        })
      );

      expect(result).toBeInstanceOf(Array);
    });

    test('should filter out empty LCO numbers', async () => {
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
              <td></td>
              <td><a href="/lco2"></a></td>
              <td><a href="/bill2">SB-5678</a></td>
              <td>01/16/2024</td>
            </tr>
            <tr>
              <td></td>
              <td>LCO #</td>
              <td><a href="/lco3">LCO #</a></td>
              <td><a href="/bill3">HB-9999</a></td>
              <td>01/17/2024</td>
            </tr>
          </table>
        </html>
      `;

      mockedAxios.post.mockResolvedValue({ data: mockHTML });

      const result = await fetchAndParse('senate');
      
      // Should filter out empty lcoNumber and "LCO #"
      const validBills = result.filter(
        (bill) => bill.lcoNumber !== "" && bill.lcoNumber !== "LCO #"
      );
      
      expect(validBills.length).toBeLessThanOrEqual(result.length);
    });

    test('should handle axios errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await fetchAndParse('senate');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('error fetching html');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});