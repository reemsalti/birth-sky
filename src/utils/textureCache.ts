import * as THREE from "three";
import { assetUrl } from "./assets";

const loader = new THREE.TextureLoader();
const textures = new Map<string, THREE.Texture>();

export function loadTexture(url: string): THREE.Texture {
  const resolved = assetUrl(url);
  let texture = textures.get(resolved);
  if (!texture) {
    texture = loader.load(resolved);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.shared = true;
    textures.set(resolved, texture);
  }
  return texture;
}
