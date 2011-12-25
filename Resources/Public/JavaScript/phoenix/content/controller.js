/**
 * Controllers which are not model- but appearance-related
 */

define(
['phoenix/common'],
function() {

	var T3 = window.T3 || {};
	T3.Content = T3.Content || {};
	var $ = window.Aloha.jQuery || window.jQuery;

	/**
	 * This controller toggles the preview mode on and off.
	 */
	var Preview = SC.Object.create({
		previewMode: false,

		init: function() {
			if (T3.Common.LocalStorage.getItem('previewMode') === true) {
				$('body').removeClass('t3-ui-controls-active');
				$('body').addClass('t3-ui-controls-inactive');
				$('body').addClass('typo3-previewmode-enabled');
				this.set('previewMode', true);
			}
		},

		togglePreview: function() {
			this.set('previewMode', !this.get('previewMode'));
		},

		onTogglePreviewMode: function() {
			var isPreviewEnabled = this.get('previewMode');
			var i = 0, count = 5, allDone = function() {
				i++;
				if (i >= count) {
					if (isPreviewEnabled) {
						$('body').removeClass('t3-ui-controls-active');
						$('body').addClass('t3-ui-controls-inactive');
						Aloha.editables.forEach(function(editable) {
							editable.disable();
						});
					} else {
						$('body').addClass('t3-ui-controls-active');
						$('body').removeClass('t3-ui-controls-inactive');

						Aloha.editables.forEach(function(editable) {
							editable.enable();
						});
					}
				}
			};
			if (isPreviewEnabled) {
				$('body').addClass('t3-ui-previewmode-activating');
				if(!T3.Common.LocalStorage.getItem('previewModeStore')) {
					var stylesToSave = {
						'body': {
							'margin-top': $('body').css('margin-top'),
							'margin-right': $('body').css('margin-right')
						},
						't3-footer': {
							'height': $('#t3-footer').css('height')
						},
						't3-toolbar': {
							'top': $('#t3-toolbar').css('top'),
							'right': $('#t3-toolbar').css('right')
						},
						't3-inspector': {
							'width': $('#t3-inspector').css('width')
						}
					};
					T3.Common.LocalStorage.setItem('previewModeStore', stylesToSave);
				}

				$('.t3-contentelement-hidden').hide('fast');
				$('body').animate({
					'margin-top': 30,
					'margin-right': 0
				}, 'fast', allDone);
				$('#t3-footer').animate({
					height: 0
				}, 'fast', allDone);
				$('#t3-toolbar').animate({
					top: 0,
					right: 0
				}, 'fast', allDone);
				$('#t3-ui-top').slideUp('fast', allDone);
				$('#t3-inspector').animate({
					width: 0
				}, 'fast', allDone);
			} else {

				var stylesToUse = T3.Common.LocalStorage.getItem('previewModeStore');

				$('body').removeClass('t3-ui-previewmode-activating');
				// TODO Cleanup the 'hidden' workaround for previewMode with a CSS transition
				$('#t3-footer, #t3-ui-top, #t3-inspector').css('display', 'block');

				$('.t3-contentelement-hidden').show('fast');

				$('body').animate({
					'margin-top': stylesToUse['body']['margin-top'],
					'margin-right': stylesToUse['body']['margin-right']
				}, 'fast', allDone);
				$('#t3-footer').animate({
					height: stylesToUse['t3-footer']['height']
				}, 'fast', allDone);
				$('#t3-toolbar').animate({
					top: stylesToUse['t3-toolbar']['top'],
					right: stylesToUse['t3-toolbar']['right']
				}, 'fast', allDone);
				$('#t3-ui-top').slideDown('fast', allDone);
				$('#t3-inspector').animate({
					width: stylesToUse['t3-inspector']['width']
				}, 'fast', allDone);
			}
		}.observes('previewMode'),

		onPreviewModeChange: function() {
			T3.Common.LocalStorage.setItem('previewMode', this.get('previewMode'));
		}.observes('previewMode')
	});

	/**
	 * This controller toggles the inspection mode on and off.
	 *
	 * @TODO: rename differently, because it is too similar with "Inspector"
	 * @TODO: Toggling inspectMode does not show popover
	 */
	var Inspect = SC.Object.create({
		inspectMode: false,

		onInspectModeChange: function() {
			var isInspectEnabled = this.get('inspectMode');
			if (isInspectEnabled) {
				$('body').addClass('t3-inspect-active');
			} else {
				$('body').removeClass('t3-inspect-active');
			}
		}.observes('inspectMode')
	});

	/**
	 * Controller for the inspector
	 */
	var Inspector = SC.Object.create({
		_modified: false,
		_unmodified: function() {
			return !this.get('_modified');
		}.property('_modified').cacheable(),

		blockProperties: null,

		selectedBlock: null,
		cleanProperties: null,

		init: function() {
			this.set('blockProperties', SC.Object.create());
		},

		/**
		 * This is a computed property which builds up a nested array powering the
		 * Inspector. It essentially contains two levels: On the first level,
		 * the groups are displayed, while on the second level, the properties
		 * belonging to each group are displayed.
		 *
		 * Thus, the output looks possibly as follows:
		 * - Visibility
		 *   - _hidden (boolean)
		 *   - _starttime (date)
		 * - Image Settings
		 *   - image (file upload)
		 */
		sectionsAndViews: function() {
			var selectedBlockSchema = T3.Content.Model.BlockSelection.get('selectedBlockSchema');
			if (!selectedBlockSchema || !selectedBlockSchema.propertyGroups || !selectedBlockSchema.properties) return [];

			var sectionsAndViews = [];
			$.each(selectedBlockSchema.propertyGroups, function(propertyGroupIdentifier, propertyGroupConfiguration) {
				var properties = [];
				$.each(selectedBlockSchema.properties, function(propertyName, propertyConfiguration) {
					if (propertyConfiguration.category === propertyGroupIdentifier) {
						properties.push($.extend({key: propertyName}, propertyConfiguration));
					}
				});

				properties.sort(function(a, b) {
					return (b.priority || 0) - (a.priority || 0);
				});

				sectionsAndViews.push($.extend({}, propertyGroupConfiguration, {
					properties: properties
				}));
			});
			sectionsAndViews.sort(function(a, b) {
				return (b.priority || 0) - (a.priority || 0);
			})

			return sectionsAndViews;
		}.property('T3.Content.Model.BlockSelection.selectedBlockSchema').cacheable(),

		/**
		 * When the selected block changes in the content model,
		 * we update this.blockProperties
		 */
		onSelectedBlockChange: function() {
			this.selectedBlock = T3.Content.Model.BlockSelection.get('selectedBlock');
			this.cleanProperties = this.selectedBlock.getCleanedUpAttributes();
			this.set('blockProperties', SC.Object.create(this.cleanProperties));
		}.observes('T3.Content.Model.BlockSelection.selectedBlock'),


		/**
		 * We'd like to monitor *every* property change, that's why we have
		 * to look through the list of properties...
		 */
		onBlockPropertiesChange: function() {
			var that = this,
				selectedBlock = this.get('selectedBlock');
			if (selectedBlock) {
				var selectedBlockSchema = T3.Content.Model.BlockSelection.get('selectedBlockSchema'),
					editableProperties = [],
					blockProperties = this.get('blockProperties');
				if (selectedBlockSchema.properties) {
					$.each(selectedBlockSchema.properties, function(propertyName, propertyConfiguration) {
						if (selectedBlockSchema.inlineEditableProperties) {
							if ($.inArray(propertyName, selectedBlockSchema.inlineEditableProperties) === -1) {
								editableProperties.push(propertyName);
							}
						} else {
							editableProperties.push(propertyName);
						}
					});
				}
				if (editableProperties.length > 0) {
					$.each(editableProperties, function(key, propertyName) {
						blockProperties.addObserver(propertyName, null, function(property, propertyName, value) {
							that._somePropertyChanged();
						});
					});
				}
			}
		}.observes('blockProperties'),

		// Some hack which is fired when we change a property. Should be replaced with a proper API method which should be fired *every time* a property is changed.
		_somePropertyChanged: function() {
			var that = this,
				hasChanges = false;
			$.each(this.selectedBlock.getCleanedUpAttributes(), function(key, value) {
				if (that.get('blockProperties').get(key) !== value) {
					hasChanges = true;
				}
			});
			this.set('_modified', hasChanges);
		},

		/**
		 * When the edit button is toggled, we apply the modified properties back
		 */
		onApplyButtonToggle: function(isModified) {
			if (isModified) {
				this.apply();
			}
		},

		/**
		 * Apply the edited properties back to the block
		 */
		apply: function() {
			var that = this;
			SC.beginPropertyChanges();
			SC.keys(this.cleanProperties).forEach(function(key) {
				that.selectedBlock.set(key, that.blockProperties.get(key));
			});

			this.set('_modified', false);
			SC.endPropertyChanges();
		},

		/**
		 * Revert all changed properties
		 */
		revert: function() {
			this.cleanProperties = this.selectedBlock.getCleanedUpAttributes();
			this.set('blockProperties', SC.Object.create(this.cleanProperties));
			this.set('_modified', false);
		}
	});

	/**
	 * The BlockActions is a container for numerous actions which can happen with blocks.
	 * They are normally triggered when clicking Block UI handles.
	 * Examples include:
	 * - deletion of content
	 * - creation of content
	 *
	 * @singleton
	 */
	var BlockActions = SC.Object.create({

		// TODO: Move this to a separete controller
		_clipboard: null,

		/**
		 * Initialization lifecycle method. Here, we connect the create-new-content button
		 * which is displayed when a ContentArray is empty.
		 */
		init: function() {
			if (T3.Common.LocalStorage.getItem('clipboard')) {
				this.set('_clipboard', T3.Common.LocalStorage.getItem('clipboard'));
			}
		},
		deleteBlock: function(nodePath, $handle) {
			var that = this;
			$handle.addClass('t3-handle-loading');

			T3.Common.Dialog.openConfirmPopover({
				title: 'Are you sure you want to remove this content element?',
				content: 'If you remove this element you can restore it using undo',
				positioning: 'absolute',
				onOk: function() {
					TYPO3_TYPO3_Service_ExtDirect_V1_Controller_NodeController['delete'].call(
						that,
						nodePath,
						function (result) {
							if (result.success) {
								T3.ContentModule.reloadPage();
							}
						}
					);
				},
				onDialogOpen: function() {
					$handle.removeClass('t3-handle-loading');
				}
			}, $handle);


		},

		addAbove: function(nodePath, $handle) {
			this._add(nodePath, 'above', $handle);
		},
		addBelow: function(nodePath, $handle) {
			this._add(nodePath, 'below', $handle);
		},
		addInside: function(nodePath, $handle) {
			this._add(nodePath, 'inside', $handle);
		},
		_add: function(nodePath, position, $handle) {
			if ($handle !== undefined) {
				$handle.addClass('t3-handle-loading');


				$handle.bind('showPopover', function() {
					$('.contentTypeSelectorTabs.notInitialized').each(function(index) {
						var newDate = new Date();
						var uniqueId = 't3-content-tabs-' + Math.random() * Math.pow(10, 17) + '-' + newDate.getTime();
						$(this).attr('id', uniqueId);

						$(this).children('ul').find('li a').each(function (index) {
							$(this).attr('href', '#' + uniqueId + '-' + index.toString());
						});

						$(this).children('div').each(function (index) {
							$(this).attr('id', uniqueId + '-' + index.toString());
						})
						$(this).tabs();
						$(this).removeClass('notInitialized');
					});
					$('.t3-handle-loading').removeClass('t3-handle-loading');
				});
			}

			T3.Common.Dialog.openFromUrl(
				'/typo3/content/new',
				{
					position: position,
					referenceNode: nodePath
				},
				{
					'created-new-content': function($callbackDomElement) {
						T3.ContentModule.reloadPage();
					}
				},
				$handle,
				{
					positioning: 'absolute'
				}
			);

		},

		/**
		 * Cut a node and put it on the clipboard
		 * TODO: Decide if we move cut copy paste to another controller
		 * @return {void}
		 */
		cut: function(nodePath, $handle) {
			var block = T3.Content.Model.BlockManager.getBlockByNodePath(nodePath);
			block.hideHandle('remove-from-copy');
			block.showHandle('copy');
			this.set('_clipboard', {
				type: 'cut',
				nodePath: nodePath
			});
		},

		/**
		 * Copy a node and put it on the clipboard
		 * @return {void}
		 */
		copy: function(nodePath, $handle) {
			var block = T3.Content.Model.BlockManager.getBlockByNodePath(nodePath);
			block.hideHandle('remove-from-cut');
			block.showHandle('cut');
			this.set('_clipboard', {
				type: 'copy',
				nodePath: nodePath
			});
		},

		/**
		 * Paste the current node on the clipboard before another node
		 * @param {String} nodePath the nodePath of the target node
		 * @param {jQuery} handle the clicked handle
 		 * @return {void}
		 */
		pasteBefore: function(nodePath, $handle) {
			this._paste(nodePath, $handle, 'before');
		},

		/**
		 * Paste the current node on the clipboard after another node
		 * @param {String} nodePath the nodePath of the target node
		 * @param {jQuery} handle the clicked handle
		 * @return {void}
		 */
		pasteAfter: function(nodePath, $handle) {
			this._paste(nodePath, $handle, 'after');
		},

		/**
		 * Paste a node on a certain location, relative to another node
		 * @param {String} nodePath the nodePath of the target node
		 * @param {jQuery} handle the clicked handle
		 * @param {String} position
		 * @return {void}
		 */
		_paste: function(nodePath, $handle, position) {
			var that = this,
				clipboard = this.get('_clipboard');

			if (!clipboard.nodePath) {
				T3.Common.Notification.notice('No node found on the clipboard');
				return;
			}
			if (clipboard.nodePath === nodePath) {
				T3.Common.Notification.notice('It is not possible to paste a node "' + position + '" at itself');
				return;
			}

			var action = (position == 'before') ? 'moveBefore' : 'moveAfter';
			TYPO3_TYPO3_Service_ExtDirect_V1_Controller_NodeController[action].call(
				that,
				clipboard.nodePath,
				nodePath,
				function (result) {
					if (result.success) {
						T3.Common.LocalStorage.removeItem('clipboard');
						T3.ContentModule.reloadPage();
					}
				}
			);
		},

		/**
		 * Paste the current node on the clipboard after another node
		 * @param {String} nodePath the nodePath of the target node
		 * @param {jQuery} handle the clicked handle
		 * @return {void}
		 */
		removeFromClipboard: function(nodePath, $handle) {
			var block = T3.Content.Model.BlockManager.getBlockByNodePath(nodePath),
				clipboard = this.get('_clipboard');

			if (clipboard.nodePath === nodePath) {
				this.set('_clipboard', {});
			}

			block.hideHandle('remove-from-cut');
			block.hideHandle('remove-from-copy');
			$('.t3-paste-before-handle, .t3-paste-after-handle').addClass('t3-handle-hidden');
			block.showHandle('cut');
			block.showHandle('copy');
			block.showHandle('add-above');
			block.showHandle('add-below');
		},

		/**
		 * Observes the _clipboard property and processes changes
		 * @return {void}
		 */
		onClipboardChange: function() {
			try {
				var clipboard = this.get('_clipboard');
				T3.Common.LocalStorage.setItem('_clipboard', clipboard);
				var block = T3.Content.Model.BlockManager.getBlockByNodePath(clipboard.nodePath);

				if (clipboard.type === 'cut') {
					// TODO: Make a sproutcore binding to andle this
					$('.t3-contentelement-cut').each(function() {
						$(this).removeClass('t3-contentelement-cut');
						$(this).parent().find('.t3-cut-handle').removeClass('t3-handle-hidden');
					});

					// Handle cut
					block.getContentElement().addClass('t3-contentelement-cut');
					block.hideHandle('cut');
					block.showHandle('remove-from-cut');
				} else if (clipboard.type === 'copy') {
					// Handle copy
					block.hideHandle('copy');
					block.showHandle('remove-from-copy');
				}
				$('.t3-paste-before-handle, .t3-paste-after-handle').removeClass('t3-handle-hidden');
				block.hideHandle('add-above');
				block.hideHandle('add-below');
			} catch (error) {
				// TODO: HACK! Somehow this is a DOMWindow on first load of the page
				setTimeout(this.onClipboardChange, 500);
			}
		}.observes('_clipboard')
	});


	var ServerConnection = SC.Object.create({

		_lastSuccessfulTransfer: null,
		_failedRequest: false,
		_pendingSave: false,
		_saveRunning: false,

		sendAllToServer: function(collection, transformFn, extDirectFn, callback, elementCallback) {
			var that = this,
				numberOfUnsavedRecords = collection.get('length'),
				responseCallback = function(element) {
					return function(provider, response) {
						if (response.status === false) {
							that.set('_failedRequest', true);
							that.set('_saveRunning', false);
							return;
						} else {
							that.set('_failedRequest', false);
							that.set('_lastSuccessfulTransfer', new Date());
						}

						if (elementCallback) {
							elementCallback(element);
						}
						numberOfUnsavedRecords--;
						if (numberOfUnsavedRecords <= 0) {
							that.set('_saveRunning', false);
							callback();
						}
					};
				};
			collection.forEach(function(element) {
				// Force copy of array
				var args = transformFn(element).slice();
				args.push(responseCallback(element));
				that.set('_saveRunning', true);
				extDirectFn.apply(window, args);
			})
		},

		statusClass: function() {
			var className = 't3-connection-status-';
			className += this.get('_failedRequest') ? 'down' : 'up';
		}.observes('_failedRequest')

	});

	T3.Content.Controller = {
		Preview: Preview,
		Inspect: Inspect,
		BlockActions: BlockActions,
		Inspector: Inspector,
		ServerConnection: ServerConnection
	}
	window.T3 = T3;
});
