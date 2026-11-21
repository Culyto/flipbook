/*
  MAKI MAKIO — PDF FLIPBOOK
  -------------------------------------------------------------
  Para usar otro PDF sin tocar el código:
  1) reemplaza /assets/manual.pdf por tu archivo
  2) conserva el nombre "manual.pdf"

  También puedes usar el botón "Cambiar PDF" o arrastrar un PDF
  directamente sobre el visor.
*/

const DEFAULT_PDF = "./assets/manual.pdf";
const PDF_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const bookEl = document.getElementById("book");
const bookWrap = document.getElementById("bookWrap");
const viewerStage = document.getElementById("viewerStage");
const loading = document.getElementById("loading");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");
const progressBar = document.getElementById("progressBar");
const pdfInput = document.getElementById("pdfInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const firstBtn = document.getElementById("firstBtn");
const lastBtn = document.getElementById("lastBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const currentPageEl = document.getElementById("currentPage");
const totalPagesEl = document.getElementById("totalPages");

let pageFlip = null;
let totalPages = 0;
let renderToken = 0;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
}

function setLoading(title, text = "", progress = 0) {
  loading.classList.remove("error-state");
  loading.hidden = false;
  bookWrap.hidden = true;
  loadingTitle.textContent = title;
  loadingText.textContent = text;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function setError(message) {
  loading.classList.add("error-state");
  loading.hidden = false;
  bookWrap.hidden = true;
  loadingTitle.textContent = "No pude abrir el PDF";
  loadingText.textContent = message;
}

function destroyCurrentBook() {
  if (pageFlip) {
    try {
      pageFlip.destroy();
    } catch (_) {}
    pageFlip = null;
  }
  bookEl.innerHTML = "";
}

function getFlipPageIndex() {
  if (!pageFlip) return 0;
  try {
    return pageFlip.getCurrentPageIndex();
  } catch (_) {
    return 0;
  }
}

function updateControls(index = getFlipPageIndex()) {
  const safeIndex = Math.max(0, Math.min(totalPages - 1, index));
  currentPageEl.textContent = totalPages ? String(safeIndex + 1) : "—";
  totalPagesEl.textContent = totalPages ? String(totalPages) : "—";
  prevBtn.disabled = !pageFlip || safeIndex <= 0;
  nextBtn.disabled = !pageFlip || safeIndex >= totalPages - 1;
}

function pageFlipDimensions(firstPage) {
  const viewport = firstPage.getViewport({ scale: 1 });
  const ratio = viewport.width / viewport.height;

  // StPageFlip usa estas medidas como proporción base y luego las estira
  // de forma responsiva dentro de los mínimos y máximos definidos.
  const baseHeight = 720;
  const baseWidth = Math.round(baseHeight * ratio);

  return {
    width: baseWidth,
    height: baseHeight,
    minWidth: Math.max(220, Math.round(baseWidth * 0.34)),
    minHeight: Math.max(150, Math.round(baseHeight * 0.34)),
    maxWidth: Math.round(baseWidth * 1.12),
    maxHeight: Math.round(baseHeight * 1.12),
  };
}

async function renderPdf(source, label = "PDF") {
  const myToken = ++renderToken;

  if (!window.pdfjsLib || !window.St?.PageFlip) {
    setError("No se cargaron las librerías. Verifica tu conexión a internet y recarga la página.");
    return;
  }

  destroyCurrentBook();
  totalPages = 0;
  updateControls(0);
  setLoading("Preparando el manual…", `Abriendo ${label}`, 4);

  try {
    const loadingTask = pdfjsLib.getDocument(source);
    const pdf = await loadingTask.promise;
    if (myToken !== renderToken) return;

    totalPages = pdf.numPages;
    totalPagesEl.textContent = String(totalPages);

    const firstPage = await pdf.getPage(1);
    const flipSize = pageFlipDimensions(firstPage);

    // Se renderiza cada página a buena resolución, sin inflar demasiado la memoria.
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      if (myToken !== renderToken) return;

      const page = pageNumber === 1 ? firstPage : await pdf.getPage(pageNumber);
      const rawViewport = page.getViewport({ scale: 1 });
      const targetLongEdge = 1600;
      const scale = Math.min(2.6, targetLongEdge / Math.max(rawViewport.width, rawViewport.height));
      const viewport = page.getViewport({ scale });

      const pageEl = document.createElement("div");
      pageEl.className = "page";
      pageEl.setAttribute("data-page-number", String(pageNumber));

      // Tapa y contratapa rígidas.
      if (pageNumber === 1 || pageNumber === pdf.numPages) {
        pageEl.setAttribute("data-density", "hard");
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute("aria-label", `Página ${pageNumber} de ${pdf.numPages}`);

      const context = canvas.getContext("2d", { alpha: false });
      context.save();
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();

      await page.render({ canvasContext: context, viewport }).promise;

      pageEl.appendChild(canvas);
      bookEl.appendChild(pageEl);

      const progress = 8 + Math.round((pageNumber / pdf.numPages) * 84);
      setLoading(
        "Preparando el manual…",
        `Renderizando página ${pageNumber} de ${pdf.numPages}`,
        progress
      );
    }

    if (myToken !== renderToken) return;

    pageFlip = new St.PageFlip(bookEl, {
      width: flipSize.width,
      height: flipSize.height,
      size: "stretch",
      minWidth: flipSize.minWidth,
      maxWidth: flipSize.maxWidth,
      minHeight: flipSize.minHeight,
      maxHeight: flipSize.maxHeight,
      autoSize: true,
      showCover: true,
      usePortrait: true,
      mobileScrollSupport: false,
      clickEventForward: true,
      swipeDistance: 28,
      flippingTime: 850,
      maxShadowOpacity: 0.48,
      drawShadow: true,
      startPage: 0,
      startZIndex: 10,
    });

    pageFlip.loadFromHTML(bookEl.querySelectorAll(".page"));

    pageFlip.on("flip", (event) => {
      updateControls(event.data);
    });

    pageFlip.on("changeOrientation", () => {
      requestAnimationFrame(() => updateControls(getFlipPageIndex()));
    });

    setLoading("Listo", "Abriendo flipbook…", 100);

    window.setTimeout(() => {
      if (myToken !== renderToken) return;
      loading.hidden = true;
      bookWrap.hidden = false;
      updateControls(0);
    }, 180);
  } catch (error) {
    console.error(error);
    setError(
      "Si abriste index.html con doble clic, usa Live Server o elige el PDF con “Cambiar PDF”."
    );
  }
}

async function loadFile(file) {
  if (!file || file.type !== "application/pdf") {
    setError("Selecciona un archivo PDF válido.");
    return;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  renderPdf({ data }, file.name);
}

pdfInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (file) await loadFile(file);
  event.target.value = "";
});

prevBtn.addEventListener("click", () => pageFlip?.flipPrev("top"));
nextBtn.addEventListener("click", () => pageFlip?.flipNext("top"));
firstBtn.addEventListener("click", () => pageFlip?.turnToPage(0));
lastBtn.addEventListener("click", () => pageFlip?.turnToPage(Math.max(0, totalPages - 1)));

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (_) {}
});

