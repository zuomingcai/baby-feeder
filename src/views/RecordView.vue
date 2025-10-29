<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Button,
  CellGroup,
  Field,
  Picker,
  Popup,
  Toast,
  NavBar,
  TimePicker,
  showFailToast,
  showSuccessToast,
} from "vant";
import type { PickerConfirmEventParams, PickerOption } from "vant";
import type { FeedingRecord } from "../services/dbService";
import {
  addFeedingRecord,
  getFeedingRecordById,
  updateFeedingRecord,
} from "../services/dbService";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";
import { formatDate, formatTime } from "../config/date.config";

const router = useRouter();
const route = useRoute();

// 判断是否为编辑模式
const isEditMode = ref(false);

// 表单数据
const formData = ref({
  id: "",
  date: "",
  time: "",
  foodType: "奶粉" as string,
  amount: 0,
  note: "",
});

// 食物类型选项
const foodTypeOptions: PickerOption[] = [
  { text: "奶粉", value: "奶粉" },
  { text: "米糊", value: "米糊" },
  { text: "药物", value: "药物" },
  { text: "其他", value: "其他" },
];

// 控制食物类型选择器显示
const showFoodTypePicker = ref(false);

// 控制时间选择器显示
const showTimePicker = ref(false);

// 页面加载时初始化数据
onMounted(async () => {
  try {
    // 检查是否有ID参数，如果有则为编辑模式
    const recordId = route.params.id as string;
    isEditMode.value = !!recordId;

    if (isEditMode.value) {
      // 编辑模式：加载现有记录
      const record = await getFeedingRecordById(recordId);

      if (record) {
        // 确保正确复制所有字段，包括id
        formData.value = {
          id: record.id,
          date: record.date,
          time: record.time,
          foodType: record.foodType,
          amount: record.amount,
          note: record.note,
        };
      } else {
        showFailToast("未找到该记录");
        router.back();
      }
    } else {
      // 添加模式：检查是否有日期查询参数
      const dateParam = route.query.date as string;
      if (dateParam) {
        formData.value.date = dateParam;
      }
      // 设置默认时间为当前时间
      formData.value.time = formatTime(new Date());
    }
  } catch (error) {
    console.error("加载记录失败:", error);
    showFailToast("加载记录失败");
    router.back();
  }
});

// 保存记录
const saveRecord = async () => {
  try {
    // 验证表单
    if (!formData.value.date || !formData.value.time) {
      showFailToast("请选择日期和时间");
      return;
    }

    if (formData.value.amount <= 0) {
      showFailToast("请输入正确的食量");
      return;
    }

    // 验证食量范围
    if (formData.value.amount > 1000) {
      showFailToast("食量不能超过1000ml");
      return;
    }

    if (isEditMode.value) {
      // 编辑模式：更新记录
      // 创建一个纯净的对象来避免DataCloneError
      const recordToSave: FeedingRecord = {
        id: formData.value.id,
        date: formData.value.date,
        time: formData.value.time,
        foodType: formData.value.foodType,
        amount: formData.value.amount,
        note: formData.value.note,
      };

      // 更新数据库
      await updateFeedingRecord(recordToSave);
      showSuccessToast("更新成功");
    } else {
      // 添加模式：新增记录
      await addFeedingRecord({
        date: formData.value.date,
        time: formData.value.time,
        foodType: formData.value.foodType,
        amount: formData.value.amount,
        note: formData.value.note,
      });
      showSuccessToast("保存成功");
    }

    // 返回主页，并传递当前记录的日期作为参数
    router.push({
      path: "/",
      //   query: {
      //     date: formData.value.date,
      //   },
    });
  } catch (error) {
    console.error("保存记录失败:", error);
    showFailToast(
      "保存记录失败: " + (error instanceof Error ? error.message : "未知错误")
    );
  }
};

// 取消操作
const cancelOperation = () => {
  // 返回主页，并传递当前记录的日期作为参数
  router.push({
    path: "/",
  });
};

// 处理食物类型确认
const onFoodTypeConfirm = (e: PickerConfirmEventParams) => {
  // 处理 Picker 选中的值
  console.log("Picker confirm:", e);

  // fallback 处理
  formData.value.foodType = e.selectedValues[0] as string;

  showFoodTypePicker.value = false;
};

