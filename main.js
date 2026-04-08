// main.js

import {
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
    LABEL_TOGGLE_KEY_CODE
} from "./config.js";

import { CityMap, MAP_WORLD }           from "./map.js";
import { Minimap }                       from "./minimap.js";
import { initWeather, WeatherWidget }    from './weather.js';
import { getLocationStart, syncURLWithPosition } from './urlParams.js';

// ── DOM ──────────────────────────────────────────────────────────────────────

const canvas       = document.getElementById("renderCanvas");
const objectLabel  = document.getElementById("object-label");
const popup        = document.getElementById("interaction-popup");
const popupTitle   = document.getElementById("popup-title");
const popupDesc    = document.getElementById("popup-description");
const popupLinks   = document.getElementById("popup-links");
const popupClose   = document.getElementById("popup-close");
const interactHint = document.getElementById("interact-hint");

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

// ── INTERACTION SYSTEM ───────────────────────────────────────────────────────

let nearbyMesh      = null;
let prevNearbyMesh  = null;
let popupOpen       = false;
let labelEnabled    = false;
let autoOpenEnabled = !!locationObj; // true on load when a locationid was matched

function openPopup(metadata) {
    popupTitle.textContent = metadata.objectName ?? "Object";

    popupDesc.textContent   = metadata.description ?? "";
    popupDesc.style.display = metadata.description ? "block" : "none";

    popupLinks.innerHTML = "";
    const urls = metadata.urls ?? [];
    urls.forEach(url => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href        = url;
        a.textContent = url;
        a.target      = "_blank";
        a.rel         = "noopener noreferrer";
        li.appendChild(a);
        popupLinks.appendChild(li);
    });
    popupLinks.style.display = urls.length ? "block" : "none";

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
        const name = hit.pickedMesh.metadata?.objectName ?? "object";
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
