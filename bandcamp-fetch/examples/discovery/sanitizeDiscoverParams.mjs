import bcfetch from '../../dist/mjs/index.js';

const params = {
  genre: 'ambient'
};

bcfetch.discovery.sanitizeDiscoverParams(params).then((result) => {
  console.log(JSON.stringify(result, null, 2));
});
