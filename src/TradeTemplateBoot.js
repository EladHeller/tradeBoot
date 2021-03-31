/*
const tradeTemplateBoot = new TradeTemplateBoot(2020)
tradeTemplateBoot.run()


const tableFormatData = tradeTemplateBoot.tableFormat()
TradeTemplateBoot.wikiUpdater.updateArticle(
  'משתמש:Sapper-bot/tradeBootData','עדכון',tableFormatData)


const companies = tradeTemplateBoot.getRelevantCompanies()
companies.forEach(company => company.updateCompanyArticle())


const nc = companies.filter(x =>
x.newArticleText
  .indexOf('== הערות שוליים ==') === -1 && x.newArticleText.indexOf('==הערות שוליים==') === -1)
*/
/* eslint-disable no-use-before-define */
// eslint-disable-next-line

const mayaLinkRegex = /^http:\/\/maya\.tase\.co\.il\/company\/(\d*)\?view=reports$/;
const jsonLink = 'http://mayaapi.tase.co.il/api/company/financereports?companyId=';
const companyPageLink = 'http://maya.tase.co.il/company/';
const reportView = '?view=reports';
const mayaGetOptions = {
  method: 'get',
  credentials: 'include',
  headers: new Headers({
    'X-Maya-With': 'allow',
  }),
};
const mayaOptionsOptions = {
  method: 'options',
  credentials: 'include',
};

class TradeTemplateBoot {
  constructor(year) {
    if (!year) {
      throw new Error('year parameter is required');
    }
    this.year = year;
    this.companies = [];
  }

  run(continueParam) {
    if (!continueParam) {
      this._getPages = 0;
      this._exceptPages = 0;
    }
    const geicontinue = continueParam ? (`&geicontinue=${continueParam}`) : '';

    return fetch(`${'https://he.wikipedia.org/w/api.php?action=query&format=json'
      // Pages with תבנית:מידע בורסאי
      + '&generator=embeddedin&geinamespace=0&geilimit=5000&geititle=תבנית:מידע בורסאי'}${geicontinue
    }&prop=templates|revisions|extlinks`
      // This page contains תבנית:חברה מסחרית?
      + '&tltemplates=תבנית:חברה מסחרית&tllimit=5000'
      // Get content of page
      + '&rvprop=content'
      // Get maya link
      + '&elprotocol=http&elquery=maya.tase.co.il/company/&ellimit=5000', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((res) => this.onListLoad(res));
  }

  onListLoad(res) {
    if (res.continue) {
      this.run(res.continue.geicontinue);
    }

    const {pages} = res.query;
    this._exceptPages += Object.keys(pages).length;
    let extLink;
    Object.values(pages).forEach((company) => {
      extLink = company.extlinks.find((link) => link['*'].match(mayaLinkRegex))['*'];
      const companyFinnaceDetailsUrl = extLink.replace(companyPageLink, jsonLink).replace(reportView, '');

      fetch(companyFinnaceDetailsUrl, mayaOptionsOptions)
        .then(() => fetch(companyFinnaceDetailsUrl, mayaGetOptions))
        .then((result) => result.json())
        .then((jsonRes) => {
          this.companyDetailsCallback(company, jsonRes);
        })
        .catch((e) => {
          this._getPages++;
          console.error(company, e);
          if (this._getPages === this._exceptPages) {
            console.log('finnish!');
          }
        });
    });
  }

  companyDetailsCallback(company, res) {
    const mayaDetails = new Map();
    res.AllRows.forEach((row) => {
      mayaDetails.set(row.Name, row.CurrPeriodValue);
    });

    const companyObj = new Company(company.title, mayaDetails, company, res.CurrentPeriod.Year);
    this.companies.push(companyObj);
    this._getPages++;

    if (this._getPages === this._exceptPages) {
      console.log('finnish!');
    }
  }

  tableFormat() {
    let tableRows = '';
    this.companies.forEach((company) => {
      const details = [company.name, ...Object.values(company.mayaDataForWiki).map((val) => val || '---')];
      details.push(company.wikiTemplateData.year);
      details.push(company.isContainsTamplate);
      tableRows += WikiParser.buildTableRow(details);
    });

    return `{| class="wikitable sortable"\n! שם החברה !! הכנסות !! רווח תפעולי !! רווח!!הון עצמי!!סך המאזן!!תאריך הנתונים!!מכיל [[תבנית:חברה מסחרית]]${tableRows}\n|}`;
  }

  getRelevantCompanies() {
    const that = this;
    return this.companies.filter((company) => company.newArticleText
      && (company.wikiTemplateData.year === that.year)
      && company.hasData
      && company.newArticleText !== company.articleText);
  }
}
