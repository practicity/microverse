// main.js

import * as configProd from "./config.js";
import * as configLocal from "./config.local.js";

const isLocal = new URLSearchParams(location.search).get("env") === "local";
const config = isLocal ? configLocal : configProd;

const {
    CELL_SIZE,
    GRAVITY, FOG_MODE,
    FOG_START, FOG_END, FOG_COLOR, CLEAR_COLOR,
    CAMERA_DEFAULT, CAMERA_LOOK_AHEAD,
    CAMERA_MIN_Z, CAMERA_SPEED_DESKTOP, CAMERA_SPEED_MOBILE, CAMERA_ANGULAR_SENSIBILITY, CAMERA_ELLIPSOID,
    KEYS_UP, KEYS_DOWN, KEYS_LEFT, KEYS_RIGHT, KEYS_UPWARD, KEYS_DOWNWARD,
    POINTER_LOCK_DELAY, COLLISIONS_ENABLED,
    SKYBOX_SIZE,
    FLASHLIGHT_ANGLE, FLASHLIGHT_EXPONENT,
    FLASHLIGHT_INTENSITY, FLASHLIGHT_ENABLED_DEFAULT,
    INTERACTION_MAX_DISTANCE,
    INTERACTION_KEY,
    INTERACTION_KEY_CODE,
    LABEL_TOGGLE_KEY,
    LABEL_TOGGLE_KEY_CODE,
    LOCATIONS_API_URL,
    PRACTICITYCONTENT_BASEURL
} = config;


import { CityMap, MAP_WORLD }                    from "./map.js";
import { initWeather, WeatherWidget }            from "./weather.js";
import { getLocationStart, syncURLWithPosition } from "./urlParams.js";


// ── DOM ──────────────────────────────────────────────────────────────────────

const loadingScreen       = document.getElementById("loading-screen");
const loadingBar          = document.getElementById("loading-bar");
const loadingPct          = document.getElementById("loading-pct");
const canvas              = document.getElementById("renderCanvas");
const locator             = document.getElementById("locator");
const locatorHeader       = document.getElementById("locator-header");
const locatorObjectName   = document.getElementById("locator-object-name");
const locatorModelName    = document.getElementById("locator-model-name");
const locatorCoords       = document.getElementById("locator-coords");
const locatorCopy         = document.getElementById("locator-copy");
const locatorModelSize    = document.getElementById("locator-model-size");
const popup               = document.getElementById("interaction-popup");
const popupTitle          = document.getElementById("popup-title");
const popupTags           = document.getElementById("popup-tags");
const popupDesc           = document.getElementById("popup-description");
const popupIllustrations  = document.getElementById("popup-illustrations");
const popupSolutions      = document.getElementById("popup-solutions");
const popupSolutionsList  = document.getElementById("popup-solutions-list");
const popupArticles       = document.getElementById("popup-articles");
const popupArticlesList   = document.getElementById("popup-articles-list");
const popupLinks          = document.getElementById("popup-links");
const popupClose          = document.getElementById("popup-close");
const uiInteract          = document.getElementById("ui-interact");

// ── LOCATIONS DATA ────────────────────────────────────────────────────────────

const locationsMap = new Map();

const locationsReady = fetch(LOCATIONS_API_URL)
    .then(res => res.json())
    .then(data => {
        const list = Array.isArray(data) ? data : Object.values(data);
        list.forEach(loc => {
            if (loc.locationid) locationsMap.set(loc.locationid, loc);
        });
    })
    .catch(err => console.warn("Could not load locations data:", err));

// ── ENGINE & SCENE ───────────────────────────────────────────────────────────

const engine = new BABYLON.Engine(canvas, true);
const scene  = new BABYLON.Scene(engine);

scene.useRightHandedSystem = true;
scene.fogMode           = FOG_MODE;
scene.fogStart          = FOG_START;
scene.fogEnd            = FOG_END;
scene.fogColor          = new BABYLON.Color3(FOG_COLOR.r, FOG_COLOR.g, FOG_COLOR.b);
scene.clearColor        = new BABYLON.Color4(CLEAR_COLOR.r, CLEAR_COLOR.g, CLEAR_COLOR.b, CLEAR_COLOR.a);
scene.gravity           = new BABYLON.Vector3(GRAVITY.x, GRAVITY.y, GRAVITY.z);
scene.collisionsEnabled = COLLISIONS_ENABLED;

