sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("edu.be.ap.hr.zsd002hr.controller.JobDetail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy : false,
                delay : 0,
                lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading"),
                edit: false
            });

            this.getRouter().getRoute("job").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "jobDetailView");

            // this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, 'json');

        },

        _onObjectMatched: function (oEvent) {
            const sPositionNr = oEvent.getParameter("arguments").position;
            this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");
            
            if (typeof sPositionNr === 'string' && sPositionNr.length > 0) {
                this._initData(sPositionNr)
            } else {
                this.getRouter().navTo('list', {}, true);
            }
        },

        _initData(positionNr) {
            this.getModel().read(`/FunctionDescriptionSet('${positionNr}')`, {
                success: function (oData) {
                    // set position data in the json model
                    this.getModel('json').setProperty('/Position', oData)

                }.bind(this),
                error: function (oError) {
                    console.error(oError);
                }
            });
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
            window.history.go(-1);
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/endColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "EndColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        },

    });

});