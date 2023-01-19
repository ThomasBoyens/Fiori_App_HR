sap.ui.define([
    "./BaseController",
    'sap/ui/core/Fragment',
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/Device",
    "sap/m/library"
], function (BaseController, Fragment, JSONModel, Device, formatter, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("edu.be.ap.hr.zsd002hr.controller.Detail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page is busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            var oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
                edit: false
            });

            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

            this.setModel(oViewModel, "detailView");

            // this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, 'json');

            this._formFragments = {};

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Event handler when the share by E-Mail button has been clicked
         * @public
         */
        onSendEmailPress: function () {
            var oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },


        /**
         * Updates the item count within the line item table's header
         * @param {object} oEvent an event containing the total number of items in the list
         * @private
         */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    //Display 'Line Items' instead of 'Line items (0)'
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        /**
         * Event handler for navigating back.
         * We navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
        },

        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

        /**
         * Binds the view to the object path and expands the aggregated line items.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {

            this.getModel("detailView").setProperty("/edit", false);
            const sPersNr = oEvent.getParameter("arguments").persNr;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");

            if (typeof sPersNr === 'string' && sPersNr.length > 0) {
                this._initData(sPersNr)
            } else {
                this.getRouter().navTo('list', {}, true);
            }
        },

        // method to get data from backend and create models
        _initData(persNr) {
            this.getModel().read(`/ZSD_002_C_PERSONNEL('${persNr}')`, {
                urlParameters: '$expand=to_info/to_functions,to_info/to_pay',
                success: function (oData) {
                    // create model for the personnel
                    this._CreatePersonellModel(oData)

                    // create model for the function
                    this._CreateFunctionModel(oData.to_info.to_functions.results)

                    // get data + create model for the payslips
                    this._CreatePayslipModel(oData.to_info.to_pay.results)

                }.bind(this),
                error: function (oError) {
                    console.error(oError);
                }
            });
        },

        // method to create model for the personnelinfo
        _CreatePersonellModel(oData) {

            //change gender before creating
            this._setGender(oData);

            //create model for the personnel
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Personnel', oData)
            this.getView().setModel(oModel, 'json');
            this.getView().bindElement("/Personnel");

        },

        // method to create model for the function
        _CreateFunctionModel(functionList) {

            // set model for all the functions of person
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Functions', functionList.reverse());
            this.getView().setModel(oModel, 'func');
            this.getView().bindElement("/Functions");
        },

        // method to create model for the payslips
        _CreatePayslipModel(payslipList) {
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Payslip', payslipList.slice(-3));
            console.log(payslipList);
            this.getView().setModel(oModel, 'pay');
            this.getView().bindElement("/Payslip");
        },

        _CreateYearlyPayModel() {
            //TODO: chart yearly pay
        },

        /* =========================================================== */
        /* begin: Manipulation Odata                                   */
        /* =========================================================== */

        _AlterPayslip() {
            //TODO: calculate salary from pay slip data
        },


        _setGender(oData) {

            // gender is a number 1= male and 2= female
            switch (oData.to_info.Gender) {
                case "1":
                    // set gender to male
                    oData.to_info.Gender = "male";
                    break;
                case "2":
                    // set gender to female
                    oData.to_info.Gender = "female";
                    break;
            }
            return oData;
        },

        /* =========================================================== */
        /* begin: fragment methods                                     */
        /* =========================================================== */

        handleEditPress: function () {
            this.getModel("detailView").setProperty("/edit", true);
        },

        handleCancelPress: function () {
            this.getModel("detailView").setProperty("/edit", false);
        },

        handleSavePress: function () {
            const persNr = this.getModel('json').getProperty('/Personnel').Pers_nr;
            var countryCode = this.getView().byId("CountryComboBox").getSelectedKey();
            console.log(countryCode);

            const oEmployee = {
                PersNr: persNr,
                Street: this.getView().byId("street").getValue(),
                City: this.getView().byId("city").getValue(),
                PostalCode: this.getView().byId("postal").getValue(),
                CountryCode: countryCode,
                //Region : this.getView().byId("region").getValue(),
                //Iban : this.getView().byId("iban").getValue(),
                LastName: this.getView().byId("lastname").getValue(),
                FirstName: this.getView().byId("firstname").getValue(),
                //Gender : this.getModel('json').getProperty('/Personnel').Gender,
                Mail: this.getView().byId("mail").getValue(),
                PhoneNr: this.getView().byId("phone").getValue(),
            }

            this.getModel().update(`/PersonnelInfoSet('${persNr}')`, oEmployee,
                {
                    succes: function (oFeedback) { console.log(oFeedback); },
                    error: function (oError) { console.error(oError); }
                });

            this.getModel("detailView").setProperty("/edit", false);
        },

        _getFormFragment: function (sFragmentName) {
            var pFormFragment = this._formFragments[sFragmentName],
                oView = this.getView();

            if (!pFormFragment) {
                pFormFragment = Fragment.load({
                    id: oView.getId(),
                    name: "edu.be.ap.hr.zsd002hr.view.fragment." + sFragmentName
                });
                this._formFragments[sFragmentName] = pFormFragment;
            }

            return pFormFragment;
        },

        _showFormFragment: function (sFragmentName) {
            var detailFrag = this.getView().byId("perInfoSectionSubSect");
            //detailFrag.removeAllBlocks();
            this._getFormFragment(sFragmentName).then(function (oVBox) {
                detailFrag.addBlock(oVBox);
            });
        },

        /* =========================================================== */
        /* begin: event handlers                                    */
        /* =========================================================== */

        // method to handle the press of the job function
        onJobSelection: function (oEvent) {
            var oList = oEvent.getSource()

            this.getModel("appView").setProperty("/layout", "ThreeColumnsMidExpanded");

            this.getRouter().navTo("job", {
                persNr: this.getModel('json').getProperty('/Personnel').Pers_nr,
                position: oList.getBindingContext('func').getObject('Plans')   
            });
        },

        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on list after detail page is closed
            //this.getOwnerComponent().oListSelector.clearListListSelection();
            this.getRouter().navTo("list");
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        }
    });

});