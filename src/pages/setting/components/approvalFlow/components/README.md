# 审批流程编排组件模块

## 模块结构

```
approvalFlow/
├── index.tsx                 # 主入口文件
├── style.css                 # 样式文件
└── components/               # 组件模块目录
    ├── index.ts              # 组件导出文件
    ├── types.ts              # 类型定义
    ├── utils.ts              # 工具函数
    ├── NodeEditModal.tsx     # 节点编辑弹窗组件
    ├── FlowEditModal.tsx     # 流程编辑弹窗组件
    ├── ContextMenu.tsx       # 右键菜单组件
    ├── FlowSelector.tsx      # 流程选择器组件
    ├── GraphEditor.tsx       # 图形编辑器组件
    └── hooks/                # 自定义钩子
        └── useFlowStorage.ts # 流程存储钩子
```

## 组件说明

### 1. NodeEditModal.tsx

**功能**: 节点编辑弹窗组件
**职责**:

- 编辑节点属性（名称、类型、审批人、必审人等）
- 根据节点类型显示不同的表单字段
- 支持审批人、邮件催办、条件分支等不同类型节点

### 2. FlowEditModal.tsx

**功能**: 流程编辑弹窗组件
**职责**:

- 编辑流程基本信息（名称、描述）
- 支持新建和编辑流程

### 3. ContextMenu.tsx

**功能**: 右键菜单组件
**职责**:

- 显示节点右键菜单
- 提供删除节点等操作

### 4. FlowSelector.tsx

**功能**: 流程选择器组件
**职责**:

- 显示流程列表
- 支持切换流程
- 提供新建流程入口
- 显示流程状态和节点数量

### 5. GraphEditor.tsx

**功能**: 图形编辑器组件
**职责**:

- 基于 @antv/x6 的图形编辑器
- 节点拖拽、连线、删除
- 节点选中状态管理
- 右键菜单触发

### 6. useFlowStorage.ts

**功能**: 流程存储钩子
**职责**:

- 管理流程数据的本地存储
- 提供流程的增删改查操作
- 初始化示例数据

### 7. types.ts

**功能**: 类型定义文件
**包含**:

- `ApprovalNodeType`: 审批节点类型枚举
- `ApprovalModule`: 审批模块枚举
- `ApprovalNode`: 审批节点接口
- `ApprovalFlow`: 审批流程接口

### 8. utils.ts

**功能**: 工具函数文件
**包含**:

- `getModuleName`: 获取模块名称
- `getNodeTypeName`: 获取节点类型名称
- `getNodeHeaderBackground`: 获取节点头部背景色
- `getNodeTypeClass`: 获取节点类型CSS类
- `getNodeIcon`: 获取节点图标

## 使用方式

### 导入组件

```typescript
import ApprovalFlowEditor from "./approvalFlow";
```

### 导入子组件

```typescript
import {
  NodeEditModal,
  FlowEditModal,
  ContextMenu,
  FlowSelector,
  GraphEditor,
} from "./approvalFlow/components";
```

### 导入类型

```typescript
import {
  ApprovalFlow,
  ApprovalNode,
  ApprovalNodeType,
  ApprovalModule,
} from "./approvalFlow/components/types";
```

### 导入工具函数

```typescript
import {
  getModuleName,
  getNodeTypeName,
  getNodeIcon,
} from "./approvalFlow/components/utils";
```

## 特性

1. **模块化设计**: 每个功能模块独立，便于维护和扩展
2. **类型安全**: 完整的 TypeScript 类型定义
3. **响应式设计**: 支持不同屏幕尺寸
4. **本地存储**: 使用 localStorage 保存流程数据
5. **拖拽连线**: 基于 @antv/x6 的图形编辑功能
6. **右键菜单**: 支持节点右键操作
7. **表单验证**: 完整的表单验证和错误提示

## 扩展说明

如需添加新的节点类型或功能：

1. 在 `types.ts` 中添加新的枚举值
2. 在 `utils.ts` 中添加对应的工具函数
3. 在 `NodeEditModal.tsx` 中添加对应的表单字段
4. 在 `GraphEditor.tsx` 中添加对应的节点渲染逻辑
5. 在 `style.css` 中添加对应的样式
