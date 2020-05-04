import * as WikiParser from './WikiParser.js';

export default class WikiTemplateParser {
  constructor(articleContent, templateName) {
    this._articleContent = articleContent;
    this._templateName = templateName;
    this.templateText = this.findTamplateText(templateName, articleContent);
    this.updateDataFromTemplete(this.templateText);
  }

  updateTamplateFromData(
    templateData = this.templateData,
    templateName = this._templateName,
  ) {
    let tamplateStr = `{{${templateName}\n`;

    Object.entries(templateData).forEach(([key, value]) => {
      tamplateStr += `|${key}=${value}\n`;
    });

    tamplateStr += '}}';
    this.templateText = tamplateStr;

    return tamplateStr;
  }

  updateDataFromTemplete(templateText = this.templateText) {
    const obj = {};
    if (templateText) {
      let currIndex = templateText.indexOf('|') + 1;

      let pipeSignIndex;
      let key;
      let value;
      let equalSignIndex;
      let isTemplateEnd = false;
      while (!isTemplateEnd) {
        equalSignIndex = templateText.indexOf('=', currIndex);
        key = templateText.substring(currIndex, equalSignIndex).trim();
        pipeSignIndex = WikiParser.nextWikiText(templateText, currIndex, '|');
        isTemplateEnd = pipeSignIndex === -1;

        if (isTemplateEnd) {
          value = templateText.substring(equalSignIndex + 1, templateText.length - 2).trim();
        } else {
          value = templateText.substring(equalSignIndex + 1, pipeSignIndex).trim();
        }

        obj[key] = value;
        currIndex = pipeSignIndex + 1;
      }
    }
    this.templateData = obj;

    return obj;
  }

  findTamplateText(
    templateName = this._templateName,
    articleContent = this._articleContent,
  ) {
    const startStr = `{{${templateName}`;
    let templateText = '';
    const startIndex = articleContent.indexOf(startStr);
    if (startIndex > -1) {
      const endIndex = WikiParser.nextWikiText(articleContent, startIndex + startStr.length, '}}') + 2;
      templateText = articleContent.substring(startIndex, endIndex);
    }
    return templateText;
  }
}
