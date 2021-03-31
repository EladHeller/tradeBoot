const nowiki = '<nowiki>';
const nowikiEnd = '</nowiki>';


const noWikiEndTagIndex = (text, startIndex) => text
  .indexOf(nowikiEnd, startIndex) + nowikiEnd.length;

const nextWikiText = (text, currIndex, str) => {
  while (text.substr(currIndex, str.length) !== str && currIndex < text.length) {
    if (text.substr(currIndex, nowiki.length) === nowiki) {
      currIndex = noWikiEndTagIndex(text, currIndex);
    } else if (text.substr(currIndex, 2) === '{{') {
      currIndex = nextWikiText(text, currIndex + 2, '}}') + 2;
    } else if (text[currIndex] === '{') {
      currIndex = nextWikiText(text, currIndex + 1, '}') + 1;
    } else if (text[currIndex] === '[') {
      currIndex = nextWikiText(text, currIndex + 1, ']') + 1;
    } else {
      currIndex++;
    }
  }
  currIndex = currIndex < text.length ? currIndex : -1;

  return currIndex;
};

const buildTableRow = (fields, style, isHeader) => {
  const delimiter = isHeader ? '!' : '|';
  style = style ? (style + delimiter) : '';
  let rowStr = `\n|-\n${delimiter}${style}[[${fields[0]}]]`;
  for (let i = 1; i < (fields.length); i++) {
    rowStr += ` || ${fields[i] === undefined ? '---' : fields[i]}`;
  }
  return rowStr;
};
const WikiParser = {
  nextWikiText,
  buildTableRow,
  noWikiEndTagIndex,
};
