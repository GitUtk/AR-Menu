/**
 * app.js — AR Restaurant Menu · Main Application
 *
 * Responsibilities:
 *   - URL routing (dish= query param)
 *   - Model loading with poster, timeout, and error recovery
 *   - Shadcn UI state management (loading / app / error screens)
 *   - In-Browser AR camera mode (A-Frame + AR.js) & Hiro marker tracking
 *   - Native AR fallback (modelViewer.activateAR)
 *   - Share API with clipboard fallback
 *   - View controls (reset, fullscreen)
 */

import { DISHES } from "./dishes.js";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_BASE = "https://yourrestaurant.com";
const DISH_ID_MAX_LEN = 64;
const MODEL_LOAD_TIMEOUT_MS = 10_000;

// ─────────────────────────────────────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────────────────────────────────────

const el = (id) => document.getElementById(id);

const dom = {
  loadingScreen: el("loadingScreen"),
  errorScreen: el("errorScreen"),
  app: el("app"),
  menuScreen: el("menuScreen"),
  menuGrid: el("menuGrid"),
  menuFilters: el("menuFilters"),
  menuEmpty: el("menuEmpty"),
  modelViewer: el("modelViewer"),
  dishTitle: el("dishTitle"),
  dishDesc: el("dishDescription"),
  dishBadge: el("dishBadge"),
  pageTitle: el("pageTitle"),
  arButton: el("arButton"),
  shareBtn: el("shareBtn"),
  resetViewBtn: el("resetViewBtn"),
  fullscreenBtn: el("fullscreenBtn"),
  toast: el("toast"),
  year: el("year"),
  metaPrice: el("metaPrice"),
  metaTime: el("metaTime"),
  metaCalories: el("metaCalories"),
  structuredData: el("structuredData"),
  arOverlay: el("arOverlay"),
  closeArBtn: el("closeArBtn"),
  arDishName: el("arDishName"),
  markerModal: el("markerModal"),
  showMarkerBtn: el("showMarkerBtn"),
  closeMarkerBtn: el("closeMarkerBtn"),
};

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

let currentDish = null;
let modelLoadTimer = null;

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const getParam = (key) => new URLSearchParams(window.location.search).get(key);

const sanitizeDishId = (raw) => {
  if (!raw) return null;
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9-_]/g, "");
  return clean.length > 0 && clean.length <= DISH_ID_MAX_LEN ? clean : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification (Shadcn Toast Style)
// ─────────────────────────────────────────────────────────────────────────────

let toastTimer = null;

