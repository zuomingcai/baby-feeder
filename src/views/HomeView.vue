<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Button, Cell, CellGroup, Icon, Toast, Dialog, showConfirmDialog, SwipeCell, Popup, Calendar, showFailToast, showSuccessToast } from 'vant';
import type { FeedingRecord } from '../services/dbService';
import { getFeedingRecordsByDate, deleteFeedingRecord } from '../services/dbService';
import { getWebDAVConfig, type WebDAVConfig, getWebDAVMetadata } from '../services/webdavService';
import { uploadDataToWebDAV, downloadDataFromWebDAV } from '../services/webdavService';
import { getAllFeedingRecords, clearAllFeedingRecords, importFeedingRecords } from '../services/dbService';
import { getLocalMetadata, initLocalMetadata } from '../services/localMetaService';
import { useRouter, useRoute } from 'vue-router';
import { formatDate as formatDateTime, formatTime } from '../config/date.config';

// 当前日期
const currentDate = ref<Date>(new Date());
// 控制日期选择弹出层显示
const showDatePicker = ref<boolean>(false);
// 饮食记录列表
const feedingRecords = ref<FeedingRecord[]>([]);
// 本地元数据
const localMeta = ref<any>(null);
// 控制本地元数据显示
const showLocalMeta = ref<boolean>(false);
// 日历组件引用
const calendarRef = ref<any>(null);
const router = useRouter();
const route = useRoute();

// 用于跟踪触摸操作的状态
const touchState = ref({
  isMoving: false,
  startX: 0,
  startY: 0
});

// 格式化日期显示
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// 加载指定日期的饮食记录
const loadFeedingRecords = async () => {
  try {
    if (currentDate.value) {
      feedingRecords.value = await getFeedingRecordsByDate(formatDateTime(currentDate.value));
    }
  } catch (error) {
    console.error('加载饮食记录失败:', error);
    showFailToast('加载饮食记录失败');
  }
};

// 打开日期选择器
const openDatePicker = () => {
  showDatePicker.value = true;
};

// 确认选择日期
const confirmDate = (date: Date) => {
  currentDate.value = date;
  showDatePicker.value = false;
  loadFeedingRecords();
};

// 取消选择日期
const cancelDate = () => {
  showDatePicker.value = false;
};

// 切换到前一天
const goToPreviousDay = () => {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() - 1);
  currentDate.value = date;
  loadFeedingRecords();
};

// 切换到后一天
const goToNextDay = () => {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() + 1);
  currentDate.value = date;
  loadFeedingRecords();
};

// 跳转到添加记录页面
const goToAddRecord = () => {
  router.push({
    path: '/add',
    query: {
      date: formatDateTime(currentDate.value)
    }
  });
};

// 跳转到编辑记录页面
const goToEditRecord = (record: FeedingRecord) => {
  router.push(`/edit/${record.id}`);
};

// 删除记录
const deleteRecord = async (id: string) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条饮食记录吗？'
    });

    await deleteFeedingRecord(id);
    showSuccessToast('删除成功');
    loadFeedingRecords(); // 重新加载数据
  } catch (error) {
    if (error !== 'cancel') {
      // 只有在非用户取消操作的情况下才显示错误消息
      console.error('删除记录失败:', error);
      showFailToast('删除记录失败');
    }
  }
};

// 滑动删除记录
const onSwipeClose = (record: FeedingRecord) => {
  deleteRecord(record.id);
};

// 检查上传冲突
const checkUploadConflict = async (config: WebDAVConfig): Promise<boolean> => {
    // 初始化本地元数据（如果不存在）
    let localMeta = await getLocalMetadata();
    if (!localMeta) {
      localMeta = await initLocalMetadata();
    }

    // 获取服务器上的元数据
    const serverMeta = await getWebDAVMetadata(config);

    let safe =  !serverMeta!.version || serverMeta!.version==localMeta!.preversion;
    return !safe;

}

