/**
 * @file 知识库 IndexedDB 服务
 * @description 提供知识条目的增删改查、分类、标签、搜索等功能
 */

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

class KnowledgeDBService {
  private dbName = "knowledgeBaseDB";
  private storeName = "knowledgeItems";
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("category", "category", { unique: false });
          store.createIndex("tags", "tags", {
            unique: false,
            multiEntry: true,
          });
          store.createIndex("question", "question", { unique: false });
        }
      };
    });
  }

  /**
   * 添加知识条目
   */
  async addItem(item: KnowledgeItem): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新知识条目
   */
  async updateItem(item: KnowledgeItem): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除知识条目
   */
  async deleteItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取所有知识条目
   */
  async getAllItems(): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 按分类获取知识条目
   */
  async getItemsByCategory(category: string): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("category");
      const request = index.getAll(category);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 按标签获取知识条目
   */
  async getItemsByTag(tag: string): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("tags");
      const request = index.getAll(tag);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关键词搜索（问题、答案、标签、分类）
   */
  async search(keyword: string): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    const all = await this.getAllItems();
    const kw = keyword.trim().toLowerCase();
    return all.filter(
      (item) =>
        item.question.toLowerCase().includes(kw) ||
        item.answer.toLowerCase().includes(kw) ||
        item.category.toLowerCase().includes(kw) ||
        item.tags.some((tag) => tag.toLowerCase().includes(kw))
    );
  }
}

export const knowledgeDBService = new KnowledgeDBService();
