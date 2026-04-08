// urlParams.js

import { GRID_SIZE, CELL_SIZE } from './config.js';
import { OBJECT_DEFINITIONS } from './objects.js';

/**
 * Reads ?locationid=XXX, finds the matching object in OBJECT_DEFINITIONS,
 * and returns the camera start state for it.
 */
export function getLocationStart(defaultCellX, defaultCellZ, defaultHeight) {
    const params     = new URLSearchParams(window.location.search);
    const locationid = params.get('locationid');

    const defaultPos    = new BABYLON.Vector3(defaultCellX + 0.5, defaultHeight, defaultCellZ);
    const defaultResult = { position: defaultPos, yaw: 0, pitch: 0, locationObj: null };

    if (!locationid) return defaultResult;

    const obj = OBJECT_DEFINITIONS.find(o => o.locationid === locationid);
    if (!obj) {
        console.warn(`[URL] locationid "${locationid}" not found — using default position`);
        return defaultResult;
    }

    console.log(`[URL] locationid "${locationid}" found`);
    return {
        position: new BABYLON.Vector3(
            obj.cameraStartX ?? defaultCellX,
            obj.cameraStartY ?? defaultHeight,
            obj.cameraStartZ ?? defaultCellZ
        ),
        yaw:         obj.cameraStartYaw   ?? 0,
        pitch:       obj.cameraStartPitch ?? 0,
        locationObj: obj
    };
}

// Position is no longer synced to the URL; locationid param is preserved as-is.
export function syncURLWithPosition(_camera) {}
