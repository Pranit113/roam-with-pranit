/**
 * Mappls SDK global singleton.
 * Call initMappls(cb) anywhere — only initialises once.
 */
import { mappls, mappls_plugin } from 'mappls-web-maps';

export const MAPPLS_KEY = 'lifbgrgdylewzefownzpslvqbdqdgtgdvtmk';

export const mapplsObj    = new mappls();
export const mapplsPlugin = new mappls_plugin();

let initialized  = false;
let pending      = [];      // callbacks waiting for init

export function initMappls(callback) {
  if (initialized) { callback(); return; }
  pending.push(callback);
  if (pending.length > 1) return;   // already kicked off

  const cfg = {
    map: true,
    layer: 'vector',
    version: '3.0',
    libraries: [],
    plugins: ['placeSearch'],
  };

  mapplsObj.initialize(MAPPLS_KEY, cfg, () => {
    initialized = true;
    pending.forEach(cb => cb());
    pending = [];
  });
}

/**
 * Search places using the Mappls plugin.
 * Returns a Promise<SuggestedLocation[]>.
 */
export function searchPlaces(keyword) {
  return new Promise(resolve => {
    initMappls(() => {
      try {
        mapplsPlugin.search({
          keyword,
          callback: data => {
            resolve(data?.suggestedLocations || []);
          },
        });
      } catch {
        resolve([]);
      }
    });
  });
}
