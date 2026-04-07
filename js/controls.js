(function () {
  function generateRandomSerial() {
    var part1 = "";
    var part2 = "";
    var i;

    for (i = 0; i < 8; i++) {
      part1 += Math.floor(Math.random() * 10);
    }
    for (i = 0; i < 4; i++) {
      part2 += Math.floor(Math.random() * 10);
    }

    return part1 + " " + part2;
  }

  function generateRandomLedCode() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var code = "";

    for (var i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  function updateDescription(text) {
    var lines = text.split("\n");

    for (var i = 0; i < 5; i++) {
      var el = document.getElementById("desc-line-" + i);
      if (el) {
        el.textContent = lines[i] !== undefined ? lines[i] : "";
      }
    }
  }

  function updateSerial(value) {
    var el = document.getElementById("serial-number");
    if (el) {
      el.textContent = value;
    }
  }

  function updateLedCode(value) {
    var el = document.getElementById("led-code");
    if (el) {
      el.textContent = value;
    }
  }

  function updateBarcode(text) {
    var container = document.getElementById("barcode-container");
    if (container && window.renderBarcode) {
      window.renderBarcode(container, text);
    }
  }

  function updateTapeColor(color) {
    document.documentElement.style.setProperty("--tape-color", color);
  }

  function initControls() {
    var swatches = document.querySelectorAll(".color-swatch");
    var barcodeInput = document.getElementById("barcode-input");
    var barcodeRandomBtn = document.getElementById("barcode-random-btn");
    var descInput = document.getElementById("desc-input");
    var serialInput = document.getElementById("serial-input");
    var serialRandomBtn = document.getElementById("serial-random-btn");
    var ledInput = document.getElementById("led-input");
    var ledRandomBtn = document.getElementById("led-random-btn");

    swatches.forEach(function (swatch) {
      swatch.addEventListener("click", function () {
        swatches.forEach(function (s) { s.classList.remove("active"); });
        swatch.classList.add("active");
        updateTapeColor(swatch.getAttribute("data-color"));
      });
    });

    if (barcodeInput) {
      barcodeInput.addEventListener("input", function () {
        updateBarcode(barcodeInput.value);
      });
    }

    if (barcodeRandomBtn) {
      barcodeRandomBtn.addEventListener("click", function () {
        var excerpt = window.getRandomExcerpt ? window.getRandomExcerpt(4) : "";
        if (barcodeInput) {
          barcodeInput.value = excerpt;
        }
        updateBarcode(excerpt);
      });
    }

    if (descInput) {
      descInput.addEventListener("input", function () {
        updateDescription(descInput.value);
      });
    }

    if (serialInput) {
      serialInput.addEventListener("input", function () {
        updateSerial(serialInput.value);
      });
    }

    if (serialRandomBtn) {
      serialRandomBtn.addEventListener("click", function () {
        var serial = generateRandomSerial();
        if (serialInput) {
          serialInput.value = serial;
        }
        updateSerial(serial);
      });
    }

    if (ledInput) {
      ledInput.addEventListener("input", function () {
        updateLedCode(ledInput.value);
      });
    }

    if (ledRandomBtn) {
      ledRandomBtn.addEventListener("click", function () {
        var code = generateRandomLedCode();
        if (ledInput) {
          ledInput.value = code;
        }
        updateLedCode(code);
      });
    }
  }

  window.generateRandomSerial = generateRandomSerial;
  window.generateRandomLedCode = generateRandomLedCode;
  window.updateDescription = updateDescription;
  window.updateSerial = updateSerial;
  window.updateLedCode = updateLedCode;
  window.updateBarcode = updateBarcode;
  window.initControls = initControls;
})();
