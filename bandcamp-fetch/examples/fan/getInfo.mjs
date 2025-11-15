import bcfetch from '../../dist/mjs/index.js';

const username = 'patrickkfkan';

const params = {
  username,
  imageFormat: 'bio_screen'
};

bcfetch.fan.getInfo(params).then((results) => {
  console.log(JSON.stringify(results, null, 2));
});
