<template>
  <q-page padding class="q-pa-md">
    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-dots color="primary" size="3em" />
      <div class="q-ml-sm text-grey-7">در حال بارگذاری اطلاعات محله...</div>
    </div>

    <div v-else-if="error" class="text-negative text-center q-my-xl">
      <q-icon name="error_outline" size="2em" class="q-mr-sm" />
      {{ errorMessage || 'خطا در دریافت اطلاعات محله.' }}
      <div class="q-mt-md">
        <q-btn label="بازگشت به لیست محله‌ها" color="primary" to="/neighborhoods" unelevated icon="arrow_back" />
      </div>
    </div>

    <div v-else-if="!neighborhoodDetail" class="text-grey-7 text-center q-my-xl">
      <q-icon name="explore_off" size="3em" class="q-mb-sm block" />
      اطلاعاتی برای این محله یافت نشد.
      <div class="q-mt-md">
        <q-btn label="بازگشت به لیست محله‌ها" color="primary" to="/neighborhoods" unelevated icon="arrow_back" />
      </div>
    </div>

    <div v-else class="q-gutter-y-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h4 q-mb-sm text-primary">
            <q-icon name="location_city" class="q-mr-sm" />
            {{ neighborhoodDetail.name }}
          </div>
          <div class="text-subtitle1 text-grey-8">شهر: {{ neighborhoodDetail.city }}</div>
          <div v-if="neighborhoodDetail.center_latitude && neighborhoodDetail.center_longitude" class="text-caption text-grey-7">
            مرکز محله: ({{ neighborhoodDetail.center_latitude.toFixed(4) }}, {{ neighborhoodDetail.center_longitude.toFixed(4) }})
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-xs-12 col-sm-6 text-center">
            <q-avatar size="xl" color="green-2" text-color="green-8" icon="groups" />
            <div class="text-h6 q-mt-sm">{{ neighborhoodDetail.user_profile_count }}</div>
            <div class="text-caption text-grey-7">همسایه (کاربر ثبت شده)</div>
          </div>
          <div class="col-xs-12 col-sm-6 text-center">
            <q-avatar size="xl" color="orange-2" text-color="orange-8" icon="storefront" />
            <div class="text-h6 q-mt-sm">{{ neighborhoodDetail.business_profile_count }}</div>
            <div class="text-caption text-grey-7">کسب‌وکار و سازمان</div>
          </div>
        </q-card-section>
      </q-card>

      <!-- (اختیاری) نمایش لیست خلاصه کاربران در محله -->
      <q-card flat bordered v-if="neighborhoodDetail.user_profiles_in_neighborhood && neighborhoodDetail.user_profiles_in_neighborhood.length > 0">
        <q-card-section>
          <div class="text-h6">همسایه‌های این محله</div>
        </q-card-section>
        <q-list separator>
          <q-item v-for="profile in neighborhoodDetail.user_profiles_in_neighborhood" :key="`user-${profile.id}`">
            <q-item-section avatar>
              <q-avatar>
                <img :src="profile.profile_picture_url || 'https://cdn.quasar.dev/img/boy-avatar.png'">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ profile.username }}</q-item-label>
              <!-- می‌توانید لینک به پروفایل کاربر را اینجا قرار دهید اگر صفحه‌ای برای آن دارید -->
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- (اختیاری) نمایش لیست خلاصه کسب‌وکارها در محله -->
      <q-card flat bordered v-if="neighborhoodDetail.business_profiles_in_neighborhood && neighborhoodDetail.business_profiles_in_neighborhood.length > 0">
        <q-card-section>
          <div class="text-h6">کسب‌وکارهای این محله</div>
        </q-card-section>
        <q-list separator>
          <q-item
            v-for="business in neighborhoodDetail.business_profiles_in_neighborhood"
            :key="`biz-${business.id}`"
            clickable
            v-ripple
            :to="`/business/${business.id}`"
          >
            <q-item-section avatar v-if="business.logo_url">
              <q-avatar rounded>
                <img :src="business.logo_url">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ business.business_name }}</q-item-label>
              <q-item-label caption v-if="business.category_name">{{ business.category_name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_left" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <div class="q-mt-lg text-center">
        <q-btn label="بازگشت به لیست محله‌ها" color="primary" icon="arrow_back" to="/neighborhoods" unelevated />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const props = defineProps({
  id: { // این prop از طریق router (با props: true) پاس داده می‌شود
    type: [String, Number],
    required: true,
  },
});

const neighborhoodDetail = ref(null);
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const $q = useQuasar();

async function fetchNeighborhoodDetail(neighborhoodId) {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';
  try {
    console.log(`NEIGHBORHOOD_DETAIL_PAGE: Fetching details for neighborhood ID: ${neighborhoodId}`);
    // از NeighborhoodDetailSerializer استفاده می‌شود که باید تعداد و لیست پروفایل‌ها را هم برگرداند
    const response = await api.get(`/api/neighborhoods/${neighborhoodId}/`);
    neighborhoodDetail.value = response.data;
    console.log("NEIGHBORHOOD_DETAIL_PAGE: Neighborhood detail fetched:", neighborhoodDetail.value);
  } catch (err) {
    console.error("NEIGHBORHOOD_DETAIL_PAGE: Error fetching neighborhood detail:", err.response?.data || err.message);
    error.value = true;
    if (err.response && err.response.status === 404) {
        errorMessage.value = 'محله مورد نظر یافت نشد.';
    } else {
        errorMessage.value = err.response?.data?.detail || 'خطا در دریافت اطلاعات از سرور.';
    }
    if ($q && typeof $q.notify === 'function') {
      $q.notify({ type: 'negative', message: errorMessage.value, position: 'top' });
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.id) {
    fetchNeighborhoodDetail(props.id);
  } else {
    // اگر به هر دلیلی ID وجود نداشت، خطا نمایش بده یا به لیست برگردان
    error.value = true;
    errorMessage.value = "شناسه محله نامعتبر است.";
    loading.value = false;
  }
});

// اگر ID در URL تغییر کرد، دوباره داده‌ها را واکشی کن
watch(() => props.id, (newId) => {
  if (newId) {
    fetchNeighborhoodDetail(newId);
  }
});
</script>

<style scoped>
/* استایل‌های لازم */
</style>