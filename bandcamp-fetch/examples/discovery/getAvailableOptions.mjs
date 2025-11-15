import bcfetch from '../../dist/mjs/index.js';

bcfetch.discovery.getAvailableOptions().then((result) => {
  console.log(JSON.stringify(result, null, 2));
});
