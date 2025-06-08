// src/router/routes.js
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('pages/IndexPage.vue') },
      { path: 'login', name: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', name: 'register', component: () => import('pages/RegisterPage.vue') },
      {
        path: 'profile', // یا my-profile
        name: 'user-profile',
        component: () => import('pages/UserProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      // مسیر جدید برای فرم پروفایل کسب‌وکار
      {
        path: 'manage-business', // یا my-business-profile یا هر نامی که دوست دارید
        name: 'manage-business',
        component: () => import('pages/BusinessProfilePage.vue'),
        meta: { requiresAuth: true } // این مسیر نیاز به لاگین دارد
      }

    ]
  },
  // ... (مسیر catchAll)
]
export default routes