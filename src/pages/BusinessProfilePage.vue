<!-- src/pages/BusinessProfilePage.vue -->
<template>
  <q-page padding class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="q-pa-sm">
          <q-card-section>
            <!-- ... (بخش عنوان فرم بدون تغییر) ... -->
             <div class="text-h6 text-primary">
              {{ editingProfile ? 'ویرایش پروفایل کسب‌وکار/سازمان' : 'ایجاد پروفایل کسب‌وکار/سازمان' }}
            </div>
            <div class="text-caption text-grey">
              اطلاعات کسب‌وکار یا سازمان خود را وارد یا ویرایش کنید.
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
              <!-- ... (فیلدهای قبلی: account_type, business_name, category, tags, description بدون تغییر) ... -->
              <q-select
                filled
                v-model="profileData.account_type"
                :options="accountTypeOptions"
                label="نوع حساب"
                emit-value
                map-options
                lazy-rules
                :rules="[val => !!val || 'لطفا نوع حساب را انتخاب کنید']"
                outlined
              />

              <q-input
                filled
                v-model="profileData.business_name"
                label="نام کسب‌وکار/سازمان"
                lazy-rules
                :rules="[val => !!val || 'لطفا نام را وارد کنید']"
                outlined
              />

              <q-select
                filled
                v-model="profileData.category_id"
                :options="categoryOptions"
                label="دسته‌بندی"
                emit-value
                map-options
                option-value="id"
                option-label="name"
                use-input
                hide-selected
                fill-input
                @filter="filterCategoryFn"
                :loading="categoriesLoading"
                lazy-rules
                :rules="[val => !!val || 'لطفا دسته‌بندی را انتخاب کنید']"
                outlined
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      نتیجه‌ای یافت نشد
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-select
                filled
                v-model="profileData.tag_ids"
                :options="tagOptions"
                label="تگ‌ها (چندین انتخاب مجاز است)"
                multiple
                emit-value
                map-options
                option-value="id"
                option-label="name"
                use-chips
                use-input
                hide-selected
                fill-input
                @filter="filterTagFn"
                :loading="tagsLoading"
                outlined
              />

              <q-input
                filled
                v-model="profileData.description"
                label="توضیحات"
                type="textarea"
                autogrow
                outlined
              />

              <q-input
                filled
                v-model="profileData.address_string"
                label="آدرس متنی (می‌توانید اینجا جستجو کنید یا از روی نقشه انتخاب کنید)"
                lazy-rules
                :rules="[val => !!val || 'لطفا آدرس را وارد کنید']"
                outlined
                @keyup.enter="geocodeAddress"
              >
                <template v-slot:append>
                  <q-btn round dense flat icon="search" @click="geocodeAddress" :loading="geocodingLoading" />
                </template>
              </q-input>

              <!-- بخش نقشه -->
              <div class="q-my-md" style="height: 400px; border: 1px solid #ccc;">
                <GoogleMap
                  :api-key="googleMapsApiKey"
                  style="width: 100%; height: 100%"
                  :center="mapCenter"
                  :zoom="mapZoom"
                  @click="handleMapClick"
                  ref="mapRef"
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
                  />
                </div>
              </div>
              <!-- ... (فیلدهای phone_number, website, و دکمه‌های فرم بدون تغییر) ... -->
              <q-input
                filled
                v-model="profileData.phone_number"
                label="شماره تلفن"
                outlined
                mask="###########"
              />

              <q-input
                filled
                v-model="profileData.website"
                label="وب‌سایت (مثال: https://example.com)"
                type="url"
                outlined
              />

              <div class="q-mt-lg">
                <q-btn
                  :label="editingProfile ? 'ذخیره تغییرات' : 'ایجاد پروفایل'"
                  type="submit"
                  color="primary"
                  class="full-width q-py-sm"
                  :loading="formLoading"
                  unelevated
                  size="lg"
                />
                <q-btn
                  label="پاک کردن فرم"
                  color="negative"
                  class="full-width q-mt-sm q-py-sm"
                  @click="resetForm"
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

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { api } from 'boot/axios';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
// ایمپورت کامپوننت‌های GoogleMap و Marker
// اگر پلاگین به درستی ثبت شده باشد و کامپوننت‌ها سراسری باشند، این import ها ممکن است لازم نباشند،
// اما برای وضوح و جلوگیری از خطاهای احتمالی، بهتر است آنها را اضافه کنیم.
import { GoogleMap, Marker } from 'vue3-google-map';

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

// ... (متغیرهای editingProfile, formLoading, profileData, accountTypeOptions بدون تغییر) ...
const editingProfile = ref(null);
const formLoading = ref(false);
const geocodingLoading = ref(false); // برای نمایش لودینگ هنگام جستجوی آدرس

