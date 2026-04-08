// urlParams.js

import { OBJECT_DEFINITIONS } from './objects.js';

/**
 * Reads ?locationid=XXX, finds the matching object in OBJECT_DEFINITIONS,
 * and returns the camera start state for it.
 */
export function getLocationStart(defaultCellX, defaultCellZ, defaultHeight) {
    const params     = new URLSearchParams(window.location.search);
    const locationid = params.get('locationid');

    console.log(`[URL] locationid param: "${locationid}", OBJECT_DEFINITIONS loaded: ${OBJECT_DEFINITIONS?.length} entries`);

    const defaultPos    = new BABYLON.Vector3(defaultCellX + 0.5, defaultHeight, defaultCellZ);
    const defaultResult = { position: defaultPos, yaw: 0, pitch: 0, locationObj: null };

    if (!locationid) {
        console.log('[URL] No locationid — using default camera position');
        return defaultResult;
    }

    const obj = OBJECT_DEFINITIONS.find(o => o.locationid === locationid);
    if (!obj) {
        console.warn(`[URL] locationid "${locationid}" not found in OBJECT_DEFINITIONS — using default`);
        return defaultResult;
    }

    // Axis convention mirrors object.js: cameraStartX=BabylonX, cameraStartY=BabylonZ, cameraStartZ=BabylonY(height)
    const pos = new BABYLON.Vector3(
        obj.cameraStartX ?? (defaultCellX + 0.5),
        obj.cameraStartZ ?? defaultHeight,
        obj.cameraStartY ?? defaultCellZ
    );
    console.log(`[URL] locationid "${locationid}" → camera at X=${pos.x} Y=${pos.y} Z=${pos.z}, yaw=${obj.cameraStartYaw ?? 0}`);

    return {
        position:    pos,
        yaw:         obj.cameraStartYaw   ?? 0,
        pitch:       obj.cameraStartPitch ?? 0,
        locationObj: obj
    };
}

// Position is no longer synced to the URL; locationid param is preserved as-is.
export function syncURLWithPosition(_camera) {}
