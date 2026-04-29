import api from './axios';

export async function downloadFile(url, filename) {
  const response = await api.get(url, {
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');

  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
