/**
 * @file IndexedDB 工具类
 */

export enum EmailStatus {
  PENDING = "pending", // 未发送
  SUCCESS = "success", // 发送成功
  FAILED = "failed", // 发送失败
  CANCELLED = "cancelled", // 新增取消状态
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
  taskId?: string; // 新增任务ID字段
}

class IndexedDBUtil {
  private dbName = "emailDB";
  private version = 2; // 增加版本号以支持新字段
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
        let store;

        if (!db.objectStoreNames.contains(this.storeName)) {
          store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        } else {
          store = (event.target as IDBOpenDBRequest).transaction!.objectStore(
            this.storeName
          );
        }

        // 创建索引
        if (!store.indexNames.contains("sendTime")) {
          store.createIndex("sendTime", "sendTime", { unique: false });
        }
        if (!store.indexNames.contains("status")) {
          store.createIndex("status", "status", { unique: false });
        }
        if (!store.indexNames.contains("taskId")) {
          store.createIndex("taskId", "taskId", { unique: true });
        }
      };
    });
  }

  /**
   * 保存邮件记录
   */
  async saveEmailRecord(record: Partial<EmailRecord>): Promise<string> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      // 如果没有传入taskId，则自动生成
      if (!record.taskId) {
        record.taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }

      const request = store.add(record as EmailRecord);

      request.onsuccess = () => {
        resolve(record.taskId!);
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
   * 根据任务ID更新邮件记录
   * @param taskId 任务ID
   * @param updates 要更新的字段
   */
  async updateEmailRecordByTaskId(
    taskId: string,
    updates: Partial<EmailRecord>
  ): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const index = store.index("taskId");
      const request = index.get(taskId);

      request.onsuccess = () => {
        const recordToUpdate = request.result;
        if (recordToUpdate) {
          Object.assign(recordToUpdate, updates);
          const updateRequest = store.put(recordToUpdate);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error(`未找到taskId为 ${taskId} 的记录`));
        }
      };
      request.onerror = () => reject(request.error);
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
