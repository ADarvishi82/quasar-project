// src/boot/google-maps.js
import { boot } from 'quasar/wrappers';
// به جای default import، سعی کنید ببینید آیا named export وجود دارد
// این فقط یک حدس است، باید مستندات پکیج را بررسی کنید
import { VueGoogleMapsPlugin } from 'vue3-google-map'; // یا نام مشابهی مثل createGoogleMaps

const GOOGLE_MAPS_API_KEY = 'AIzaSyDnWWhRvds75DoC8HIVwhq4rAlzZQkGGrI';

export default boot(({ app }) => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith('YOUR_GOOGLE_MAPS_API_KEY')) {
    console.warn('Google Maps API Key is not properly configured...');
    return;
  }

  // اگر VueGoogleMapsPlugin یک تابع یا آبجکت پلاگین است
  if (typeof VueGoogleMapsPlugin === 'function' || typeof VueGoogleMapsPlugin === 'object') {
    app.use(VueGoogleMapsPlugin, { // <<<< اینجا از VueGoogleMapsPlugin استفاده کنید
      load: {
        key: GOOGLE_MAPS_API_KEY,
        libraries: "places,geocoding",
      },
    });
    console.log("Google Maps plugin (named import) registered with API Key.");
  } else {
    console.error("Failed to import VueGoogleMaps plugin correctly. Check the import statement.");
  }
});