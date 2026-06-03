export type DownloadPayload = Blob | ArrayBuffer | string | { url: string };

export function isUrlPayload(data: unknown): data is { url: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'url' in data &&
    typeof (data as { url: string }).url === 'string'
  );
}

export function downloadFromUrl(url: string, fileName?: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (fileName) {
    anchor.download = fileName;
  }
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadFromServiceData(
  data: DownloadPayload | undefined,
  fileName: string,
  mimeType = 'application/octet-stream'
): void {
  if (!data) {
    throw new Error('No download data received');
  }

  if (isUrlPayload(data)) {
    downloadFromUrl(data.url, fileName);
    return;
  }

  const blob =
    data instanceof Blob ? data : new Blob([data as BlobPart], { type: mimeType });
  downloadBlob(blob, fileName);
}