// 上传数据
const uploadData = async () => {
  try {
    // 检查配置
    const config = await getWebDAVConfig();
    if (!config) {
      showFailToast('WebDAV未正确配置，请联系管理员');
      return;
    }

        // 显示上传确认对话框
    await showConfirmDialog({
      title: '确认上传',
      message: `确定要上传到服务器吗？`
    });

    // 检查冲突
    const hasConflict = await checkUploadConflict(config);
    if (hasConflict) {
      // 处理版本冲突
      await showConfirmDialog({
        title: '版本冲突',
        message: '服务器上的数据已被其他设备修改，是否强制覆盖？'
      });
    }

    // 获取所有本地数据
    const records = await getAllFeedingRecords();

    // 上传数据
    await uploadDataToWebDAV(config, {
      records: records,
      exportTime: `${formatDateTime(new Date())} ${formatTime(new Date())}`
    });

    showSuccessToast('数据上传成功');
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作（包括上传确认和版本冲突确认）
      console.error(' 用户取消操作:', error);
      return;
    }

    console.error('数据上传失败:', error);
    showFailToast('数据上传失败: ' + (error as Error).message);
  }
};

// 下载数据
const downloadData = async () => {
  try {
    // 检查配置
    const config = await getWebDAVConfig();
    if (!config) {
      showFailToast('WebDAV未正确配置，请联系管理员');
      return;
    }

    // 显示下载确认对话框
    await showConfirmDialog({
      title: '确认下载',
      message: '确定要从服务器下载数据吗？这将会覆盖本地数据。'
    });

    // 下载并导入数据（不返回数据，失败会抛出异常）
    await downloadDataFromWebDAV(config);

    showSuccessToast('数据导入成功');
    loadFeedingRecords(); // 重新加载数据
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消操作（包括所有确认对话框）
      return;
    }

    console.error('数据下载失败:', error);
    showFailToast('数据下载失败: ' + (error as Error).message);
  }
};

// 查看本地元数据
const viewLocalMeta = async () => {
  try {
    const meta = await getLocalMetadata();
    localMeta.value = meta;
    showLocalMeta.value = true;
  } catch (error) {
    console.error('获取本地元数据失败:', error);
    showFailToast('获取本地元数据失败');
  }
};

// 跳转到设置页面
const goToSettings = () => {
  router.push('/settings');
};

// 清空所有数据
const clearAllData = async () => {
  try {
    // 显示确认对话框
    await showConfirmDialog({
      title: '确认清空',
      message: '确定要清空所有数据吗？此操作不可恢复。'
    });

    // 清空本地数据
    await clearAllFeedingRecords();

    showSuccessToast('数据已清空');
    loadFeedingRecords(); // 重新加载数据
  } catch (error) {
    if (error !== 'cancel') {
      // 只有在非用户取消操作的情况下才显示错误消息
      console.error('清空数据失败:', error);
      showFailToast('清空数据失败');
    }
  }
};

// 处理触摸开始事件
const handleTouchStart = (event: TouchEvent) => {
  touchState.value.isMoving = false;
  if (event.touches && event.touches[0]) {
    touchState.value.startX = event.touches[0].clientX;
    touchState.value.startY = event.touches[0].clientY;
  }
};

// 处理触摸移动事件
const handleTouchMove = (event: TouchEvent) => {
  if (!touchState.value.startX || !touchState.value.startY) {
    return;
  }

  if (event.touches && event.touches[0]) {
    const deltaX = Math.abs(event.touches[0].clientX - touchState.value.startX);
    const deltaY = Math.abs(event.touches[0].clientY - touchState.value.startY);

    // 如果水平或垂直移动超过一定距离，则认为是滑动操作
    if (deltaX > 10 || deltaY > 10) {
      touchState.value.isMoving = true;
    }
  }
};

// 处理触摸结束事件
const handleTouchEnd = (record: FeedingRecord) => {
  // 如果不是滑动操作，则执行点击事件
  if (!touchState.value.isMoving) {
    goToEditRecord(record);
  }

  // 重置状态
  touchState.value.isMoving = false;
  touchState.value.startX = 0;
  touchState.value.startY = 0;
};

// 页面加载时获取数据
onMounted(() => {
  // 检查是否有日期查询参数
  const dateParam = route.query.date as string;
  if (dateParam) {
    currentDate.value = new Date(dateParam);
  }

  loadFeedingRecords();
});
</script>

