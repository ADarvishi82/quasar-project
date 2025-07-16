<template>
  <q-page padding class="q-pa-md">
    <div class="text-h5 q-mb-md text-primary">آخرین پست‌ها (فید)</div>

    <!-- فرم ایجاد پست (فقط برای کاربران لاگین شده) -->
    <CreatePostForm v-if="authStore.isAuthenticated" @postCreated="handleNewPost" class="q-mb-xl" />

    <q-separator class="q-mb-lg" v-if="authStore.isAuthenticated" />

    <!-- وضعیت‌های لودینگ و خطا -->
    <div v-if="loadingPosts" class="row justify-center q-my-xl">
      <q-spinner-dots color="primary" size="3em" />
    </div>
    <div v-else-if="postsError" class="text-negative text-center q-my-xl">
      خطا در دریافت پست‌ها.
      <q-btn flat label="تلاش مجدد" @click="fetchPosts" icon="refresh" color="primary"/>
    </div>
    <div v-else-if="posts.length === 0" class="text-grey-7 text-center q-my-xl">
      هیچ پستی برای نمایش وجود ندارد. اولین نفر باشید که پست می‌گذارید!
    </div>

    <!-- لیست پست‌ها -->
    <div v-else class="q-gutter-y-md">
      <q-card v-for="post in posts" :key="post.id" flat bordered>
        <q-card-section>
          <div class="row items-center no-wrap">
            <router-link :to="getProfileLink(post.author)" class="row items-center no-wrap" style="text-decoration: none; color: inherit;">
              <q-avatar size="md" class="q-mr-sm">
                <img v-if="getAuthorAvatar(post.author)" :src="getAuthorAvatar(post.author)" alt="Avatar">
                <q-icon v-else name="account_circle" />
              </q-avatar>
              <div class="col">
                <div class="text-subtitle2">{{ post.author?.username || 'کاربر ناشناس' }}</div>
                <div class="text-caption text-grey">
                  {{ formatDateTime(post.created_at) }}
                  <span v-if="post.created_at !== post.updated_at" class="q-ml-xs">(ویرایش شده)</span>
                </div>
              </div>
            </router-link>
            <q-space />
            <q-btn flat round dense icon="more_vert" v-if="authStore.isAuthenticated && authStore.user?.id === post.author?.id">
              <q-menu auto-close>
                <q-list style="min-width: 100px">
                  <q-item clickable @click="editPost(post)">
                    <q-item-section>ویرایش</q-item-section>
                  </q-item>
                  <q-item clickable @click="confirmDeletePost(post.id)">
                    <q-item-section>حذف</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none" v-if="post.content">
          <p style="white-space: pre-line;">{{ post.content }}</p>
        </q-card-section>

        <!-- نمایش گالری عکس (اگر پستی عکس دارد) -->
        <q-carousel
          v-if="post.images && post.images.length > 0"
          v-model="post.slide"
          animated
          arrows
          navigation
          infinite
          :height="post.images.length > 1 ? '350px' : 'auto'"
          class="bg-grey-3"
        >
          <q-carousel-slide
            v-for="(img, index) in post.images"
            :key="img.id"
            :name="index"
            class="q-pa-none"
          >
            <q-img
              :src="img.image"
              class="full-height full-width cursor-pointer"
              fit="contain"
              @click="showImageGallery(post.images, index)"
            >
              <template v-slot:loading>
                <q-spinner-puff color="primary" />
              </template>
            </q-img>
          </q-carousel-slide>
        </q-carousel>

        <q-separator spaced />

        <q-card-actions align="around">
          <q-btn flat round :color="post.is_liked_by_user ? 'red' : 'grey-7'" :icon="post.is_liked_by_user ? 'favorite' : 'favorite_border'" @click="toggleLike(post)" :loading="post.is_liking">
            <span v-if="post.likes_count > 0" class="q-ml-xs text-caption">{{ post.likes_count }}</span>
            <q-tooltip>{{ post.is_liked_by_user ? 'پسندیدن را بردار' : 'بپسند' }}</q-tooltip>
          </q-btn>
          <q-btn flat round icon="chat_bubble_outline" label="نظر" />
          <q-btn flat round icon="share" label="اشتراک" />
        </q-card-actions>
      </q-card>
    </div>

    <!-- مودال برای نمایش گالری بزرگتر -->
    <q-dialog v-model="galleryDialog">
      <q-carousel
        v-model="currentGallerySlide"
        animated
        arrows
        navigation
        infinite
        class="bg-black"
        style="width: 90vw; max-width: 90vw; height: 90vh;"
        swipeable
      >
        <q-carousel-slide
          v-for="(img, index) in currentGalleryImages"
          :key="img.id"
          :name="index"
          class="q-pa-none"
        >
           <q-img :src="img.image" class="full-height" fit="contain" />
        </q-carousel-slide>
      </q-carousel>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';
