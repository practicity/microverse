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
    CAMERA_MIN_Z, CAMERA_SPEED, CAMERA_ANGULAR_SENSIBILITY, CAMERA_ELLIPSOID,
    KEYS_UP, KEYS_DOWN, KEYS_LEFT, KEYS_RIGHT, KEYS_UPWARD, KEYS_DOWNWARD,
    POINTER_LOCK_DELAY,
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
import { Minimap }                               from "./minimap.js";
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
const interactHint        = document.getElementById("interact-hint");

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
scene.collisionsEnabled = true;

// ── CAMERA ───────────────────────────────────────────────────────────────────

// locationid URL param overrides config defaults
const { position: startPosition, yaw: startYaw, pitch: startPitch, locationObj } = getLocationStart(CAMERA_DEFAULT);

const camera = new BABYLON.UniversalCamera("cam", startPosition, scene);

camera.rotation.y = startYaw;
camera.rotation.x = startPitch;

camera.minZ               = CAMERA_MIN_Z;
camera.speed              = CAMERA_SPEED;
camera.angularSensibility = CAMERA_ANGULAR_SENSIBILITY;
camera.ellipsoid          = new BABYLON.Vector3(CAMERA_ELLIPSOID.x, CAMERA_ELLIPSOID.y, CAMERA_ELLIPSOID.z);
camera.ellipsoidOffset    = new BABYLON.Vector3(0, CAMERA_ELLIPSOID.y, 0);
camera.checkCollisions    = true;
camera.applyGravity       = false;
camera.attachControl(canvas, true);
canvas.focus();

camera.keysUp       = KEYS_UP;
camera.keysDown     = KEYS_DOWN;
camera.keysLeft     = KEYS_LEFT;
camera.keysRight    = KEYS_RIGHT;
camera.keysUpward   = KEYS_UPWARD;
camera.keysDownward = KEYS_DOWNWARD;





// ── POINTER LOCK ─────────────────────────────────────────────────────────────

canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
        setTimeout(() => canvas.requestPointerLock(), POINTER_LOCK_DELAY);
    }
});

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

initWeather(scene, sun, ambient, skyMat);

// ── BUILD THE CITY ───────────────────────────────────────────────────────────

const cityMap = new CityMap(scene);

let loadedCount = 0;
const loadTotal = CityMap.loadTotal;

cityMap.build(() => {
    loadedCount++;
    const pct = Math.round((loadedCount / loadTotal) * 100);
    loadingBar.style.width = pct + "%";
    loadingPct.textContent = pct + "%";

    if (loadedCount >= loadTotal) {
        scene.executeWhenReady(() => {
            loadingScreen.classList.add("fade-out");
            loadingScreen.addEventListener("transitionend", () => loadingScreen.remove(), { once: true });
        });
    }
});

// ── GRID TOGGLE ──────────────────────────────────────────────────────────────

window.addEventListener("keydown", (e) => {
    if (e.key === "g" || e.key === "G") cityMap.toggleGrid();
});

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

// ── MINIMAP ──────────────────────────────────────────────────────────────────

const minimap       = new Minimap("minimapCanvas", scene, camera);
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
    camera.attachControl(canvas, true);
    canvas.focus();
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
        const meta = hit.pickedMesh.metadata ?? {};
        const locData = meta.locationid ? locationsMap.get(meta.locationid) : null;
        const name = locData?.name ?? meta.objectName ?? "object";
        interactHint.textContent = `[${INTERACTION_KEY}] Interact with ${name}`;
        interactHint.classList.add("visible");

        if (autoOpenEnabled && nearbyMesh !== prevNearbyMesh) {
            autoOpenEnabled = false;
            openPopup(nearbyMesh.metadata);
        }
    } else {
        nearbyMesh = null;
        interactHint.classList.remove("visible");
    }

    prevNearbyMesh = nearbyMesh;
});

// ── KEYDOWN ACTIONS ──────────────────────────────────────────────────────────

window.addEventListener("keydown", (e) => {
    // Interact
    if (
        (e.key.toUpperCase() === INTERACTION_KEY || e.code === INTERACTION_KEY_CODE) &&
        !popupOpen && nearbyMesh
    ) {
        openPopup(nearbyMesh.metadata);
        return;
    }

    // Locator toggle
    if (e.key.toUpperCase() === LABEL_TOGGLE_KEY || e.code === LABEL_TOGGLE_KEY_CODE) {
        labelEnabled = !labelEnabled;
        locator.classList.toggle("visible", labelEnabled);
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

locatorCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(locatorText()).then(() => {
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
    minimap.update(camera.position);
    syncURLWithPosition(camera);
    locatorCoords.textContent = locatorText();
});

window.addEventListener("resize", () => engine.resize());
