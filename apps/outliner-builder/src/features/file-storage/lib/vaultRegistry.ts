/**
 * @file vaultRegistry.ts
 * @description 마지막으로 연 보관함 폴더를 브라우저(IndexedDB)에 기억해 두는 저장소
 *
 * 폴더 핸들은 문자열로 바꿀 수 없어서 IndexedDB 에만 보관할 수 있다.
 * 기억하지 못해도 앱은 동작해야 하므로, 실패는 "기억 없음"으로 취급한다.
 */

const DB_NAME = 'outliner-builder';
const STORE_NAME = 'vault';
const LAST_VAULT_KEY = 'last';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function rememberVault(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    await run('readwrite', (store) => store.put(handle, LAST_VAULT_KEY));
  } catch (err) {
    console.warn('보관함을 기억하지 못했습니다:', err);
  }
}

export async function recallVault(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await run<unknown>('readonly', (store) => store.get(LAST_VAULT_KEY));
    return handle instanceof FileSystemDirectoryHandle ? handle : null;
  } catch {
    return null;
  }
}
