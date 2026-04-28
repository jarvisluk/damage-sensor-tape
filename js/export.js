(function () {
  var EXPORT_PPI = 300;
  var CSS_REFERENCE_PPI = 96;
  var exportButtons = [];
  var isExporting = false;

  function getTapeNode() {
    return document.getElementById("preview-stage") || document.getElementById("tape-preview");
  }

  function getStatusNode() {
    return document.getElementById("export-status");
  }

  function sanitizeFilenamePart(value) {
    var safeValue = (value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return safeValue || "custom";
  }

  function buildFilename(extension) {
    var serialInput = document.getElementById("serial-input");
    var serialValue = serialInput ? serialInput.value : "";

    return "damage-sensor-tape-" + sanitizeFilenamePart(serialValue) + "." + extension;
  }

  function setStatus(message, isError) {
    var statusNode = getStatusNode();

    if (!statusNode) {
      return;
    }

    statusNode.textContent = message || "";
    statusNode.classList.toggle("error", Boolean(isError));
  }

  function setButtonsDisabled(disabled) {
    exportButtons.forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function downloadUrl(url, filename) {
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadText(text, filename, mimeType) {
    var blob = new Blob([text], { type: mimeType });
    var url = URL.createObjectURL(blob);

    try {
      downloadUrl(url, filename);
    } finally {
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 0);
    }
  }

  function getExportSize(node) {
    return {
      width: Math.round(node.offsetWidth || node.clientWidth || 340),
      height: Math.round(node.offsetHeight || node.clientHeight || 1200)
    };
  }

  function getExportOptions(node) {
    var size = getExportSize(node);
    var backgroundColor = window.getComputedStyle(node).backgroundColor || "#fce700";

    return {
      backgroundColor: backgroundColor,
      cacheBust: true,
      pixelRatio: EXPORT_PPI / CSS_REFERENCE_PPI,
      width: size.width,
      height: size.height
    };
  }

  function ensureHtmlToImage() {
    if (!window.htmlToImage) {
      throw new Error("html-to-image failed to load.");
    }
  }

  function ensureJsPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF failed to load.");
    }
  }

  function ensureSvg2Pdf() {
    if (
      !window.svg2pdf &&
      !(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.svg)
    ) {
      throw new Error("svg2pdf.js failed to load.");
    }
  }

  function ensureVectorExport() {
    if (!window.buildVectorTapeSvg || !window.serializeVectorSvg) {
      throw new Error("Vector export renderer failed to load.");
    }
  }

  function renderSvgToPdf(svg, pdf, size) {
    if (typeof pdf.svg === "function") {
      return pdf.svg(svg, {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
      });
    }

    if (window.svg2pdf && typeof window.svg2pdf.svg2pdf === "function") {
      return window.svg2pdf.svg2pdf(svg, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
      });
    }

    if (typeof window.svg2pdf === "function") {
      return window.svg2pdf(svg, pdf, {
        xOffset: 0,
        yOffset: 0,
        scale: 1
      });
    }

    throw new Error("svg2pdf.js failed to load.");
  }

  function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }

    return Promise.resolve();
  }

  async function exportPng() {
    var node = getTapeNode();
    var dataUrl;

    if (!node) {
      throw new Error("Tape preview was not found.");
    }

    ensureHtmlToImage();
    dataUrl = await window.htmlToImage.toPng(node, getExportOptions(node));
    downloadUrl(dataUrl, buildFilename("png"));
  }

  async function exportSvg() {
    var node = getTapeNode();
    var svg;

    if (!node) {
      throw new Error("Tape preview was not found.");
    }

    ensureVectorExport();
    svg = await window.buildVectorTapeSvg(node);
    downloadText(window.serializeVectorSvg(svg), buildFilename("svg"), "image/svg+xml;charset=utf-8");
  }

  async function exportPdf() {
    var node = getTapeNode();
    var size;
    var svg;
    var pdf;

    if (!node) {
      throw new Error("Tape preview was not found.");
    }

    ensureJsPdf();
    ensureSvg2Pdf();
    ensureVectorExport();
    size = getExportSize(node);
    svg = await window.buildVectorTapeSvg(node);
    pdf = new window.jspdf.jsPDF({
      orientation: size.height >= size.width ? "portrait" : "landscape",
      unit: "px",
      format: [size.width, size.height]
    });

    await renderSvgToPdf(svg, pdf, size);
    pdf.save(buildFilename("pdf"));
  }

  function wireButton(buttonId, exportingLabel, exportHandler) {
    var button = document.getElementById(buttonId);
    var defaultLabel;

    if (!button) {
      return;
    }

    defaultLabel = button.textContent;
    exportButtons.push(button);
    button.addEventListener("click", async function () {
      if (isExporting) {
        return;
      }

      isExporting = true;
      setButtonsDisabled(true);
      button.textContent = exportingLabel;
      setStatus("Preparing export...", false);

      try {
        await waitForFonts();
        await exportHandler();
        setStatus("Saved " + buttonId.replace("export-", "").replace("-btn", "").toUpperCase() + " successfully.", false);
      } catch (error) {
        setStatus(error && error.message ? error.message : "Export failed.", true);
      } finally {
        button.textContent = defaultLabel;
        setButtonsDisabled(false);
        isExporting = false;
      }
    });
  }

  function initExport() {
    if (exportButtons.length > 0) {
      return;
    }

    wireButton("export-png-btn", "Saving...", exportPng);
    wireButton("export-svg-btn", "Saving...", exportSvg);
    wireButton("export-pdf-btn", "Saving...", exportPdf);
  }

  window.initExport = initExport;
})();
