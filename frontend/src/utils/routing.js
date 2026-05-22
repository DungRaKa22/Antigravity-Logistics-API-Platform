/**
 * OSRM Routing Utility
 * Gọi OSRM public API để lấy geometry đường đi thực tế (bám theo đường giao thông)
 * thay vì vẽ đường thẳng giữa 2 điểm.
 */

/**
 * Lấy hình dạng đường đi thực tế giữa 2+ điểm từ OSRM
 * @param {Array<[number, number]>} coordinates - Mảng tọa độ [[lat, lon], [lat, lon], ...]
 * @returns {Promise<Array<[number, number]>|null>} - Mảng tọa độ Leaflet [[lat, lon], ...] hoặc null nếu fail
 */
export async function fetchRouteGeometry(coordinates) {
  if (!coordinates || coordinates.length < 2) return null;

  // Lọc bỏ các tọa độ null/undefined
  const validCoords = coordinates.filter(
    (c) => c && c[0] !== undefined && c[0] !== null && c[1] !== undefined && c[1] !== null
  );
  if (validCoords.length < 2) return null;

  try {
    // OSRM yêu cầu format: lon,lat;lon,lat (ngược với Leaflet)
    const waypoints = validCoords.map((c) => `${c[1]},${c[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // GeoJSON coordinates are [lon, lat] — convert to Leaflet [lat, lon]
      const route = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
      return route;
    }
  } catch (e) {
    console.warn('[OSRM Routing] Failed to fetch route geometry, falling back to straight line:', e.message);
  }

  return null; // Fallback: trả null để component dùng đường thẳng
}
