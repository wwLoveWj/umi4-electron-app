/**
 * @file IndexedDB 服务类
 */
export interface CodeNode {
  key: string;
  title: string;
  code?: string;
  children?: CodeNode[];
  parentKey?: string;
  shareId?: string;
  language?: string;
}

class IndexedDBService {
  private dbName = "codeSnippetsDB";
  private storeName = "codeSnippets";
  private shareStoreName = "sharedSnippets";
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let store;
        if (!db.objectStoreNames.contains(this.storeName)) {
          store = db.createObjectStore(this.storeName, { keyPath: "key" });
        } else {
          store = (event.target as IDBOpenDBRequest).transaction!.objectStore(
            this.storeName
          );
        }
        // 确保 parentKey 索引存在
        if (!store.indexNames.contains("parentKey")) {
          store.createIndex("parentKey", "parentKey", { unique: false });
        }
        if (!db.objectStoreNames.contains(this.shareStoreName)) {
          const store = db.createObjectStore(this.shareStoreName, {
            keyPath: "shareId",
          });
          store.createIndex("nodeKey", "nodeKey", { unique: true });
        }
      };
    });
  }

  /**
   * 生成分享链接
   */
  async shareSnippet(nodeKey: string): Promise<string> {
    if (!this.db) await this.init();
    return new Promise(async (resolve, reject) => {
      try {
        // 获取代码片段
        const node = await this.getSnippetByKey(nodeKey);
        if (!node) {
          throw new Error("代码片段不存在");
        }

        // 生成分享ID
        const shareId = `share_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // 保存分享信息
        const transaction = this.db!.transaction(
          [this.shareStoreName],
          "readwrite"
        );
        const store = transaction.objectStore(this.shareStoreName);
        await store.add({
          shareId,
          nodeKey,
          createTime: new Date().toISOString(),
        });

        // 更新节点的分享ID
        await this.updateSnippet({
          ...node,
          shareId,
        });

        resolve(shareId);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取分享的代码片段
   */
  async getSharedSnippet(shareId: string): Promise<CodeNode | null> {
    if (!this.db) await this.init();
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db!.transaction(
          [this.shareStoreName],
          "readonly"
        );
        const store = transaction.objectStore(this.shareStoreName);
        const request = store.get(shareId);

        request.onerror = () => reject(request.error);
        request.onsuccess = async () => {
          const shareInfo = request.result;
          if (!shareInfo) {
            resolve(null);
            return;
          }

          const node = await this.getSnippetByKey(shareInfo.nodeKey);
          resolve(node);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 根据key获取代码片段
   */
  async getSnippetByKey(key: string): Promise<CodeNode | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * 获取所有代码片段
   */
  async getAllSnippets(): Promise<CodeNode[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const nodes = request.result;
        // 构建树形结构
        const nodeMap = new Map<string, CodeNode>();
        const rootNodes: CodeNode[] = [];

        // 首先将所有节点放入 Map
        nodes.forEach((node: CodeNode) => {
          nodeMap.set(node.key, { ...node, children: [] });
        });

        // 构建树形结构
        nodes.forEach((node: CodeNode) => {
          const nodeWithChildren = nodeMap.get(node.key)!;
          if (node.parentKey) {
            const parent = nodeMap.get(node.parentKey);
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(nodeWithChildren);
            }
          } else {
            rootNodes.push(nodeWithChildren);
          }
        });

        resolve(rootNodes);
      };
    });
  }

  /**
   * 添加代码片段
   */
  async addSnippet(snippet: CodeNode): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(snippet);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 更新代码片段
   */
  async updateSnippet(snippet: CodeNode): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(snippet);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 删除代码片段及其子节点（带详细日志和异常捕获）
   */
  async deleteSnippet(key: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      let index: IDBIndex;
      try {
        index = store.index("parentKey");
      } catch (e) {
        console.error("parentKey 索引不存在", e);
        reject(e);
        return;
      }

      // 递归删除子节点
      const deleteChildren = async (parentKey: string) => {
        let children: CodeNode[] = [];
        try {
          children = await new Promise<CodeNode[]>((resolve, reject) => {
            const request = index.getAll(parentKey);
            request.onerror = () => {
              console.error("获取子节点失败", request.error);
              reject(request.error);
            };
            request.onsuccess = () => resolve(request.result);
          });
        } catch (e) {
          console.error("获取子节点异常", e);
          throw e;
        }

        for (const child of children) {
          await deleteChildren(child.key);
          await new Promise<void>((resolve, reject) => {
            const request = store.delete(child.key);
            request.onerror = () => {
              console.error(`删除子节点${child.key}失败`, request.error);
              reject(request.error);
            };
            request.onsuccess = () => resolve();
          });
        }
      };

      deleteChildren(key)
        .then(() => {
          const request = store.delete(key);
          request.onerror = () => {
            console.error("删除主节点失败", request.error);
            reject(request.error);
          };
          request.onsuccess = () => resolve();
        })
        .catch((e) => {
          console.error("递归删除失败", e);
          reject(e);
        });
    });
  }
}

export const indexedDBService = new IndexedDBService();
