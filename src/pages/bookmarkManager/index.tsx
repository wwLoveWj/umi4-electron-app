import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  message,
  Tree,
  Dropdown,
  Menu,
  Popconfirm,
  Space,
  Input,
  Modal,
} from "antd";
import {
  PlusOutlined,
  FolderOutlined,
  DeleteOutlined,
  BookOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  EditOutlined,
} from "@ant-design/icons";
import AddCategoryForm from "./components/AddCategoryForm";
import { Bookmark, Category } from "./components/types";
import { buildTree } from "./utils/tree";
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
  const [addParentId, setAddParentId] = useState<string | undefined>(undefined);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [mode, setMode] = useState<"card" | "tree">("card");
  const [renameModal, setRenameModal] = useState<{
    visible: boolean;
    id?: string;
    name?: string;
  }>({ visible: false });
  const [renameValue, setRenameValue] = useState("");
  // 当前选中的分类
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showBookmarkModal, setShowBookmarkModal] = useState<{
    visible: boolean;
    categoryId?: string;
  }>({ visible: false });

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
  const handleAddCategory = (name: string, parentId?: string) => {
    if (categories.find((c) => c.name === name && c.parentId === parentId)) {
      message.error("分类名已存在");
      return;
    }
    setCategories([
      ...categories,
      { id: Date.now().toString(), name, order: categories.length, parentId },
    ]);
    setShowAddCategory(false);
    setAddParentId(undefined);
  };

  /**
   * 删除分类及其所有子分类和书签
   */
  const handleDeleteCategory = (categoryId: string) => {
    const getAllCategoryIds = (id: string): string[] => {
      const children = categories.filter((c) => c.parentId === id);
      return [id, ...children.flatMap((c) => getAllCategoryIds(c.id))];
    };
    const idsToDelete = getAllCategoryIds(categoryId);
    setCategories(categories.filter((c) => !idsToDelete.includes(c.id)));
    setBookmarks(bookmarks.filter((b) => !idsToDelete.includes(b.categoryId)));
    if (idsToDelete.includes(selectedKey)) setSelectedKey("");
  };

  /**
   * 重命名分类
   */
  const handleRenameCategory = (id: string, name: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
    setRenameModal({ visible: false });
    setRenameValue("");
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
  const getCategoryMenu = (categoryId: string, categoryName: string) => (
    <Menu
      items={[
        {
          key: "add",
          icon: <PlusOutlined />,
          label: "添加子文件夹",
          onClick: () => {
            setAddParentId(categoryId);
            setShowAddCategory(true);
          },
        },
        {
          key: "rename",
          icon: <EditOutlined />,
          label: "重命名",
          onClick: () => {
            setRenameModal({
              visible: true,
              id: categoryId,
              name: categoryName,
            });
            setRenameValue(categoryName);
          },
        },
        {
          key: "delete",
          icon: <DeleteOutlined style={{ color: "red" }} />,
          label: (
            <Popconfirm
              title="确定要删除该分类吗？"
              description="删除分类会同时删除其所有子分类和链接，且不可恢复。"
              onConfirm={() => handleDeleteCategory(categoryId)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <span style={{ color: "red" }}>删除</span>
            </Popconfirm>
          ),
        },
      ]}
    />
  );

  // 渲染树节点图标
  const renderTreeIcon = (node: any) => {
    if (node.isLeaf) return <BookOutlined style={{ color: "#00f6ff" }} />;
    return <FolderOutlined style={{ color: "#1890ff" }} />;
  };

  // 树形数据
  const treeData = buildTree(categories);

  // 右侧书签列表
  const currentCategoryId = selectedKey;
  const currentBookmarks = bookmarks.filter(
    (b) => b.categoryId === currentCategoryId
  );
  const currentCategory = categories.find((c) => c.id === currentCategoryId);

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
        title={
          <Space>
            <span>网页收藏夹</span>
            <Button
              icon={
                mode === "card" ? <ApartmentOutlined /> : <AppstoreOutlined />
              }
              onClick={() => setMode(mode === "card" ? "tree" : "card")}
              size="small"
            >
              {mode === "card" ? "树形模式" : "卡片模式"}
            </Button>
          </Space>
        }
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          marginBottom: 24,
          minWidth: 320,
        }}
        className="bookmark-manager-card"
      >
        {mode === "card" ? (
          <div className="category-list-grid">
            {categories
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <Dropdown
                  overlay={getCategoryMenu(category.id, category.name)}
                  trigger={["contextMenu"]}
                  key={category.id}
                >
                  <div
                    className="category-card"
                    onClick={() => setSelectedCategory(category)}
                    style={{ position: "relative" }}
                  >
                    <FolderOutlined className="category-icon" />
                    <div className="category-name" title={category.name}>
                      {category.name}
                    </div>
                    <div className="category-count">
                      {
                        bookmarks.filter((b) => b.categoryId === category.id)
                          .length
                      }{" "}
                      个链接
                    </div>
                  </div>
                </Dropdown>
              ))}
          </div>
        ) : (
          <div style={{ display: "flex", minHeight: 400 }}>
            <div
              style={{
                width: 300,
                background: "#181c2b",
                borderRadius: 8,
                marginRight: 24,
                padding: 16,
              }}
            >
              <Tree
                treeData={treeData}
                showIcon
                icon={renderTreeIcon}
                selectedKeys={[selectedKey]}
                onSelect={(keys) => setSelectedKey(keys[0] as string)}
                titleRender={(nodeData) => {
                  if (!nodeData.isLeaf) {
                    return (
                      <Dropdown
                        overlay={getCategoryMenu(nodeData.key, nodeData.title)}
                        trigger={["contextMenu"]}
                      >
                        <span title={nodeData.title}>{nodeData.title}</span>
                      </Dropdown>
                    );
                  }
                  return <span title={nodeData.title}>{nodeData.title}</span>;
                }}
                defaultExpandAll
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                style={{ marginTop: 16 }}
                onClick={() => {
                  setAddParentId(undefined);
                  setShowAddCategory(true);
                }}
              >
                添加根文件夹
              </Button>
            </div>
            <div
              style={{
                flex: 1,
                background: "#181c2b",
                borderRadius: 8,
                padding: 24,
                minHeight: 400,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#fff",
                  fontSize: 18,
                  marginBottom: 16,
                }}
              >
                {currentCategory ? currentCategory.name : "请选择左侧文件夹"}
              </div>
              {currentCategory ? (
                currentBookmarks.length === 0 ? (
                  <div
                    style={{ color: "#888", textAlign: "center", padding: 40 }}
                  >
                    暂无链接
                  </div>
                ) : (
                  <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                    {currentBookmarks.map((bm) => (
                      <li
                        key={bm.id}
                        style={{
                          marginBottom: 16,
                          background: "#232a3d",
                          borderRadius: 6,
                          padding: 16,
                          color: "#fff",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(bm.url, "_blank")}
                        title={bm.title}
                      >
                        <div style={{ fontWeight: 500, fontSize: 16 }}>
                          {bm.title}
                        </div>
                        <div
                          style={{
                            color: "#b0b8d0",
                            fontSize: 13,
                            margin: "6px 0",
                          }}
                        >
                          {bm.description}
                        </div>
                        <div style={{ color: "#00f6ff", fontSize: 12 }}>
                          {bm.url}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          </div>
        )}
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
        onAdd={(name) => handleAddCategory(name, addParentId)}
        onCancel={() => {
          setShowAddCategory(false);
          setAddParentId(undefined);
        }}
      />
      <Modal
        open={renameModal.visible}
        title="重命名分类"
        onOk={() => handleRenameCategory(renameModal.id!, renameValue)}
        onCancel={() => setRenameModal({ visible: false })}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          maxLength={20}
        />
      </Modal>
      <Modal
        open={showBookmarkModal.visible}
        title={(() => {
          const cat = categories.find(
            (c) => c.id === showBookmarkModal.categoryId
          );
          return cat ? cat.name + " 的链接" : "链接列表";
        })()}
        onCancel={() => setShowBookmarkModal({ visible: false })}
        footer={null}
        width={600}
        destroyOnClose
      >
        {(() => {
          const catId = showBookmarkModal.categoryId;
          const list = bookmarks.filter((b) => b.categoryId === catId);
          if (list.length === 0)
            return (
              <div style={{ color: "#888", textAlign: "center", padding: 40 }}>
                暂无链接
              </div>
            );
          return (
            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {list.map((bm) => (
                <li
                  key={bm.id}
                  style={{
                    marginBottom: 16,
                    background: "#232a3d",
                    borderRadius: 6,
                    padding: 16,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(bm.url, "_blank")}
                  title={bm.title}
                >
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {bm.title}
                  </div>
                  <div
                    style={{ color: "#b0b8d0", fontSize: 13, margin: "6px 0" }}
                  >
                    {bm.description}
                  </div>
                  <div style={{ color: "#00f6ff", fontSize: 12 }}>{bm.url}</div>
                </li>
              ))}
            </ul>
          );
        })()}
      </Modal>
    </div>
  );
};

export default BookmarkManager;
