/*
===============================================================================================

 Unify Project

 Homepage: unify-project.org
 License: MIT + Apache (V2)
 Copyright: 2011, Sebastian Fastner, Mainz, Germany, http://unify-training.com

 ===============================================================================================
*/

/**
 * Animate position of widget
 */
core.Class("unify.fx.Opacity", {
	include: [unify.fx.core.Base],
	
	construct : function(widget) {
		unify.fx.core.Base.call(this, widget);
	},
	
	members : {
		__mod : null,
		__anim : null,
		__resetPoint: null,
		
		_setup : function() {
			var to = this.getValue();
			var from = this.__resetPoint = parseFloat(this._widget.getStyle("opacity")) || 1;
			
			this.__mod = from;
			this.__anim = to - from
		},
		
		_reset : function(value) {
			this._widget.setStyle({
				opacity: value||"1"
			});
		},
		
		_getResetValue : function() {
			return this.__resetPoint;
		},
		
		_render : function(percent, now, render) {
			if (!render) {
				return;
			}
			var mod = this.__mod;
			var anim = this.__anim;

			this._widget.setStyle({
				opacity: (mod + anim * percent)
			});
		}
	}
});