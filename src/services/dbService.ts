import { v4 as uuidv4 } from 'uuid';
import { updateLocalVersion } from './localMetaService';
import { formatDate, formatTime } from '../config/date.config';

// 定义饮食记录接口
export interface FeedingRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  foodType: string;
  amount: number; // 毫升
  note: string;
}

// 数据库名称和版本
const DB_NAME = 'BabyFeederDB';
const DB_VERSION = 1;

// 打开或创建数据库
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('无法打开数据库'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    // 创建对象存储空间
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建饮食记录存储空间
      if (!db.objectStoreNames.contains('feedingRecords')) {
        const store = db.createObjectStore('feedingRecords', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('id', 'id', { unique: true });
      }
    };
  });
}

// 添加饮食记录
export async function addFeedingRecord(record: Omit<FeedingRecord, 'id'>): Promise<string> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readwrite');
  const store = transaction.objectStore('feedingRecords');
  
  // 生成UUID作为ID
  const newRecord: FeedingRecord = {
    ...record,
    id: uuidv4()
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(newRecord);
    
    request.onsuccess = async () => {
      // 更新本地元数据版本
      try {
        await updateLocalVersion();
      } catch (error) {
        console.error('更新本地元数据版本失败:', error);
      }
      resolve(newRecord.id);
    };
    
    request.onerror = () => {
      reject(new Error('添加记录失败'));
    };
  });
}

// 获取指定日期的饮食记录
export async function getFeedingRecordsByDate(date: string): Promise<FeedingRecord[]> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readonly');
  const store = transaction.objectStore('feedingRecords');
  const index = store.index('date');
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(date));
    
    request.onsuccess = () => {
      // 按时间排序
      const records = request.result.sort((a, b) => a.time.localeCompare(b.time));
      resolve(records);
    };
    
    request.onerror = () => {
      reject(new Error('获取记录失败'));
    };
  });
}

// 获取所有饮食记录
export async function getAllFeedingRecords(): Promise<FeedingRecord[]> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readonly');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(new Error('获取所有记录失败'));
    };
  });
}

// 根据ID获取饮食记录
export async function getFeedingRecordById(id: string): Promise<FeedingRecord | null> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readonly');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => {
      reject(new Error('获取记录失败'));
    };
  });
}

// 更新饮食记录
export async function updateFeedingRecord(record: FeedingRecord): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readwrite');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    const request = store.put(record);
    
    request.onsuccess = async () => {
      // 更新本地元数据版本
      try {
        await updateLocalVersion();
      } catch (error) {
        console.error('更新本地元数据版本失败:', error);
      }
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('更新记录失败: ' + (request.error?.message || '未知错误')));
    };
  });
}

// 删除饮食记录
export async function deleteFeedingRecord(id: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readwrite');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    
    request.onsuccess = async () => {
      // 更新本地元数据版本
      try {
        await updateLocalVersion();
      } catch (error) {
        console.error('更新本地元数据版本失败:', error);
      }
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('删除记录失败'));
    };
  });
}

// 清空所有饮食记录
export async function clearAllFeedingRecords(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readwrite');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    
    request.onsuccess = async () => {
      // 更新本地元数据版本
      try {
        await updateLocalVersion();
      } catch (error) {
        console.error('更新本地元数据版本失败:', error);
      }
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error('清空记录失败'));
    };
  });
}

// 批量导入饮食记录
export async function importFeedingRecords(records: FeedingRecord[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(['feedingRecords'], 'readwrite');
  const store = transaction.objectStore('feedingRecords');
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasError = false;
    
    if (records.length === 0) {
      resolve();
      return;
    }
    
    records.forEach(record => {
      const request = store.put(record);
      
      request.onsuccess = () => {
        completed++;
        if (completed === records.length && !hasError) {
          // 更新本地元数据版本
          updateLocalVersion().catch(error => {
            console.error('更新本地元数据版本失败:', error);
          });
          resolve();
        }
      };
      
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(new Error('导入记录失败'));
        }
      };
    });
  });
}