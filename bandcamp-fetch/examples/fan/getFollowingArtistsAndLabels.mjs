import bcfetch from '../../dist/mjs/index.js';

const username = 'patrickkfkan';

const params = {
  target: username,
  imageFormat: 'bio_featured'
};

bcfetch.fan.getFollowingArtistsAndLabels(params).then(async (results) => {
  console.log(JSON.stringify(results, null, 2));

  if (results.continuation) {
    console.log('Fetching more by continuation...');

    const moreResults = await bcfetch.fan.getFollowingArtistsAndLabels({
      ...params,
      target: results.continuation
    });
    console.log(JSON.stringify(moreResults, null, 2));
  }
});
