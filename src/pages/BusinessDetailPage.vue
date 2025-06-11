<template>
  <q-page padding class="q-pa-md">
    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-dots color="primary" size="3em" />
      <div class="q-ml-sm text-grey-7">در حال بارگذاری اطلاعات کسب‌وکار...</div>
    </div>

    <div v-else-if="error" class="text-negative text-center q-my-xl">
      <q-icon name="error_outline" size="2em" class="q-mr-sm" />
      {{ errorMessage || 'خطا در دریافت اطلاعات کسب‌وکار.' }}
      <div class="q-mt-md">
        <q-btn label="بازگشت به لیست" color="primary" to="/businesses" unelevated />
      </div>
    </div>

    <div v-else-if="!businessDetail" class="text-grey-7 text-center q-my-xl">
      <q-icon name="storefront" size="3em" class="q-mb-sm block" />
      اطلاعاتی برای این کسب‌وکار یافت نشد.
      <div class="q-mt-md">
        <q-btn label="بازگشت به لیست" color="primary" to="/businesses" unelevated />
      </div>
    </div>

    <div v-else class="q-gutter-y-lg">
      <q-card flat bordered>
        <q-img
          v-if="businessDetail.logo"
          :src="businessDetail.logo"
          :ratio="16/9"
          style="max-height: 300px;"
        >
          <div class="absolute-bottom text-h6 bg-transparent text-shadow">
            {{ businessDetail.business_name }}
            <q-badge v-if="businessDetail.is_verified" color="green" class="q-ml-sm" title="تایید شده">
              <q-icon name="check_circle" color="white" size="xs" />
            </q-badge>
          </div>
        </q-img>
        <q-card-section v-else>
          <div class="text-h4 q-mb-sm">{{ businessDetail.business_name }}
            <q-badge v-if="businessDetail.is_verified" color="green" class="q-ml-sm" title="تایید شده">
              <q-icon name="check_circle" color="white" size="xs" />
            </q-badge>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-subtitle1 text-primary" v-if="businessDetail.category">
            <q-icon name="category" /> {{ businessDetail.category.name }}
          </div>
          <div class="text-caption text-grey-7 q-mt-xs" v-if="businessDetail.account_type_display">
            نوع: {{ businessDetail.account_type_display }}
          </div>

          <q-separator class="q-my-md" />

          <div class="text-body1 q-mb-md" style="white-space: pre-line;">
            {{ businessDetail.description || 'توضیحاتی برای این کسب‌وکار ارائه نشده است.' }}
          </div>

          <div v-if="businessDetail.tags && businessDetail.tags.length > 0" class="q-mb-md">
            <span class="text-weight-medium">تگ‌ها:</span>
            <q-chip
              v-for="tag in businessDetail.tags"
              :key="tag.id"
              color="blue-grey-1"
              text-color="blue-grey-9"
              size="sm"
              class="q-ml-xs"
            >
              {{ tag.name }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- بخش اطلاعات تماس و آدرس -->
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6">اطلاعات تماس و آدرس</div>
        </q-card-section>
        <q-list separator>
          <q-item v-if="businessDetail.address_string">
            <q-item-section avatar>
              <q-icon color="grey-7" name="location_on" />
            </q-item-section>
            <q-item-section>
              <q-item-label>آدرس</q-item-label>
              <q-item-label caption>{{ businessDetail.address_string }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="businessDetail.phone_number">
            <q-item-section avatar>
              <q-icon color="grey-7" name="phone" />
            </q-item-section>
            <q-item-section>
              <q-item-label>شماره تلفن</q-item-label>
              <q-item-label caption>
                <a :href="`tel:${businessDetail.phone_number}`" class="text-primary" style="text-decoration: none;">
                  {{ businessDetail.phone_number }}
                </a>
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="businessDetail.website">
            <q-item-section avatar>
              <q-icon color="grey-7" name="language" />
            </q-item-section>
            <q-item-section>
              <q-item-label>وب‌سایت</q-item-label>
              <q-item-label caption>
                <a :href="businessDetail.website" target="_blank" rel="noopener noreferrer" class="text-primary" style="text-decoration: none;">
                  {{ businessDetail.website }}
                </a>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- بخش نقشه (اگر مختصات وجود دارد و نقشه گوگل کار می‌کند) -->
      <q-card flat bordered v-if="businessDetail.latitude && businessDetail.longitude && googleMapsApiKey">
        <q-card-section>
          <div class="text-h6">موقعیت مکانی</div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <div style="height: 300px; width: 100%;">
            <GoogleMap
              :api-key="googleMapsApiKey"
              style="width: 100%; height: 100%"
              :center="{ lat: businessDetail.latitude, lng: businessDetail.longitude }"
              :zoom="16"
              :options="{
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
              }"
            >
              <Marker :options="{ position: { lat: businessDetail.latitude, lng: businessDetail.longitude } }" />
            </GoogleMap>
          </div>
        </q-card-section>
      </q-card>

      <div class="q-mt-lg text-center">
        <q-btn label="بازگشت به لیست کسب‌وکارها" color="primary" icon="arrow_back" to="/businesses" unelevated />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { GoogleMap, Marker } from 'vue3-google-map'; // اگر می‌خواهید نقشه نمایش دهید

const props = defineProps({
  id: { // این prop از طریق router (با props: true) پاس داده می‌شود
    type: [String, Number],
    required: true,
  },
});

const businessDetail = ref(null);
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const $q = useQuasar();

// کلید API گوگل مپ - مطمئن شوید که این کلید با کلید فعال شما یکی است
const googleMapsApiKey = ref('AIzaSyDnWWhRvds75DoC8HIVwhq4rAlzZQkGGrI'); // <<<< کلید API خود را اینجا قرار دهید

async function fetchBusinessDetail(businessId) {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';
  try {
    console.log(`Fetching details for business ID: ${businessId}`);
    const response = await api.get(`/api/business-profiles/${businessId}/`);
    businessDetail.value = response.data;
    console.log("Business detail fetched:", businessDetail.value);
  } catch (err) {
    console.error("Error fetching business detail:", err.response?.data || err.message);
    error.value = true;
    if (err.response && err.response.status === 404) {
        errorMessage.value = 'کسب‌وکار مورد نظر یافت نشد.';
    } else {
        errorMessage.value = err.response?.data?.detail || 'خطا در دریافت اطلاعات از سرور.';
    }
    $q.notify({ type: 'negative', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchBusinessDetail(props.id);
});

// اگر ID در URL تغییر کرد (مثلاً کاربر از یک صفحه جزئیات به دیگری رفت)، دوباره داده‌ها را واکشی کن
watch(() => props.id, (newId) => {
  if (newId) {
    fetchBusinessDetail(newId);
  }
});
</script>

<style lang="scss" scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
}
.bg-transparent {
    background-color: transparent !important; /* برای اطمینان از شفافیت */
}
</style>