const showToast = (message, duration = 2500) => {
  if (!dom.toast) return;
  dom.toast.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> <span>${message}</span>`;
  dom.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast?.classList.remove("show"), duration);
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

const track = (name, data = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, data);
  }
  console.debug("[Analytics]", name, data);
};

// ─────────────────────────────────────────────────────────────────────────────
// UI State Management
// ─────────────────────────────────────────────────────────────────────────────

const showLoading = () => {
  dom.loadingScreen?.classList.remove("hidden");
  dom.errorScreen?.classList.add("hidden");
  dom.app?.classList.add("hidden");
  dom.menuScreen?.classList.add("hidden");
};

const showApp = () => {
  dom.loadingScreen?.classList.add("hidden");
  dom.errorScreen?.classList.add("hidden");
  dom.app?.classList.remove("hidden");
  dom.menuScreen?.classList.add("hidden");
};

const showError = () => {
  dom.loadingScreen?.classList.add("hidden");
  dom.errorScreen?.classList.remove("hidden");
  dom.app?.classList.add("hidden");
  dom.menuScreen?.classList.add("hidden");
  document.title = "Dish Not Found — AR Restaurant";
};

const showMenuScreen = () => {
  dom.loadingScreen?.classList.add("hidden");
  dom.errorScreen?.classList.add("hidden");
  dom.app?.classList.add("hidden");
  dom.menuScreen?.classList.remove("hidden");
  document.title = "AR Restaurant Menu — Explore Dishes in 3D";
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO & Metadata
// ─────────────────────────────────────────────────────────────────────────────

const updateOpenGraph = (dish) => {
  const title = `${dish.name} — AR Restaurant Menu`;
  const setMeta = (key, value) => {
    const el = document.querySelector(`meta[property="${key}"]`) || document.querySelector(`meta[name="${key}"]`);
    if (el) el.setAttribute("content", value);
  };
  setMeta("og:title", title);
  setMeta("og:description", dish.description);
};

// ─────────────────────────────────────────────────────────────────────────────
// Dish Loading Logic
// ─────────────────────────────────────────────────────────────────────────────

const loadDish = (dish) => {
  currentDish = dish;

  document.title = `${dish.name} — AR Restaurant`;
  if (dom.pageTitle) dom.pageTitle.textContent = dish.name;
  if (dom.dishTitle) dom.dishTitle.textContent = dish.name;
  if (dom.dishDesc) dom.dishDesc.textContent = dish.description;
  if (dom.dishBadge) dom.dishBadge.textContent = dish.badge ?? "Featured";

  const setMetaVal = (container, val) => {
    const target = container?.querySelector(".meta-value");
    if (target) target.textContent = val ?? "—";
  };
  setMetaVal(dom.metaPrice, dish.price);
  setMetaVal(dom.metaTime, dish.prepTime);
  setMetaVal(dom.metaCalories, dish.calories);

  updateOpenGraph(dish);

  const mv = dom.modelViewer;
  if (mv) {
    mv.setAttribute("src", dish.model);
    mv.setAttribute("alt", `3D view of ${dish.name}`);
    if (dish.poster) mv.setAttribute("poster", dish.poster);
    if (dish.iosSrc) mv.setAttribute("ios-src", dish.iosSrc);

    mv.addEventListener("load", onModelLoaded, { once: true });
    mv.addEventListener("error", onModelError, { once: true });
  }

  modelLoadTimer = setTimeout(() => {
    showToast("Loading 3D model…");
  }, MODEL_LOAD_TIMEOUT_MS);

  showApp();
  track("dish_view", { dish_id: dish.id, dish_name: dish.name });
};

const onModelLoaded = () => {
  clearTimeout(modelLoadTimer);
  dom.loadingScreen?.classList.add("hidden");
  track("model_loaded", { dish_id: currentDish?.id });
};

const onModelError = () => {
  clearTimeout(modelLoadTimer);
  console.error("[AR Menu] Failed to load 3D model for:", currentDish?.id);
  showToast("Showing dish preview.");
};

// ─────────────────────────────────────────────────────────────────────────────
// AR Experience (A-Frame + AR.js In-Browser Camera & Hiro Marker)
// ─────────────────────────────────────────────────────────────────────────────

let arCleanupInterval = null;

const openArJsOverlay = () => {
  if (!currentDish) return;
  if (dom.arDishName) dom.arDishName.textContent = currentDish.name;

  const sceneContainer = el("arSceneContainer");
  if (sceneContainer) {
    sceneContainer.innerHTML = `
      <a-scene embedded background="transparent: true" arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;" vr-mode-ui="enabled: false" renderer="logarithmicDepthBuffer: true; colorManagement: true; antialias: true;">
        <a-marker preset="hiro" id="hiroMarker">
          <a-entity light="type: ambient; intensity: 1.6;"></a-entity>
          <a-entity light="type: directional; intensity: 1.4;" position="1 4 2"></a-entity>
          
          <!-- 3D Dish Model -->
          <a-entity id="arDishEntity" gltf-model="${currentDish.model}" position="0 0.1 0" scale="${currentDish.arScale || "2.2 2.2 2.2"}" rotation="${currentDish.rotation || "0 0 0"}"></a-entity>
        </a-marker>
        <a-entity camera></a-entity>
      </a-scene>
    `;
  }

  document.body.classList.add("ar-mode-active");
  dom.arOverlay?.classList.remove("hidden");

  // Continuously clear any inline width/height mutations injected by AR.js
  clearInterval(arCleanupInterval);
  arCleanupInterval = setInterval(() => {
    document.body.style.width = "";
    document.body.style.height = "";
    document.body.style.marginLeft = "";
    document.body.style.marginTop = "";
  }, 100);

  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
  }, 200);

  showToast("Opening AR Camera… Point at Hiro marker");
  track("ar_js_open", { dish_id: currentDish.id });
};

const closeArJsOverlay = () => {
  clearInterval(arCleanupInterval);
  document.body.classList.remove("ar-mode-active");
  document.body.style.width = "";
  document.body.style.height = "";
  document.body.style.marginLeft = "";
  document.body.style.marginTop = "";

  dom.arOverlay?.classList.add("hidden");
  dom.markerModal?.classList.add("hidden");

  // Stop camera tracks and unmount video/canvas elements
  const videoElements = document.querySelectorAll("video, #arjs-video");
  videoElements.forEach((video) => {
    if (video.srcObject && typeof video.srcObject.getTracks === "function") {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    video.remove();
  });

  const sceneContainer = el("arSceneContainer");
  if (sceneContainer) sceneContainer.innerHTML = "";

  track("ar_js_close", { dish_id: currentDish?.id });
};

const openMarkerModal = () => dom.markerModal?.classList.remove("hidden");
const closeMarkerModal = () => dom.markerModal?.classList.add("hidden");

const activateAR = () => {
  if (dom.modelViewer?.canActivateAR) {
    dom.modelViewer.activateAR();
    track("ar_activate_native", { dish_id: currentDish?.id });
    return;
  }
  openArJsOverlay();
};

// ─────────────────────────────────────────────────────────────────────────────
// Share & View Controls
// ─────────────────────────────────────────────────────────────────────────────

const shareDish = async () => {
  if (!currentDish) return;
  const url = `${CANONICAL_BASE}?dish=${currentDish.id}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: currentDish.name,
        text: `Check out ${currentDish.name} in 3D!`,
        url,
      });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard");
  } catch {
    showToast("Unable to share");
  }
};

