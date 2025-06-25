/**
 * @file 知识库 IndexedDB 服务
 * @description 提供知识条目的增删改查、分类、标签、搜索等功能
 */

import { ApprovalNodeType } from "@/pages/setting/components/approvalFlow/components/types";

export enum ApprovalStatus {
  PENDING = "pending", // 待审批
  APPROVED = "approved", // 已通过
  REJECTED = "rejected", // 已拒绝
}

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string; // 更新时间
  approvalStatus: ApprovalStatus; // 审批状态
  submittedBy?: string; // 提交人
  submittedAt?: string; // 提交时间
  approvedBy?: string; // 审核人
  approvedAt?: string; // 审批时间
  rejectReason?: string; // 拒绝原因
  documentUrl?: string; // 文档引用地址
  /**
   * 审批流ID
   */
  flowId?: string;
  /**
   * 当前审批节点ID
   */
  currentNodeId?: string;
  /**
   * 已流转节点历史
   */
  nodeHistory?: string[];
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
      const request = indexedDB.open(this.dbName, 2); // 增加版本号
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        let store;

        if (!db.objectStoreNames.contains(this.storeName)) {
          store = db.createObjectStore(this.storeName, { keyPath: "id" });
        } else {
          store = (event.target as IDBOpenDBRequest).transaction!.objectStore(
            this.storeName
          );
        }

        // 创建索引
        if (!store.indexNames.contains("category")) {
          store.createIndex("category", "category", { unique: false });
        }
        if (!store.indexNames.contains("tags")) {
          store.createIndex("tags", "tags", {
            unique: false,
            multiEntry: true,
          });
        }
        if (!store.indexNames.contains("question")) {
          store.createIndex("question", "question", { unique: false });
        }
        if (!store.indexNames.contains("approvalStatus")) {
          store.createIndex("approvalStatus", "approvalStatus", {
            unique: false,
          });
        }
        if (!store.indexNames.contains("submittedAt")) {
          store.createIndex("submittedAt", "submittedAt", { unique: false });
        }
      };
    });
  }

  /**
   * 添加知识条目
   */
  async addItem(item: KnowledgeItem): Promise<void> {
    if (!this.db) await this.init();
    const now = new Date().toISOString();
    const itemWithTimestamps = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: now,
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.add(itemWithTimestamps);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新知识条目
   */
  async updateItem(item: KnowledgeItem): Promise<void> {
    if (!this.db) await this.init();
    const updatedItem = {
      ...item,
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(updatedItem);
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
   * 获取已审批通过的知识条目（用于智能问答）
   */
  async getApprovedItems(): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("approvalStatus");
      const request = index.getAll(ApprovalStatus.APPROVED);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取待审批的知识条目
   */
  async getPendingItems(): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const index = store.index("approvalStatus");
      const request = index.getAll(ApprovalStatus.PENDING);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 审批知识条目（支持审批流流转）
   * @param {string} id - 知识条目ID
   * @param {string} approvedBy - 审批人
   * @param {string} [rejectReason] - 拒绝原因
   * @param {boolean} [approved] - 是否通过（默认true）
   */
  async approveItem(
    id: string,
    approvedBy: string,
    rejectReason?: string,
    approved: boolean = true
  ): Promise<void> {
    if (!this.db) await this.init();
    return new Promise(async (resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const getRequest = store.get(id);
      getRequest.onsuccess = async () => {
        const item = getRequest.result;
        if (!item) {
          reject(new Error("知识条目不存在"));
          return;
        }

        // 审批流逻辑
        if (item.flowId && item.currentNodeId) {
          // 获取审批流配置
          const flowsStr = localStorage.getItem("approvalFlows");
          const flows = flowsStr ? JSON.parse(flowsStr) : [];
          const flow = flows.find((f: any) => f.id === item.flowId);

          if (flow) {
            const currentNode = flow.nodes.find(
              (n: any) => n.id === item.currentNodeId
            );

            if (approved) {
              // 查找下一个节点
              const edge = flow.edges.find(
                (e: any) => e.source === currentNode.id
              );
              const nextNodeId = edge?.target;
              const nextNode = flow.nodes.find((n: any) => n.id === nextNodeId);

              if (!nextNodeId || nextNode?.type === ApprovalNodeType.END) {
                // 流程结束，审批通过
                item.approvalStatus = ApprovalStatus.APPROVED;
                item.currentNodeId = null;
                item.nodeHistory = [
                  ...(item.nodeHistory || []),
                  currentNode.id,
                ];
              } else {
                // 进入下一个节点，继续待审批
                item.currentNodeId = nextNodeId;
                item.nodeHistory = [
                  ...(item.nodeHistory || []),
                  currentNode.id,
                ];
                item.approvalStatus = ApprovalStatus.PENDING;
              }
            } else {
              // 审批拒绝，流程结束
              item.approvalStatus = ApprovalStatus.REJECTED;
              item.rejectReason = rejectReason;
              item.currentNodeId = null;
              item.nodeHistory = [...(item.nodeHistory || []), currentNode.id];
            }
          } else {
            // 没有找到审批流配置，直接通过/拒绝
            item.approvalStatus = approved
              ? ApprovalStatus.APPROVED
              : ApprovalStatus.REJECTED;
            if (!approved) item.rejectReason = rejectReason;
          }
        } else {
          // 没有审批流配置，直接通过/拒绝
          item.approvalStatus = approved
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.REJECTED;
          if (!approved) item.rejectReason = rejectReason;
        }

        item.approvedBy = approvedBy;
        item.approvedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();

        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
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
   * 关键词搜索（问题、答案、标签、分类）- 只搜索已审批通过的内容
   */
  async search(keyword: string): Promise<KnowledgeItem[]> {
    if (!this.db) await this.init();
    const approvedItems = await this.getApprovedItems();
    const kw = keyword.trim().toLowerCase();
    return approvedItems.filter(
      (item) =>
        item.question.toLowerCase().includes(kw) ||
        item.answer.toLowerCase().includes(kw) ||
        item.category.toLowerCase().includes(kw) ||
        item.tags.some((tag) => tag.toLowerCase().includes(kw))
    );
  }
}

export const knowledgeDBService = new KnowledgeDBService();
