import bcfetch from '../../dist/mjs/index.js';

const username = 'patrickkfkan';

const params = {
  target: username,
  imageFormat: 'art_app_large'
};

bcfetch.fan.getWishlist(params).then(async (results) => {
  console.log(JSON.stringify(results, null, 2));

  if (results.continuation) {
    console.log('Fetching more by continuation...');

    const moreResults = await bcfetch.fan.getWishlist({
      ...params,
      target: results.continuation
    });
    console.log(JSON.stringify(moreResults, null, 2));
  }
});
