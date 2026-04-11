import { CELL_SIZE } from './config.js';

export function createObject(def, scene) {

    const positions = [];

    const xStart = def.mapXFrom ?? def.mapX;
    const xEnd   = def.mapXTo   ?? def.mapX;
    const yStart = def.mapYFrom ?? def.mapY;
    const yEnd   = def.mapYTo   ?? def.mapY;

    const xStep = def.stepX ?? 1;
    const yStep = def.stepY ?? 1;

    for (let x = xStart; x <= xEnd; x += xStep) {
        for (let y = yStart; y <= yEnd; y += yStep) {
            positions.push({ x, y });
        }
    }

    positions.forEach(({ x, y }) => {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "public/assets/",
            def.model,
            scene,
            (meshes) => {
                const root = new BABYLON.TransformNode(`${def.name}_${x}_${y}`, scene);
                meshes.forEach(m => {
                    m.parent = root;
                    m.isPickable = true;  // all meshes pickable for label ray
                    m.metadata = {
                        ...(m.metadata || {}),
                        locationid:  def.locationid ?? null,
                        objectName:  def.name ?? def.locationid ?? "",
                        interactive: def.interactive === true,
                        description: def.description ?? "",
                        urls:        def.urls ?? []
                    };
                });

                root.position.set(
                    x * CELL_SIZE + CELL_SIZE / 2,
                    def.mapZ ?? 0,
                    y * CELL_SIZE + CELL_SIZE / 2
                );

                root.rotation.x = def.rotationX ?? 0;
                root.rotation.y = def.rotationY ?? 0;
                root.rotation.z = def.rotationZ ?? 0;

                const s = def.scale ?? 1;
                root.scaling.set(s, s, s);
            }
        );
    });
}
