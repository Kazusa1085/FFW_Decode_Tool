// ===== 工具函数 =====

// 循环右移（用于解码）
function ror(val, r) {
  r = r % 8;
  return ((val >>> r) | (val << (8 - r))) & 0xFF;
}

// 循环左移（用于编码）
function rol(val, r) {
  r = r % 8;
  return ((val << r) | (val >>> (8 - r))) & 0xFF;
}

// 根据索引 i 计算掩码
function computeMask(i) {
  let mask = (1 << (i & 3)) ^ (1 << (i % 7)) ^ (1 << ((i % 13) + 4));
  return mask & 0xFF;
}

// 解码处理
function decode(data) {
  let out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    let r = i % 8;
    let tmp = ror(data[i], r);
    let mask = computeMask(i);
    out[i] = tmp ^ mask;
  }
  return out;
}

// 编码处理
function encode(data) {
  let out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    let r = i % 8;
    let mask = computeMask(i);
    let tmp = data[i] ^ mask;
    out[i] = rol(tmp, r);
  }
  return out;
}

// ===== 生成输出文件名（修改版） =====
// 原逻辑：SM2320XT.FFW_decoded
// 新逻辑：SM2320XT_decoded.FFW
function getOutputName(originalName, mode) {
  const suffix = mode === 'decode' ? '_decoded' : '_encoded';
  // 分离文件名和扩展名
  const lastDotIndex = originalName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // 没有扩展名，直接追加后缀
    return originalName + suffix;
  }
  const nameWithoutExt = originalName.substring(0, lastDotIndex);
  const ext = originalName.substring(lastDotIndex);
  // 插入后缀到扩展名之前
  return nameWithoutExt + suffix + ext;
}

// ===== UI 交互 =====

const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');

function setStatus(type, message) {
  statusEl.className = 'message ' + type;
  statusEl.innerHTML = message;
}

function processFile(mode) {
  const file = fileInput.files[0];
  if (!file) {
    setStatus('error', '⚠️ 请先选择一个文件。');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    const data = new Uint8Array(arrayBuffer);
    let result;
    if (mode === 'decode') {
      result = decode(data);
    } else {
      result = encode(data);
    }

    // 创建 Blob 并下载
    const blob = new Blob([result], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const downloadName = getOutputName(file.name, mode);

    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatus('success', `✅ 处理完成！<a href="${url}" download="${downloadName}">点击重新下载</a>`);
  };
  reader.onerror = function() {
    setStatus('error', '❌ 读取文件失败，请重试。');
  };
  reader.readAsArrayBuffer(file);
  setStatus('info', '⏳ 处理中...');
}

// 绑定按钮事件
document.getElementById('decodeBtn').addEventListener('click', () => processFile('decode'));
document.getElementById('encodeBtn').addEventListener('click', () => processFile('encode'));

// 文件选择后自动更新状态
fileInput.addEventListener('change', function() {
  if (this.files.length > 0) {
    setStatus('info', `📎 已选择：<strong>${this.files[0].name}</strong>（${(this.files[0].size / 1024).toFixed(1)} KB）`);
  } else {
    setStatus('info', '📌 就绪，请选择文件。');
  }
});

console.log('🔐 SM232X FFW 加解密工具已加载');