document.addEventListener("keydown", (event) => {
  if (!pageFlip) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    pageFlip.flipPrev("top");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    pageFlip.flipNext("top");
  } else if (event.key === "Home") {
    event.preventDefault();
    pageFlip.turnToPage(0);
  } else if (event.key === "End") {
    event.preventDefault();
    pageFlip.turnToPage(Math.max(0, totalPages - 1));
  }
});

// Arrastrar y soltar PDF.
["dragenter", "dragover"].forEach((eventName) => {
  viewerStage.addEventListener(eventName, (event) => {
    event.preventDefault();
    viewerStage.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  viewerStage.addEventListener(eventName, (event) => {
    event.preventDefault();
    viewerStage.classList.remove("is-dragging");
  });
});

viewerStage.addEventListener("drop", async (event) => {
  const files = [...event.dataTransfer.files];
  const pdf = files.find((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  if (pdf) await loadFile(pdf);
});

// Al usar un servidor local (por ejemplo Live Server) se carga el PDF incluido.
// Si el HTML se abre con doble clic, algunos navegadores bloquean el PDF local;
// en ese caso el botón "Cambiar PDF" sigue funcionando.
if (location.protocol === "file:") {
  setLoading(
    "Selecciona tu PDF",
    "Abre este proyecto con Live Server para cargar assets/manual.pdf automáticamente, o usa “Cambiar PDF”.",
    0
  );
} else {
  renderPdf(DEFAULT_PDF, "assets/manual.pdf");
}
