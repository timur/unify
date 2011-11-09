/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2009-2011 Deutsche Telekom AG, Germany, http://telekom.com

*********************************************************************************************** */

/**
 * Manager for view managers which functions as a so-called pop over.
 *
 */

qx.Class.define("unify.view.PopOverManager",
{
  extend : qx.core.Object,
  type : "singleton",
  
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
    
  construct : function()
  {
    this.base(arguments);
    
    this.__root = qx.core.Init.getApplication().getRoot();
    this.__visibleViewManagers = [];
    this.__overlays={};
    this.__styleRegistry = {};
    
    var setStyles = qx.lang.Function.bind(qx.bom.element.Style.setStyles, qx.bom.element.Style);
    
    var pblocker = this.__pblocker = document.createElement("div");
    setStyles(pblocker, {
      "position": "absolute",
      "left": 0,
      "top": 0,
      "width": "100%",
      "height": "100%",
      "display": "none"
    });
    pblocker.id = "popover-blocker";
    var mblocker = this.__mblocker = document.createElement("div");
    setStyles(mblocker, {
      "position": "absolute",
      "left": 0,
      "top": 0,
      "width": "100%",
      "height": "100%",
      "display": "none",
      "backgroundColor": "#000",
      "opacity": 0.5
    });
    mblocker.id = "modal-blocker";
    qx.event.Registration.addListener(pblocker,'tap',this.__onTapBlocker,this);
    this.__root.getElement().appendChild(pblocker);
    this.__root.getElement().appendChild(mblocker);
  },
  
  

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
    
  members :
  {
    __root : null,
    __visibleViewManagers : null,
    __pblocker : null,
    __mblocker : null,
    
    /** {Map} ID to view manager registry */
    __viewManagers : null,
    
    
    /** {Map} Style registry */
    __styleRegistry : null,
    
    setStyles : function(viewManager, styleMap) {
      this.__styleRegistry[viewManager] = styleMap;
    },
    
    getStyles : function(viewManager) {
      return this.__styleRegistry[viewManager];
    },
    
    /**
     * Applies correct zIndex to all visible pop-overs
     * and positions blocker below the topmost visible popover.
     */
    __sortPopOvers : function()
    {
      var zIndexBase=100;//TODO read base value from config or some other global strategy to play nice with other zIndex dependant features like transition animations
      var visible = this.__visibleViewManagers;
      var pblocker = this.__pblocker;
      var mblocker = this.__mblocker;

      var numVisible=visible.length;
      for (var i=0; i<numVisible; i++) {
        var viewManager=visible[i];
        var elem=viewManager.getElement();
        if(viewManager.getDisplayMode()=='popover'){
          elem=elem.parentNode;//adjust wrapper for popovers
        }
        elem.style.zIndex = zIndexBase + 2*i;//leave a gap of 1 between layers so the blocker fits between 2 visible popovers
      }

      if(numVisible>0){
        var mSet=false;
        var pSet=false;
        for(var i=numVisible-1;i>=0;i--){
          var mode=visible[i].getDisplayMode();

          if(!mSet && mode == 'modal'){
            mblocker.style.zIndex = (zIndexBase-1)+2*i;
            mblocker.style.display = 'block';
            mSet=true;
          } else if (!pSet && mode =='popover'){
            pblocker.style.zIndex = (zIndexBase-1)+2*i;
            pblocker.style.display = 'block';
            pSet=true;
          }
          if(mSet&&pSet){
            break;
          }
        }
        if(!mSet){
          mblocker.style.zIndex =undefined;
          mblocker.style.display='none';
        }
        if(!pSet){
          pblocker.style.zIndex = undefined;
          pblocker.style.display='none';
        }
      } else {
        pblocker.style.zIndex = undefined;
        mblocker.style.zIndex = undefined;
        pblocker.style.display='none';
        mblocker.style.display='none';
      }
    },

    /**
     * Closes topmost popover
     */
    __onTapBlocker : function(){
      var numVisible=this.__visibleViewManagers.length;
      if(numVisible>0){
        var topMost=this.__visibleViewManagers[numVisible-1];

        this.hide(topMost.getId());
      } else {
        this.error("tapped on blocker without visible viewmanager");
        //sort popovers again to make sure the blocker is gone
        this.__sortPopOvers();
      }
    },

    /**
     * Shows the view manager with the given ID.
     *
     * @param id {String} ID of view manager
     * @param trigger {unify.ui.Widget?null} Widget that triggers the opening of the popover
     * @param triggerPosition {String?null} Position on trigger to attach popover to
     * @param popoverPosition {String?null} Position on popover to attach to the trigger position
     */
    show : function(id, trigger, triggerPosition, popoverPosition)
    {
      var viewManager = unify.view.ViewManager.get(id);
      if (!viewManager.isInitialized()) {
        viewManager.init();
      }
      
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!viewManager) {
          throw new Error("Unknown view manager: " + id);
        }
      }
      if (this.__visibleViewManagers.indexOf(viewManager) >-1) {
        if (qx.core.Environment.get("qx.debug")){
            this.debug("called show with viewmanager that is already visible: "+id);
        }
        return;//already visible
      }
      if (qx.core.Environment.get("qx.debug")) {
        this.debug("Show: " + id);
      }
      var elem = viewManager.getElement();
      var overlay;
      if(viewManager.getDisplayMode()=='popover'){
        overlay=this.__getOverlay(viewManager);
        /*var wrapper = overlay.getElement();*/
        var style = this.__styleRegistry[viewManager] || {};
        
        if (trigger && triggerPosition && popoverPosition) {
          var position = trigger.getPositionInfo();
          
          style.left = (position.left + position.width + 5);
          style.top = (position.top + 5);
        }
        
        if (style) {
          var left = style.left || 0;
          var top = style.top || 0;
          var mystyle = qx.lang.Object.clone(style);
          delete mystyle.left;
          delete mystyle.top;
          
          overlay.setStyle(mystyle);
          this.__root.add(overlay, {
            left: left,
            top: top
          });
        } else {
          this.error("No style of overlay for view " + viewManager);
        }
        
        overlay.add(viewManager.getWidgetElement());
      } else {
        if(!this.__root==elem.parentNode){
          this.__root.appendChild(elem);
        }
      }
      this.__visibleViewManagers.push(viewManager);
      this.__sortPopOvers();
      viewManager.show();
      if(overlay){
         overlay.show();
      }
    },
    
    
    /**
     * Hides the view manager with the given ID.
     *
     * @param id {String} ID of view manager
     */
    hide : function(id,skipAnimation)
    {
      var viewManager=unify.view.ViewManager.get(id);

      if (qx.core.Environment.get("qx.debug"))
      {
        if (!viewManager) {
          throw new Error("Unknown view manager: " + id);
        }
      }
      if (this.__visibleViewManagers.indexOf(viewManager) < 0) {
        if (qx.core.Environment.get("qx.debug")){
            this.debug("called hide with viewmanager that is not visible: "+id);
        }
        return;
      }
      var mode=viewManager.getDisplayMode();

      var self=this;
      var hideCallback=function(){
        viewManager.hide();

        qx.lang.Array.remove(self.__visibleViewManagers, viewManager);
        self.__sortPopOvers();
      };

      if(mode=='popover'){
        var overlay=this.__overlays[viewManager];
        if(skipAnimation){
          var animate=overlay.getEnableAnimation();
          overlay.setEnableAnimation(false);
          overlay.hide();
          overlay.setEnableAnimation(animate);
          hideCallback();
        } else {
          overlay.addListenerOnce("hidden",hideCallback,this);
          overlay.hide();
        }
      } else {
        viewManager.hide(hideCallback);
      }
    },

    __getOverlay : function(viewManager){
      var overlay=this.__overlays[viewManager];
      if(!overlay){
        overlay=new unify.ui.container.Overlay;
        var elem=overlay.getElement();
        elem.id='popover-overlay';
        /*var indicator=document.createElement("div");
        indicator.className="popover-indicator";
        elem.appendChild(indicator);*/
        this.__overlays[viewManager]=overlay;
      }
      return overlay;
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
    
  destruct : function() {
    qx.event.Registration.removeListener(this.__pblocker,'tap',this.__onTapBlocker,this);
    this.__root.removeChild(this.__pblocker);
    this.__root.removeChild(this.__mblocker);
    this.__root = this.__pblocker= this.__mblocker=this.__viewManager=this.__styleRegistry = null;
  } 
});