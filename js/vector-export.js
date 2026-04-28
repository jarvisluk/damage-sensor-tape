(function () {
  var SVG_NS = "http://www.w3.org/2000/svg";
  var FONT_SOURCES = {
    "Octin College": "assets/fonts/Octin-College-Book.otf",
    "Death Stranded": "assets/fonts/Death_Stranded.otf",
    "JD LCD Rounded": "assets/fonts/JD-LCD-Rounded.otf"
  };
  var fontCache = {};
  var inlineSvgCache = {};

  function createSvgNode(tagName) {
    return document.createElementNS(SVG_NS, tagName);
  }

  function appendNode(parent, tagName, attributes) {
    var node = createSvgNode(tagName);
    Object.keys(attributes || {}).forEach(function (key) {
      if (attributes[key] !== undefined && attributes[key] !== null) {
        node.setAttribute(key, String(attributes[key]));
      }
    });
    parent.appendChild(node);
    return node;
  }

  function isTransparentColor(value) {
    return !value || value === "transparent" || value === "rgba(0, 0, 0, 0)";
  }

  function getElementRect(element, rootRect) {
    var rect = element.getBoundingClientRect();

    return {
      x: rect.left - rootRect.left,
      y: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function getExportColor(element) {
    return window.getComputedStyle(element).backgroundColor || "#fce700";
  }

  function parseNumber(value, fallback) {
    var parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : fallback;
  }

  function normalizeFontFamily(value) {
    var family = (value || "").split(",")[0].trim();

    return family
      .replace(/^['"]|['"]$/g, "")
      .replace(/_/g, " ");
  }

  function getPdfSafeFontFamily(fontFamily) {
    if (/courier|mono/i.test(fontFamily)) {
      return "courier";
    }

    if (/times|serif/i.test(fontFamily)) {
      return "times";
    }

    return "helvetica";
  }

  function loadOutlineFont(fontFamily) {
    var source = FONT_SOURCES[fontFamily];

    if (!source || !window.opentype) {
      return Promise.resolve(null);
    }

    if (!fontCache[source]) {
      fontCache[source] = new Promise(function (resolve) {
        window.opentype.load(source, function (error, font) {
          resolve(error ? null : font);
        });
      });
    }

    return fontCache[source];
  }

  function getLetterSpacing(computedStyle) {
    if (!computedStyle.letterSpacing || computedStyle.letterSpacing === "normal") {
      return 0;
    }

    return parseNumber(computedStyle.letterSpacing, 0);
  }

  function pathDataForText(font, text, fontSize, letterSpacing, baselineY) {
    var currentX = 0;
    var pathData = [];

    Array.prototype.forEach.call(text, function (character) {
      var path;

      if (character === "\n") {
        return;
      }

      path = font.getPath(character, currentX, baselineY, fontSize);
      pathData.push(path.toPathData(2));
      currentX += font.getAdvanceWidth(character, fontSize) + letterSpacing;
    });

    return pathData.join("");
  }

  function getTextAdvance(font, text, fontSize, letterSpacing) {
    var width = 0;

    Array.prototype.forEach.call(text, function (character, index) {
      width += font.getAdvanceWidth(character, fontSize);
      if (index < text.length - 1) {
        width += letterSpacing;
      }
    });

    return width;
  }

  function appendSvgText(parent, text, rect, computedStyle, transform) {
    var fontFamily = normalizeFontFamily(computedStyle.fontFamily);
    var textNode = appendNode(parent, "text", {
      x: rect.x,
      y: rect.y + rect.height * 0.78,
      fill: computedStyle.color || "#0f0f0f",
      "font-family": getPdfSafeFontFamily(fontFamily),
      "font-size": parseNumber(computedStyle.fontSize, 16),
      "font-weight": computedStyle.fontWeight,
      "letter-spacing": getLetterSpacing(computedStyle)
    });

    if (transform) {
      textNode.setAttribute("transform", transform);
    }

    textNode.textContent = text;
  }

  async function appendOutlinedText(parent, element, rootRect) {
    var computedStyle = window.getComputedStyle(element);
    var fontFamily = normalizeFontFamily(computedStyle.fontFamily);
    var font = await loadOutlineFont(fontFamily);
    var text = element.textContent || "";
    var rect = getElementRect(element, rootRect);
    var fontSize = parseNumber(computedStyle.fontSize, 16);
    var letterSpacing = getLetterSpacing(computedStyle);
    var writingMode = computedStyle.writingMode || "";
    var fill = computedStyle.color || "#0f0f0f";
    var path;
    var pathData;
    var baselineY;
    var transform;
    var textAdvance;

    if (!text.trim()) {
      return;
    }

    if (!font) {
      appendSvgText(parent, text, rect, computedStyle);
      return;
    }

    if (writingMode.indexOf("vertical") !== -1) {
      baselineY = fontSize * 0.78;
      pathData = pathDataForText(font, text, fontSize, letterSpacing, baselineY);
      textAdvance = getTextAdvance(font, text, fontSize, letterSpacing);
      transform = [
        "translate(",
        rect.x + rect.width * 0.78,
        " ",
        rect.y + Math.max(0, (rect.height - textAdvance) / 2),
        ") rotate(90)"
      ].join("");
      path = appendNode(parent, "path", {
        d: pathData,
        fill: fill,
        transform: transform
      });
      path.setAttribute("data-export-text", text);
      return;
    }

    baselineY = rect.y + rect.height * 0.78;
    pathData = pathDataForText(font, text, fontSize, letterSpacing, baselineY);
    path = appendNode(parent, "path", {
      d: pathData,
      fill: fill,
      transform: "translate(" + rect.x + " 0)"
    });
    path.setAttribute("data-export-text", text);
  }

  function resolvePaintValue(value) {
    var fallbackMatch;

    if (!value || value.indexOf("var(") !== 0) {
      return value;
    }

    fallbackMatch = value.match(/,\s*([^)]+)\)/);
    return fallbackMatch ? fallbackMatch[1].trim() : value;
  }

  function normalizeInlineSvgPaints(node) {
    Array.prototype.forEach.call(node.attributes || [], function (attribute) {
      if (attribute.value.indexOf("var(") !== -1) {
        node.setAttribute(attribute.name, resolvePaintValue(attribute.value));
      }
    });

    Array.prototype.forEach.call(node.children || [], normalizeInlineSvgPaints);
  }

  async function fetchInlineSvg(sourceUrl) {
    var response;
    var text;
    var parsed;

    if (!inlineSvgCache[sourceUrl]) {
      inlineSvgCache[sourceUrl] = (async function () {
        response = await fetch(sourceUrl);
        text = await response.text();
        parsed = new DOMParser().parseFromString(text, "image/svg+xml").documentElement;
        normalizeInlineSvgPaints(parsed);
        return parsed;
      })();
    }

    return inlineSvgCache[sourceUrl];
  }

  function parseViewBox(svgNode) {
    var viewBox = (svgNode.getAttribute("viewBox") || "").split(/\s+/).map(Number);
    var width = parseNumber(svgNode.getAttribute("width"), 0);
    var height = parseNumber(svgNode.getAttribute("height"), 0);

    if (viewBox.length === 4 && viewBox.every(isFinite)) {
      return {
        x: viewBox[0],
        y: viewBox[1],
        width: viewBox[2],
        height: viewBox[3]
      };
    }

    return {
      x: 0,
      y: 0,
      width: width || 1,
      height: height || 1
    };
  }

  function appendScaledSvgContent(parent, sourceSvg, rect) {
    var viewBox = parseViewBox(sourceSvg);
    var group = appendNode(parent, "g", {
      transform: [
        "translate(",
        rect.x,
        " ",
        rect.y,
        ") scale(",
        rect.width / viewBox.width,
        " ",
        rect.height / viewBox.height,
        ") translate(",
        -viewBox.x,
        " ",
        -viewBox.y,
        ")"
      ].join("")
    });

    Array.prototype.forEach.call(sourceSvg.childNodes, function (child) {
      group.appendChild(document.importNode(child, true));
    });
  }

  async function appendImage(parent, element, rootRect) {
    var rect = getElementRect(element, rootRect);
    var source = element.currentSrc || element.src;
    var sourceSvg;

    if (!source || source.indexOf(".svg") === -1) {
      return;
    }

    sourceSvg = await fetchInlineSvg(source);
    appendScaledSvgContent(parent, sourceSvg, rect);
  }

  function appendEmbeddedSvg(parent, element, rootRect) {
    var rect = getElementRect(element, rootRect);

    appendScaledSvgContent(parent, element, rect);
  }

  function appendBackground(parent, element, rootRect) {
    var computedStyle = window.getComputedStyle(element);
    var backgroundColor = computedStyle.backgroundColor;
    var rect;

    if (isTransparentColor(backgroundColor)) {
      return;
    }

    rect = getElementRect(element, rootRect);
    appendNode(parent, "rect", {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      fill: backgroundColor
    });
  }

  function appendBorder(parent, element, rootRect) {
    var computedStyle = window.getComputedStyle(element);
    var width = parseNumber(computedStyle.borderTopWidth, 0);
    var style = computedStyle.borderTopStyle;
    var rect;

    if (!width || style === "none" || style === "hidden") {
      return;
    }

    rect = getElementRect(element, rootRect);
    appendNode(parent, "rect", {
      x: rect.x + width / 2,
      y: rect.y + width / 2,
      width: Math.max(0, rect.width - width),
      height: Math.max(0, rect.height - width),
      fill: "none",
      stroke: computedStyle.borderTopColor || "#0f0f0f",
      "stroke-width": width
    });
  }

  function shouldRenderText(element) {
    return element.tagName && element.tagName.toLowerCase() === "p" && (element.textContent || "").trim();
  }

  async function appendElement(parent, element, rootRect) {
    var tagName = element.tagName ? element.tagName.toLowerCase() : "";

    appendBackground(parent, element, rootRect);
    appendBorder(parent, element, rootRect);

    if (tagName === "img") {
      await appendImage(parent, element, rootRect);
      return;
    }

    if (tagName === "svg") {
      appendEmbeddedSvg(parent, element, rootRect);
      return;
    }

    if (shouldRenderText(element)) {
      await appendOutlinedText(parent, element, rootRect);
      return;
    }

    for (var i = 0; i < element.children.length; i += 1) {
      await appendElement(parent, element.children[i], rootRect);
    }
  }

  async function buildVectorTapeSvg(rootNode) {
    var rootRect = rootNode.getBoundingClientRect();
    var width = Math.round(rootNode.offsetWidth || rootRect.width || 340);
    var height = Math.round(rootNode.offsetHeight || rootRect.height || 1200);
    var svg = createSvgNode("svg");

    svg.setAttribute("xmlns", SVG_NS);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Damage sensor tape");

    appendNode(svg, "rect", {
      x: 0,
      y: 0,
      width: width,
      height: height,
      fill: getExportColor(rootNode)
    });

    for (var i = 0; i < rootNode.children.length; i += 1) {
      await appendElement(svg, rootNode.children[i], rootRect);
    }

    return svg;
  }

  function serializeVectorSvg(svg) {
    return new XMLSerializer().serializeToString(svg);
  }

  window.buildVectorTapeSvg = buildVectorTapeSvg;
  window.serializeVectorSvg = serializeVectorSvg;
})();
