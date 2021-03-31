const TEMPLATE_NAME = 'חברה מסחרית';
const lossStr = 'הפסד של';
const thousandStr = '1000 (מספר)|אלף';
const millionStr = 'מיליון';
const milliardStr = 'מיליארד';
const NIS = 'ש"ח';
const fieldsForWiki = [
  {mayaName: 'סה"כ הכנסות', wikiName: 'הכנסה'},
  {mayaName: 'רווח תפעולי', wikiName: 'רווח תפעולי'},
  {mayaName: 'רווח נקי', wikiName: 'רווח'},
  {mayaName: 'הון עצמי', wikiName: 'הון עצמי'},
  {mayaName: 'סך מאזן', wikiName: 'סך המאזן'},
];
const NAME_FIELD = 'שם';
const NAME_STRING = '{{שם הדף בלי הסוגריים}}';
const companyReportView = '?view=reports';
const companyFinanceView = '?view=finance';


const getFieldString = (fieldData, year, reference, name, isFirst) => {
  let finalString = '';
  if (fieldData) {
    fieldData = fieldData.trim().replace(/,/g, '');

    if (fieldData.startsWith('-')) {
      finalString += `${lossStr} `;
      fieldData = fieldData.substr(1);
    }

    let order = '';
    let sumStr;
    if (fieldData === '0') {
      sumStr = fieldData;
    } else if (fieldData.length < 4) {
      order = thousandStr;
      sumStr = fieldData;
    } else if (fieldData.length < 10) {
      order = fieldData.length < 7 ? millionStr : milliardStr;
      sumStr = fieldData.substring(0, 3);
      const remind = fieldData.length % 3;
      if (remind) {
        sumStr = [sumStr.slice(0, remind), '.', sumStr.slice(remind)].join('');
      }
    } else {
      order = milliardStr;
      sumStr = Number(fieldData.substring(0, fieldData.length - 6)).toLocaleString();
    }
    const commentKey = `דוח${year}-${name}`;
    const comment = `{{הערה|שם=${commentKey}${isFirst ? `|1=${name}: [${reference.replace(companyReportView, companyFinanceView)} נתונים כספיים] באתר [[מאי"ה]].` : ''}}}`;
    finalString += `${sumStr} ${order ? `[[${order}]]` : ''} [[${NIS}]] ([[${year}]])${comment}`;
  }

  return finalString;
};

class Company {
  constructor(name, mayaData, wikiData, year) {
    this.name = name;

    if (mayaData) {
      this.appendMayaData(mayaData, year);
    }
    if (wikiData) {
      this.appendWikiData(wikiData);
    }
    this.updateWikiTamplate();
  }

  updateCompanyArticle() {
    Company.wikiUpdater.updateArticle(this.name, 'עדכון תבנית:חברה מסחרית', this.newArticleText);
  }

  updateWikiTamplate() {
    let isFirst = true;
    fieldsForWiki.forEach((field) => {
      const fieldData = this.mayaDataForWiki[field.wikiName];
      if (fieldData) {
        this.wikiTemplateData[field.wikiName] = getFieldString(
          fieldData,
          this.wikiTemplateData.year,
          this.reference,
          this.templateParser.templateData[NAME_FIELD] || NAME_STRING,
          isFirst,
        );

        isFirst = false;
        this.templateParser.templateData[field.wikiName] = this.wikiTemplateData[field.wikiName] || '';
      }
    });

    const oldTemplate = this.templateParser.templateText;
    this.templateParser.updateTamplateFromData();
    if (this.isContainsTamplate) {
      this.newArticleText = this.articleText.replace(oldTemplate, this.templateParser.templateText);
      // If not contains template and not has other template
    } else if (!this.articleText.trim().startsWith('{')) {
      this.newArticleText = `${this.templateParser.templateText}\n${this.articleText}`;
    }
  }

  async appendWikiData(wikiData) {
    this.isContainsTamplate = 'templates' in wikiData;
    this.articleText = wikiData.revisions[0]['*'];
    this.reference = wikiData.extlinks[0]['*'];


    this.templateParser = new WikiTemplateParser(this.articleText, TEMPLATE_NAME);
  }

  appendMayaData(mayaData, year) {
    this.mayaDataForWiki = {};
    this.wikiTemplateData = {};
    this.hasData = false;

    fieldsForWiki.forEach((field) => {
      const fieldData = mayaData.get(field.mayaName);
      this.hasData = this.hasData || !!fieldData;
      this.mayaDataForWiki[field.wikiName] = mayaData.get(field.mayaName);
    });

    this.wikiTemplateData.year = year;
  }
}
