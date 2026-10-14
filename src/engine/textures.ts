import { BIOMES, type BiomeId } from './biomes';
import { floorTexture, wallBandTexture } from './paint';

/**
 * Sinh texture sàn + dải tường cho mọi biome (1 lần khi app khởi động) và gắn vào
 * CSS variables: --tex-<biome>, --wall-<biome>. Các class bg-floor-* / wall-band-* dùng chúng.
 */
export function installTextures() {
  const root = document.documentElement.style;
  (Object.keys(BIOMES) as BiomeId[]).forEach((id) => {
    root.setProperty(`--tex-${id}`, `url("${floorTexture(BIOMES[id])}")`);
    root.setProperty(`--wall-${id}`, `url("${wallBandTexture(BIOMES[id])}")`);
  });
}