// ── CAMERA ───────────────────────────────────────────────────────────────────

// locationid URL param overrides config defaults
const { position: startPosition, yaw: startYaw, pitch: startPitch, locationObj } = getLocationStart(CAMERA_DEFAULT);

const camera = new BABYLON.UniversalCamera("cam", startPosition, scene);

camera.rotation.y = startYaw;
camera.rotation.x = startPitch;

camera.minZ               = CAMERA_MIN_Z;
camera.angularSensibility = CAMERA_ANGULAR_SENSIBILITY;
camera.ellipsoid          = new BABYLON.Vector3(CAMERA_ELLIPSOID.x, CAMERA_ELLIPSOID.y, CAMERA_ELLIPSOID.z);
camera.ellipsoidOffset    = new BABYLON.Vector3(0, CAMERA_ELLIPSOID.y, 0);
camera.checkCollisions    = COLLISIONS_ENABLED;
camera.applyGravity       = false;
camera.attachControl(canvas, true);
canvas.focus();

camera.keysUp       = KEYS_UP;
camera.keysDown     = KEYS_DOWN;
camera.keysLeft     = KEYS_LEFT;
camera.keysRight    = KEYS_RIGHT;
camera.keysUpward   = KEYS_UPWARD;
camera.keysDownward = KEYS_DOWNWARD;

const isMobile     = window.matchMedia("(pointer: coarse)").matches;
const CAMERA_SPEED = isMobile ? CAMERA_SPEED_MOBILE : CAMERA_SPEED_DESKTOP;
camera.speed       = CAMERA_SPEED;





// ── POINTER LOCK ─────────────────────────────────────────────────────────────

if (!isMobile) {
    canvas.addEventListener("click", () => {
        if (document.pointerLockElement !== canvas) {
            setTimeout(() => canvas.requestPointerLock(), POINTER_LOCK_DELAY);
        }
    });
}

// ── LIGHTING ─────────────────────────────────────────────────────────────────

const sun     = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -1), scene);
const ambient = new BABYLON.HemisphericLight("amb", new BABYLON.Vector3(0, 1, 0), scene);

// ── SKY ──────────────────────────────────────────────────────────────────────

const skybox = BABYLON.MeshBuilder.CreateBox("sky", { size: SKYBOX_SIZE }, scene);
const skyMat = new BABYLON.StandardMaterial("skyMat", scene);
skyMat.backFaceCulling = false;
skyMat.disableLighting = true;
skybox.material        = skyMat;
skybox.isPickable      = false;

// ── WEATHER ──────────────────────────────────────────────────────────────────

initWeather(scene, sun, ambient, skyMat, camera);

// ── BUILD THE CITY ───────────────────────────────────────────────────────────

const cityMap = new CityMap(scene);

let loadedCount = 0;
const loadTotal = CityMap.loadTotal + 1; // +1 for locations API data

function onProgress() {
    loadedCount++;
    const pct = Math.round((loadedCount / loadTotal) * 100);
    loadingBar.style.width = pct + "%";
    loadingPct.textContent = pct + "%";

    if (loadedCount >= loadTotal) {
        // whenReadyAsync waits for all textures (including GLB-embedded ones) and
        // shader compilation to complete before revealing the world.
        scene.whenReadyAsync().then(() => {
            // Freeze all material shaders — static scene never needs define recompilation.
            scene.materials.forEach(mat => { if (mat.freeze) mat.freeze(); });
            loadingScreen.classList.add("fade-out");
            loadingScreen.addEventListener("transitionend", () => loadingScreen.remove(), { once: true });
        });
    }
}

cityMap.build(onProgress);
// Gate reveal on locations data so interaction names are ready on first approach.
locationsReady.then(onProgress);


// ── FLASHLIGHT ───────────────────────────────────────────────────────────────

const flashlight = new BABYLON.SpotLight(
    "flashlight",
    camera.position,
    BABYLON.Vector3.Zero(),
    FLASHLIGHT_ANGLE,
    FLASHLIGHT_EXPONENT,
    scene
);
flashlight.intensity = FLASHLIGHT_INTENSITY;
flashlight.range     = MAP_WORLD;
flashlight.setEnabled(FLASHLIGHT_ENABLED_DEFAULT);

