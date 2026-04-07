(function () {
  var EXPORT_PIXEL_RATIO = 3;
  var exportButtons = [];
  var isExporting = false;

  function getTapeNode() {
    return document.getElementById("tape-preview");
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
      pixelRatio: EXPORT_PIXEL_RATIO,
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
    var dataUrl;

    if (!node) {
      throw new Error("Tape preview was not found.");
    }

    ensureHtmlToImage();
    dataUrl = await window.htmlToImage.toSvg(node, getExportOptions(node));
    downloadUrl(dataUrl, buildFilename("svg"));
  }

  async function exportPdf() {
    var node = getTapeNode();
    var size;
    var pngDataUrl;
    var pdf;

    if (!node) {
      throw new Error("Tape preview was not found.");
    }

    ensureHtmlToImage();
    ensureJsPdf();
    size = getExportSize(node);
    pngDataUrl = await window.htmlToImage.toPng(node, getExportOptions(node));
    pdf = new window.jspdf.jsPDF({
      orientation: size.height >= size.width ? "portrait" : "landscape",
      unit: "px",
      format: [size.width, size.height]
    });

    pdf.addImage(pngDataUrl, "PNG", 0, 0, size.width, size.height, undefined, "FAST");
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
