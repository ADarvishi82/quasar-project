<template>
  <q-page padding class="q-pa-md">
    <div class="text-h4 q-mb-md text-primary">لیست کسب‌وکارها و سازمان‌ها</div>

    <div class="row q-mb-md q-gutter-sm">
      <q-input outlined v-model="searchTerm" label="جستجو در نام یا توضیحات..." dense class="col" @keyup.enter="fetchBusinesses" clearable>
        <template v-slot:append>
          <q-icon name="search" class="cursor-pointer" @click="fetchBusinesses" />
        </template>
      </q-input>
      <q-select
        outlined
        v-model="selectedCategory"
        :options="categoryOptionsForFilter"
        label="فیلتر بر اساس دسته‌بندی"
        emit-value
        map-options
        clearable
        dense
        class="col-md-4 col-sm-6 col-xs-12"
        @update:model-value="fetchBusinesses"
      />
    </div>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-dots color="primary" size="3em" />
      <div class="q-ml-sm text-grey-7">در حال بارگذاری اطلاعات...</div>
    </div>

    <div v-else-if="error" class="text-negative text-center q-my-xl">
      <q-icon name="error_outline" size="2em" class="q-mr-sm" />
      {{ errorMessage || 'خطا در دریافت اطلاعات کسب‌وکارها.' }}
    </div>

    <div v-else-if="businesses.length === 0" class="text-grey-7 text-center q-my-xl">
      <q-icon name="storefront" size="3em" class="q-mb-sm block" />
      در حال حاضر هیچ کسب‌وکار یا سازمانی برای نمایش وجود ندارد.
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="business in businesses"
        :key="business.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="my-card cursor-pointer" @click="goToBusinessDetail(business.id)">
          <!-- اگر لوگو دارید -->
          <q-img
            :src="business.logo || 'https://cdn.quasar.dev/img/material.png'"
            :ratio="16/9"
            style="min-height: 150px; max-height: 180px;"
          >
            <q-badge
              v-if="business.is_verified"
              color="green"
              floating
              class="q-ma-xs"
              title="تایید شده"
            >
              <q-icon name="check_circle" color="white" size="xs" />
            </q-badge>
            <q-badge
              v-if="business.account_type_display"
              color="blue-grey-7"
              style="bottom: 8px; left: 8px; opacity: 0.8"
              class="absolute-bottom-left q-ma-xs"
            >
              {{ business.account_type_display }}
            </q-badge>
          </q-img>

          <q-card-section>
            <div class="text-h6 ellipsis">{{ business.business_name }}</div>
            <div class="text-subtitle2 text-grey-7 ellipsis" v-if="business.category">
              <q-icon name="category" size="xs" class="q-mr-xs" />{{ business.category.name }}
            </div>
            <div class="text-caption text-grey ellipsis-2-lines q-mt-sm" v-if="business.description">
              {{ business.description }}
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div v-if="business.address_string" class="text-caption text-grey-8 ellipsis">
              <q-icon name="location_on" size="xs" class="q-mr-xs" />{{ business.address_string }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn flat color="primary" label="مشاهده جزئیات" :to="`/business/${business.id}`" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- (اختیاری) Pagination -->
    <!-- <div class="q-pa-lg flex flex-center" v-if="totalPages > 1">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        @update:model-value="fetchBusinesses"
        direction-links
      />
    </div> -->

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const businesses = ref([]);
const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const router = useRouter();
const $q = useQuasar();

// برای فیلترها (اختیاری)
// const searchTerm = ref('');
// const selectedCategory = ref(null);
// const categories = ref([]); // برای پر کردن q-select دسته‌بندی
// const categoryOptionsForFilter = computed(() => {
//   if (!categories.value) return [];
//   return [{ label: 'همه دسته‌بندی‌ها', value: null }, ...categories.value.map(cat => ({ label: cat.name, value: cat.id }))];
// });

// برای Pagination (اختیاری)
// const currentPage = ref(1);
// const totalPages = ref(1);
// const itemsPerPage = ref(12); // تعداد آیتم در هر صفحه

async function fetchBusinesses() {
  loading.value = true;
  error.value = false;
  errorMessage.value = '';
  try {
    // پارامترهای کوئری برای فیلتر و صفحه‌بندی (اختیاری)
    const params = {
      // page: currentPage.value,
      // page_size: itemsPerPage.value,
      // search: searchTerm.value || undefined, // اگر خالی است، نفرست
      // category: selectedCategory.value || undefined, // اگر null است، نفرست
      is_verified: true, // فقط تایید شده‌ها
    };

    // حذف پارامترهای undefined تا URL تمیزتر باشد
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    console.log("Fetching businesses with params:", params);
    const response = await api.get('/api/business-profiles/', { params });

    // ساختار پاسخ API شما ممکن است متفاوت باشد (مثلاً اگر از pagination استفاده می‌کنید)
    // اگر pagination دارید:
    // businesses.value = response.data.results;
    // totalPages.value = Math.ceil(response.data.count / itemsPerPage.value);
    // currentPage.value = response.data.current_page_number || currentPage.value; // اگر سرور صفحه فعلی را برمی‌گرداند

    // اگر pagination ندارید یا هنوز پیاده‌سازی نشده:
    businesses.value = response.data;
    if (!Array.isArray(response.data)) { // اگر سرور یک آبجکت با نتایج برمی‌گرداند
        if (response.data.results && Array.isArray(response.data.results)) {
            businesses.value = response.data.results;
        } else {
            console.warn("Business list API response is not an array or does not have a 'results' array:", response.data);
            businesses.value = []; // بازنشانی به آرایه خالی در صورت پاسخ نامعتبر
        }
    }


    console.log("Businesses fetched:", businesses.value);
    if (businesses.value.length === 0) {
        console.log("No verified businesses found.");
    }

  } catch (err) {
    console.error("Error fetching businesses:", err.response?.data || err.message);
    error.value = true;
    errorMessage.value = err.response?.data?.detail || 'خطا در دریافت اطلاعات از سرور.';
    $q.notify({ type: 'negative', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

// (اختیاری) برای واکشی لیست دسته‌بندی‌ها برای فیلتر
// async function fetchCategoriesForFilter() {
//   try {
//     const response = await api.get('/api/categories/');
//     categories.value = response.data;
//   } catch (error) {
//     console.error("Error fetching categories for filter:", error);
//   }
// }

function goToBusinessDetail(businessId) {
  router.push(`/business/${businessId}`); // یا هر مسیری که برای جزئیات تعریف می‌کنید
}

onMounted(() => {
  fetchBusinesses();
  // fetchCategoriesForFilter(); // اگر فیلتر دسته‌بندی دارید
});
</script>

<style lang="scss" scoped>
.my-card {
  width: 100%;
  max-width: 350px; /* یا هر اندازه‌ای که مناسب است */
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>