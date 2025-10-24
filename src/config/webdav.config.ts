// WebDAV配置文件
// 此文件包含WebDAV服务器的配置信息
// 注意：这个配置文件在构建时会被嵌入到应用程序中，用户无法修改

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

// WebDAV配置
// 请根据实际情况修改以下配置
export const WEBDAV_CONFIG: WebDAVConfig = {
  url: 'https://dav.jianguoyun.com/dav/app/', // 直接访问WebDAV服务器
  username: 'zuomingcai@163.com', // WebDAV用户名
  password: 'ak227u7azfysu4en'  // WebDAV密码
};

// 配置示例:
// export const WEBDAV_CONFIG: WebDAVConfig = {
//   url: 'https://example.com/remote.php/dav/files/username/',
//   username: 'your_username',
//   password: 'your_password'
// };