/**
 * @file IndexedDB 工具类
 */

export enum EmailStatus {
  PENDING = "pending", // 未发送
  SUCCESS = "success", // 发送成功
  FAILED = "failed", // 发送失败
}

interface EmailRecord {
  id?: number;
  sendTime?: string;
  sender: string;
  content: string;
  subject: string;
  status: EmailStatus; // 修改为 status 字段
  recipients: string;
  emailType: string;
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
          store.createIndex("status", "status", { unique: false }); // 修改索引
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
        // 对旧数据进行兼容处理
        const records = request.result.map((record: EmailRecord) => ({
          ...record,
          emailType: record.emailType || "即时邮件", // 如果没有 emailType 字段，默认为即时邮件
        }));
        resolve(records);
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

  /**
   * 更新邮件记录
   */
  async updateEmailRecord(
    id: number,
    updates: Partial<EmailRecord>
  ): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      // 先获取现有记录
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) {
          reject(new Error("邮件记录不存在"));
          return;
        }

        // 更新记录，确保保留 emailType 字段
        const updatedRecord = {
          ...record,
          ...updates,
          emailType: record.emailType || "即时邮件", // 确保保留 emailType 字段
        };
        const updateRequest = store.put(updatedRecord);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(new Error("更新邮件记录失败"));
        };
      };

      getRequest.onerror = () => {
        reject(new Error("获取邮件记录失败"));
      };
    });
  }
}

export const indexedDBUtil = new IndexedDBUtil();
export type { EmailRecord };
