(function () {
  function replaceContainerContent(containerEl, childNode) {
    if (typeof containerEl.replaceChildren === "function") {
      if (childNode) {
        containerEl.replaceChildren(childNode);
      } else {
        containerEl.replaceChildren();
      }
      return;
    }

    containerEl.textContent = "";

    if (childNode) {
      containerEl.appendChild(childNode);
    }
  }

  function drawBarcodeToCanvas(canvas, barcode) {
    var context = canvas.getContext("2d");
    var rows = barcode.num_rows;
    var cols = barcode.num_cols;
    var rowIndex;
    var colIndex;
    var row;
    var cellValue;

    if (!context) {
      throw new Error("Failed to acquire 2D canvas context.");
    }

    canvas.width = cols;
    canvas.height = rows;

    context.clearRect(0, 0, cols, rows);
    context.fillStyle = "#000000";

    for (rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      row = barcode.bcode[rowIndex];

      if (!row) {
        continue;
      }

      for (colIndex = 0; colIndex < cols; colIndex += 1) {
        cellValue = row[colIndex];

        if (cellValue === 1 || cellValue === "1") {
          context.fillRect(colIndex, rowIndex, 1, 1);
        }
      }
    }
  }

  function renderBarcode(containerEl, text) {
    var safeText = typeof text === "string" ? text.trim() : "";
    var canvas;
    var barcode;

    if (!containerEl) {
      return null;
    }

    if (!safeText) {
      replaceContainerContent(containerEl);
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
    replaceContainerContent(containerEl, canvas);

    return canvas;
  }

  window.renderBarcode = renderBarcode;
})();
