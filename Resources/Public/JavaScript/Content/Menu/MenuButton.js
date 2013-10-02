define(
	[
		'emberjs',
		'Library/jquery-with-dependencies',
		'../Components/Button',
		'./MenuPanelController'
	], function(Ember, $, Button, MenuPanelController) {
		return Button.extend({
			elementId: ['neos-menu-button'],
			title: 'Toggle menu',
			classNames: ['neos-button'],
			classNameBindings: ['controller.menuPanelMode:neos-pressed'],

			controller: MenuPanelController,

			init: function() {
				if (this.get('controller.configuration.stickyMenuState')){
					this.toggleProperty('controller.menuPanelMode');
				}
			},

			triggerAction: function() {
				this.toggleProperty('controller.menuPanelMode');
			},

			mouseEnter: function() {
				this._super();
				this.set('controller.menuPanelMode', true);
			},

			mouseLeave: function() {
				this._super();

				if (this.get('controller.stickyMenuPanelMode') === false) {
					if ($('#neos-menu-panel:hover').length !== 0) {
						this.set('controller.menuPanelMode', false);
					} else if (this.get('controller.menuPanelMode') === true) {
						this.set('controller.menuPanelMode', false);
					}
				}
			}
		});
	}
);