scene.onBeforeRenderObservable.add(() => {
    flashlight.position  = camera.position.clone();
    flashlight.direction = camera.target.subtract(camera.position).normalize();
});

window.addEventListener("keydown", (e) => {
    if (e.key === "f" || e.key === "F") flashlight.setEnabled(!flashlight.isEnabled());
});

const weatherWidget = new WeatherWidget("weatherCanvas");

// ── INTERACTION POPUP ───────────────────────────────────────────────────────

let nearbyMesh      = null;
let prevNearbyMesh  = null;
let popupOpen       = false;
let labelEnabled    = false;
let crosshairMapX   = null;
let crosshairMapY   = null;
let autoOpenEnabled = new URLSearchParams(window.location.search).get("popautoopen") === "true";

// Resolve a URL from the API: prefix relative paths with the content base URL
function contentUrl(path) {
    if (!path) return null;
    try {
        const u = new URL(path);
        return `${PRACTICITYCONTENT_BASEURL}${u.pathname}${u.search}${u.hash}`;
    } catch {
        // relative path
        return `${PRACTICITYCONTENT_BASEURL}${path}`;
    }
}

async function openPopup(metadata) {
    await locationsReady;

    // Resolve data: prefer remote location record, fall back to inline metadata
    const loc = metadata.locationid ? (locationsMap.get(metadata.locationid) ?? {}) : {};

    const name         = loc.name        ?? metadata.objectName ?? "Object";
    const description  = loc.description ?? metadata.description ?? "";
    const tags         = loc.tags        ?? [];
    const screenshots  = [loc.screenshot1, loc.screenshot2].map(contentUrl).filter(Boolean);
    const solutions    = loc.solutions   ?? [];
    const articles     = loc.articles    ?? [];
    const locationUrl  = contentUrl(loc.url);

    // Title
    if (locationUrl) {
        popupTitle.innerHTML = "";
        const a = document.createElement("a");
        a.href        = locationUrl;
        a.textContent = name;
        a.target      = "_blank";
        a.rel         = "noopener noreferrer";
        popupTitle.appendChild(a);
    } else {
        popupTitle.textContent = name;
    }

    // Tags
    popupTags.innerHTML = "";
    tags.forEach(tag => {
        const span = document.createElement("span");
        span.className   = "popup-tag";
        span.textContent = tag;
        popupTags.appendChild(span);
    });
    popupTags.style.display = tags.length ? "flex" : "none";

    // Description
    popupDesc.textContent   = description;
    popupDesc.style.display = description ? "block" : "none";

    // Illustrations (screenshot1 / screenshot2)
    popupIllustrations.innerHTML = "";
    screenshots.forEach(src => {
        const img = document.createElement("img");
        img.src       = src;
        img.className = "popup-illustration";
        img.alt       = name;
        img.loading   = "lazy";
        popupIllustrations.appendChild(img);
    });
    popupIllustrations.style.display = screenshots.length ? "flex" : "none";

    // Solutions
    popupSolutionsList.innerHTML = "";
    solutions.forEach(s => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href        = contentUrl(s.url);
        a.textContent = s.title ?? s.url;
        a.target      = "_blank";
        a.rel         = "noopener noreferrer";
        li.appendChild(a);
        popupSolutionsList.appendChild(li);
    });
    popupSolutions.style.display = solutions.length ? "flex" : "none";

    // Articles
    popupArticlesList.innerHTML = "";
    articles.forEach(article => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href        = contentUrl(article.url);
        a.textContent = article.title ?? article.url;
        a.target      = "_blank";
        a.rel         = "noopener noreferrer";
        li.appendChild(a);
        popupArticlesList.appendChild(li);
    });
    popupArticles.style.display = articles.length ? "flex" : "none";

    popupLinks.style.display = "none";

    popup.classList.add("visible");
    popupOpen = true;

    if (document.pointerLockElement === canvas) document.exitPointerLock();
    camera.detachControl(canvas);
}

function closePopup() {
    popup.classList.remove("visible");
    popupOpen = false;
    if (!isMobile) {
        camera.attachControl(canvas, true);
        canvas.focus();
    }
}

popupClose.addEventListener("click", closePopup);

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popupOpen) closePopup();
});

// ── PER-FRAME: RAYCAST ───────────────────────────────────────────────────────

