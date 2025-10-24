<script setup lang="ts">
import { ref } from 'vue';
import { Button, CellGroup, Toast, NavBar, Dialog } from 'vant';
import { getWebDAVConfig, type WebDAVConfig, getWebDAVMetadata } from '../services/webdavService';
import { getAllFeedingRecords, clearAllFeedingRecords, importFeedingRecords } from '../services/dbService';
import { uploadDataToWebDAV, downloadDataFromWebDAV } from '../services/webdavService';
import { getLocalMetadata, initLocalMetadata } from '../services/localMetaService';
import { useRouter } from 'vue-router';

const router = useRouter();

// 是否正在上传数据
const isUploading = ref(false);

// 是否正在下载数据
const isDownloading = ref(false);



// 返回主页
const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="settings-container">
    <!-- 导航栏 -->
    <NavBar
      title="设置"
      left-text="返回"
      @click-left="goBack"
    />
    
    <!-- 数据同步 -->
          <div class="form-container">
            <CellGroup title="数据同步">
              <div class="sync-instructions">
                <p>通过WebDAV同步数据，确保在不同设备间备份和恢复宝宝的饮食记录。</p>
                <p style="color: #ff6600; font-size: 12px;">注意：WebDAV配置由系统管理员设置，用户无法修改。</p>
              </div>
            </CellGroup>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.button-group,
.sync-buttons {
  padding: 16px;
}

.sync-instructions {
  padding: 16px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}
</style>