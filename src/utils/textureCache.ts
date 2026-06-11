import * as THREE from "three";

const loader = new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();

export function loadTexture(url: string): THREE.Texture {
  let texture = textures.get(url);
  if (!texture) {
    texture = loader.load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.shared = true;
    textures.set(url, texture);
  }
  return texture;
}