scene.onBeforeRenderObservable.add(() => {
    if (popupOpen) return;

    const ray = scene.createPickingRay(
        engine.getRenderWidth()  / 2,
        engine.getRenderHeight() / 2,
        BABYLON.Matrix.Identity(),
        camera
    );

    // Crosshair grid position: intersect ray with ground plane (y=0)
    // Babylon X → mapY, Babylon Z → mapX (matches object.js axis convention)
    if (ray.direction.y !== 0) {
        const t = -ray.origin.y / ray.direction.y;
        if (t > 0) {
            crosshairMapX = Math.round(ray.origin.z + t * ray.direction.z);
            crosshairMapY = Math.round(ray.origin.x + t * ray.direction.x);
        }
    }

    // Locator header: object name + model when crosshair hits a named mesh
    const labelHit = scene.pickWithRay(
        ray,
        (mesh) => mesh.isPickable && mesh.name && mesh.name !== "" && mesh.name !== "__root__"
    );

    if (labelHit.hit && labelHit.pickedMesh) {
        const meta  = labelHit.pickedMesh.metadata ?? {};
        const name  = meta.objectName || labelHit.pickedMesh.name || "";
        const model = meta.model || "";
        if (name) {
            locatorObjectName.textContent = name;
            locatorModelName.textContent  = model;
            locatorModelSize.textContent  = glbSizeCache.get(model) ?? "";
            if (model && !glbSizeCache.has(model)) {
                fetchGlbSize(model).then(size => {
                    if (locatorModelName.textContent === model) locatorModelSize.textContent = size;
                });
            }
            locatorHeader.classList.add("visible");
        } else {
            locatorHeader.classList.remove("visible");
        }
    } else {
        locatorHeader.classList.remove("visible");
    }

    // Interaction: only interactive meshes
    const hit = scene.pickWithRay(
        ray,
        (mesh) => mesh.isPickable && mesh.metadata?.interactive
    );

    if (hit.hit && hit.pickedMesh && hit.distance <= INTERACTION_MAX_DISTANCE) {
        nearbyMesh = hit.pickedMesh;
        if (!isMobile) {
            const meta = hit.pickedMesh.metadata ?? {};
            const locData = meta.locationid ? locationsMap.get(meta.locationid) : null;
            const name = locData?.name ?? meta.objectName ?? "object";
            uiInteract.textContent = `  |  Click to know more about ${name}`;
        }

        if (autoOpenEnabled && nearbyMesh !== prevNearbyMesh) {
            autoOpenEnabled = false;
            openPopup(nearbyMesh.metadata);
        }
    } else {
        nearbyMesh = null;
        if (!isMobile) uiInteract.textContent = "";
    }

    prevNearbyMesh = nearbyMesh;
});

// ── KEYDOWN ACTIONS ──────────────────────────────────────────────────────────

canvas.addEventListener("click", () => {
    if (!popupOpen && nearbyMesh) openPopup(nearbyMesh.metadata);
});

window.addEventListener("keydown", (e) => {
    // Locator + grid toggle
    if (e.key.toUpperCase() === LABEL_TOGGLE_KEY || e.code === LABEL_TOGGLE_KEY_CODE) {
        labelEnabled = !labelEnabled;
        locator.classList.toggle("visible", labelEnabled);
        cityMap.toggleGrid();
        return;
    }
});

// ── LOCATOR ──────────────────────────────────────────────────────────────────

function locatorText() {
    const x     = camera.position.x;
    const y     = camera.position.y;   // eye height (Babylon Y)
    const z     = camera.position.z;
    const pitch = camera.rotation.x;
    const yaw   = camera.rotation.y;

    const f = (n, d = 3) => parseFloat(n.toFixed(d));

    const lines = [
        `"cameraStartX": ${f(z)},`,
        `"cameraStartY": ${f(x)},`,
        `"cameraStartZ": ${f(y)},`,
        `"cameraStartPitch": ${f(pitch)},`,
        `"cameraStartYaw": ${f(yaw)},`,
    ];

    if (crosshairMapX !== null) {
        lines.push(`"mapX": ${crosshairMapX},`);
        lines.push(`"mapY": ${crosshairMapY},`);
    }

    return lines.join("\n");
}

const glbSizeCache = new Map();

