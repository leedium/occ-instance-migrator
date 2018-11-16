define(

  ['knockout', 'CCi18n'],

  function(ko, CCi18n) {

    "use strict";

    return {
      /*
       * Note that "this" is bound to the Widget View Model.
       */      
      resourcesLoaded : function(widget) {
      },

      onLoad : function(widget) { 
      
        /*
         Configuration properties can be accessed as follows:
         */
        console.log(widget.exampleStringProperty());
        console.log(widget.exampleOptionProperty());
        console.log(widget.exampleBooleanProperty());
            
        /*
         * Localized resource values can be accessed as follows:
         */
        console.log(CCi18n.t("exampleResourceKey"));
            
      },

      beforeAppear : function(page) {
      }
    }
  }
);
