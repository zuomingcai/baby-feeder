import { v4 as uuidv4 } from 'uuid';
import { formatDate, formatTime } from '../config/date.config';

// 定义元数据接口
export interface LocalMetadata {
  version: string;        // 本地数据版本号
  preversion: string;     // 上次同步时的服务器版本号
  lastModified: string;   // 数据最后修改时间
  deviceId: string;       // 设备标识符
}

// 本地存储键名
const LOCAL_META_KEY = 'baby_feeder_local_metadata';
const DEVICE_ID_KEY = 'baby_feeder_device_id';

// 获取设备ID（如果没有则生成一个）
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// 获取本地元数据
export async function getLocalMetadata(): Promise<LocalMetadata | null> {
  try {
    const metaStr = localStorage.getItem(LOCAL_META_KEY);
    if (metaStr) {
      return JSON.parse(metaStr);
    }
    return null;
  } catch (error) {
    console.error('获取本地元数据失败:', error);
    return null;
  }
}

// 保存本地元数据
export async function saveLocalMetadata(metadata: LocalMetadata): Promise<void> {
  try {
    localStorage.setItem(LOCAL_META_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('保存本地元数据失败:', error);
    throw error;
  }
}

// 初始化本地元数据（如果不存在）
export async function initLocalMetadata(): Promise<LocalMetadata> {
  const existingMeta = await getLocalMetadata();
  if (existingMeta) {
    return existingMeta;
  }

  // 创建新的元数据
  const newMeta: LocalMetadata = {
    version: uuidv4(),      // 初始版本号
    preversion: '',         // 还未同步
    lastModified: `${formatDate(new Date())} ${formatTime(new Date())}`,
    deviceId: getDeviceId()
  };

  await saveLocalMetadata(newMeta);
  return newMeta;
}

// 更新本地数据版本（当本地数据发生变化时调用）
export async function updateLocalVersion(): Promise<LocalMetadata> {
  const meta = await getLocalMetadata();
  if (!meta) {
    return await initLocalMetadata();
  }

  // 更新版本号和最后修改时间
  const updatedMeta: LocalMetadata = {
    ...meta,
    version: uuidv4(),  // 生成新的版本号
    lastModified: `${formatDate(new Date())} ${formatTime(new Date())}`
  };

  await saveLocalMetadata(updatedMeta);
  return updatedMeta;
}

// 更新同步状态（同步成功后调用）
export async function updateSyncStatus(serverVersion: string): Promise<LocalMetadata> {
  const meta = await getLocalMetadata();
  if (!meta) {
    throw new Error('本地元数据不存在');
  }

  // 更新同步状态
  const updatedMeta: LocalMetadata = {
    ...meta,
    preversion: serverVersion,  // 设置为服务器版本
    version: serverVersion      // 与服务器版本同步
  };

  await saveLocalMetadata(updatedMeta);
  return updatedMeta;
}