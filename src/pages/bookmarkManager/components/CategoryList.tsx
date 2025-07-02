import React from "react";
import { Bookmark, Category } from "./types";
import BookmarkCard from "./BookmarkCard";
import { Card } from "antd";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

/**
 * 分类列表组件 Props
 */
interface CategoryListProps {
  categories: Category[];
  bookmarks: Bookmark[];
  onMoveCategory: (from: number, to: number) => void;
  onMoveBookmark: (bookmarkId: string, toCategoryId: string) => void;
}

/**
 * 分类列表组件，支持分类和卡片拖拽
 */
const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  bookmarks,
  onMoveCategory,
  onMoveBookmark,
}) => {
  // 拖拽结束回调
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;
    if (type === "category") {
      if (source.index !== destination.index) {
        onMoveCategory(source.index, destination.index);
      }
    } else if (type === "bookmark") {
      // 卡片拖拽到其他分类
      const toCategoryId = destination.droppableId;
      onMoveBookmark(draggableId, toCategoryId);
    }
  };

  return (
    // @ts-ignore - react-beautiful-dnd 与 React 18+ 兼容性问题
    <DragDropContext onDragEnd={onDragEnd}>
      {/* @ts-ignore */}
      <Droppable
        droppableId="all-categories"
        direction="horizontal"
        type="category"
      >
        {(provided: any) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ display: "flex", gap: 24 }}
          >
            {categories
              .sort((a, b) => a.order - b.order)
              .map((cat, idx) => (
                // @ts-ignore
                <Draggable draggableId={cat.id} index={idx} key={cat.id}>
                  {(catProvided: any) => (
                    <div
                      ref={catProvided.innerRef}
                      {...catProvided.draggableProps}
                      style={{
                        minWidth: 320,
                        ...catProvided.draggableProps.style,
                      }}
                    >
                      <Card
                        title={
                          <span {...catProvided.dragHandleProps}>
                            {cat.name}
                          </span>
                        }
                        style={{ background: "#232a3d", marginBottom: 16 }}
                        bodyStyle={{ background: "#232a3d", minHeight: 180 }}
                      >
                        {/* @ts-ignore */}
                        <Droppable droppableId={cat.id} type="bookmark">
                          {(dropProvided: any) => (
                            <div
                              ref={dropProvided.innerRef}
                              {...dropProvided.droppableProps}
                            >
                              {bookmarks
                                .filter((b) => b.categoryId === cat.id)
                                .map((bm, bmIdx) => (
                                  // @ts-ignore
                                  <Draggable
                                    draggableId={bm.id}
                                    index={bmIdx}
                                    key={bm.id}
                                  >
                                    {(bmProvided: any, bmSnapshot: any) => (
                                      <div
                                        ref={bmProvided.innerRef}
                                        {...bmProvided.draggableProps}
                                        {...bmProvided.dragHandleProps}
                                        style={{
                                          marginBottom: 16,
                                          ...bmProvided.draggableProps.style,
                                        }}
                                      >
                                        <BookmarkCard
                                          bookmark={bm}
                                          className={
                                            bmSnapshot.isDragging
                                              ? "dragging"
                                              : ""
                                          }
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {dropProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default CategoryList;
