import React, { useState, useEffect } from "react";
import { Card, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import CategoryList from "./components/CategoryList";
import AddBookmarkForm from "./components/AddBookmarkForm";
import AddCategoryForm from "./components/AddCategoryForm";
import { Bookmark, Category } from "./components/types";

/**
 * 网页链接收藏夹主入口组件
 * @returns {JSX.Element}
 */
const BookmarkManager: React.FC = () => {
  // 分类和书签状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  // 控制表单显示
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

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
   * 添加新书签
   */
  const handleAddBookmark = (bm: Omit<Bookmark, "id">) => {
    setBookmarks([...bookmarks, { ...bm, id: Date.now().toString() }]);
    setShowAddBookmark(false);
  };

  /**
   * 分类排序/拖拽
   */
  const handleMoveCategory = (from: number, to: number) => {
    const newCats = [...categories];
    const [moved] = newCats.splice(from, 1);
    newCats.splice(to, 0, moved);
    setCategories(newCats.map((c, i) => ({ ...c, order: i })));
  };

  /**
   * 书签移动到其他分类
   */
  const handleMoveBookmark = (bookmarkId: string, toCategoryId: string) => {
    setBookmarks(
      bookmarks.map((b) =>
        b.id === bookmarkId ? { ...b, categoryId: toCategoryId } : b
      )
    );
  };

  return (
    <div style={{ padding: 32, background: "#101522", minHeight: "100vh" }}>
      <Card
        title="网页收藏夹"
        extra={
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddBookmark(true)}
              style={{ marginRight: 8 }}
            >
              添加链接
            </Button>
            <Button onClick={() => setShowAddCategory(true)}>添加分类</Button>
          </>
        }
        style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}
        bodyStyle={{ background: "#181c2b" }}
      >
        <CategoryList
          categories={categories}
          bookmarks={bookmarks}
          onMoveCategory={handleMoveCategory}
          onMoveBookmark={handleMoveBookmark}
        />
      </Card>
      <AddBookmarkForm
        visible={showAddBookmark}
        categories={categories}
        onAdd={handleAddBookmark}
        onCancel={() => setShowAddBookmark(false)}
      />
      <AddCategoryForm
        visible={showAddCategory}
        onAdd={handleAddCategory}
        onCancel={() => setShowAddCategory(false)}
      />
    </div>
  );
};

export default BookmarkManager;