const resetView = () => {
  if (!dom.modelViewer) return;
  dom.modelViewer.resetTurntableRotation?.();
  dom.modelViewer.cameraOrbit = "0deg 75deg 105%";
  showToast("Camera view reset");
};

const toggleFullscreen = () => {
  if (!dom.modelViewer) return;
  if (!document.fullscreenElement) {
    (dom.modelViewer.requestFullscreen ?? dom.modelViewer.webkitRequestFullscreen)?.call(dom.modelViewer);
  } else {
    (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu Landing Page Rendering (Shadcn UI Cards & Tabs)
// ─────────────────────────────────────────────────────────────────────────────

const createDishCard = (dish) => {
  const card = document.createElement("a");
  card.className = "shadcn-card";
  card.href = `?dish=${dish.id}`;
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", `View ${dish.name} in 3D — ${dish.price}`);
  card.dataset.tags = (dish.tags ?? []).join(",");

  card.innerHTML = `
    <div class="card-image-box">
      <div class="card-emoji" aria-hidden="true">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </div>
      <div class="card-badge-top">
        <span class="badge badge-amber">${dish.badge ?? "Featured"}</span>
      </div>
      <div class="card-ar-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
        View in 3D
      </div>
    </div>
    <div class="card-body">
      <h2 class="card-title">${dish.name}</h2>
      <p class="card-desc">${dish.description}</p>
      <div class="card-footer-row">
        <span class="card-price">${dish.price}</span>
        <div class="card-meta-tags">
          <span>${dish.prepTime}</span>
          <span>·</span>
          <span>${dish.calories}</span>
        </div>
      </div>
    </div>
  `;

  return card;
};

const renderMenuCards = () => {
  if (!dom.menuGrid) return;
  dom.menuGrid.innerHTML = "";
  Object.values(DISHES).forEach((dish) => {
    dom.menuGrid.appendChild(createDishCard(dish));
  });
};

const filterMenu = (tag) => {
  const cards = dom.menuGrid?.querySelectorAll(".shadcn-card");
  let visibleCount = 0;

  cards?.forEach((card) => {
    const tags = card.dataset.tags?.split(",") ?? [];
    const match = tag === "all" || tags.includes(tag);
    if (match) {
      card.style.display = "";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  if (dom.menuEmpty) dom.menuEmpty.classList.toggle("hidden", visibleCount > 0);
  if (dom.menuGrid) dom.menuGrid.classList.toggle("hidden", visibleCount === 0);

  dom.menuFilters?.querySelectorAll(".tab-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.filter === tag);
  });
};

const initMenu = () => {
  renderMenuCards();
  showMenuScreen();

  dom.menuFilters?.addEventListener("click", (e) => {
    const pill = e.target.closest(".tab-pill");
    if (!pill) return;
    filterMenu(pill.dataset.filter);
  });

  const menuYears = document.querySelectorAll(".menu-year");
  menuYears.forEach((y) => (y.textContent = new Date().getFullYear()));
};

// ─────────────────────────────────────────────────────────────────────────────
// Init Boot
// ─────────────────────────────────────────────────────────────────────────────

const init = () => {
  if (dom.year) dom.year.textContent = new Date().getFullYear();

  const rawDishParam = getParam("dish");
  const dishId = sanitizeDishId(rawDishParam);
  const dish = dishId ? DISHES[dishId] : null;

  if (rawDishParam === null) {
    initMenu();
    return;
  }

  if (!dish) {
    showError();
    return;
  }

  loadDish(dish);

  dom.arButton?.addEventListener("click", activateAR);
  dom.shareBtn?.addEventListener("click", shareDish);
  dom.resetViewBtn?.addEventListener("click", resetView);
  dom.fullscreenBtn?.addEventListener("click", toggleFullscreen);
  dom.closeArBtn?.addEventListener("click", closeArJsOverlay);
  dom.showMarkerBtn?.addEventListener("click", openMarkerModal);
  dom.closeMarkerBtn?.addEventListener("click", closeMarkerModal);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
