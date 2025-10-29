// WebDAV配置接口
import { WEBDAV_CONFIG, type WebDAVConfig } from '../config/webdav.config';
import { v4 as uuidv4 } from 'uuid';
import {
    getLocalMetadata,
    saveLocalMetadata,
    initLocalMetadata,
    updateLocalVersion,
    updateSyncStatus
} from './localMetaService';
import { importFeedingRecords } from './dbService';
import { formatDate, formatTime } from '../config/date.config';


// 定义元数据接口
export interface WebDAVMetadata {
    version: string;        // 当前服务器数据版本号
    preversion: string;     // 上次同步时的服务器版本号
    lastModified: string;   // 数据最后修改时间
    deviceId: string;       // 同步设备标识符
}

export type { WebDAVConfig };

// 保存WebDAV配置到本地存储
// 注意：由于配置现在来自配置文件，此函数不再需要
export async function saveWebDAVConfig(config: WebDAVConfig): Promise<void> {
    // 不再实现，因为配置来自配置文件
    console.warn('saveWebDAVConfig: 配置来自配置文件，无需保存');
    return Promise.resolve();
}

// 获取WebDAV服务器上的元数据
export async function getWebDAVMetadata(config: WebDAVConfig): Promise<WebDAVMetadata | null> {
    try {
        // 构建元数据文件URL
        const metaUrl = config.url.endsWith('/') ?
            `${config.url}meta.json` :
            `${config.url}/meta.json`;

        // 创建请求头
        const headers: any = {};
        if (config.username && config.password) {
            // 使用Base64编码用户名和密码
            const credentials = btoa(`${config.username}:${config.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        // 发送GET请求下载元数据
        const response = await fetch(metaUrl, { method: 'GET', headers: headers
         });

        if (response.status === 200) {
            const data = await response.json();
            return data as WebDAVMetadata;
        }

        return null;
    } catch (error) {
        console.error('从WebDAV获取元数据失败:', error);
        return null;
    }
}

// 上传元数据到WebDAV服务器
export async function uploadMetadataToWebDAV(config: WebDAVConfig, metadata: WebDAVMetadata): Promise<void> {

    const jsonData = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });

    // 构建元数据文件URL
    const metaUrl = config.url.endsWith('/') ?
        `${config.url}meta.json` :
        `${config.url}/meta.json`;

    // 创建请求头
    const headers: any = {};
    headers['Content-Type'] = 'application/json';

    if (config.username && config.password) {
        const credentials = btoa(`${config.username}:${config.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    // 发送PUT请求上传元数据文件
    const response = await fetch(metaUrl, { method: 'PUT', headers: headers, body: jsonData
     });

    if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
        throw new Error('元数据上传失败');
    }

}

// 从配置文件获取WebDAV配置
export async function getWebDAVConfig(): Promise<WebDAVConfig | null> {
    try {
        // 直接返回配置文件中的配置
        // 如果URL为空，则返回null表示未配置
        if (!WEBDAV_CONFIG.url) {
            return null;
        }
        return WEBDAV_CONFIG;
    } catch (error) {
        console.error('获取WebDAV配置失败:', error);
        return null;
    }
}

// 检查WebDAV服务器连接
export async function checkWebDAVConnection(config: WebDAVConfig): Promise<boolean> {
    try {
        // 创建请求头
        const headers: any = {};
        if (config.username && config.password) {
            // 使用Base64编码用户名和密码
            const credentials = btoa(`${config.username}:${config.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
        }

        // 发送PROPFIND请求检查连接
        const response = await fetch(config.url, { method: 'PROPFIND', headers: headers
         });

        return response.status === 200 || response.status === 207; // 207是WebDAV多状态响应
    } catch (error) {
        console.error('WebDAV连接检查失败:', error);
        return false;
    }
}

// 上传数据到WebDAV服务器
export async function uploadDataToWebDAV(config: WebDAVConfig, data: any): Promise<void> {

    // 初始化本地元数据（如果不存在）
    let localMeta = await getLocalMetadata();
    if (!localMeta) {
        localMeta = await initLocalMetadata();
    }

    // 生成新的版本号
    const newVersion = localMeta.version;

    // 准备要上传的数据（不包含版本信息）
    const dataToUpload = {
        records: data.records,
        exportTime: data.exportTime
    };

    const jsonData = JSON.stringify(dataToUpload, null, 2);

    // 构建数据文件URL
    const dataUrl = config.url.endsWith('/') ?
        `${config.url}baby_feeding_records.json` :
        `${config.url}/baby_feeding_records.json`;

    // 创建请求头
    const headers: any = {};
    headers['Content-Type'] = 'application/json';

    if (config.username && config.password) {
        // 使用Base64编码用户名和密码
        const credentials = btoa(`${config.username}:${config.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    // 发送PUT请求上传数据文件
    const dataResponse = await fetch(dataUrl, { method: 'PUT', headers: headers, body: jsonData
     });

    if (dataResponse.status !== 200 && dataResponse.status !== 201 && dataResponse.status !== 204) {
        throw new Error('数据上传失败');
    }

    // 获取服务器上的元数据
    const serverMeta = await getWebDAVMetadata(config);

    // 准备新的元数据
    const newMetadata: WebDAVMetadata = {
        version: newVersion,
        preversion: serverMeta?.version || '',
        lastModified: `${formatDate(new Date())} ${formatTime(new Date())}`,
        deviceId: localMeta.deviceId
    };

    // 上传元数据
    await uploadMetadataToWebDAV(config, newMetadata);

    // 更新本地同步状态
    await updateSyncStatus(newVersion);

}

// 从WebDAV服务器下载数据
export async function downloadDataFromWebDAV(config: WebDAVConfig): Promise<void> {
    // 获取服务器上的元数据
    const serverMeta = await getWebDAVMetadata(config);

    // 构建数据文件URL
    const dataUrl = config.url.endsWith('/') ?
        `${config.url}baby_feeding_records.json` :
        `${config.url}/baby_feeding_records.json`;

    // 创建请求头
    const headers: any = {};
    if (config.username && config.password) {
        // 使用Base64编码用户名和密码
        const credentials = btoa(`${config.username}:${config.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    // 发送GET请求下载文件
    const response = await fetch(dataUrl, { method: 'GET', headers: headers
     });

    if (response.status !== 200) {
        throw new Error('数据下载失败');
    }

    const data = await response.json();

    // 导入数据到indexdb
    if (data.records && Array.isArray(data.records)) {
        await importFeedingRecords(data.records);
    }

    // 更新本地同步状态
    await updateSyncStatus(serverMeta!.version);
}