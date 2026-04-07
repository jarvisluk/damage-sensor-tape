(function () {
  var DEFAULT_DESCRIPTION = [
    "THE SENSOR IS ALWAYS ACTIVE AND WILL INSTANTLY DEVELOP COLOR IF DAMAGE IS RECEIVED.",
    "MATCH THE TAPE'S COLOR WITH THE REFERENCE CHART TO ESTIMATE DAMAGE.",
    "TO EXTEND THE SERVICE LIFE KEEP COLD",
    "WHEN NOT IN USE.",
    "AVOID PROLONGED EXPOSURE TO HEAT AND SUNLIGHT."
  ];

  var DEFAULT_SERIAL = "19879494 3803";
  var DEFAULT_LED_CODE = "882809S7IB";

  function init() {
    var descInput = document.getElementById("desc-input");
    var serialInput = document.getElementById("serial-input");
    var ledInput = document.getElementById("led-input");
    var barcodeInput = document.getElementById("barcode-input");

    var descText = DEFAULT_DESCRIPTION.join("\n");
    if (descInput) {
      descInput.value = descText;
    }
    window.updateDescription(descText);

    if (serialInput) {
      serialInput.value = DEFAULT_SERIAL;
    }
    window.updateSerial(DEFAULT_SERIAL);

    if (ledInput) {
      ledInput.value = DEFAULT_LED_CODE;
    }
    window.updateLedCode(DEFAULT_LED_CODE);

    var excerpt = window.getRandomExcerpt ? window.getRandomExcerpt(4) : "";
    if (barcodeInput) {
      barcodeInput.value = excerpt;
    }
    window.updateBarcode(excerpt);

    window.initControls();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