const profileData = ref({
  account_type: 'BUSINESS',
  business_name: '',
  category_id: null,
  tag_ids: [],
  description: '',
  address_string: '',
  latitude: null,
  longitude: null,
  phone_number: '',
  website: '',
});
const accountTypeOptions = [
  { label: 'کسب‌وکار عادی', value: 'BUSINESS' },
  { label: 'سازمان/اداره', value: 'ORGANIZATION' },
];


// ... (کدهای مربوط به categories و tags و توابع filter آنها بدون تغییر) ...
const categories = ref([]);
const categoryOptions = ref([]);
const categoriesLoading = ref(false);
const tags = ref([]);
const tagOptions = ref([]);
const tagsLoading = ref(false);

// کلید API گوگل مپ (باید با کلیدی که در فایل boot استفاده کردید یکی باشد یا از یک متغیر محیطی خوانده شود)
const googleMapsApiKey = 'AIzaSyDnWWhRvds75DoC8HIVwhq4rAlzZQkGGrI'; // <<<< API KEY خودتان را اینجا هم وارد کنید
                                                                    // بهتر است این را در یک فایل .env قرار دهید و از آنجا بخوانید

// تنظیمات نقشه
const mapRef = ref(null); // رفرنس به خود نقشه برای دسترسی به متدهای آن (مثل setCenter)
const mapCenter = ref({ lat: 35.6892, lng: 51.3890 }); // مختصات پیش‌فرض (مثلاً تهران)
const mapZoom = ref(12); // زوم پیش‌فرض نقشه
const markerPosition = ref({ lat: 35.6892, lng: 51.3890 }); // موقعیت اولیه مارکر

// توابع مربوط به نقشه
function handleMapClick(event) {
  if (event.latLng) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    markerPosition.value = { lat, lng };
    profileData.value.latitude = lat;
    profileData.value.longitude = lng;
    // (اختیاری) می‌توانید آدرس متنی را هم بر اساس مختصات جدید آپدیت کنید (reverse geocoding)
    reverseGeocode(lat, lng);
  }
}

function handleMarkerDragEnd(event) {
  if (event.latLng) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    markerPosition.value = { lat, lng }; // موقعیت مارکر را آپدیت کن
    profileData.value.latitude = lat;
    profileData.value.longitude = lng;
    reverseGeocode(lat, lng);
  }
}

// تابع برای تبدیل آدرس متنی به مختصات
async function geocodeAddress() {
  if (!profileData.value.address_string) return;
  geocodingLoading.value = true;
  try {
    // استفاده از Google Geocoding API
    // این نیاز دارد که Geocoding API در Google Cloud Console فعال باشد
    // و API Key شما به آن دسترسی داشته باشد.
    // vue3-google-map مستقیماً ابزاری برای geocoding ندارد، باید خودتان API را فراخوانی کنید
    // یا از سرویس Geocoder خود Google Maps JavaScript API استفاده کنید.

    // روش ساده‌تر با استفاده از سرویس Geocoder خود Google Maps JavaScript API
    // که پس از بارگذاری نقشه در دسترس است:
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: profileData.value.address_string, region: 'IR' }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          mapCenter.value = { lat, lng };
          markerPosition.value = { lat, lng };
          profileData.value.latitude = lat;
          profileData.value.longitude = lng;
          mapZoom.value = 17; // زوم بیشتر پس از پیدا کردن آدرس
          if (mapRef.value?.map) { // اگر از رفرنس به کامپوننت نقشه استفاده می‌کنید
             mapRef.value.map.setCenter({ lat, lng }); // برای اطمینان از مرکزیت نقشه
             mapRef.value.map.setZoom(17);
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
  } catch {
    console.error("Error geocoding address");
    $q.notify({ type: 'negative', message: 'خطا در پردازش درخواست جستجوی آدرس' });
    geocodingLoading.value = false;
  }
}

// تابع برای تبدیل مختصات به آدرس متنی (اختیاری)
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


// ... (توابع fetchCategories, filterCategoryFn, fetchTags, filterTagFn بدون تغییر) ...
async function fetchCategories() {
  categoriesLoading.value = true;
  try {
    const response = await api.get('/api/categories/');
    categories.value = response.data;
    categoryOptions.value = response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    $q.notify({ type: 'negative', message: 'خطا در دریافت دسته‌بندی‌ها' });
  } finally {
    categoriesLoading.value = false;
  }
}

