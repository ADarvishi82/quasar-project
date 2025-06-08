<!-- src/pages/UserProfilePage.vue -->
<!-- src/pages/UserProfilePage.vue -->
<template>
  <q-page padding class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="q-pa-sm">
          <q-card-section>
            <div class="text-h6 text-primary">
              {{ editingProfile ? 'ویرایش پروفایل کاربری' : 'ایجاد پروفایل کاربری' }}
            </div>
            <div class="text-caption text-grey">
              اطلاعات پروفایل شخصی خود را وارد یا ویرایش کنید.
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
              <q-input
                filled
                v-model="profileData.address_string"
                label="آدرس متنی (می‌توانید اینجا جستجو کنید یا از روی نقشه انتخاب کنید)"
                outlined
                autogrow
                type="textarea"
                @keyup.enter="geocodeAddress"
              >
                <template v-slot:append>
                  <q-btn round dense flat icon="search" @click="geocodeAddress" :loading="geocodingLoading" />
                </template>
              </q-input>

              <!-- بخش نقشه (مشابه BusinessProfilePage) -->
              <div class="q-my-md" style="height: 300px; border: 1px solid #ccc;">
                <GoogleMap
                  :api-key="googleMapsApiKey"
                  style="width: 100%; height: 100%"
                  :center="mapCenter"
                  :zoom="mapZoom"
                  @click="handleMapClick"
                  ref="userMapRef"
                >
                  <Marker
                    :options="{ position: markerPosition, draggable: true }"
                    @dragend="handleMarkerDragEnd"
                  />
                </GoogleMap>
              </div>

              <div class="row q-col-gutter-sm">
                <div class="col">
                  <q-input
                    filled
                    v-model.number="profileData.latitude"
                    label="عرض جغرافیایی"
                    type="number"
                    step="any"
                    readonly
                    outlined
                    dense
                  />
                </div>
                <div class="col">
                  <q-input
                    filled
                    v-model.number="profileData.longitude"
                    label="طول جغرافیایی"
                    type="number"
                    step="any"
                    readonly
                    outlined
                    dense
                  />
                </div>
              </div>

              <q-file
                filled
                v-model="profilePictureFile"
                label="عکس پروفایل (اختیاری)"
                accept=".jpg, .jpeg, .png"
                outlined
                clearable
                @update:model-value="handleProfilePictureUpload"
                hint="حداکثر حجم: ۲ مگابایت"
              >
                <template v-slot:prepend>
                  <q-icon name="photo_camera" />
                </template>
              </q-file>
              <div v-if="profilePicturePreviewUrl || (editingProfile && editingProfile.profile_picture_url)" class="q-mt-sm text-center">
                 <q-avatar size="150px">
                    <img :src="profilePicturePreviewUrl || editingProfile.profile_picture_url">
                 </q-avatar>
              </div>

              <div class="q-mt-lg">
                <q-btn
                  :label="editingProfile ? 'ذخیره تغییرات پروفایل' : 'ایجاد پروفایل'"
                  type="submit"
                  color="primary"
                  class="full-width q-py-sm"
                  :loading="formLoading"
                  unelevated
                  size="lg"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

// src/pages/UserProfilePage.vue -> <script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { api } from 'boot/axios';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { GoogleMap, Marker } from 'vue3-google-map'; // ایمپورت کامپوننت‌های نقشه

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const editingProfile = ref(null);
const formLoading = ref(false);
const geocodingLoading = ref(false); // برای لودینگ جستجوی آدرس

const profileData = ref({
  address_string: '',
  latitude: null,
  longitude: null,
  profile_picture: null,
});

const profilePictureFile = ref(null);
const profilePicturePreviewUrl = ref('');

// کلید API گوگل مپ - مطمئن شوید که این کلید با کلید فعال شما یکی است
// بهتر است این را از یک متغیر محیطی یا فایل config مرکزی بخوانید
const googleMapsApiKey = ref('AIzaSyDnWWhRvds75DoC8HIVwhq4rAlzZQkGGrI'); // <<<< کلید API خود را اینجا قرار دهید

