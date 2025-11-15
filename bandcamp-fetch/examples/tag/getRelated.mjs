import bcfetch from '../../dist/mjs/index.js';

const params = {
  tags: ['dark-ambient', 'industrial', 'asia']
};

bcfetch.tag.getRelated(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
