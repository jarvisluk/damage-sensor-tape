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

  function createSvgNode(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  function createBarcodeSvg(barcode) {
    var svg = createSvgNode("svg");
    var rows = barcode.num_rows;
    var cols = barcode.num_cols;
    var rowIndex;
    var colIndex;
    var row;
    var cellValue;
    var path = createSvgNode("path");
    var pathData = [];
    var runStart;
    var runLength;

    svg.setAttribute("viewBox", "0 0 " + cols + " " + rows);
    svg.setAttribute("width", String(cols));
    svg.setAttribute("height", String(rows));
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "PDF417 barcode");
    svg.setAttribute("shape-rendering", "crispEdges");

    for (rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      row = barcode.bcode[rowIndex];

      if (!row) {
        continue;
      }

      for (colIndex = 0; colIndex < cols; colIndex += 1) {
        cellValue = row[colIndex];

        if (cellValue !== 1 && cellValue !== "1") {
          continue;
        }

        runStart = colIndex;
        runLength = 1;

        while (colIndex + 1 < cols && (row[colIndex + 1] === 1 || row[colIndex + 1] === "1")) {
          colIndex += 1;
          runLength += 1;
        }

        pathData.push("M" + runStart + " " + rowIndex + "h" + runLength + "v1H" + runStart + "Z");
      }
    }

    path.setAttribute("d", pathData.join(""));
    path.setAttribute("fill", "#000000");
    svg.appendChild(path);

    return svg;
  }

  function renderBarcode(containerEl, text) {
    var safeText = typeof text === "string" ? text.trim() : "";
    var svg;
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

    svg = createBarcodeSvg(barcode);
    replaceContainerContent(containerEl, svg);

    return svg;
  }

  window.renderBarcode = renderBarcode;
})();
