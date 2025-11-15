import bcfetch from '../../dist/mjs/index.js';

const articleUrl = 'https://daily.bandcamp.com/best-ambient/best-new-ambient-march-2018';

const params = {
  articleUrl,
  includeRawData: false
};

bcfetch.article.getArticle(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
