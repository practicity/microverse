// map.js

import {
    GRID_SIZE,
    CELL_SIZE,
    COLLISIONS_ENABLED,
    GROUND_SUBDIVISIONS,
    GROUND_TEXTURE_PATH,
    GROUND_TEXTURE_SCALE,
    GROUND_METALLIC,
    GROUND_ROUGHNESS,
    GRID_MAJOR_UNIT_FREQUENCY,
    GRID_MINOR_UNIT_VISIBILITY,
    GRID_MAIN_COLOR,
    GRID_LINE_COLOR,
    GRID_OPACITY,
    GRID_VISIBLE_DEFAULT,
    GRID_Y_OFFSET
} from './config.js';

import { createObject } from "./object.js";

// Auto-discover every *.js file in public/objects/ — add a file there and it loads automatically
const _objectModules = import.meta.glob("../public/objects/*.json", { eager: true });
const OBJECT_DEFINITIONS = Object.values(_objectModules).flatMap(mod => mod.default ?? mod);



// ── MAP CLASS ─────────────────────────────────────────────────────────────────

export const MAP_WORLD = GRID_SIZE * CELL_SIZE;
export class CityMap {
    /**
     * @param {BABYLON.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.grid  = Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(null));
    }

    build(onProgress) {
        this._buildWorldGrid();
        this._buildGround(onProgress);
        this._buildBoundaryWalls();
        this._buildObjects(onProgress);
    }

    // ── World Grid ────────────────────────────────────────────────────────────

    _buildWorldGrid() {
        this.gridMesh = BABYLON.MeshBuilder.CreateGround("grid", {
            width:  MAP_WORLD,
            height: MAP_WORLD
        }, this.scene);

        this.gridMesh.position.set(0, GRID_Y_OFFSET, 0);

        const gridMaterial = new BABYLON.GridMaterial("gridMaterial", this.scene);
        gridMaterial.majorUnitFrequency  = GRID_MAJOR_UNIT_FREQUENCY;
        gridMaterial.minorUnitVisibility = GRID_MINOR_UNIT_VISIBILITY;
        gridMaterial.gridRatio           = CELL_SIZE;
        gridMaterial.backFaceCulling     = false;
        gridMaterial.mainColor           = GRID_MAIN_COLOR;
        gridMaterial.lineColor           = GRID_LINE_COLOR;
        gridMaterial.opacity             = GRID_OPACITY;

        this.gridMesh.material  = gridMaterial;
        this.gridMesh.isVisible = GRID_VISIBLE_DEFAULT;
    }

    toggleGrid() {
        if (this.gridMesh) {
            this.gridMesh.isVisible = !this.gridMesh.isVisible;
        }
    }

    // ── Ground Plane ──────────────────────────────────────────────────────────

    _buildGround(onProgress) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width:        MAP_WORLD,
            height:       MAP_WORLD,
            subdivisions: GROUND_SUBDIVISIONS
        }, this.scene);

        ground.position.set(0, 0, 0);
        ground.checkCollisions = COLLISIONS_ENABLED;
        ground.isPickable      = false;

        const gm = new BABYLON.PBRMaterial("groundMat", this.scene);

        const diffuseTex  = new BABYLON.Texture(GROUND_TEXTURE_PATH, this.scene);
        diffuseTex.uScale = MAP_WORLD / GROUND_TEXTURE_SCALE;
        diffuseTex.vScale = MAP_WORLD / GROUND_TEXTURE_SCALE;
        diffuseTex.onLoadObservable.addOnce(() => { if (onProgress) onProgress(); });
        gm.albedoTexture  = diffuseTex;

        gm.metallic  = GROUND_METALLIC;
        gm.roughness = GROUND_ROUGHNESS;

        ground.material = gm;
    }

    // ── Boundary Walls ────────────────────────────────────────────────────────

    _buildBoundaryWalls() {
        const half  = MAP_WORLD / 2;
        const wallH = 30;
        const wallT = 1;

        const walls = [
            { pos: [0,          wallH / 2,  half],       size: [MAP_WORLD + wallT, wallH, wallT] },
            { pos: [0,          wallH / 2, -half],       size: [MAP_WORLD + wallT, wallH, wallT] },
            { pos: [ half,      wallH / 2,  0],          size: [wallT, wallH, MAP_WORLD + wallT] },
            { pos: [-half,      wallH / 2,  0],          size: [wallT, wallH, MAP_WORLD + wallT] },
        ];

        walls.forEach(({ pos, size }, i) => {
            const w = BABYLON.MeshBuilder.CreateBox(`boundary_${i}`, {
                width: size[0], height: size[1], depth: size[2]
            }, this.scene);
            w.position.set(...pos);
            w.checkCollisions = COLLISIONS_ENABLED;
            w.isVisible       = false;
            w.isPickable      = false;
        });
    }

    // ── Objects ───────────────────────────────────────────────────────────────

    // Total items to track: one per definition + one for the ground texture
    static get loadTotal() {
        return OBJECT_DEFINITIONS.length + 1;
    }

    _buildObjects(onProgress) {
        OBJECT_DEFINITIONS.forEach(def => {
            this._markGrid(def.mapX, def.mapY, 1, 1, "object");
            createObject(def, this.scene, COLLISIONS_ENABLED, () => { if (onProgress) onProgress(); });
        });
    }

    // ── Grid Helper ───────────────────────────────────────────────────────────

    _markGrid(x, y, w, h, type) {
        x = Math.floor(x);
        y = Math.floor(y);
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const gx = x + dx;
                const gy = y + dy;
                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                    this.grid[gy][gx] = type;
                }
            }
        }
    }

    getCell(mapX, mapY) {
        mapX = Math.floor(mapX);
        mapY = Math.floor(mapY);
        if (mapX < 0 || mapX >= GRID_SIZE || mapY < 0 || mapY >= GRID_SIZE) return null;
        return this.grid[mapY][mapX];
    }
}
