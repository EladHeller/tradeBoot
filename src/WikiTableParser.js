const getNextRowDelimiterIndex = (rowText, currIndex, delimiter) => {
  const nextDelimiterIndex1 = WikiParser.nextWikiText(rowText, currIndex, delimiter + delimiter);
  const nextDelimiterIndex2 = WikiParser.nextWikiText(rowText, currIndex, `\n${delimiter}`);
  const index = ((nextDelimiterIndex2 === -1)
    || ((nextDelimiterIndex1 < nextDelimiterIndex2) && (nextDelimiterIndex1 > -1)))
    ? nextDelimiterIndex1
    : nextDelimiterIndex2;
  return index;
};

const getTableRow = (rowText, isHeader) => {
  const delimiter = isHeader ? '!' : '|';
  const row = {values: []};
  let currIndex = 0;

  if (rowText[currIndex] === delimiter) {
    currIndex++;
  }

  let nextDelimiterIndex = WikiParser.nextWikiText(rowText, currIndex, delimiter);

  // Row has style cell
  if (rowText[nextDelimiterIndex + 1] !== delimiter) {
    row.rowStyle = rowText.substring(currIndex, nextDelimiterIndex).trim();
    currIndex = nextDelimiterIndex + 1;
  }

  nextDelimiterIndex = getNextRowDelimiterIndex(rowText, currIndex, delimiter);

  while (nextDelimiterIndex !== -1) {
    row.values.push(rowText.substring(currIndex, nextDelimiterIndex).trim());
    currIndex = nextDelimiterIndex + 2;
    nextDelimiterIndex = getNextRowDelimiterIndex(rowText, currIndex, delimiter);
  }

  row.values.push(rowText.substr(currIndex).trim());

  return row;
};

const findTablesText = (articleContent) => {
  const startStr = '{|';
  const tables = [];

  let startIndex = articleContent.indexOf(startStr);
  let endIndex;
  while (startIndex > -1) {
    endIndex = WikiParser.nextWikiText(articleContent, startIndex + startStr.length, '|}') + 2;
    tables.push(articleContent.substring(startIndex, endIndex));
    startIndex = articleContent.indexOf(startStr, endIndex);
  }
  return tables;
};

const tableTextToObject = (tableText) => {
  const startStr = '{|';
  const tableData = {text: tableText, rows: []};
  let rowText;
  const headerIndex = tableText.indexOf('!', startStr.length);
  const rowIndex = tableText.indexOf('|', startStr.length);
  const hasHeader = (headerIndex > -1) && (headerIndex < rowIndex);
  let currIndex = hasHeader ? headerIndex : rowIndex;
  tableData.tableStyle = tableText.substring(startStr.length, currIndex).trim();
  let nextRowIndex = WikiParser.nextWikiText(tableText, currIndex, '|-');

  if (hasHeader) {
    rowText = tableText.substring(currIndex + 1, nextRowIndex).trim();
    tableData.rows.push(getTableRow(rowText, true));
    nextRowIndex += 2;
    currIndex = nextRowIndex;
    nextRowIndex = WikiParser.nextWikiText(tableText, currIndex, '|-');
  }

  while (nextRowIndex > -1) {
    rowText = tableText.substring(currIndex + 1, nextRowIndex).trim();
    tableData.rows.push(getTableRow(rowText, false));
    nextRowIndex += 2;
    currIndex = nextRowIndex;
    nextRowIndex = WikiParser.nextWikiText(tableText, currIndex, '|-');
  }

  rowText = tableText.substr(currIndex + 1).trim();
  tableData.rows.push(getTableRow(rowText, false));

  return tableData;
};

class WikiTableParser {
  constructor(articleText) {
    this._articleContent = articleText;
    const tableTexts = findTablesText(articleText);

    this.tables = tableTexts.map(tableTextToObject);
  }
}