// 安全地获取时间数组用于 TimePicker 的 model-value
const getTimeArray = (): string[] => {
  // 确保 formData.time 是有效的 HH:mm 格式
  if (!formData.value.time || typeof formData.value.time !== "string") {
    // 返回默认时间 00:00
    return ["00", "00"];
  }

  const parts = formData.value.time.split(":");
  // 确保有两个部分并且都是有效的数字
  if (parts.length !== 2 || isNaN(parseInt(parts[0]!)) || isNaN(parseInt(parts[1]!))) {
    // 返回默认时间 00:00
    return ["00", "00"];
  }

  return parts;
};

// 处理时间确认
const onTimeConfirm = (value: string[] | { selectedValues: string[] }) => {
  // 兼容不同版本的 Vant TimePicker 参数格式

  console.log(value);

  // 检查 value 是否为数组，如果不是则从 selectedValues 属性获取
  const timeValues = Array.isArray(value) ? value : value.selectedValues;

  // 确保 timeValues 是有效的数组
  if (Array.isArray(timeValues) && timeValues.length === 2) {
    formData.value.time = timeValues.join(":");
  } else {
    // 如果格式不正确，使用默认时间
    formData.value.time = "00:00";
  }

  showTimePicker.value = false;
};

// 获取食物类型的默认索引
const getDefaultFoodTypeIndex = (): number => {
  // 由于 PickerOption 可能是字符串或对象，我们需要分别处理
  for (let i = 0; i < foodTypeOptions.length; i++) {
    const option = foodTypeOptions[i];
    // 如果选项是对象且有 text 属性
    if (typeof option === "object" && option !== null && "text" in option) {
      if ((option as { text: string }).text === formData.value.foodType) {
        return i;
      }
    }
    // 如果选项是字符串
    else if (typeof option === "string" && option === formData.value.foodType) {
      return i;
    }
  }
  // 默认返回第一个选项
  return 0;
};
</script>

<template>
  <div class="record-container">
    <!-- 导航栏 -->
    <NavBar
      :title="isEditMode ? '编辑饮食记录' : '添加饮食记录'"
      left-text="取消"
      right-text="保存"
      @click-left="cancelOperation"
      @click-right="saveRecord"
    />

    <!-- 表单内容 -->
    <div class="form-container">
      <CellGroup>
        <!-- 日期 -->
        <Field
          v-model="formData.date"
          label="日期"
          placeholder="请选择日期"
          :is-link="false"
          :readonly="true"
        >
        </Field>

        <!-- 时间 -->
        <Field
          v-model="formData.time"
          label="时间"
          placeholder="请选择时间"
          is-link
          readonly
          @click="showTimePicker = true"
        >
        </Field>

        <!-- 食物类型 -->
        <Field
          v-model="formData.foodType"
          label="食物类型"
          placeholder="请选择食物类型"
          is-link
          readonly
          @click="showFoodTypePicker = true"
        />

        <!-- 食量 -->
        <Field
          v-model.number="formData.amount"
          type="number"
          label="食量(ml)"
          placeholder="请输入食量"
        />

        <!-- 备注 -->
        <Field
          v-model="formData.note"
          label="备注"
          type="textarea"
          placeholder="请输入备注信息"
          rows="2"
        />
      </CellGroup>
    </div>

    <!-- 食物类型选择器 -->
    <Popup
      v-model:show="showFoodTypePicker"
      position="bottom"
      @popup-close="showFoodTypePicker = false"
    >
      <Picker
        :columns="foodTypeOptions"
        :default-index="getDefaultFoodTypeIndex()"
        :model-value="[formData.foodType]"
        @confirm="onFoodTypeConfirm"
        @cancel="showFoodTypePicker = false"
      />
    </Popup>

    <!-- 时间选择器 -->
    <Popup
      v-model:show="showTimePicker"
      position="bottom"
      @popup-close="showTimePicker = false"
    >
      <TimePicker
        type="time"
        :columns-type="['hour', 'minute']"
        :min-hour="0"
        :max-hour="23"
        :min-minute="0"
        :max-minute="59"
        :model-value="getTimeArray()"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </Popup>
  </div>
</template>

<style scoped>
.record-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.date-input,
.time-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
}
</style>
