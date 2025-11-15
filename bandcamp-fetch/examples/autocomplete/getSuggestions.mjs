import bcfetch, { AutocompleteItemType } from '../../dist/mjs/index.js';

const autocompleteTagParams = {
  itemType: AutocompleteItemType.Tag,
  query: 'ambient'
};

const autocompleteLocationParams = {
  itemType: AutocompleteItemType.Location,
  query: 'Fin',
  limit: 20
};

function printResults(results, params) {
  const limit = params.limit !== undefined ? `, Limit: ${params.limit}` : '';
  const title = `Autocomplete ${params.itemType.toLowerCase()} suggestions: ${params.query}${limit}`;
  console.log(title);
  console.log('-'.repeat(title.length));
  console.log(JSON.stringify(results, null, 2));
  console.log('');
}

bcfetch.autocomplete.getSuggestions(autocompleteTagParams).then((results) => {
  printResults(results, autocompleteTagParams);
});

bcfetch.autocomplete.getSuggestions(autocompleteLocationParams).then((results) => {
  printResults(results, autocompleteLocationParams);
});
