import React, { useState, useEffect } from "react";
import { Card, Button, message, Dropdown, Menu, Popconfirm } from "antd";
import {
  PlusOutlined,
  FolderOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import AddCategoryForm from "./components/AddCategoryForm";
import { Bookmark, Category } from "./components/types";
import "./index.css";
import CategoryDetail from "./components/CategoryDetail";

/**
 * 网页链接收藏夹主入口组件 - 文件夹模式
 * @returns {JSX.Element}
 */
const BookmarkManager: React.FC = () => {
  // 分类和书签状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  // 控制表单显示
  const [showAddCategory, setShowAddCategory] = useState(false);
  // 当前选中的分类
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // 数据持久化
  useEffect(() => {
    const cat = localStorage.getItem("bookmark-categories");
    const bm = localStorage.getItem("bookmark-list");
    if (cat) setCategories(JSON.parse(cat));
    if (bm) setBookmarks(JSON.parse(bm));
  }, []);
  useEffect(() => {
    localStorage.setItem("bookmark-categories", JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem("bookmark-list", JSON.stringify(bookmarks));
  }, [bookmarks]);

  /**
   * 添加新分类
   */
  const handleAddCategory = (name: string) => {
    if (categories.find((c) => c.name === name)) {
      message.error("分类名已存在");
      return;
    }
    setCategories([
      ...categories,
      { id: Date.now().toString(), name, order: categories.length },
    ]);
    setShowAddCategory(false);
  };

  /**
   * 删除分类及其下所有书签
   */
  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter((c) => c.id !== categoryId));
    setBookmarks(bookmarks.filter((b) => b.categoryId !== categoryId));
  };

  /**
   * 点击分类卡片
   */
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  /**
   * 返回分类列表
   */
  const handleBackToList = () => {
    setSelectedCategory(null);
  };

  /**
   * 获取分类下的书签数量
   */
  const getBookmarkCount = (categoryId: string) => {
    return bookmarks.filter((b) => b.categoryId === categoryId).length;
  };

  /**
   * 右键菜单
   */
  const getCategoryMenu = (categoryId: string) => (
    <Menu
      items={[
        {
          key: "delete",
          label: (
            <Popconfirm
              title="确定要删除该分类吗？"
              description="删除分类会同时删除该分类下所有链接，且不可恢复。"
              onConfirm={() => handleDeleteCategory(categoryId)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <span style={{ color: "red" }}>
                <DeleteOutlined /> 删除分类
              </span>
            </Popconfirm>
          ),
        },
      ]}
    />
  );

  // 如果选中了分类，显示分类详情页面
  if (selectedCategory) {
    return (
      <CategoryDetail
        category={selectedCategory}
        bookmarks={bookmarks.filter(
          (b) => b.categoryId === selectedCategory.id
        )}
        onBack={handleBackToList}
        onBookmarksChange={(newBookmarks: Bookmark[]) => {
          const otherBookmarks = bookmarks.filter(
            (b) => b.categoryId !== selectedCategory.id
          );
          setBookmarks([...otherBookmarks, ...newBookmarks]);
        }}
      />
    );
  }

  // 显示分类列表页面
  return (
    <div style={{ padding: 32, background: "#101522", minHeight: "100vh" }}>
      <Card
        title="网页收藏夹"
        extra={
          <Button onClick={() => setShowAddCategory(true)}>添加分类</Button>
        }
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          marginBottom: 24,
          minWidth: 320,
        }}
        className="bookmark-manager-card"
      >
        <div className="category-list-grid">
          {categories
            .sort((a, b) => a.order - b.order)
            .map((category) => (
              <Dropdown
                overlay={getCategoryMenu(category.id)}
                trigger={["contextMenu"]}
                key={category.id}
              >
                <div
                  className="category-card"
                  onClick={() => handleCategoryClick(category)}
                  style={{ position: "relative" }}
                >
                  <FolderOutlined className="category-icon" />
                  <div className="category-name" title={category.name}>
                    {category.name}
                  </div>
                  <div className="category-count">
                    {getBookmarkCount(category.id)} 个链接
                  </div>
                </div>
              </Dropdown>
            ))}
        </div>
        {categories.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#666", padding: "40px 0" }}
          >
            暂无分类，请先添加分类
          </div>
        )}
      </Card>
      <AddCategoryForm
        visible={showAddCategory}
        onAdd={handleAddCategory}
        onCancel={() => setShowAddCategory(false)}
      />
    </div>
  );
};

export default BookmarkManager;