// تنظیمات نقشه
const userMapRef = ref(null); // رفرنس به نقشه
const mapCenter = ref({ lat: 35.6892, lng: 51.3890 }); // مختصات پیش‌فرض (مثلاً تهران)
const mapZoom = ref(12);
const markerPosition = ref({ lat: 35.6892, lng: 51.3890 });

// توابع مربوط به نقشه (مشابه BusinessProfilePage)
function handleMapClick(event) {
  if (event.latLng) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    markerPosition.value = { lat, lng };
    profileData.value.latitude = parseFloat(lat.toFixed(7)); // محدود کردن تعداد اعشار
    profileData.value.longitude = parseFloat(lng.toFixed(7));
    reverseGeocode(lat, lng);
  }
}

function handleMarkerDragEnd(event) {
  if (event.latLng) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    markerPosition.value = { lat, lng };
    profileData.value.latitude = parseFloat(lat.toFixed(7));
    profileData.value.longitude = parseFloat(lng.toFixed(7));
    reverseGeocode(lat, lng);
  }
}

async function geocodeAddress() {
  if (!profileData.value.address_string) return;
  geocodingLoading.value = true;
  try {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: profileData.value.address_string, region: 'IR' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          mapCenter.value = { lat, lng };
          markerPosition.value = { lat, lng };
          profileData.value.latitude = parseFloat(lat.toFixed(7));
          profileData.value.longitude = parseFloat(lng.toFixed(7));
          profileData.value.address_string = results[0].formatted_address; // آپدیت آدرس با نتیجه دقیق‌تر
          mapZoom.value = 17;
          if (userMapRef.value?.map) {
             userMapRef.value.map.setCenter({ lat, lng });
             userMapRef.value.map.setZoom(17);
          }
        } else {
          $q.notify({ type: 'negative', message: `خطا در یافتن آدرس: ${status}` });
        }
        geocodingLoading.value = false;
      });
    } else {
      $q.notify({ type: 'warning', message: 'سرویس Geocoding در دسترس نیست.' });
      geocodingLoading.value = false;
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
    $q.notify({ type: 'negative', message: 'خطا در پردازش درخواست جستجوی آدرس' });
    geocodingLoading.value = false;
  }
}

async function reverseGeocode(lat, lng) {
  if (window.google && window.google.maps && window.google.maps.Geocoder) {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        profileData.value.address_string = results[0].formatted_address;
      } else {
        console.warn(`Reverse geocoding failed: ${status}`);
      }
    });
  }
}


function handleProfilePictureUpload(file) {
  // ... (کد قبلی بدون تغییر) ...
  profileData.value.profile_picture = file;
  if (file) {
    profilePicturePreviewUrl.value = URL.createObjectURL(file);
  } else {
    profilePicturePreviewUrl.value = '';
  }
}

async function fetchMyUserProfile() {
  // ... (کد قبلی، اما بخش مربوط به پر کردن latitude و longitude و تنظیم نقشه را اضافه کنید) ...
  if (!authStore.isAuthenticated || !authStore.user) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  formLoading.value = true;
  try {
    const response = await api.get('/api/user-profiles/me/');
    if (response.data && response.data.id) {
      editingProfile.value = response.data;
      profileData.value.address_string = response.data.address_string || '';
      profileData.value.latitude = response.data.latitude;
      profileData.value.longitude = response.data.longitude;
      profilePictureFile.value = null;
      profilePicturePreviewUrl.value = ''; // URL عکس از editingProfile.value.profile_picture_url در template گرفته می‌شود

      // تنظیم نقشه بر اساس داده‌های موجود
      if (response.data.latitude && response.data.longitude) {
        const lat = response.data.latitude;
        const lng = response.data.longitude;
        mapCenter.value = { lat, lng };
        markerPosition.value = { lat, lng };
        mapZoom.value = 16; // یا هر زوم مناسب دیگر
      } else {
        // اگر مختصات ندارد، سعی کن از Geolocation استفاده کنی یا به مرکز پیش‌فرض برگرد
        initializeMapToUserLocationOrDefault();
      }
    } else {
      editingProfile.value = null;
      initializeMapToUserLocationOrDefault();
    }
  } catch (error) {
    // ... (مدیریت خطای قبلی) ...
    if (error.response && error.response.status === 404) {
      editingProfile.value = null;
      console.log("No existing user profile found for this user.");
      initializeMapToUserLocationOrDefault();
    } else {
      console.error("Error fetching user profile:", error.response?.data || error);
      $q.notify({ type: 'negative', message: 'خطا در دریافت اطلاعات پروفایل کاربری' });
    }
  } finally {
    formLoading.value = false;
  }
}

