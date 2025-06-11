<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <q-card class="q-pa-md shadow-2" style="min-width: 400px; max-width: 500px;">
      <q-card-section class="text-center">
        <q-avatar size="100px" font-size="52px" color="primary" text-color="white" icon="person_outline" />
        <div class="text-grey-9 text-h5 text-weight-bold q-mt-md">ثبت نام کاربر عادی</div>
        <div class="text-grey-8">برای پیوستن به جامعه محلی ما ثبت نام کنید.</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md">
          <q-input
            filled
            v-model="formData.username"
            label="نام کاربری"
            lazy-rules
            :rules="[val => !!val || 'لطفا نام کاربری را وارد کنید']"
            outlined
            autocomplete="username"
          />

          <q-input
            filled
            v-model="formData.email"
            type="email"
            label="آدرس ایمیل"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا ایمیل را وارد کنید',
              val => /.+@.+\..+/.test(val) || 'ایمیل معتبر نیست'
            ]"
            outlined
            autocomplete="email"
          />

          <q-input
            filled
            type="password"
            v-model="formData.password"
            label="رمز عبور"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا رمز عبور را وارد کنید',
              val => val.length >= 8 || 'رمز عبور باید حداقل ۸ کاراکتر باشد'
            ]"
            outlined
            autocomplete="new-password"
          />

          <q-input
            filled
            type="password"
            v-model="formData.password2"
            label="تکرار رمز عبور"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا تکرار رمز عبور را وارد کنید',
              val => val === formData.password || 'رمزهای عبور مطابقت ندارند'
            ]"
            outlined
            autocomplete="new-password"
          />

          <div v-if="errorMessage" class="text-negative q-mb-sm text-caption" style="white-space: pre-line;">
            <q-icon name="warning" class="q-mr-xs" />{{ errorMessage }}
          </div>

          <q-btn
            label="ثبت نام کاربر عادی"
            type="submit"
            color="primary"
            class="full-width q-py-sm"
            :loading="loading"
            unelevated
            size="lg"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
          <router-link to="/register/business" class="text-secondary text-weight-bold" style="text-decoration: none">
            ثبت نام به عنوان کسب‌وکار یا سازمان
          </router-link>
        </div>
        <div class="text-grey-8 q-mt-sm">
          قبلاً ثبت نام کرده‌اید؟
          <router-link to="/login" class="text-primary text-weight-bold" style="text-decoration: none">
            وارد شوید
          </router-link>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const formData = ref({
  username: '',
  email: '',
  password: '',
  password2: '',
});
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

function showNotification(type, message) {
  if ($q && typeof $q.notify === 'function') {
    $q.notify({ type, message, position: 'top', html: type === 'negative', timeout: type === 'negative' ? 7000 : 3000 });
  } else {
    console.warn(`Quasar Notify is not available. Type: ${type}, Message: ${message}`);
    if (type === 'negative' || type === 'warning') {
        errorMessage.value = message;
    }
  }
}

async function handleRegister() {
  errorMessage.value = '';
  if (!formData.value.username || !formData.value.email || !formData.value.password || !formData.value.password2) {
    showNotification('warning', 'لطفا تمام فیلدها را پر کنید.');
    return;
  }
  if (formData.value.password !== formData.value.password2) {
    showNotification('warning', 'رمزهای عبور مطابقت ندارند.');
    return;
  }
  if (formData.value.password.length < 8) {
    showNotification('warning', 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
    return;
  }

  loading.value = true;

  const registrationPayload = {
    username: formData.value.username,
    email: formData.value.email,
    password1: formData.value.password, // ارسال به بک‌اند با نام password1
    password2: formData.value.password2,
    // is_business_registration: false, // (اختیاری) اگر می‌خواهید به بک‌اند اطلاع دهید
  };

  console.log("REGISTER_USER_PAGE: Sending registration data to store:", registrationPayload);

  // از همان اکشن register قبلی استفاده می‌کنیم
  // اگر می‌خواهید نوع را مشخص کنید، می‌توانید یک پارامتر دوم به اکشن register اضافه کنید
  // const result = await authStore.register(registrationPayload, 'user');
  const result = await authStore.register(registrationPayload); // فعلا بدون نوع
  loading.value = false;

  if (result.success) {
    console.log("REGISTER_USER_PAGE: Registration successful. Data:", result.data);
    showNotification('positive', 'ثبت نام با موفقیت انجام شد! لطفاً وارد شوید.');
    router.push('/login');
  } else {
    console.log("REGISTER_USER_PAGE: Registration failed. Message:", result.message);
    const msg = result.message || "خطای نامشخص در ثبت نام.";
    showNotification('negative', msg);
  }
}
</script>

<style scoped>
/* استایل‌های لازم */
</style>