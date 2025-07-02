import { Category } from "../components/types";

/**
 * 只构建分类（文件夹）树，不包含书签节点
 */
export function buildTree(categories: Category[]) {
  const categoryMap = new Map<string, any>();
  categories.forEach((cat) =>
    categoryMap.set(cat.id, {
      ...cat,
      key: cat.id,
      title: cat.name,
      children: [],
    })
  );

  // 分类挂到父分类
  categories.forEach((cat) => {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(categoryMap.get(cat.id));
      }
    }
  });

  // 返回顶级分类
  return categories
    .filter((cat) => !cat.parentId)
    .map((cat) => categoryMap.get(cat.id));
}