async function fetchGlbSize(model) {
    if (glbSizeCache.has(model)) return glbSizeCache.get(model);
    try {
        const res = await fetch(`assets/${model}`, { method: "HEAD" });
        const bytes = parseInt(res.headers.get("content-length") || "0", 10);
        const mb = bytes ? (bytes / 1048576).toFixed(2) + " MB" : "";
        glbSizeCache.set(model, mb);
        return mb;
    } catch {
        glbSizeCache.set(model, "");
        return "";
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).catch(() => execCopy(text));
    }
    execCopy(text);
    return Promise.resolve();
}

function execCopy(text) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}

locatorCopy.addEventListener("click", () => {
    copyToClipboard(locatorText()).then(() => {
        locatorCopy.textContent = "COPIED!";
        locatorCopy.classList.add("copied");
        setTimeout(() => {
            locatorCopy.textContent = "COPY";
            locatorCopy.classList.remove("copied");
        }, 1500);
    });
});

// ── RENDER LOOP ──────────────────────────────────────────────────────────────

engine.runRenderLoop(() => {
    scene.render();
    syncURLWithPosition(camera);
    locatorCoords.textContent = locatorText();
});

window.addEventListener("resize", () => engine.resize());

// ── MOBILE CONTROLS ──────────────────────────────────────────────────────────

if (isMobile) {
    camera.detachControl(canvas);

    document.getElementById("ui").style.display = "none";
    const mobileControls     = document.getElementById("mobile-controls");
    const mobileInteractBtn  = document.getElementById("mobile-interact-btn");
    mobileControls.style.display = "flex";

    const mobileInput = {
        forward: false, backward: false,
        lookUp: false, lookDown: false,
        lookLeft: false, lookRight: false,
    };

    const attachHold = (id, prop) => {
        const btn = document.getElementById(id);
        const press   = e => { e.preventDefault(); mobileInput[prop] = true;  btn.classList.add("pressed"); };
        const release = e => { e.preventDefault(); mobileInput[prop] = false; btn.classList.remove("pressed"); };
        btn.addEventListener("touchstart",  press,   { passive: false });
        btn.addEventListener("touchend",    release, { passive: false });
        btn.addEventListener("touchcancel", release, { passive: false });
    };

    attachHold("btn-forward",    "forward");
    attachHold("btn-backward",   "backward");
    // Touch-drag on canvas for free-look — track by identifier so it works
    // simultaneously with button touches (multi-touch).
    let dragId     = null;
    let touchOrigin = null;
    canvas.addEventListener("touchstart", e => {
        e.preventDefault();
        if (dragId === null) {
            const t    = e.changedTouches[0];
            dragId     = t.identifier;
            touchOrigin = { x: t.clientX, y: t.clientY };
        }
    }, { passive: false });
    canvas.addEventListener("touchmove", e => {
        e.preventDefault();
        if (dragId === null) return;
        let t = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === dragId) { t = e.touches[i]; break; }
        }
        if (!t) return;
        const dx = t.clientX - touchOrigin.x;
        const dy = t.clientY - touchOrigin.y;
        camera.rotation.y  -= dx * 0.005;
        camera.rotation.x  -= dy * 0.005;
        camera.rotation.x   = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, camera.rotation.x));
        touchOrigin = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    const endDrag = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === dragId) { dragId = null; touchOrigin = null; break; }
        }
    };
    canvas.addEventListener("touchend",    endDrag);
    canvas.addEventListener("touchcancel", endDrag);

    // Interact tap button
    mobileInteractBtn.addEventListener("touchstart", e => {
        e.preventDefault();
        if (!popupOpen && nearbyMesh) openPopup(nearbyMesh.metadata);
    }, { passive: false });

    // Per-frame mobile movement & interact button visibility
    scene.onBeforeRenderObservable.add(() => {
        mobileInteractBtn.style.display = (!popupOpen && nearbyMesh) ? "flex" : "none";

        if (mobileInput.forward || mobileInput.backward) {
            const sign = mobileInput.forward ? 1 : -1;
            const dt   = engine.getDeltaTime() / 1000;
            const fwd  = camera.getForwardRay(1).direction;
            const spd  = CAMERA_SPEED * 60 * dt;
            const disp = new BABYLON.Vector3(fwd.x * spd * sign, fwd.y * spd * sign, fwd.z * spd * sign);
            if (COLLISIONS_ENABLED) {
                camera._collideWithWorld(disp);
            } else {
                camera.position.addInPlace(disp);
            }
        }
    });
}
