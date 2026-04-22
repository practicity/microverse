// weather.js

import SunCalc from 'suncalc';
import * as configProd  from "./config.js";
import * as configLocal from "./config.local.js";

const isLocal = new URLSearchParams(location.search).get("env") === "local";
const {
    WEATHER_API_KEY,
    WEATHER_LAT,
    WEATHER_LON,
    WEATHER_REFRESH_MS,
    WEATHER_MAP_NORTH_BEARING_DEG,
    CEL_BODY_DIST,
    SUN_ANGULAR_SIZE_DEG,
    MOON_ANGULAR_SIZE_DEG,
} = isLocal ? configLocal : configProd;

// ── WEATHER STATE ─────────────────────────────────────────────────────────────

export const weatherState = {
    temp: undefined,
    description: '',
    iconUrl: ''
};

// ── SUN / BODY DIRECTION MATH ─────────────────────────────────────────────────
//
// Converts spherical sky coordinates (SunCalc convention) to a Babylon.js
// DirectionalLight direction vector (FROM the body TOWARD the scene).
//
// SunCalc azimuth: 0 = south, positive = clockwise toward west.
//
// Geographic light direction (East=+X_geo, North=+Z_geo):
//   lightN =  cos(az) * cos(alt)
//   lightE =  sin(az) * cos(alt)
//   lightY = -sin(alt)            (negative = going downward)
//
// Map bearing rotation (b = mapNorthBearingDeg, CW from Babylon +Z to North):
//   babylonX = -lightN*sin(b) + lightE*cos(b)
//   babylonZ =  lightN*cos(b) + lightE*sin(b)
//
function bodyLightDir(az, alt, bearingDeg) {
    const lightN =  Math.cos(az) * Math.cos(alt);
    const lightE =  Math.sin(az) * Math.cos(alt);
    const lightY = -Math.sin(alt);
    const b  = bearingDeg * (Math.PI / 180);
    return new BABYLON.Vector3(
        -lightN * Math.sin(b) + lightE * Math.cos(b),
        lightY,
        lightN * Math.cos(b) + lightE * Math.sin(b)
    );
}

