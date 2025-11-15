## Breaking changes from v1.x to v2.x

### Discovery API

In `discover(params)`, `params` has the following changes:
- Removed `artistRecommendationType`, as Bandcamp removed 'artist recommended' from `sortBy` option values.
- `format` replaced by `category`, to which Bandcamp added the 't-shirt' option value.
- Added `merchImageFormat` for setting the format of t-shirt images.
- Added `customTags` for specifiying tag values.
- Removed `page`, as Bandcamp now uses cursors instead of page numbers. Use `continuation` returned in `discover()` result to obtain the next set of results.

In `discover()` result, `items` can now be `Album` or `Shirt`.

### Tag API

Bandcamp used to have a dedicated page for showing albums by tag. That page has been replaced by Bandcamp Discover. The Tag API has accordingly been revised as follows:

- Removed `getInfo()`. `getAlbumHighlights()`, `getReleases()` and `getReleasesAvailableFilters()` methods.
- Added `getRelated()` for fetching related tags.

The data structure of Tag has also changed with the removal of `url`, `related` and `isLocation` properties.

To obtain albums by tag, use `discover(params)` of the Discovery API instead, and pass `customTags` in `params`.

### Autocomplete API

- In `getSuggestions(params)`, `params.limit` only applies when `itemType` is `ItemType.Location`.
