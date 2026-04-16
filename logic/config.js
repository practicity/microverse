// config.js  —  production

// ── CONTENT SERVER ────────────────────────────────────────────────────────────
export const PRACTICITYCONTENT_BASEURL  = "https://practi.city";
export const LOCATIONS_API_URL          = `${PRACTICITYCONTENT_BASEURL}/api/locations.json`;

// ── GRID / MAP ────────────────────────────────────────────────────────────────
export const GRID_SIZE              =100;
export const CELL_SIZE              = 1;

// ── SCENE ────────────────────────────────────────────────────────────────────
export const GRAVITY                = { x: 0, y: -0.9, z: 0 };
export const FOG_MODE               = 3;
export const FOG_START              = 20;
export const FOG_END                = 125;
export const FOG_COLOR              = { r: 0.6, g: 0.8, b: 1.0 };
export const CLEAR_COLOR            = { r: 0.55, g: 0.80, b: 1.0, a: 1 };

// ── CAMERA ───────────────────────────────────────────────────────────────────
export const CAMERA_DEFAULT = {
    cameraStartX:     0,
    cameraStartY:     0,
    cameraStartZ:     0.175,
    cameraStartPitch: 0,
    cameraStartYaw:   4.7,
};
export const CAMERA_LOOK_AHEAD          = 10;
export const CAMERA_MIN_Z               = 0.1;
export const CAMERA_SPEED               = 0.15;
export const CAMERA_ANGULAR_SENSIBILITY = 1500;
export const CAMERA_ELLIPSOID           = { x: 0.35, y: 0.1, z: 0.35 };

// ── POINTER LOCK ─────────────────────────────────────────────────────────────
export const POINTER_LOCK_DELAY     = 100;

// ── SKYBOX ───────────────────────────────────────────────────────────────────
export const SKYBOX_SIZE            = 200;

// ── INTERACTION ───────────────────────────────────────────────────────────────
export const KEYS_UP       = [90, 38];   // Z + ArrowUp
export const KEYS_DOWN     = [83, 40];   // S + ArrowDown
export const KEYS_LEFT     = [81, 37];   // Q + ArrowLeft
export const KEYS_RIGHT    = [68, 39];   // D + ArrowRight
export const KEYS_UPWARD   = [32];       // Space
export const KEYS_DOWNWARD = [16];       // LShift

export const INTERACTION_MAX_DISTANCE   = 40;
export const INTERACTION_KEY            = "E";
export const INTERACTION_KEY_CODE       = "KeyE";

export const LABEL_TOGGLE_KEY           = "L";
export const LABEL_TOGGLE_KEY_CODE      = "KeyL";

// ── FLASHLIGHT ───────────────────────────────────────────────────────────────
export const FLASHLIGHT_ANGLE           = Math.PI / 3;
export const FLASHLIGHT_EXPONENT        = 5;
export const FLASHLIGHT_INTENSITY       = 50;
export const FLASHLIGHT_ENABLED_DEFAULT = false;

// ── WORLD GRID MATERIAL ───────────────────────────────────────────────────────
export const GRID_MAJOR_UNIT_FREQUENCY  = 10;
export const GRID_MINOR_UNIT_VISIBILITY = 0.5;
export const GRID_MAIN_COLOR            = { r: 1,   g: 1,   b: 1   };
export const GRID_LINE_COLOR            = { r: 0.5, g: 0.5, b: 0.5 };
export const GRID_OPACITY               = 0.8;
export const GRID_VISIBLE_DEFAULT       = false;
export const GRID_Y_OFFSET              = 0.01;

// ── GROUND ───────────────────────────────────────────────────────────────────
export const GROUND_SUBDIVISIONS    = 5;
export const GROUND_TEXTURE_PATH    = "assets/grounds/texture_grass.jpg";
export const GROUND_TEXTURE_SCALE   = 1;
export const GROUND_METALLIC        = 0;
export const GROUND_ROUGHNESS       = 2;
