/**
 * 单个收藏链接
 */
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  categoryId: string;
}

/**
 * 分类
 */
export interface Category {
  id: string;
  name: string;
  order: number;
  parentId?: string; // 顶级分类无parentId
}
