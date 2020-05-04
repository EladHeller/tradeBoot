export const contentOfPage = (title, callback) => fetch(`https://he.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&titles=${title}`)
  .then((res) => res.json())
  .then((res) => {
    const pageId = Object.keys(res.query.pages)[0];
    callback(res.query.pages[pageId].revisions[0]['*']);
  });

export const getLangLinkName = async (name, srcLng, destLang) => {
  const fetchRes = await fetch(`https://${srcLng}.wikipedia.org/w/api.php?action=query&prop=langlinks&titles=${name}&redirects=&lllang=${destLang}&format=json`);
  const res = await fetchRes.json();
  const {pages} = res.query;
  const page = pages[Object.keys(pages)[0]];
  if (page.langlinks) {
    return page.langlinks[0]['*'];
  }

  return false;
};
