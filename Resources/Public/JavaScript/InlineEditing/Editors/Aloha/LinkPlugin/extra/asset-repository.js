/**
 * Create the Aloha Repositories object.
 */
define(
[
	'aloha',
	'jquery'
], function(
	Aloha,
	$
) {
	return Aloha.AbstractRepository.extend({
		_type: 'asset',
		_repositoryIdentifier: 'asset-repository',

		_constructor: function() {
			this._super(this._repositoryIdentifier);
		},

		getResultThumbnail: function($result) {
			if ($('[rel="thumbnail"]', $result).length > 0) {
				return '<img src="' + $('[rel="thumbnail"]', $result).attr('href') + '" width="40" height="40" alt="' + $result.text() + '" />';
			}
			return '';
		},

		getQueryRequestData: function(searchTerm) {
			return {
				searchTerm: searchTerm
			};
		},

		getObjectQueryRequestData: function() {
			return {};
		},

		/**
		 * Searches a repository for repository items matching queryString if none found returns null.
		 * The returned repository items must be an array of Aloha.Repository.Object
		 *
		 * @param {object} params object with properties
		 * @param {function} callback this method must be called with all resulting repository items
		 * @return {void}
		 */
		query: function(params, callback) {
			var that = this;

			require({context: 'neos'}, ['Shared/HttpRestClient'], function(HttpRestClient) {
				HttpRestClient.getResource('neos-service-assets', null, {data: that.getQueryRequestData(params.queryString)}).then(function(result) {
					var convertedResults = [];
					$.each($('.assets', result.resource).children('li'), function() {
						var assetIdentifier = $('.asset-identifier', this).text();
						convertedResults.push({
							'id': assetIdentifier,
							'__icon': '<i class="icon-file-alt"></i> ',
							'__path': '<br />' + assetIdentifier,
							'__thumbnail': that.getResultThumbnail($(this)),
							'name': $('.asset-label', this).text(),
							'url': that._type + '://' + assetIdentifier,
							'type': that._type,
							'repositoryId': that._repositoryIdentifier
						});
					});
					callback.call(this, convertedResults);
				});
			});
		},

		/**
		 * Get the repositoryItem with given id
		 * Callback: {Aloha.Repository.Object} item with given id
		 *
		 * @param {string} itemId  id of the repository item to fetch
		 * @param {function} callback callback function
		 * @return {void}
		 */
		getObjectById: function(itemId, callback) {
			var that = this;

			require({context: 'neos'}, ['Shared/HttpRestClient'], function(HttpRestClient) {
				HttpRestClient.getResource('neos-service-nodes', itemId, {data: that.getObjectQueryRequestData()}).then(function(result) {
					var convertedResult = [],
						$asset = $('.asset', result.resource),
						assetIdentifier = $('.asset-identifier', $asset),
						url = that._type + '://' + assetIdentifier;
					convertedResult.push({
						'id': assetIdentifier,
						'name': $('.asset-label', $asset).text() + ' (' + url + ')',
						'url': url,
						'type': that._type,
						'repositoryId': that._repositoryIdentifier
					});
					callback.call(this, convertedResult);
				});
			});
		},

		/**
		 * Mark or modify an object as needed by that repository for handling, processing or identification.
		 * Objects can be any DOM object as A, SPAN, ABBR, etc..
		 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
		 *
		 * @param {object} obj jQuery object to make clean
		 * @param {object} repositoryItem
		 * @return {void}
		 */
		markObject: function(obj, repositoryItem) {
			$(obj).attr('data-' + this._repositoryIdentifier + '-temporary-data', repositoryItem.name);
		},

		/**
		 * Make the given jQuery object (representing an object marked as object of this type)
		 * clean. All attributes needed for handling should be removed.
		 *
		 * @param {object} obj jQuery object to make clean
		 * @return {void}
		 */
		makeClean: function(obj) {
			$(obj).removeAttr('data-' + this._repositoryIdentifier + '-temporary-data');
		}
	});
});