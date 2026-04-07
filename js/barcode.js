(function () {
  var DEFAULT_MAX_WIDTH = 290;

  function clearContainer(containerEl) {
    while (containerEl.firstChild) {
      containerEl.removeChild(containerEl.firstChild);
    }
  }

  function getContainerWidth(containerEl) {
    var measuredWidth = Math.floor(containerEl.clientWidth || 0);

    if (measuredWidth > 0) {
      return measuredWidth;
    }

    return DEFAULT_MAX_WIDTH;
  }

  function drawBarcodeToCanvas(canvas, barcode) {
    var context = canvas.getContext("2d");
    var rows = barcode.num_rows;
    var cols = barcode.num_cols;
    var rowIndex;
    var colIndex;
    var row;

    canvas.width = cols;
    canvas.height = rows;

    context.clearRect(0, 0, cols, rows);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, cols, rows);
    context.fillStyle = "#000000";

    for (rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      row = barcode.bcode[rowIndex];

      if (!row) {
        continue;
      }

      for (colIndex = 0; colIndex < cols; colIndex += 1) {
        if (Number(row[colIndex]) === 1) {
          context.fillRect(colIndex, rowIndex, 1, 1);
        }
      }
    }
  }

  function renderBarcode(containerEl, text) {
    var safeText = typeof text === "string" ? text.trim() : "";
    var canvas;
    var barcode;
    var maxWidth;
    var targetWidth;
    var targetHeight;

    if (!containerEl) {
      return null;
    }

    clearContainer(containerEl);

    if (!safeText) {
      return null;
    }

    if (!window.PDF417 || typeof window.PDF417.init !== "function") {
      throw new Error("PDF417 library is not available.");
    }

    window.PDF417.init(safeText);
    barcode = window.PDF417.getBarcodeArray();

    if (!barcode || !barcode.num_cols || !barcode.num_rows || !barcode.bcode) {
      throw new Error("Failed to generate PDF417 barcode data.");
    }

    canvas = document.createElement("canvas");
    drawBarcodeToCanvas(canvas, barcode);

    maxWidth = Math.min(DEFAULT_MAX_WIDTH, getContainerWidth(containerEl));
    targetWidth = Math.max(1, maxWidth);
    targetHeight = Math.max(
      1,
      Math.round((barcode.num_rows / barcode.num_cols) * targetWidth)
    );

    canvas.style.width = targetWidth + "px";
    canvas.style.height = targetHeight + "px";

    containerEl.appendChild(canvas);

    return canvas;
  }

  window.renderBarcode = renderBarcode;
})();
