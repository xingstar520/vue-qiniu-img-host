<template>
  <div class="background">
    <div class="main-card">
      <UploadImage />
       <!-- <TestComponent /> -->
    </div>
    <footer class="footer">© 2025 琦月图床 | 开源地址 <a href="https://github.com/xingstar520/vue-qiniu-img-host">Github</a></footer>
  </div>
</template>

<script setup>
// import TestComponent from './components/TestComponent.vue';
import UploadImage from './components/UploadImage.vue'
</script>
<style>
.background {
  background: url('/src/assets/background.png') center center / cover no-repeat fixed;
  height: 100vh;
  width: 100vw;
}
</style>