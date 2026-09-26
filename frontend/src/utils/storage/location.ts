export interface Coordinates {
  latitude: number;
  longitude: number;
}

// సింగిల్ టైమ్ కరెంట్ లొకేషన్ పొందడానికి
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

// డ్రైవర్ కదులుతున్నప్పుడు రియల్ టైమ్ లొకేషన్ ట్రాక్ చేయడానికి
export const watchDriverLocation = (
  onUpdate: (coords: Coordinates) => void,
  onError: (err: any) => void
): (() => void) => {
  if (typeof window === "undefined" || !navigator.geolocation) {
    onError(new Error("Geolocation not supported"));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => onError(error),
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
};
