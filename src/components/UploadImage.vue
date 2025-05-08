<template>
  <div class="upload-card">
    <div class="upload-section">
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        :auto-upload="false"
        :on-change="handleChange"
        multiple
        :show-file-list="false"
      >
        <template v-if="!imageUrl">
          <div class="upload-inner">
            <div class="el-upload__text">点击或拖拽图片到此处上传</div>
            <p class="upload-tip">支持 JPG, PNG, GIF 等常见图片格式</p>
          </div>
        </template>
        <template v-else>
          <div class="upload-area has-image">
            <div class="image-preview">
              <img v-if="fullImageUrl" :src="fullImageUrl" alt="预览" @error="onImgError" />
              <div class="preview-actions">
                <el-button type="text" icon="el-icon-zoom-in" @click="previewImage"></el-button>
                <el-button type="text" icon="el-icon-delete" @click="resetUpload"></el-button>
              </div>
            </div>
          </div>
        </template>
      </el-upload>

      <div
        class="paste-area"
        tabindex="0"
        @paste="handlePaste"
        @focus="focused = true"
        @blur="focused = false"
      >
        <i class="el-icon-upload paste-icon"></i>
        <div class="paste-tip">使用 Ctrl+V 粘贴图片上传</div>
      </div>

      <div class="slider-box">
        <span>图片清晰度 {{ quality }}%</span>
        <el-slider v-model="quality" :min="60" :max="100" />
      </div>

      <div class="url-bar">
        <el-input
          v-model="fullImageUrl"
          readonly
          class="url-input"
          placeholder="图片上传后显示URL"
          clearable
          @clear="resetUpload"
        />
        <el-button
          type="primary"
          icon="el-icon-document-copy"
          @click="copyUrl"
          :disabled="!fullImageUrl"
          class="copy-btn"
        >
          {{ copied ? '已复制' : '复制' }}
        </el-button>
      </div>
    </div>

    <div class="info-section">
      <div class="info-box">
        <h4>压缩前</h4>
        <p>
          宽度：<span :class="{ 'zero-value': originalWidth === 0 }">{{ originalWidth }} px</span>
          高度：<span :class="{ 'zero-value': originalHeight === 0 }">{{ originalHeight }} px</span>
          大小：<span :class="{ 'zero-value': originalSize === 0 }">{{ originalSize }} KB</span>
        </p>
      </div>
      <div class="info-box">
        <h4>压缩后</h4>
        <p>
          宽度：<span :class="{ 'zero-value': compressedWidth === 0 }">{{ compressedWidth }} px</span>
          高度：<span :class="{ 'zero-value': compressedHeight === 0 }">{{ compressedHeight }} px</span>
          大小：<span :class="{ 'zero-value': compressedSize === 0 }">{{ compressedSize }} KB </span> 
        </p>
      </div>
    </div>
    
    <!-- 图片预览模态框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="80%">
      <img :src="fullImageUrl" style="max-width: 100%; max-height: 80vh;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadToQiniu } from '@/api/qiniu'

const uploadRef = ref(null)
const quality = ref(60)
const imageUrl = ref('')
const originalWidth = ref(0)
const originalHeight = ref(0)
const originalSize = ref(0)
const compressedWidth = ref(0)
const compressedHeight = ref(0)
const compressedSize = ref(0)
const copied = ref(false)
const focused = ref(false)
const previewVisible = ref(false)

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}

const fullImageUrl = computed(() => getFullUrl(imageUrl.value))

function updateImageInfo(file, img) {
  originalWidth.value = img.width
  originalHeight.value = img.height
  originalSize.value = (file.size / 1024).toFixed(2)
  const ratio = quality.value / 100
  compressedWidth.value = Math.round(img.width * ratio)
  compressedHeight.value = Math.round(img.height * ratio)
  compressedSize.value = (file.size * ratio / 1024).toFixed(2)
}

watch(quality, (val) => {
  if (originalWidth.value && originalHeight.value && originalSize.value) {
    compressedWidth.value = Math.round(originalWidth.value * val / 100)
    compressedHeight.value = Math.round(originalHeight.value * val / 100)
    compressedSize.value = (originalSize.value * val / 100).toFixed(2)
  }
})

