/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"edu/be/ap/hr/zsd002hr/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});