<template>
  <div class="home-container">
    <!-- 顶部标题栏 -->
    <div class="app-header">
      <h2 class="app-title">宝宝饮食记录</h2>
      <div class="header-icons">
        <Button type="default" @click="uploadData" size="small" icon="upgrade" />
        <Button type="default" @click="downloadData" size="small" icon="down" />
        <Button type="default" @click="viewLocalMeta" size="small" icon="info-o" />
        <Button type="danger" @click="clearAllData" size="small" icon="delete-o" />
      </div>
    </div>

    <!-- 日期导航栏 -->
    <div class="date-navigation">
      <Button icon="arrow-left" @click="goToPreviousDay" />
      <h2 @click="openDatePicker" style="cursor: pointer">
        {{ formatDate(currentDate) }}
      </h2>
      <Button icon="arrow" @click="goToNextDay" />
    </div>

    <!-- 日期选择器弹出层 -->
    <Popup
      v-model:show="showDatePicker"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <div style="height: 100%; overflow: hidden">
        <Calendar
          ref="calendarRef"
          :min-date="new Date(2020, 0, 1)"
          :max-date="new Date(2030, 11, 31)"
          :default-date="currentDate"
          @confirm="confirmDate"
          @cancel="cancelDate"
          round
          title="选择日期"
          :show-confirm="false"
          :poppable="false"
          :style="{ height: '100%' }"
          :formatter="(day) => day"
          :lazy-render="false"
        />
      </div>
    </Popup>

    <!-- 本地元数据显示弹出层 -->
    <Popup v-model:show="showLocalMeta" position="bottom" :style="{ height: '50%' }">
      <div style="padding: 20px">
        <h3 style="text-align: center; margin-top: 0">本地元数据</h3>
        <div v-if="localMeta" style="text-align: left">
          <p><strong>版本号:</strong> {{ localMeta.version }}</p>
          <p><strong>预同步版本:</strong> {{ localMeta.preversion || "无" }}</p>
          <p><strong>最后修改时间:</strong> {{ localMeta.lastModified }}</p>
          <p><strong>设备ID:</strong> {{ localMeta.deviceId }}</p>
        </div>
        <div v-else>
          <p>暂无本地元数据</p>
        </div>
        <div style="margin-top: 20px">
          <Button type="primary" @click="showLocalMeta = false" block>关闭</Button>
        </div>
      </div>
    </Popup>

    <!-- 添加记录按钮 -->
    <div class="add-button-container">
      <Button type="primary" @click="goToAddRecord" block>添加饮食记录</Button>
    </div>

    <!-- 饮食记录列表 -->
    <CellGroup title="饮食记录">
      <SwipeCell
        v-for="record in feedingRecords"
        :key="record.id"
        :right-width="65"
        :left-width="0"
        stop-propagation
      >
        <Cell
          :title="`${record.time} - ${record.foodType}`"
          :label="`食量: ${record.amount}ml${record.note ? ' - ' + record.note : ''}`"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="() => handleTouchEnd(record)"
        />
        <template #right>
          <Button
            square
            type="danger"
            text="删除"
            @click="onSwipeClose(record)"
            style="height: 100%"
          />
        </template>
      </SwipeCell>

      <!-- 无记录提示 -->
      <div v-if="feedingRecords.length === 0" class="empty-placeholder">
        <Icon name="description" size="48" />
        <p>今天还没有添加饮食记录</p>
        <p class="hint">点击上方"添加饮食记录"按钮开始记录</p>
      </div>
    </CellGroup>
  </div>
</template>

<style scoped>
.home-container {
  padding: 16px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e5e5;
}

.app-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.header-icons {
  display: flex;
  gap: 5px;
}

.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.date-navigation h2 {
  margin: 0;
  text-align: center;
  flex-grow: 1;
}

.add-button-container {
  margin-bottom: 20px;
}

.van-cell-group {
  margin-bottom: 20px;
}

.empty-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-placeholder p {
  margin: 10px 0 0;
}

.empty-placeholder .hint {
  font-size: 14px;
  color: #ccc;
}

.swipe-cell {
  margin-bottom: 10px;
}
</style>
