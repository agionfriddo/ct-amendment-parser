export const generateHTML = (amendments, chamber) => {
  return `<body>
    <h1>New ${chamber} amendments</h1>
    <table>
      <thead>
        <tr>
          <th>Cal #</th>
          <th>LCO #</th>
          <th>Bill #</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${amendments
          .map(
            (amendment) =>
              `
              <tr style="border: 1px solid black">
                <td>${amendment.calNumber}</td>
                <td>
                  <a href=${amendment.lcoLink}>${amendment.lcoNumber}</a>
                </td>
                <td>
                  <a href=${amendment.billLink}>${amendment.billNumber}</a>
                </td>
                <td>${amendment.date}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  </body>`;
};
