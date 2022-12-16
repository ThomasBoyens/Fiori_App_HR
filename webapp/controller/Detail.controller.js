sap.ui.define([
    "./BaseController",
    'sap/ui/core/Fragment',
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library"
], function (BaseController, Fragment, JSONModel, formatter, mobileLibrary) {
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

            //this._showFormFragment("Display");

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

                // this._formFragments = {};
                // // Set the initial form to be the display one
                // this._showFormFragment("Display");

            } else {
                this.getRouter().navTo('list', {}, true);
            }
        },

        /* =========================================================== */
        /* begin: Get Data                                             */
        /* =========================================================== */


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

                    this._CreateYearlyPayModel(oData.to_info.to_pay.results);

                }.bind(this),
                error: function (oError) {
                    console.error(oError);
                }
            });
        },



        /* =========================================================== */
        /* begin: Creating Models                                      */
        /* =========================================================== */

        _CreatePersonellModel(oData) {

            //change gender before creating
            this._setGender(oData);

            //create model for the personnel
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Personnel', oData)
            this.getView().setModel(oModel, 'json');
            this.getView().bindElement("/Personnel");

        },

        _CreateFunctionModel(functionList) {

            // set model for all the functions of person
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Functions', functionList.reverse());
            this.getView().setModel(oModel, 'func');
            this.getView().bindElement("/Functions");
        },

        _CreatePayslipModel(payslipList) {

            payslipList = this._AlterPayslip(payslipList)
            payslipList = this._paySorted(payslipList)
            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/Payslip', payslipList.reverse().slice(0, 3));
            console.log(payslipList);
            this.getView().setModel(oModel, 'pay');
            this.getView().bindElement("/Payslip");
        },

        _CreateYearlyPayModel(payslipList) { 
            let yearPay = {
                "loan": 
                [
                    { "Year": "2022", "Salary" : 100000 , "Bonus" : 23000   }, 
                    { "Year": "2021", "Salary" : 80000,   "Bonus" : 20000   }, 
                    { "Year": "2020", "Salary" : 60000,   "Bonus" : 15000   }, 
                    { "Year": "2019", "Salary" : 50000,   "Bonus" : 10000   },    
                ]
            }
            this._calcYearlyPay(payslipList)

            // yearPay.loan.push({
            //     "Year": "2022",
            //     "Salary": 100000,
            //     "Bonus": 23000
            // })

            const oModel = new sap.ui.model.json.JSONModel();
            oModel.setProperty('/yearPay', yearPay);
            console.log(yearPay);
            this.getView().setModel(oModel, 'yrPay');
            this.getView().bindElement("/yearPay");

            // var oVizFrame = this.getView().byId("idVizFrame");
            // oVizFrame.setModel(yearPay);

        },

        /* =========================================================== */
        /* begin: Manipulation Odata                                   */
        /* =========================================================== */

        _AlterPayslip(payslipList) {
            payslipList.forEach(x => {
                x.PerformanceAmount = parseFloat(x.PerformanceAmount) + parseFloat(x.LeaveAmount) + parseFloat(x.SicknessAmount) - parseFloat(x.SocialSecurityAmount) - parseFloat(x.TaxOnRemunerationAmount)
                x.PerformanceAmount = parseFloat(x.PerformanceAmount).toFixed(2);
            });
            return payslipList;
        },

        _calcYearlyPay(payslipList) {
            
            payslipList = this._AlterPayslip(payslipList)
            for (const result of payslipList) {
                const year = new Date(result.SlipDate).getFullYear();
                if (year in sums) {
                  sums[year] += parseFloat(result.PerformanceAmount);
                } else {
                  sums[year] = parseFloat(result.PerformanceAmount);
                }
              }
            console.log(sums); 
        },

        _paySorted(payslipList) {
            payslipList.sort((a, b) => {
                // Extract the year and month from the "SlipDate" field of each element
                const yearA = new Date(a.SlipDate).getFullYear();
                const yearB = new Date(b.SlipDate).getFullYear();
                const monthA = new Date(a.SlipDate).getMonth();
                const monthB = new Date(b.SlipDate).getMonth();

                // Sort the elements first by year, then by month
                if (yearA < yearB) {
                    return -1;
                } else if (yearA > yearB) {
                    return 1;
                } else {
                    if (monthA < monthB) {
                        return -1;
                    } else if (monthA > monthB) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });
            return payslipList;
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
        },

        /* =========================================================== */
        /* begin: fragment methods                                     */
        /* =========================================================== */

        handleEditPress: function (PersNr) {
            this.getModel("detailView").setProperty("/edit", true);

            //Clone the data
            // this._oPersonnel = Object.assign({}, this.getView().getModel().getData().Personnel[PersNr]);
            // this._toggleButtonsAndView(true);
            // console.log(this._oPersonnel)

        },

        handleCancelPress: function () {

            this.getModel("detailView").setProperty("/edit", false);
            // //Restore the data
            // var oModel = this.getView().getModel();
            // var oData = oModel.getData();

            // oData.SupplierCollection[0] = this._oSupplier;

            // oModel.setData(oData);
            // this._toggleButtonsAndView(false);

        },

        handleSavePress: function () {

            this.getModel("detailView").setProperty("/edit", false);
            // this._toggleButtonsAndView(false);

        },

        // _toggleButtonsAndView : function (bEdit) {
        // 	var oView = this.getView();

        // 	// Show the appropriate action buttons
        // 	oView.byId("edit").setVisible(!bEdit);
        // 	oView.byId("save").setVisible(bEdit);
        // 	oView.byId("cancel").setVisible(bEdit);

        // 	// Set the right form type
        // 	this._showFormFragment(bEdit ? "Change" : "Display");
        // },

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

            //detailFrag.destroyBlocks();
            this._getFormFragment(sFragmentName).then(function (oVBox) {
                detailFrag.addBlock(oVBox);
            });
        }
    });

});