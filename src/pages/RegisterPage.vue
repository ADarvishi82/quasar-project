<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <q-card class="q-pa-md shadow-2" style="min-width: 400px; max-width: 500px;">
      <q-card-section class="text-center">
        <q-avatar size="100px" font-size="52px" color="secondary" text-color="white" icon="person_add" />
        <div class="text-grey-9 text-h5 text-weight-bold q-mt-md">ایجاد حساب کاربری جدید</div>
        <div class="text-grey-8">اطلاعات خود را وارد کنید</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md">
          <q-input
            filled
            v-model="username"
            label="نام کاربری"
            lazy-rules
            :rules="[val => !!val || 'لطفا نام کاربری را وارد کنید']"
            outlined
            autocomplete="username"
            name="username"
          />

          <q-input
            filled
            v-model="email"
            type="email"
            label="آدرس ایمیل"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا ایمیل را وارد کنید',
              val => /.+@.+\..+/.test(val) || 'ایمیل معتبر نیست'
            ]"
            outlined
            autocomplete="email"
            name="email"
          />

          <q-input
            filled
            type="password"
            v-model="password"
            label="رمز عبور"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا رمز عبور را وارد کنید',
              val => val.length >= 8 || 'رمز عبور باید حداقل ۸ کاراکتر باشد'
            ]"
            outlined
            autocomplete="new-password"
            name="password_first"
          />

          <q-input
            filled
            type="password"
            v-model="password2"
            label="تکرار رمز عبور"
            lazy-rules
            :rules="[
              val => !!val || 'لطفا تکرار رمز عبور را وارد کنید',
              val => val === password || 'رمزهای عبور مطابقت ندارند'
            ]"
            outlined
            autocomplete="new-password"
            name="password_confirmation"
          />

          <div v-if="errorMessage" class="text-negative q-mb-sm text-caption" style="white-space: pre-line;">
            <q-icon name="warning" class="q-mr-xs" />{{ errorMessage }}
          </div>

          <q-btn
            label="ثبت نام"
            type="submit"
            color="secondary"
            class="full-width q-py-sm"
            :loading="loading"
            unelevated
            size="lg"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-grey-8">
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

const username = ref('');
const email = ref('');
const password = ref(''); // مقدار از فیلد اول پسورد
const password2 = ref(''); // مقدار از فیلد دوم پسورد (تکرار)
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

// تابع کمکی برای نمایش Notify با بررسی وجود $q.notify
function showNotification(type, message) {
  if ($q && typeof $q.notify === 'function') {
    $q.notify({ type, message, position: 'top', html: type === 'negative', timeout: type === 'negative' ? 7000 : 3000 });
  } else {
    console.warn(`Quasar Notify is not available. Type: ${type}, Message: ${message}`);
    // اگر Notify در دسترس نیست، حداقل پیام خطا را در errorMessage بگذاریم
    if (type === 'negative' || type === 'warning') {
        errorMessage.value = message;
    }
  }
}

async function handleRegister() {
  errorMessage.value = ''; // پاک کردن پیام خطای قبلی

  if (!username.value || !email.value || !password.value || !password2.value) {
    const msg = 'لطفا تمام فیلدها را پر کنید.';
    showNotification('warning', msg);
    return;
  }
  if (password.value !== password2.value) {
    const msg = 'رمزهای عبور مطابقت ندارند.';
    showNotification('warning', msg);
    return;
  }
  if (password.value.length < 8) {
      const msg = 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
      showNotification('warning', msg);
      return;
  }

  loading.value = true;

  const registrationData = {
    username: username.value,
    email: email.value,
    password1: password.value,  // <<<< تغییر اصلی: ارسال مقدار فیلد اول پسورد با کلید password1
    password2: password2.value, // این معمولاً توسط dj_rest_auth برای تایید استفاده می‌شود
  };

  console.log("REGISTER_PAGE: Sending registration data to store:", registrationData);

  const result = await authStore.register(registrationData);
  loading.value = false;

  if (result.success) {
    console.log("REGISTER_PAGE: Registration reported as successful by store. Data:", result.data);
    showNotification('positive', 'ثبت نام با موفقیت انجام شد! لطفاً وارد شوید.');
    router.push('/login'); // هدایت به صفحه ورود
  } else {
    console.log("REGISTER_PAGE: Registration reported as failed by store. Message:", result.message);
    const msg = result.message || "خطای نامشخص در ثبت نام.";
    showNotification('negative', msg);
    // errorMessage.value در اینجا هم توسط showNotification تنظیم می‌شود اگر Notify در دسترس نباشد
  }
}
</script>

<style scoped>
/* می‌توانید استایل‌های سفارشی خود را اینجا اضافه کنید */
</style>