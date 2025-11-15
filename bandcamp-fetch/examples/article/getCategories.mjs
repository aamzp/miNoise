import bcfetch from '../../dist/mjs/index.js';

bcfetch.article.getCategories().then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