function filterCategoryFn(val, update) {
  if (val === '') {
    update(() => {
      categoryOptions.value = categories.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    categoryOptions.value = categories.value.filter(
      category => category.name.toLowerCase().indexOf(needle) > -1
    );
  });
}

async function fetchTags() {
  tagsLoading.value = true;
  try {
    const response = await api.get('/api/tags/');
    tags.value = response.data;
    tagOptions.value = response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    $q.notify({ type: 'negative', message: 'خطا در دریافت تگ‌ها' });
  } finally {
    tagsLoading.value = false;
  }
}

function filterTagFn(val, update) {
  if (val === '') {
    update(() => {
      tagOptions.value = tags.value;
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    tagOptions.value = tags.value.filter(
      tag => tag.name.toLowerCase().indexOf(needle) > -1
    );
  });
}

async function fetchMyBusinessProfile() {
  // ... (کد قبلی، اما بخش مربوط به پر کردن latitude و longitude را هم اضافه کنید)
  if (!authStore.isAuthenticated || !authStore.user) {
    router.push('/login');
    return;
  }
  formLoading.value = true;
  try {
    const response = await api.get('/api/business-profiles/my-business/');
    if (response.data && response.data.id) {
      editingProfile.value = response.data;
      profileData.value.account_type = response.data.account_type;
      profileData.value.business_name = response.data.business_name;
      profileData.value.category_id = response.data.category?.id || null;
      profileData.value.tag_ids = response.data.tags?.map(tag => tag.id) || [];
      profileData.value.description = response.data.description;
      profileData.value.address_string = response.data.address_string;
      profileData.value.latitude = response.data.latitude;
      profileData.value.longitude = response.data.longitude;
      profileData.value.phone_number = response.data.phone_number;
      profileData.value.website = response.data.website;

      // اگر مختصات وجود دارد، نقشه و مارکر را روی آن تنظیم کن
      if (response.data.latitude && response.data.longitude) {
        const lat = response.data.latitude;
        const lng = response.data.longitude;
        mapCenter.value = { lat, lng };
        markerPosition.value = { lat, lng };
        mapZoom.value = 17; // زوم بیشتر اگر مکان مشخص است
      }

    } else {
      editingProfile.value = null;
       // اگر پروفایل جدید است، سعی کن مکان کاربر را با Geolocation API بگیری (اختیاری)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapCenter.value = { lat, lng };
          markerPosition.value = { lat, lng };
          profileData.value.latitude = lat;
          profileData.value.longitude = lng;
          mapZoom.value = 15;
          reverseGeocode(lat, lng); // آدرس را هم پیدا کن
        }, () => {
          console.warn("Geolocation failed or permission denied. Using default map center.");
        });
      }
    }
  } catch {
    console.error("Error geocoding address");
    $q.notify({ type: 'negative', message: 'خطا در پردازش درخواست جستجوی آدرس' });
    geocodingLoading.value = false;
  } finally {
    formLoading.value = false;
  }
}

// ... (تابع handleSubmit و resetForm بدون تغییر عمده، فقط مطمئن شوید lat/lng را ارسال می‌کنند) ...
async function handleSubmit() {
  formLoading.value = true;
  try {
    const data = { ...profileData.value };
    if (editingProfile.value) {
      await api.put(`/api/business-profiles/${editingProfile.value.id}/`, data);
      $q.notify({ type: 'positive', message: 'پروفایل با موفقیت بروزرسانی شد' });
    } else {
      await api.post('/api/business-profiles/', data);
      $q.notify({ type: 'positive', message: 'پروفایل با موفقیت ایجاد شد' });
    }
    router.push('/profile');
  } catch (error) {
    console.error('Error submitting profile:', error);
    $q.notify({ type: 'negative', message: 'خطا در ذخیره پروفایل' });
  } finally {
    formLoading.value = false;
  }
}

function resetForm() {
  profileData.value = {
    account_type: 'BUSINESS',
    business_name: '',
    category_id: null,
    tag_ids: [],
    description: '',
    address_string: '',
    latitude: null,
    longitude: null,
    phone_number: '',
    website: '',
  };
  mapCenter.value = { lat: 35.6892, lng: 51.3890 };
  markerPosition.value = { lat: 35.6892, lng: 51.3890 };
  mapZoom.value = 12;
}


onMounted(() => {
  // ... (بخش بررسی auth و fetchCategories و fetchTags بدون تغییر) ...
  if (!authStore.isAuthenticated) { /* ... */ }
  fetchCategories();
  fetchTags();
  fetchMyBusinessProfile(); // این تابع نقشه را هم بر اساس داده‌های موجود یا موقعیت کاربر مقداردهی می‌کند
});

// ... (بخش watch بدون تغییر) ...
watch(() => authStore.isAuthenticated, (newAuthStatus) => {
  if (!newAuthStatus) {
    router.push('/login');
  }
});

</script>

<style scoped>
/* استایل‌های لازم */
</style>