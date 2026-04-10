// main.js

const _configFile = new URLSearchParams(location.search).get("env") === "local"
    ? "./config.local.js"
    : "./config.js";

const {
    CELL_SIZE,
    GRAVITY, FOG_MODE,
    FOG_START, FOG_END, FOG_COLOR, CLEAR_COLOR,
    CAMERA_START_CELL_X, CAMERA_START_CELL_Z,
    CAMERA_HEIGHT, CAMERA_LOOK_AHEAD,
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
} = await import(_configFile);

import { CityMap, MAP_WORLD }           from "./map.js";
import { Minimap }                       from "./minimap.js";
import { initWeather, WeatherWidget }    from './weather.js';
import { getLocationStart, syncURLWithPosition } from './urlParams.js';

// ── DOM ──────────────────────────────────────────────────────────────────────

const canvas              = document.getElementById("renderCanvas");
const objectLabel         = document.getElementById("object-label");
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

scene.fogMode           = FOG_MODE;
scene.fogStart          = FOG_START;
scene.fogEnd            = FOG_END;
scene.fogColor          = new BABYLON.Color3(FOG_COLOR.r, FOG_COLOR.g, FOG_COLOR.b);
scene.clearColor        = new BABYLON.Color4(CLEAR_COLOR.r, CLEAR_COLOR.g, CLEAR_COLOR.b, CLEAR_COLOR.a);
scene.gravity           = new BABYLON.Vector3(GRAVITY.x, GRAVITY.y, GRAVITY.z);
scene.collisionsEnabled = true;

// ── CAMERA ───────────────────────────────────────────────────────────────────

// locationid URL param overrides config defaults
const { position: startPosition, yaw: startYaw, pitch: startPitch, locationObj } = getLocationStart(
    CAMERA_START_CELL_X,
    CAMERA_START_CELL_Z,
    CAMERA_HEIGHT
);

const camera = new BABYLON.UniversalCamera("cam", startPosition, scene);

camera.rotation.y = startYaw;
camera.rotation.x = startPitch;

if (!locationObj) {
    camera.setTarget(new BABYLON.Vector3(
        startPosition.x,
        startPosition.y,
        startPosition.z + CAMERA_LOOK_AHEAD
    ));
}

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
cityMap.build();

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

    // Label: any named mesh
    const labelHit = scene.pickWithRay(
        ray,
        (mesh) => mesh.isPickable && mesh.name && mesh.name !== "" && mesh.name !== "__root__"
    );

    if (labelEnabled && labelHit.hit && labelHit.pickedMesh) {
        const name = labelHit.pickedMesh.metadata?.objectName
                  ?? labelHit.pickedMesh.name
                  ?? "";
        if (name) {
            objectLabel.textContent = name;
            objectLabel.classList.add("visible");
        } else {
            objectLabel.classList.remove("visible");
        }
    } else {
        objectLabel.classList.remove("visible");
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

    // Label toggle
    if (e.key.toUpperCase() === LABEL_TOGGLE_KEY || e.code === LABEL_TOGGLE_KEY_CODE) {
        labelEnabled = !labelEnabled;
        if (!labelEnabled) objectLabel.classList.remove("visible");
        return;
    }
});

// ── RENDER LOOP ──────────────────────────────────────────────────────────────

engine.runRenderLoop(() => {
    scene.render();
    minimap.update(camera.position);
    syncURLWithPosition(camera);
});

window.addEventListener("resize", () => engine.resize());
