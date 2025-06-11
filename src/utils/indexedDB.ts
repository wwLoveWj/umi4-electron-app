/**
 * @file IndexedDB 工具类
 */

interface EmailRecord {
  id?: number;
  sendTime: string;
  sender: string;
  content: string;
  subject: string;
  isSuccess: boolean;
  recipients: string;
}

class IndexedDBUtil {
  private dbName = "emailDB";
  private version = 1;
  private storeName = "emailRecords";

  /**
   * 初始化数据库
   */
  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("数据库打开失败"));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("sendTime", "sendTime", { unique: false });
          store.createIndex("isSuccess", "isSuccess", { unique: false });
        }
      };
    });
  }

  /**
   * 保存邮件记录
   */
  async saveEmailRecord(record: EmailRecord): Promise<number> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(record);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error("保存邮件记录失败"));
      };
    });
  }

  /**
   * 获取所有邮件记录
   */
  async getAllEmailRecords(): Promise<EmailRecord[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error("获取邮件记录失败"));
      };
    });
  }

  /**
   * 删除邮件记录
   */
  async deleteEmailRecord(id: number): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("删除邮件记录失败"));
      };
    });
  }
}

export const indexedDBUtil = new IndexedDBUtil();
export type { EmailRecord };
