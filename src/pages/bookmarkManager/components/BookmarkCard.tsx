import React from "react";
import { Bookmark } from "./types";
import "./BookmarkCard.css";

/**
 * 单个链接卡片 Props
 */
interface BookmarkCardProps {
  bookmark: Bookmark;
}

/**
 * 单个链接卡片，hover有阴影和背景色变化，点击跳转
 */
const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark }) => {
  return (
    <div
      className="bookmark-card"
      onClick={() => window.open(bookmark.url, "_blank")}
      title={bookmark.title}
    >
      <div className="bookmark-title">{bookmark.title}</div>
      <div className="bookmark-desc">{bookmark.description}</div>
      <div className="bookmark-url">{bookmark.url}</div>
    </div>
  );
};

export default BookmarkCard;