async function handlePasteOrUpload(file) {
  try {
    const response = await uploadToQiniu(file)
    imageUrl.value = response.data.url
    const img = new Image()
    img.onload = () => updateImageInfo(file, img)
    img.src = URL.createObjectURL(file)
  } catch (error) {
    ElMessage.error('上传失败：' + error.message)
  }
}

const handleChange = async (uploadFile) => {
  if (uploadFile && uploadFile.raw) {
    await handlePasteOrUpload(uploadFile.raw)
    ElMessage.success('上传成功')
  }
}

function copyUrl() {
  if (!fullImageUrl.value) return
  navigator.clipboard.writeText(fullImageUrl.value).then(() => {
    ElMessage.success('已复制！')
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  })
}

function handlePaste(e) {
  const items = e.clipboardData && e.clipboardData.items
  if (!items) return
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      // 创建一个新的文件列表并触发上传
      // Removed unused variable 'newFileList'
      if (uploadRef.value) {
        uploadRef.value.handleStart(file)
      }
      break
    }
  }
}

function onImgError() {
  ElMessage.error('图片加载失败，请检查外链或跨域设置')
  console.warn('图片加载失败', imageUrl.value)
}

function previewImage() {
  previewVisible.value = true
}

function resetUpload() {
  imageUrl.value = ''
  previewVisible.value = false
}

onMounted(() => {
  const el = uploadRef.value?.$el || uploadRef.value?.$refs['upload-inner']
  if (el) el.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  const el = uploadRef.value?.$el || uploadRef.value?.$refs['upload-inner']
  if (el) el.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
.upload-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(240, 249, 255, 0.1) 100%);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1px 2px 0 rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px);
  padding: 32px 32px 24px 32px;
  min-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.upload-card:hover {
  box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.22), 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

.upload-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.upload-area {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(240, 249, 255, 0.1));
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  width: 100%;
  height: 400px;
  min-height: 300px;
  max-height: 300px;
  position: relative;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.upload-area:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(240, 249, 255, 0.15));
}

.upload-area.has-image {
  height: auto;
  min-height: 200px;
}

.upload-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.05);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-area:hover::before {
  opacity: 1;
}

.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  width: 100%;
  z-index: 1;
  position: relative;
  color: #fff;
}

.upload-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.image-preview {
  position: relative;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 12px;
}

.image-preview img {
  display: block;
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 12px;
}

.preview-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.preview-actions .el-button {
  color: white;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  padding: 4px;
  font-size: 16px;
}

.paste-area {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
  width: 100%;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  outline: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(240, 249, 255, 0.1) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.paste-area:focus {
  border-color: rgba(255, 255, 255, 0.5);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(240, 249, 255, 0.15) 100%);
}

.paste-icon {
  font-size: 20px;
}

.paste-tip {
  color: rgba(255, 255, 255, 0.7);
}

.slider-box {
  margin: 10px 0 0 0;
  width: 100%;
}

.slider-box span {
  font-size: 14px;
}

.url-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.url-input {
  flex: 1;
  border-radius: 8px;
}

.copy-btn {
  min-width: 72px;
  border-radius: 8px;
}

/* 图片信息展示区域 */
.info-section {
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  width: 100%;
  margin-top: 24px;
}

.info-section::after {
  content: '';
  position: absolute;
  top: 20%;
  bottom: 20%;
  left: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-50%);
}

.info-box {
  flex: 1;
  text-align: center;
}

.info-box h4 {
  font-size: 24px;
  font-weight: 600;
  color: var(--white);
  margin-bottom: 6px;
}

.info-box p {
  font-size: 16px;
  color: var(--white);
  opacity: 0.85;
  line-height: 1.6;
}

.info-box p span {
  font-weight: 600;
}

.info-box p .unit {
  font-weight: normal;
  font-size: 12px;
  opacity: 0.6;
}

.zero-value {
  color: var(--danger);
  font-weight: normal;
}

/* 响应式 */
@media (max-width: 768px) {
  .upload-card {
    min-width: auto;
    width: 100%;
    padding: 24px 16px;
  }

  .info-section {
    flex-direction: column;
    gap: 16px;
  }

  .info-section::after {
    display: none;
  }

  .info-box p {
    font-size: 13px;
  }
}
</style>