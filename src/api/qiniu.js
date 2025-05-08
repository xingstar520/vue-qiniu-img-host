import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 5000,
    withCredentials: true
});

/**
 * 获取七牛云上传凭证
 * @returns {Promise<string>}
 */
export const getQiniuToken = () => {
    return api.get('/qiniu/upload-token');
};

/**
 * 上传文件到七牛云
 * @param {File} file - 要上传的文件
 * @returns {Promise<object>} - 上传结果
 */
export const uploadToQiniu = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/qiniu/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/**
 * 删除七牛云文件
 * @param {string} key - 文件key
 * @returns {Promise<object>} - 删除结果
 */
export const deleteQiniuFile = (key) => {
    return api.delete(`/qiniu/${key}`);
};

/**
 * 生成七牛云文件key
 * @param {File} file - 文件对象
 * @returns {string} - 文件key
 */
export function getQiniuKey(file) {
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    return `bed/${timestamp}.${ext}`;
}

// 获取七牛云文件访问域名
export const getQiniuDomain = () => {
    return api.get('/qiniu/domain');
};
