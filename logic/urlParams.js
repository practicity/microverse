// urlParams.js

const _objectModules = import.meta.glob("../public/objects/*.json", { eager: true });
const OBJECT_DEFINITIONS = Object.values(_objectModules).flatMap(mod => mod.default ?? mod);

function cameraFromDef(obj) {
    // cameraStartX = forward/back (→ Babylon Z)
    // cameraStartY = right/left   (→ Babylon X)
    // cameraStartZ = height       (→ Babylon Y)
    return {
        position: new BABYLON.Vector3(
            obj.cameraStartY ?? 0,
            obj.cameraStartZ ?? 0.175,
            obj.cameraStartX ?? 0
        ),
        yaw:         obj.cameraStartYaw   ?? 0,
        pitch:       obj.cameraStartPitch ?? 0,
        locationObj: obj,
    };
}

/**
 * Reads ?locationid=XXX from the URL.
 * Falls back to the CAMERA_DEFAULT object from config if not found.
 */
export function getLocationStart(defaults) {
    const params     = new URLSearchParams(window.location.search);
    const locationid = params.get('locationid');

    if (!locationid) {
        console.log('[URL] No locationid — using default camera position');
        return { ...cameraFromDef(defaults), locationObj: null };
    }

    const locationidUpper = locationid.toUpperCase();
    const obj = OBJECT_DEFINITIONS.find(o => o.locationid?.toUpperCase() === locationidUpper);
    if (!obj) {
        console.warn(`[URL] locationid "${locationid}" not found — using default`);
        return { ...cameraFromDef(defaults), locationObj: null };
    }

    console.log(`[URL] locationid "${locationid}" → cameraStartX=${obj.cameraStartX} Y=${obj.cameraStartY} Z=${obj.cameraStartZ}`);
    return cameraFromDef(obj);
}

// Position is no longer synced to the URL; locationid param is preserved as-is.
export function syncURLWithPosition(_camera) {}
