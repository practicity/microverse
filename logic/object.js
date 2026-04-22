function resolveAngle(val) {
    if (typeof val !== 'string') return val ?? 0;
    return new Function(`return ${val.replace(/Math\.PI/g, '3.141592653589793')}`)();
}

export function createObject(def, scene, collisionsEnabled, onLoaded) {

    const positions = [];

    const xStart = def.mapYFrom ?? def.mapY;
    const xEnd   = def.mapYTo   ?? def.mapY;
    const yStart = def.mapXFrom ?? def.mapX;
    const yEnd   = def.mapXTo   ?? def.mapX;

    const xStep = def.stepY ?? 1;
    const yStep = def.stepX ?? 1;

    for (let x = xStart; x <= xEnd; x += xStep) {
        for (let y = yStart; y <= yEnd; y += yStep) {
            positions.push({ x, y });
        }
    }

    let remaining = positions.length;

    const FALLBACK_MODEL = "infrastructures/constructionsite.glb";

    function loadMesh(model, x, y) {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/",
            model,
            scene,
            (meshes) => {
                const root = new BABYLON.TransformNode(`${def.name}_${x}_${y}`, scene);
                meshes.forEach(m => {
                    m.parent = root;
                    m.isPickable      = true;  // all meshes pickable for label ray
                    m.checkCollisions = collisionsEnabled;
                    m.metadata = {
                        ...(m.metadata || {}),
                        locationid:  def.locationid ?? null,
                        objectName:  def.name ?? def.locationid ?? "",
                        model:       def.model ?? "",
                        interactive: def.interactive === true,
                        description: def.description ?? "",
                        urls:        def.urls ?? []
                    };
                });

                // mapX/mapY/mapZ are direct world coords: X=right, Y=forward(→Z), Z=height(→Y)
                root.position.set(x, def.mapZ ?? 0, y);

                root.rotation.x = resolveAngle(def.rotationX);
                root.rotation.y = resolveAngle(def.rotationY);
                root.rotation.z = resolveAngle(def.rotationZ);

                const s = def.scale ?? 1;
                root.scaling.set(s, s, s);

                if (--remaining === 0 && onLoaded) onLoaded();
            },
            null,
            (_scene, message) => {
                if (model !== FALLBACK_MODEL) {
                    console.warn(`[object] Failed to load "${model}" — using fallback. ${message}`);
                    loadMesh(FALLBACK_MODEL, x, y);
                } else {
                    console.error(`[object] Fallback model "${FALLBACK_MODEL}" also failed. ${message}`);
                    if (--remaining === 0 && onLoaded) onLoaded();
                }
            }
        );
    }

    positions.forEach(({ x, y }) => loadMesh(def.model, x, y));
}
