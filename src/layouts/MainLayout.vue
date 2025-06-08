<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          پلتفرم محلی من
        </q-toolbar-title>

        <q-space />

        <div v-if="authStore.isAuthenticated">
          <span class="q-mr-md gt-sm">
            خوش آمدید، {{ authStore.user?.username || 'کاربر' }}
          </span>
          <q-btn flat round dense icon="account_circle" to="/profile" class="q-mr-sm" v-if="authStore.user">
            <q-tooltip>پروفایل من</q-tooltip>
          </q-btn>
          <q-btn flat dense label="خروج" @click="handleLogout" icon-right="logout" />
        </div>
        <div v-else>
          <q-btn flat dense label="ورود" to="/login" class="q-mr-sm" icon="login" />
          <q-btn outline dense label="ثبت نام" to="/register" color="white" icon="person_add" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-list>
        <q-item-label
          header
          class="text-grey-8"
        >
          منوی اصلی
        </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />

        <q-separator class="q-my-md" />

        <q-item clickable v-if="!authStore.isAuthenticated" to="/login" exact>
          <q-item-section avatar>
            <q-icon name="login" />
          </q-item-section>
          <q-item-section>
            <q-item-label>ورود</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-if="!authStore.isAuthenticated" to="/register" exact>
          <q-item-section avatar>
            <q-icon name="person_add" />
          </q-item-section>
          <q-item-section>
            <q-item-label>ثبت نام</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-if="authStore.isAuthenticated" @click="handleLogout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>خروج</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- (اختیاری) فوتر -->
    <!-- <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center text-caption">
          © {{ new Date().getFullYear() }} پلتفرم محلی من
        </q-toolbar-title>
      </q-toolbar>
    </q-footer> -->

  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue'; // کامپوننت پیش‌فرض Quasar
import { useAuthStore } from 'stores/auth-store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const essentialLinks = [
  {
    title: 'صفحه اصلی',
    caption: '',
    icon: 'home',
    link: '/'
  },
  // مثال برای لینک پروفایل، فقط اگر کاربر لاگین کرده باشد
  // {
  //   title: 'پروفایل من',
  //   caption: '',
  //   icon: 'account_circle',
  //   link: '/profile',
  //   showIfAuthenticated: true // یک فیلد سفارشی برای نمایش شرطی
  // },
];

const leftDrawerOpen = ref(false);
const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function handleLogout() {
  console.log("MAIN_LAYOUT: Initiating logout...");
  await authStore.logout();
  $q.notify({ type: 'info', message: 'شما با موفقیت خارج شدید.', position: 'top' });
  router.push('/login');
}

// برای فیلتر کردن لینک‌ها بر اساس وضعیت احراز هویت (اگر essentialLinks شما نیاز دارد)
// import { computed } from 'vue';
// const filteredEssentialLinks = computed(() => {
//   return essentialLinks.filter(link => {
//     if (link.showIfAuthenticated === undefined) return true; // همیشه نمایش بده
//     return link.showIfAuthenticated ? authStore.isAuthenticated : !authStore.isAuthenticated;
//   });
// });
</script>