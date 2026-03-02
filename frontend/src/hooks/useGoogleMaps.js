// src/hooks/useGoogleMaps.js
// Loads the Google Maps JS SDK exactly once, shared across all components.

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || 'AIzaSyCjh2TyJjFbrnT3ExXMb3FbE7XPoF8Vfvg';

let _promise = null;

export function loadGoogleMaps() {
  if (_promise) return _promise;
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  _promise = new Promise((resolve, reject) => {
    // Avoid duplicate script tags (e.g. hot-reload)
    if (document.querySelector('script[data-gmap="1"]')) {
      const check = setInterval(() => {
        if (window.google?.maps) { clearInterval(check); resolve(window.google.maps); }
      }, 100);
      return;
    }
    const s = document.createElement('script');
    s.dataset.gmap = '1';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry&language=en`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = () => { _promise = null; reject(new Error('Google Maps failed to load')); };
    document.head.appendChild(s);
  });

  return _promise;
}

export default loadGoogleMaps;
