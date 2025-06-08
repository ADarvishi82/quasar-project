// src/stores/auth-store.js
import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { LocalStorage } from 'quasar';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: LocalStorage.getItem('accessToken') || null,
    refreshToken: LocalStorage.getItem('refreshToken') || null,
    user: LocalStorage.getItem('user') ? JSON.parse(LocalStorage.getItem('user')) : null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    getUser: (state) => state.user,
    getAccessToken: (state) => state.accessToken,
  },

  actions: {
    async login(credentials) {
      // ... (کد قبلی login بدون تغییر) ...
      // در انتهای بخش try:
      // return { success: true, user: this.user };
      // در انتهای بخش catch:
      // return { success: false, message: errorMessage };
      console.log("AUTH_STORE: Attempting login with credentials:", credentials);
      try {
        const response = await api.post('/api/auth/login/', credentials);
        const accessToken = response.data.access;
        const refreshToken = response.data.refresh;
        const userData = response.data.user;

        if (!accessToken) {
          console.error('AUTH_STORE: Access token not found in login response:', response.data);
          this.logout();
          return { success: false, message: 'پاسخ سرور شامل توکن دسترسی نبود.' };
        }

        this.accessToken = accessToken;
        if (refreshToken) {
          this.refreshToken = refreshToken;
          LocalStorage.set('refreshToken', this.refreshToken);
        }
        this.user = userData;

        LocalStorage.set('accessToken', this.accessToken);
        LocalStorage.set('user', JSON.stringify(this.user));

        api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

        console.log("AUTH_STORE: Login successful. User:", this.user, "Access Token:", this.accessToken);
        return { success: true, user: this.user };

      } catch (error) {
        console.error('AUTH_STORE: Login error:', error.response?.data || error.message);
        let errorMessage = 'خطا در ورود. لطفاً دوباره تلاش کنید.';
        if (error.response && error.response.data) {
          if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.non_field_errors) {
            errorMessage = error.response.data.non_field_errors.join(' ');
          } else if (error.response.data.username) { // خطای مربوط به فیلد username
            errorMessage = `نام کاربری: ${error.response.data.username.join(' ')}`;
          } else if (error.response.data.email) { // خطای مربوط به فیلد email
             errorMessage = `ایمیل: ${error.response.data.email.join(' ')}`;
          } else if (error.response.data.password) { // خطای مربوط به فیلد password
             errorMessage = `رمز عبور: ${error.response.data.password.join(' ')}`;
          } else if (error.response.status === 401) {
            errorMessage = 'نام کاربری یا رمز عبور اشتباه است.';
          } else if (error.response.status === 400) {
            errorMessage = 'اطلاعات وارد شده معتبر نیست یا خطای دیگری رخ داده.';
          }
        }

        this.logout();
        return { success: false, message: errorMessage };
      }
    },

    // ***** اکشن جدید برای ثبت نام *****
    // src/stores/auth-store.js
// ... (state, getters, action login, action logout, action refreshTokenAction, action checkAuthOnLoad بدون تغییر) ...

    // ***** اکشن برای ثبت نام *****
    async register(registrationData) {
      console.log("AUTH_STORE: Attempting registration with data:", registrationData);
      try {
        // registrationData حالا باید شامل password1 و password2 باشد
        // که از RegisterPage.vue با این نام‌ها ارسال شده است.
        const response = await api.post('/api/auth/registration/', registrationData);

        console.log("AUTH_STORE: Registration successful. Response data:", response.data);
        return { success: true, data: response.data };

      } catch (error) {
        console.error('AUTH_STORE: Registration error:', error.response?.data || error.message);
        let errorMessage = 'خطا در ثبت نام. لطفاً دوباره تلاش کنید.';
        if (error.response && error.response.data) {
          const errors = error.response.data;
          const messages = [];
          // استخراج پیام‌های خطا از آبجکت خطا
          // dj-rest-auth ممکن است خطاها را به صورت { field1: ["error msg"], field2: ["error msg"] } برگرداند
          for (const field in errors) {
            if (Array.isArray(errors[field])) {
              messages.push(`${errors[field].join(', ')}`); // فقط پیام خطا، بدون نام فیلد برای سادگی
            } else {
              messages.push(`${errors[field]}`);
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join('\n'); // پیام‌ها را با خط جدید از هم جدا کن
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        }
        return { success: false, message: errorMessage };
      }
    },

    logout() {
      // ... (کد قبلی logout بدون تغییر) ...
      console.log("AUTH_STORE: Logging out...");
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;

      LocalStorage.remove('accessToken');
      LocalStorage.remove('refreshToken');
      LocalStorage.remove('user');

      delete api.defaults.headers.common['Authorization'];
    },

    async refreshTokenAction() {
      // ... (کد قبلی refreshTokenAction بدون تغییر) ...
      if (!this.refreshToken) {
        console.warn("AUTH_STORE: No refresh token available for refresh action.");
        this.logout();
        return false;
      }
      try {
        console.log("AUTH_STORE: Attempting to refresh token with:", this.refreshToken);
        const response = await api.post('/api/auth/token/refresh/', { refresh: this.refreshToken });
        this.accessToken = response.data.access;
        LocalStorage.set('accessToken', this.accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
        console.log("AUTH_STORE: Token refreshed successfully. New access token:", this.accessToken);
        return true;
      } catch (error) {
        console.error('AUTH_STORE: Token refresh error:', error.response?.data || error.message);
        this.logout();
        return false;
      }
    },

    checkAuthOnLoad() {
      // ... (کد قبلی checkAuthOnLoad بدون تغییر) ...
      if (this.accessToken) {
        console.log("AUTH_STORE: Auth check on load: Token found, setting Axios header.");
        api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      } else {
        console.log("AUTH_STORE: Auth check on load: No token found.");
      }
    }
  },
});