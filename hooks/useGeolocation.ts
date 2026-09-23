'use client';

import { useCallback, useRef, useState } from 'react';
import type { GeoData } from '@/lib/types';
import {
  checkLocationSupport,
  fetchIpGeolocation,
  getGeoWithAddress,
  requestLocation,
  watchLocation,
  type LocationError,
} from '@/lib/browser';

export function useGeolocation() {
  const [geo, setGeo] = useState<GeoData>({ position: null, address: null });
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const handleError = useCallback((error: LocationError) => {
    setLocationError(error);
    setLocationGranted(false);
    setLoading(false);
  }, []);

  const applyIpFallback = useCallback(async (current: GeoData): Promise<GeoData> => {
    if (current.position) return current;
    const ipData = await fetchIpGeolocation();
    if (!ipData?.position) return current;
    const enriched = await getGeoWithAddress(ipData.position);
    const resolved = { ...enriched, source: 'ip' as const };
    setGeo(resolved);
    return resolved;
  }, []);

  const beginWatch = useCallback(() => {
    if (watchIdRef.current !== null) return;

    watchIdRef.current = watchLocation(
      (data) => {
        setGeo({ ...data, source: 'gps' });
        setLocationGranted(true);
        setLocationError(null);
        setLoading(false);
      },
      handleError
    );
  }, [handleError]);

  const requestPermission = useCallback(async (): Promise<GeoData | null> => {
    setLoading(true);
    setLocationError(null);
    setLocationGranted(null);

    const supportError = checkLocationSupport();
    if (supportError) {
      const ipData = await applyIpFallback(geo);
      if (ipData.position) {
        setLocationError(supportError.code === 'insecure' ? supportError : null);
        setLocationGranted(false);
        setLoading(false);
        return ipData;
      }
      handleError(supportError);
      return null;
    }

    try {
      const pos = await requestLocation();
      const data = await getGeoWithAddress(pos);
      const resolved = { ...data, source: 'gps' as const };
      setGeo(resolved);
      setLocationGranted(true);
      setLocationError(null);
      beginWatch();
      return resolved;
    } catch (err) {
      const ipData = await applyIpFallback(geo);
      if (ipData.position) {
        setLocationError(err as LocationError);
        setLocationGranted(false);
        return ipData;
      }
      handleError(err as LocationError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [geo, handleError, beginWatch, applyIpFallback]);

  const ensureLocation = useCallback(async (): Promise<GeoData> => {
    const supportError = checkLocationSupport();
    if (supportError) {
      const ipData = await applyIpFallback(geo);
      if (ipData.position) return ipData;
      handleError(supportError);
      return geo;
    }

    if (!locationGranted || !geo.position || geo.source === 'ip') {
      const data = await requestPermission();
      if (data?.position && data.source !== 'ip') return data;
    }

    setLoading(true);
    try {
      const pos = await requestLocation();
      const data = await getGeoWithAddress(pos);
      const resolved = { ...data, source: 'gps' as const };
      setGeo(resolved);
      setLocationGranted(true);
      setLocationError(null);
      return resolved;
    } catch {
      return applyIpFallback(geo);
    } finally {
      setLoading(false);
    }
  }, [geo, locationGranted, requestPermission, handleError, applyIpFallback]);

  /** Geolocalização rápida na captura; fallback por IP se o browser falhar. */
  const ensureLocationForCapture = useCallback(async (): Promise<GeoData> => {
    const supportError = checkLocationSupport();

    if (supportError || locationGranted === false) {
      if (geo.position) return geo;
      return applyIpFallback(geo);
    }

    if (!locationGranted || !geo.position) {
      try {
        const pos = await requestLocation(3000);
        const data = await getGeoWithAddress(pos);
        const resolved = { ...data, source: 'gps' as const };
        setGeo(resolved);
        setLocationGranted(true);
        setLocationError(null);
        beginWatch();
        return resolved;
      } catch {
        return applyIpFallback(geo);
      }
    }

    if (geo.source === 'ip') return geo;

    try {
      const pos = await requestLocation(2000);
      const data = await getGeoWithAddress(pos);
      const resolved = { ...data, source: 'gps' as const };
      setGeo(resolved);
      return resolved;
    } catch {
      return geo.position ? geo : applyIpFallback(geo);
    }
  }, [geo, locationGranted, beginWatch, applyIpFallback]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    geo,
    locationGranted,
    locationError,
    locationLoading: loading,
    requestLocationPermission: requestPermission,
    ensureLocation,
    ensureLocationForCapture,
    retryLocation: requestPermission,
    stopWatching,
  };
}