import { useRouter } from 'vue-router';
import CreatePostForm from 'components/CreatePostForm.vue';
import { format, parseISO } from 'date-fns';

const posts = ref([]);
const loadingPosts = ref(true);
const postsError = ref(false);
const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();

// برای نمایش گالری در مودال
const galleryDialog = ref(false);
const currentGalleryImages = ref([]);
const currentGallerySlide = ref(0);

async function fetchPosts() {
  loadingPosts.value = true;
  postsError.value = false;
  try {
    const response = await api.get('/api/posts/');
    let fetchedPosts = [];
    if (response.data && Array.isArray(response.data.results)) {
      fetchedPosts = response.data.results;
    } else if (Array.isArray(response.data)) {
      fetchedPosts = response.data;
    }
    posts.value = fetchedPosts.map(post => ({ ...post, is_liking: false, slide: 0 }));
  } catch (error) {
    console.error("Error fetching posts:", error);
    postsError.value = true;
    $q.notify({ type: 'negative', message: 'خطا در دریافت پست‌ها.' });
  } finally {
    loadingPosts.value = false;
  }
}

function showImageGallery(images, startIndex) {
  currentGalleryImages.value = images;
  currentGallerySlide.value = startIndex;
  galleryDialog.value = true;
}

// ... (تمام توابع دیگر: toggleLike, handleNewPost, formatDateTime, getProfileLink, getAuthorAvatar, editPost, confirmDeletePost)
// این توابع از راهنمایی‌های قبلی کپی می‌شوند و بدون تغییر هستند

function toggleLike(post) {
  if (!authStore.isAuthenticated) {
    $q.notify({ type: 'info', message: 'برای پسندیدن پست‌ها باید ابتدا وارد شوید.', actions: [{ label: 'ورود', color: 'white', handler: () => { router.push('/login') } }] });
    return;
  }
  post.is_liking = true;
  api.post(`/api/posts/${post.id}/like/`).then(() => {
    post.is_liked_by_user = !post.is_liked_by_user;
    post.is_liked_by_user ? post.likes_count++ : post.likes_count--;
  }).catch(error => {
    console.error("Error toggling like:", error.response?.data || error.message);
    $q.notify({ type: 'negative', message: 'خطا در عملیات پسندیدن.' });
  }).finally(() => {
    post.is_liking = false;
  });
}

function handleNewPost(newPost) {
  posts.value.unshift({ ...newPost, is_liking: false, slide: 0 });
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  try { return format(parseISO(dateTimeString), 'yyyy/MM/dd HH:mm'); }
  catch (error) { console.error(`Could not format date: "${dateTimeString}"`, error); return dateTimeString; }
}

function getProfileLink(author) {
  if (!author) return '#';
  if (author.business_profile && author.business_profile.id) { return { name: 'business-detail', params: { id: author.business_profile.id } }; }
  else if (author.profile && author.profile.id) { return '#'; }
  return '#';
}

function getAuthorAvatar(author) {
  if (!author) return null;
  if (author.business_profile && author.business_profile.logo_url) { return author.business_profile.logo_url; }
  else if (author.profile && author.profile.profile_picture_url) { return author.profile.profile_picture_url; }
  return null;
}

function editPost(post) {
  $q.dialog({ title: 'ویرایش پست', message: 'محتوای جدید را وارد کنید:', prompt: { model: post.content, type: 'textarea' }, cancel: true, persistent: true })
    .onOk(async (data) => {
      if (!data || !data.trim()) { $q.notify({ type: 'warning', message: 'محتوا نمی‌تواند خالی باشد.' }); return; }
      try {
        const response = await api.patch(`/api/posts/${post.id}/`, { content: data });
        const index = posts.value.findIndex(p => p.id === post.id);
        if (index !== -1) { posts.value[index] = { ...posts.value[index], ...response.data }; }
        $q.notify({ type: 'positive', message: 'پست با موفقیت ویرایش شد.' });
      } catch (error) { console.error("Error editing post:", error); $q.notify({ type: 'negative', message: 'خطا در ویرایش پست.' }); }
    });
}

function confirmDeletePost(postId) {
  $q.dialog({ title: 'تأیید حذف', message: 'آیا از حذف این پست مطمئن هستید؟', cancel: { label: 'لغو', color: 'grey' }, ok: { label: 'حذف کن', color: 'negative' }, persistent: true })
    .onOk(async () => {
      try {
        await api.delete(`/api/posts/${postId}/`);
        posts.value = posts.value.filter(p => p.id !== postId);
        $q.notify({ type: 'positive', message: 'پست با موفقیت حذف شد.' });
      } catch (error) { console.error("Error deleting post:", error); $q.notify({ type: 'negative', message: 'خطا در حذف پست.' }); }
    });
}


onMounted(() => {
  fetchPosts();
});
</script>

<style scoped>
/* می‌توانید استایل‌های سفارشی خود را اینجا اضافه کنید */
</style>
