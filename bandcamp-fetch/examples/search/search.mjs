import bcfetch from '../../dist/mjs/index.js';

function printResults(results, query, itemType) {
  const title = `Search query: ${query}. Item type: ${itemType}. ${results.items.length} results.`;
  console.log(title);
  console.log('-'.repeat(title.length));
  console.log(JSON.stringify(results, null, 2));
  console.log('');
}

const baseParams = {
  page: 1,
  albumImageFormat: 'art_app_large',
  artistImageFormat: 'bio_featured'
};

const searchAllParams = { ...baseParams, query: 'jazz' };
const searchArtistsAndLabelsParams = { ...baseParams, query: 'merge' };
const searchAlbumsParams = { ...baseParams, query: 'Coeur de pirate' };
const searchTracksParams = { ...baseParams, query: 'Coeur de pirate' };
const searchFansParams = { ...baseParams, query: 'merge' };

void (async () => {
  const all = await bcfetch.search.all(searchAllParams);
  const artistsAndLabels = await bcfetch.search.artistsAndLabels(searchArtistsAndLabelsParams);
  const albums = await bcfetch.search.albums(searchAlbumsParams);
  const tracks = await bcfetch.search.tracks(searchTracksParams);
  const fans = await bcfetch.search.fans(searchFansParams);
  printResults(all, searchAllParams.query, 'All');
  printResults(artistsAndLabels, searchArtistsAndLabelsParams.query, 'Artists & labels');
  printResults(albums, searchAlbumsParams.query, 'Albums');
  printResults(tracks, searchTracksParams.query, 'Tracks');
  printResults(fans, searchFansParams.query, 'Fans');
})();
