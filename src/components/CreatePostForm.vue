<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section>
      <div class="text-h6">ایجاد پست جدید</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-form @submit.prevent="submitPost" class="q-gutter-md">
        <q-input
          v-model="content"
          label="چه چیزی در ذهن دارید؟"
          type="textarea"
          filled
          autogrow
        />

        <!-- بخش آپلود چندین عکس -->
        <q-file
          v-model="imageFiles"
          label="عکس‌ها را ضمیمه کنید (اختیاری)"
          filled
          clearable
          multiple
          append
          accept=".jpg, .jpeg, .png, image/*"
          @update:model-value="handleImagesUpload"
          max-files="5"
          max-file-size="5242880"
          @rejected="onRejected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
          <template v-slot:append>
            <q-badge v-if="imageFiles.length > 0" color="primary">{{ imageFiles.length }} عکس</q-badge>
          </template>
        </q-file>

        <!-- پیش‌نمایش عکس‌های انتخاب شده -->
        <div v-if="imagePreviewUrls.length > 0" class="row q-col-gutter-sm q-mt-sm">
          <div v-for="(url, index) in imagePreviewUrls" :key="index" class="col-4 col-sm-3">
            <q-img :src="url" :ratio="1" class="rounded-borders">
              <q-btn
                class="absolute-top-right"
                size="sm"
                flat
                dense
                round
                icon="close"
                color="white"
                @click="removeImage(index)"
                style="background: rgba(0,0,0,0.5)"
                title="حذف عکس"
              />
            </q-img>
          </div>
        </div>

        <div class="row justify-end">
          <q-btn label="ارسال پست" type="submit" color="primary" :loading="submitting" unelevated />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth-store';

const content = ref('');
const imageFiles = ref([]); // برای نگهداری آبجکت‌های فایل
const imagePreviewUrls = ref([]); // برای URL های پیش‌نمایش
const submitting = ref(false);
const $q = useQuasar();
const authStore = useAuthStore();
const emit = defineEmits(['postCreated']);

function handleImagesUpload(files) {
  // files یک آرایه از آبجکت‌های File است که q-file برمی‌گرداند
  imagePreviewUrls.value = files.map(file => URL.createObjectURL(file));
}

function removeImage(index) {
  // حذف از هر دو آرایه
  imageFiles.value.splice(index, 1);
  imagePreviewUrls.value.splice(index, 1);
}

function clearForm() {
  content.value = '';
  imageFiles.value = [];
  imagePreviewUrls.value = [];
}

function onRejected (rejectedEntries) {
  // اطلاع رسانی به کاربر در مورد فایل‌های رد شده (مثلا به خاطر حجم یا نوع)
  $q.notify({
    type: 'negative',
    message: `${rejectedEntries.length} فایل به دلیل حجم یا نوع نامعتبر، رد شد.`
  })
}

async function submitPost() {
  if (!authStore.isAuthenticated) {
    $q.notify({ type: 'negative', message: 'برای ارسال پست باید ابتدا وارد شوید.' });
    return;
  }
  if (!content.value.trim() && imageFiles.value.length === 0) {
    $q.notify({ type: 'warning', message: 'پست شما باید شامل متن یا حداقل یک عکس باشد.' });
    return;
  }

  submitting.value = true;

  const formData = new FormData();
  formData.append('content', content.value);

  // هر فایل را با کلید 'uploaded_images' به FormData اضافه کن
  if (imageFiles.value.length > 0) {
    for (const file of imageFiles.value) {
      // نام کلید باید با چیزی که در بک‌اند (perform_create) می‌خوانید یکی باشد
      // در راهنمایی بک‌اند، از نام 'uploaded_images' استفاده کردیم
      formData.append('uploaded_images', file);
    }
  }

  try {
    const response = await api.post('/api/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log("Post created:", response.data);
    $q.notify({ type: 'positive', message: 'پست شما با موفقیت ارسال شد!' });
    clearForm(); // فرم را کامل پاک کن
    emit('postCreated', response.data);
  } catch (error) {
    console.error("Error creating post:", error.response?.data || error.message);
    let errorMsg = 'خطا در ارسال پست.';
    if (error.response?.data) {
      // منطق استخراج پیام خطا از بک‌اند
      const errors = error.response.data;
      const messages = [];
      for (const field in errors) {
        if (Array.isArray(errors[field])) {
          messages.push(errors[field].join(', '));
        } else {
          messages.push(String(errors[field]));
        }
      }
      if (messages.length > 0) errorMsg = messages.join('\n');
    }
    $q.notify({ type: 'negative', message: errorMsg, html: true });
  } finally {
    submitting.value = false;
  }
}
</script>
