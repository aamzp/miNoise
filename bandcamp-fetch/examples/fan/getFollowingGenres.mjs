import bcfetch from '../../dist/mjs/index.js';

const username = 'patrickkfkan';

const params = {
  target: username,
  imageFormat: 'art_tags_large'
};

bcfetch.fan.getFollowingGenres(params).then(async (results) => {
  console.log(JSON.stringify(results, null, 2));

  if (results.continuation) {
    console.log('Fetching more by continuation...');

    const moreResults = await bcfetch.fan.getFollowingGenres({
      ...params,
      target: results.continuation
    });
    console.log(JSON.stringify(moreResults, null, 2));
  }
});
