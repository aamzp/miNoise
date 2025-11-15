import bcfetch from '../../dist/mjs/index.js';

const params = {
  categoryUrl: 'https://daily.bandcamp.com/best-ambient',
  page: 2
};

bcfetch.article.list(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
