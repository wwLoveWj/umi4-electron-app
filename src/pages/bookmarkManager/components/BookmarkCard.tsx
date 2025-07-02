import React from "react";
import { Bookmark } from "./types";
import { CloseOutlined } from "@ant-design/icons";
import "./BookmarkCard.css";

/**
 * 单个链接卡片 Props
 */
interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: () => void;
  className?: string;
}

/**
 * 单个链接卡片，hover有阴影和背景色变化，点击跳转
 */
const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  onDelete,
  className,
}) => {
  return (
    <div
      className={`bookmark-card-container${className ? " " + className : ""}`}
    >
      <div className={`bookmark-card${className ? " " + className : ""}`}>
        <div
          onClick={() => window.open(bookmark.url, "_blank")}
          title={bookmark.title}
        >
          <div className="bookmark-title">{bookmark.title}</div>
          <div className="bookmark-desc">{bookmark.description}</div>
          <div className="bookmark-url">{bookmark.url}</div>
        </div>
        {onDelete && (
          <button
            className="bookmark-delete-btn"
            style={
              className && className.includes("dragging")
                ? { display: "none" }
                : {}
            }
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="删除链接"
          >
            <CloseOutlined />
          </button>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