function sunDirectionVector(date, lat, lon, bearingDeg) {
    const { azimuth, altitude } = SunCalc.getPosition(date, lat, lon);
    return bodyLightDir(azimuth, altitude, bearingDeg);
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

export function initWeather(scene, sun, ambient, skyMat, camera) {
    startWeatherSystem(scene, sun, ambient, skyMat, camera);
}

// ── FETCH ─────────────────────────────────────────────────────────────────────

async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather`
              + `?lat=${WEATHER_LAT}&lon=${WEATHER_LON}&appid=${WEATHER_API_KEY}&units=metric`;
    try {
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const now = Math.floor(Date.now() / 1000);
        weatherState.sunriseTs   = data.sys.sunrise;
        weatherState.sunsetTs    = data.sys.sunset;
        weatherState.isDay       = now >= data.sys.sunrise && now < data.sys.sunset;
        weatherState.cloudiness  = (data.clouds?.all ?? 0) / 100;
        weatherState.description = data.weather[0].description;
        weatherState.condId      = data.weather[0].id;
        weatherState.temp        = Math.round(data.main.temp);
        weatherState.feelsLike   = Math.round(data.main.feels_like);
        weatherState.humidity    = data.main.humidity;
        weatherState.windKmh     = Math.round((data.wind?.speed ?? 0) * 3.6);

        const id = data.weather[0].id;
        weatherState.storm = id >= 200 && id < 300;
        weatherState.rain  = id >= 300 && id < 600;
        weatherState.snow  = id >= 600 && id < 700;
        weatherState.fog   = id >= 700 && id < 800;

    } catch (err) {
        console.warn('[WeatherSystem] fetch failed:', err);
    }
}

// ── APPLY WEATHER TO SCENE ────────────────────────────────────────────────────

function applyWeatherToScene(scene, sun, ambient, skyMat) {
    const { isDay, cloudiness, rain, snow, fog, storm } = weatherState;

    sun.direction = sunDirectionVector(new Date(), WEATHER_LAT, WEATHER_LON, WEATHER_MAP_NORTH_BEARING_DEG);

    if (isDay) {
        const baseSunIntensity = 1.2 - cloudiness * 0.8 - (storm ? 0.3 : 0);
        sun.intensity = Math.max(0.05, baseSunIntensity);
        sun.diffuse   = new BABYLON.Color3(1, 0.95 - cloudiness * 0.1, 0.85 - cloudiness * 0.2);

        ambient.intensity = 0.6 - cloudiness * 0.3;
        ambient.diffuse   = new BABYLON.Color3(
            0.6 - cloudiness * 0.2,
            0.7 - cloudiness * 0.2,
            0.9
        );

        if (fog || rain || storm) {
            skyMat.emissiveColor = new BABYLON.Color3(0.35, 0.37, 0.4);
        } else if (snow) {
            skyMat.emissiveColor = new BABYLON.Color3(0.7, 0.75, 0.8);
        } else {
            const blue = 1.0 - cloudiness * 0.5;
            skyMat.emissiveColor = new BABYLON.Color3(
                0.3 + cloudiness * 0.3,
                0.55 + cloudiness * 0.15,
                blue
            );
        }

        if (rain || storm) {
            scene.fogMode    = BABYLON.Scene.FOGMODE_EXP;
            scene.fogDensity = 0.008 + (storm ? 0.005 : 0);
            scene.fogColor   = new BABYLON.Color3(0.4, 0.4, 0.45);
        } else if (fog) {
            scene.fogMode    = BABYLON.Scene.FOGMODE_EXP;
            scene.fogDensity = 0.02;
            scene.fogColor   = new BABYLON.Color3(0.7, 0.7, 0.7);
        } else {
            scene.fogMode  = BABYLON.Scene.FOGMODE_LINEAR;
            scene.fogStart = 300;
            scene.fogEnd   = 600;
            scene.fogColor = new BABYLON.Color3(0.7, 0.8, 1.0);
        }

    } else {
        sun.intensity = 0.08 - cloudiness * 0.06;
        sun.diffuse   = new BABYLON.Color3(0.7, 0.75, 1.0);

        ambient.intensity = 0.15;
        ambient.diffuse   = new BABYLON.Color3(0.2, 0.2, 0.4);

        skyMat.emissiveColor = cloudiness > 0.6
            ? new BABYLON.Color3(0.03, 0.03, 0.05)
            : new BABYLON.Color3(0.02, 0.02, 0.12);

        scene.fogMode  = BABYLON.Scene.FOGMODE_LINEAR;
        scene.fogStart = 150;
        scene.fogEnd   = 400;
        scene.fogColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    }
}

// ── CELESTIAL BODY VISUALS ────────────────────────────────────────────────────

function initCelestialBodies(scene, sunLight, camera) {
    // Disc radius = dist * tan(half-angle)
    const sunRadius  = CEL_BODY_DIST * Math.tan(SUN_ANGULAR_SIZE_DEG  * 0.5 * Math.PI / 180);
    const moonRadius = CEL_BODY_DIST * Math.tan(MOON_ANGULAR_SIZE_DEG * 0.5 * Math.PI / 180);

    // ── Sun disc ──────────────────────────────────────────────────────────────

    const sunDisc = BABYLON.MeshBuilder.CreateDisc(
        "sunDisc", { radius: sunRadius, tessellation: 48 }, scene
    );
    sunDisc.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    sunDisc.isPickable    = false;

    const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
    sunMat.emissiveColor  = new BABYLON.Color3(1.0, 0.92, 0.35);
    sunMat.disableLighting = true;
    sunMat.backFaceCulling = false;
    sunDisc.material = sunMat;

    // Glow halo around the sun
    const glow = new BABYLON.GlowLayer("sunGlow", scene);
    glow.intensity = 0.7;
    glow.addIncludedOnlyMesh(sunDisc);

    // ── Moon disc ─────────────────────────────────────────────────────────────

    const moonDisc = BABYLON.MeshBuilder.CreateDisc(
        "moonDisc", { radius: moonRadius, tessellation: 48 }, scene
    );
    moonDisc.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    moonDisc.isPickable    = false;
    moonDisc.isVisible     = false;

    const moonMat = new BABYLON.StandardMaterial("moonMat", scene);
    moonMat.emissiveColor  = new BABYLON.Color3(0.85, 0.87, 0.92);
    moonMat.disableLighting = true;
    moonMat.backFaceCulling = false;
    moonDisc.material = moonMat;

    // ── Moon position / phase cache (refreshed every minute) ─────────────────

    let _moonDir      = new BABYLON.Vector3(0, 1, 0);  // below horizon by default
    let _moonFraction = 0;

    function refreshMoonCache() {
        const now = new Date();
        const mp  = SunCalc.getMoonPosition(now, WEATHER_LAT, WEATHER_LON);
        _moonDir      = bodyLightDir(mp.azimuth, mp.altitude, WEATHER_MAP_NORTH_BEARING_DEG);
        _moonFraction = SunCalc.getMoonIllumination(now).fraction;
    }
    refreshMoonCache();
    setInterval(refreshMoonCache, 60_000);

    // ── Per-frame update ──────────────────────────────────────────────────────
    //
    // sunLight.direction.y == -sin(altitude):
    //   altitude > 0  →  direction.y < 0  (sun above horizon)
    //   altitude < 0  →  direction.y > 0  (sun below horizon)
    //
    // Show moon when:
    //   - moon is above horizon  (_moonDir.y < 0)
    //   - sun is low/gone        (sunLight.direction.y > -0.15, i.e. alt < ~8.6°)

    scene.onBeforeRenderObservable.add(() => {
        const sunAboveHorizon = sunLight.direction.y < 0;

        // ── Sun ───────────────────────────────────────────────────────────────
        if (sunAboveHorizon) {
            const toSun = sunLight.direction.scale(-1).normalize();
            sunDisc.position = camera.position.add(toSun.scale(CEL_BODY_DIST));
            sunDisc.isVisible = true;

            // Gradient: deep orange at horizon → bright yellow-white overhead
            // sin(alt) = -direction.y, range 0..1
            const sinAlt = Math.min(1, Math.max(0, -sunLight.direction.y));
            const warm   = Math.min(1, sinAlt * 8);  // reaches full warmth above ~7°
            sunMat.emissiveColor = new BABYLON.Color3(
                1.0,
                0.42 + 0.55 * warm,   // green channel: 0.42 (orange) → 0.97 (yellow-white)
                0.05 + 0.30 * warm    // blue  channel: 0.05 (deep orange) → 0.35
            );
        } else {
            sunDisc.isVisible = false;
        }

        // ── Moon ──────────────────────────────────────────────────────────────
        const moonAboveHorizon = _moonDir.y < 0;
        const sunIsLow         = sunLight.direction.y > -0.15;

        if (moonAboveHorizon && sunIsLow) {
            const toMoon = _moonDir.scale(-1).normalize();
            moonDisc.position = camera.position.add(toMoon.scale(CEL_BODY_DIST));
            moonDisc.isVisible = true;

            // Brightness scales with illuminated fraction (new moon = dim, full = bright)
            const b = 0.35 + 0.65 * _moonFraction;
            moonMat.emissiveColor = new BABYLON.Color3(b * 0.88, b * 0.90, b);
        } else {
            moonDisc.isVisible = false;
        }
    });
}

// ── START ─────────────────────────────────────────────────────────────────────

export function startWeatherSystem(scene, sun, ambient, skyMat, camera) {
    async function refresh() {
        await fetchWeather();
        applyWeatherToScene(scene, sun, ambient, skyMat);
    }

    refresh();
    setInterval(refresh, WEATHER_REFRESH_MS);
    setInterval(() => applyWeatherToScene(scene, sun, ambient, skyMat), 60_000);

    if (camera) initCelestialBodies(scene, sun, camera);
}

// ── WEATHER WIDGET ────────────────────────────────────────────────────────────

export class WeatherWidget {

    constructor(canvasId) {
        this.canvas   = document.getElementById(canvasId);
        this.ctx      = this.canvas.getContext('2d');
        this._visible = true;
        this._owmLogo = null;

        this._loadLogo();
        setInterval(() => this._draw(), 1000);

        window.addEventListener('keydown', e => {
            if (e.key === 'w' || e.key === 'W') {
                this._visible = !this._visible;
                this.canvas.style.display = this._visible ? 'block' : 'none';
            }
        });
    }

    _loadLogo() {
        this._owmLogo = new Image();
        this._owmLogo.src = 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png';
    }

    _draw() {
        if (!this._visible) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.roundRect(0, 0, W, H, 10);
        ctx.fill();

        const now = new Date();
        const timeStr = now.toLocaleTimeString('fr-FR', {
            timeZone: 'Europe/Paris',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const dateStr = now.toLocaleDateString('fr-FR', {
            timeZone: 'Europe/Paris',
            weekday: 'short', day: 'numeric', month: 'short'
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, W / 2, 28);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(dateStr, W / 2, 44);

        const d = weatherState;
        if (d && d.temp !== undefined) {
            if (d.iconUrl) {
                const img = new Image();
                img.src = d.iconUrl;
                img.onload = () => ctx.drawImage(img, W/2 - 20, 48, 40, 40);
                try { ctx.drawImage(img, W/2 - 20, 48, 40, 40); } catch(e) {}
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(d.temp)}°C`, W / 2, 104);

            ctx.font = '11px Arial';
            ctx.fillStyle = '#aaddff';
            ctx.fillText(d.description || '', W / 2, 118);
        } else {
            ctx.fillStyle = '#888888';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading weather…', W / 2, 75);
        }

        if (this._owmLogo && this._owmLogo.complete) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(this._owmLogo, W - 50, H - 16, 40, 10);
            ctx.globalAlpha = 1.0;
        }
    }
}
