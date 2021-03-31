let _token;

chrome.storage.local.get('revisionData', (res) => {
  if (!res.revisionData) {
    chrome.storage.local.set({revisionData: {}});
  }
});


fetch('https://he.wikipedia.org/w/api.php?action=query&meta=tokens&format=json&assert=bot', {
  credentials: 'include',
})
  .then((res) => res.json())
  .then((res) => {
    _token = res.query.tokens.csrftoken;
  });

class WikiUpdater {
  constructor() {
    this._edits = [];
  }

  async editSection(articleTitle, sectionTitle, sectionId, content) {
    const fetchDetails = {
      method: 'post',
      body: objectToFormData({title: articleTitle,
        section: sectionId,
        text: content,
        token: _token,
        summary: sectionTitle}),
      credentials: 'include',
    };
    const res = await fetch('https://he.wikipedia.org/w/api.php?action=edit&format=json&assert=bot&bot=true', fetchDetails);
    const data = await res.json();
    this._edits.push({revisionId: data.edit.newrevid, title: articleTitle});
    this.saveEdits();
  }

  updateArticle(articleTitle, summary, content) {
    const _that = this;
    const fetchDetails = {
      method: 'post',
      body: objectToFormData({title: articleTitle, text: content, token: _token, summary}),
      credentials: 'include',
    };
    fetch('https://he.wikipedia.org/w/api.php?action=edit&format=json&assert=bot&bot=true', fetchDetails)
      .then((res) => res.json())
      .then((res) => {
        _that._edits.push({revisionId: res.edit.newrevid, title: articleTitle});
        this.saveEdits();
      });
  }

  rollbackAllEdits(summary) {
    this._edits.forEach((edit) => {
      this.rollbackEdit(edit.title, summary, edit.revisionId);
    });
    this._edits = [];
  }

  static async rollbackEdit(articleTitle, summary, revisionId) {
    const fetchDetails = {
      method: 'post',
      body: objectToFormData({title: articleTitle, undo: revisionId, token: _token}),
      credentials: 'include',
    };
    return fetch('https://he.wikipedia.org/w/api.php?action=edit&format=json&assert=bot&bot=1', fetchDetails)
      .then((res) => res.json())
      .then((res) => console.log(res));
  }

  saveEdits() {
    chrome.storage.local.get('revisionData', (res) => {
      this._edits.forEach((edit) => {
        res.revisionData[edit.revisionId] = edit.title;
      });
      chrome.storage.local.set({revisionData: res.revisionData});
    });
  }

  static rollbackAllStorageEdits(summery) {
    chrome.storage.local.get('revisionData', (res) => {
      Object.entries(res.revisionData).forEach(([revId, title]) => {
        this.rollbackEdit(title, summery, revId);
      });
    });

    chrome.storage.local.set({revisionData: {}});
  }
}