function initializeMapToUserLocationOrDefault() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      mapCenter.value = { lat, lng };
      markerPosition.value = { lat, lng };
      profileData.value.latitude = parseFloat(lat.toFixed(7));
      profileData.value.longitude = parseFloat(lng.toFixed(7));
      mapZoom.value = 15;
      reverseGeocode(lat, lng);
    }, () => {
      console.warn("Geolocation failed or permission denied. Using default map center for UserProfile.");
      mapCenter.value = { lat: 35.6892, lng: 51.3890 }; // تهران
      markerPosition.value = { lat: 35.6892, lng: 51.3890 };
      mapZoom.value = 12;
    });
  } else {
    console.warn("Geolocation not supported. Using default map center for UserProfile.");
    mapCenter.value = { lat: 35.6892, lng: 51.3890 };
    markerPosition.value = { lat: 35.6892, lng: 51.3890 };
    mapZoom.value = 12;
  }
}

async function handleSubmit() {
  // ... (کد قبلی handleSubmit بدون تغییر عمده، فقط مطمئن شوید که latitude و longitude را از profileData می‌خواند) ...
  formLoading.value = true;
  const formData = new FormData();

  // فقط فیلدهایی که مقدار دارند یا فایل هستند را اضافه کن
  if (profileData.value.address_string) formData.append('address_string', profileData.value.address_string);
  if (profileData.value.latitude !== null) formData.append('latitude', profileData.value.latitude);
  if (profileData.value.longitude !== null) formData.append('longitude', profileData.value.longitude);
  if (profilePictureFile.value) { // profilePictureFile همان v-model برای q-file است
    formData.append('profile_picture', profilePictureFile.value);
  }
  // اگر فیلدهای دیگری دارید، آنها را هم به formData اضافه کنید

  try {
    let response;
    if (editingProfile.value && editingProfile.value.id) {
      response = await api.patch(`/api/user-profiles/${editingProfile.value.id}/`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      $q.notify({ type: 'positive', message: 'پروفایل کاربری با موفقیت ویرایش شد!' });
    } else {
      response = await api.post('/api/user-profiles/', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      $q.notify({ type: 'positive', message: 'پروفایل کاربری با موفقیت ایجاد شد!' });
    }
    console.log("Server response (UserProfile):", response.data);
    fetchMyUserProfile(); // رفرش کردن داده‌های فرم
  } catch (error) {
    // ... (مدیریت خطای قبلی) ...
    console.error("Error submitting user profile:", error.response?.data || error.message);
    let errorMsg = "خطا در ذخیره اطلاعات پروفایل.";
    if (error.response && error.response.data) {
        const errors = error.response.data;
        const messages = [];
        for (const field in errors) {
            if (Array.isArray(errors[field])) { messages.push(`${errors[field].join(', ')}`);
            } else { messages.push(`${errors[field]}`); }
        }
        if (messages.length > 0) errorMsg = messages.join('\n');
    }
    $q.notify({ type: 'negative', message: errorMsg, html:true, timeout: 7000 });
  } finally {
    formLoading.value = false;
  }
}

onMounted(() => {
  // ... (کد قبلی onMounted) ...
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
  } else {
    fetchMyUserProfile(); // این تابع در صورت نیاز، نقشه را هم مقداردهی اولیه می‌کند
  }
});

watch(() => authStore.isAuthenticated, (newAuthStatus) => {
  // ... (کد قبلی watch) ...
  if (!newAuthStatus) {
    router.push('/login');
  } else if (!editingProfile.value) {
    fetchMyUserProfile();
  }
});

</script>

<style scoped>
/* استایل‌های لازم */
</style>