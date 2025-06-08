<template>
  <q-page class="flex flex-center bg-grey-2 q-pa-md">
    <q-card class="q-pa-md shadow-2" style="min-width: 400px; max-width: 500px;">
      <q-card-section class="text-center">
        <q-avatar size="100px" font-size="52px" color="primary" text-color="white" icon="login" />
        <div class="text-grey-9 text-h5 text-weight-bold q-mt-md">ورود به حساب کاربری</div>
        <div class="text-grey-8">برای ادامه وارد شوید</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            filled
            v-model="loginIdentifier"
            label="نام کاربری یا ایمیل"
            lazy-rules
            :rules="[val => !!val || 'لطفا نام کاربری یا ایمیل را وارد کنید']"
            outlined
            autocomplete="username"
            name="username"
          />

          <q-input
            filled
            type="password"
            v-model="password"
            label="رمز عبور"
            lazy-rules
            :rules="[val => !!val || 'لطفا رمز عبور را وارد کنید']"
            outlined
            autocomplete="current-password"
            name="password"
          />

          <div v-if="errorMessage" class="text-negative q-mb-sm text-caption">
            <q-icon name="warning" class="q-mr-xs" />{{ errorMessage }}
          </div>

          <q-btn
            label="ورود"
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
          حساب کاربری ندارید؟
          <router-link to="/register" class="text-primary text-weight-bold" style="text-decoration: none">
            ثبت نام کنید
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
import { useQuasar } from 'quasar'; // برای استفاده از $q.notify

const loginIdentifier = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar(); // نمونه Quasar برای دسترسی به پلاگین‌ها

async function handleLogin() {
  errorMessage.value = '';
  if (!loginIdentifier.value || !password.value) {
    errorMessage.value = 'لطفا تمام فیلدها را پر کنید.';
    $q.notify({ type: 'warning', message: errorMessage.value, position: 'top' });
    return;
  }
  loading.value = true;

  const credentials = {
    username: loginIdentifier.value, // بک‌اند شما این فیلد را برای نام کاربری/ایمیل می‌پذیرد
    password: password.value
  };

  console.log("LOGIN_PAGE: Sending credentials to store:", credentials);

  const result = await authStore.login(credentials);
  loading.value = false;

  if (result.success) {
    console.log("LOGIN_PAGE: Login reported as successful by store. User:", result.user);
    $q.notify({ type: 'positive', message: 'ورود با موفقیت انجام شد!', position: 'top' });
    router.push('/'); // یا مسیر داشبورد
  } else {
    console.log("LOGIN_PAGE: Login reported as failed by store. Message:", result.message);
    errorMessage.value = result.message || "خطای نامشخص در ورود.";
    $q.notify({ type: 'negative', message: errorMessage.value, position: 'top' });
  }
}
</script>

<style scoped>
/* می‌توانید استایل‌های سفارشی خود را اینجا اضافه کنید */
</style>