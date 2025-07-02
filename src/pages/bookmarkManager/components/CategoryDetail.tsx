import React, { useState } from "react";
import { Button, Card, message, Space } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { Bookmark, Category } from "./types";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkForm from "./AddBookmarkForm";

interface CategoryDetailProps {
  category: Category;
  bookmarks: Bookmark[];
  onBack: () => void;
  onBookmarksChange: (newBookmarks: Bookmark[]) => void;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({
  category,
  bookmarks,
  onBack,
  onBookmarksChange,
}) => {
  const [showAdd, setShowAdd] = useState(false);

  // 添加书签
  const handleAddBookmark = (bookmark: Omit<Bookmark, "id" | "categoryId">) => {
    if (bookmarks.find((b) => b.url === bookmark.url)) {
      message.error("该链接已存在");
      return;
    }
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      categoryId: category.id,
    };
    onBookmarksChange([...bookmarks, newBookmark]);
    setShowAdd(false);
  };

  // 删除书签
  const handleDelete = (id: string) => {
    onBookmarksChange(bookmarks.filter((b) => b.id !== id));
  };

  return (
    <div style={{ padding: 32, background: "#101522", minHeight: "100vh" }}>
      <Card
        title={
          <span>
            <ArrowLeftOutlined
              onClick={onBack}
              style={{ marginRight: 16, cursor: "pointer" }}
            />
            {category.name}
          </span>
        }
        extra={
          <Button icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
            添加链接
          </Button>
        }
        style={{ maxWidth: 600, margin: "0 auto", marginBottom: 24 }}
        bodyStyle={{ background: "#181c2b" }}
      >
        {bookmarks.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#666", padding: "40px 0" }}
          >
            暂无链接，请先添加
          </div>
        )}
        {bookmarks.map((bm) => (
          <div key={bm.id} style={{ marginBottom: 16 }}>
            <BookmarkCard bookmark={bm} onDelete={() => handleDelete(bm.id)} />
          </div>
        ))}
      </Card>
      <AddBookmarkForm
        visible={showAdd}
        onAdd={handleAddBookmark}
        onCancel={() => setShowAdd(false)}
      />
    </div>
  );
};

export default CategoryDetail;
