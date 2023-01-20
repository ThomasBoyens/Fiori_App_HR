sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "./Detail.controller",
    "../model/formatter",
    "sap/m/library"
], function (BaseController, JSONModel, DetailController, formatter, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return DetailController.extend("edu.be.ap.hr.zsd002hr.controller.PayDetail", {

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

            this.getRouter().getRoute("pay").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "payDetailView");

            // this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, 'json');

        },

        _onObjectMatched: function (oEvent) {
            const sPersNr = oEvent.getParameter("arguments").persNr;
            this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");
            
            if (typeof sPersNr === 'string' && sPersNr.length > 0) {
                this._initData(sPersNr)
            } else {
                this.getRouter().navTo('list', {}, true);
            }
        },

        _initData(persNr) {
            this.getModel().read(`/ZSD_002_C_PERSONNEL('${persNr}')`, {
                urlParameters: '$expand=to_info/to_pay',
                success: function (oData) {
                    // get data + create model for the payslips
                    this._CreatePayslipModel(oData.to_info.to_pay.results);
                    
                    console.log(oData.to_info.to_pay.results)

                }.bind(this),
                error: function (oError) {
                    console.error(oError);
                }
            });
        },

        // method to create model for the payslips
        _CreatePayslipModel(payslipList) {

            payslipList = this._AlterPayslip(payslipList)
            payslipList = this._paySorted(payslipList)
            this.getModel('json').setProperty('/Payslip', payslipList.reverse())
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/endColumn/fullScreen", false);
            this.getRouter().navTo("object", {
                persNr: this.getModel('json').getProperty('/Payslip/0/Pers_nr')
            }, true);
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