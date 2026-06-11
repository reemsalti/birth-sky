import * as THREE from "three";

/** Free GPU resources on a subtree. Skips geometries/textures marked shared. */
export function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      const geometry = child.geometry;
      if (geometry && !geometry.userData.shared) geometry.dispose();
      disposeMaterial(child.material);
    } else if (child instanceof THREE.Sprite) {
      disposeMaterial(child.material);
    } else if (child instanceof THREE.Points) {
      const geometry = child.geometry;
      if (geometry && !geometry.userData.shared) geometry.dispose();
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    for (const value of Object.values(mat)) {
      if (value instanceof THREE.Texture && !value.userData.shared) value.dispose();
    }
    mat.dispose();
  }
}
