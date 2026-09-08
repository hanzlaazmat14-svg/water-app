/**
 * Resilient multi-tier geolocation detection & reverse geocoding utility.
 * Handles device GPS, WiFi location, and seamless IP-based fallback
 * for desktop environments without hardware GPS or when location services are restricted.
 */

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  city?: string;
  locality?: string;
  formattedAddress: string;
  source: 'gps' | 'network' | 'ip';
}

/**
 * Reverse geocodes coordinates into a readable address string using BigDataCloud API.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{
  formattedAddress: string;
  city?: string;
  locality?: string;
}> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (!res.ok) throw new Error('Geocoding response not ok');
    const data = await res.json();

    const parts = [
      data.locality || data.localityInfo?.administrative?.[3]?.name,
      data.city || data.principalSubdivision,
    ].filter(Boolean);

    const formattedAddress = parts.length > 0 ? parts.join(', ') : `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

    return {
      formattedAddress,
      city: data.city || data.principalSubdivision,
      locality: data.locality,
    };
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return {
      formattedAddress: `GPS Pin (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };
  }
}

/**
 * Fallback to IP-based geolocation when device GPS hardware is unavailable or disabled.
 */
export async function fetchIpLocation(): Promise<DetectedLocation> {
  const res = await fetch(
    'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en'
  );
  if (!res.ok) throw new Error('IP geolocation service unreachable');
  const data = await res.json();

  if (!data.latitude || !data.longitude) {
    throw new Error('No coordinates returned from IP geolocation');
  }

  const parts = [
    data.locality || data.localityInfo?.administrative?.[3]?.name,
    data.city || data.principalSubdivision,
  ].filter(Boolean);

  const formattedAddress = parts.length > 0 ? parts.join(', ') : `Location (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)})`;

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.city || data.principalSubdivision,
    locality: data.locality,
    formattedAddress,
    source: 'ip',
  };
}

/**
 * Robust multi-tier location detection:
 * 1. Device GPS (High Accuracy, 5s timeout)
 * 2. Device Network / WiFi (Low Accuracy, 6s timeout)
 * 3. IP-based Geolocation fallback (Fast & universal)
 */
export async function detectLocation(): Promise<DetectedLocation> {
  const hasBrowserGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  if (hasBrowserGeo) {
    try {
      // 1. Try high accuracy GPS (mobile devices with satellite/cell GPS)
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 30000,
        });
      });

      const { latitude, longitude } = pos.coords;
      const geoInfo = await reverseGeocode(latitude, longitude);

      return {
        latitude,
        longitude,
        city: geoInfo.city,
        locality: geoInfo.locality,
        formattedAddress: geoInfo.formattedAddress,
        source: 'gps',
      };
    } catch (highAccuracyErr) {
      console.warn('High-accuracy GPS attempt failed, trying low accuracy...', highAccuracyErr);

      // 2. Try standard browser geolocation (WiFi / ISP cell on laptops)
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000,
          });
        });

        const { latitude, longitude } = pos.coords;
        const geoInfo = await reverseGeocode(latitude, longitude);

        return {
          latitude,
          longitude,
          city: geoInfo.city,
          locality: geoInfo.locality,
          formattedAddress: geoInfo.formattedAddress,
          source: 'network',
        };
      } catch (lowAccuracyErr) {
        console.warn('Browser geolocation failed, falling back to IP geolocation...', lowAccuracyErr);
      }
    }
  }

  // 3. Fallback to IP-based Geolocation
  try {
    return await fetchIpLocation();
  } catch (ipErr: any) {
    console.error('All geolocation attempts failed:', ipErr);
    throw new Error('Unable to detect location. Please type your street address manually.');
  }
}
