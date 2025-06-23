# 审批流程编排组件模块拆分变更日志

## 版本 2.0.0 - 模块化重构

### 🎯 主要变更

#### 模块拆分

- **重构前**: 单一文件包含所有功能（1461行代码）
- **重构后**: 拆分为8个独立模块，代码结构清晰

#### 新增文件结构

```
approvalFlow/
├── index.tsx                 # 主入口文件 (332行)
├── style.css                 # 样式文件
├── CHANGELOG.md              # 变更日志
└── components/               # 组件模块目录
    ├── index.ts              # 组件导出文件
    ├── README.md             # 模块说明文档
    ├── types.ts              # 类型定义 (65行)
    ├── utils.ts              # 工具函数 (89行)
    ├── NodeEditModal.tsx     # 节点编辑弹窗 (237行)
    ├── FlowEditModal.tsx     # 流程编辑弹窗 (68行)
    ├── ContextMenu.tsx       # 右键菜单组件 (47行)
    ├── FlowSelector.tsx      # 流程选择器 (95行)
    ├── GraphEditor.tsx       # 图形编辑器 (344行)
    └── hooks/                # 自定义钩子
        └── useFlowStorage.ts # 流程存储钩子 (140行)
```

### 📦 模块说明

#### 1. 类型定义模块 (`types.ts`)

- `ApprovalNodeType`: 审批节点类型枚举
- `ApprovalModule`: 审批模块枚举
- `ApprovalNode`: 审批节点接口
- `ApprovalFlow`: 审批流程接口

#### 2. 工具函数模块 (`utils.ts`)

- `getModuleName`: 获取模块名称
- `getNodeTypeName`: 获取节点类型名称
- `getNodeHeaderBackground`: 获取节点头部背景色
- `getNodeTypeClass`: 获取节点类型CSS类
- `getNodeIcon`: 获取节点图标

#### 3. 节点编辑弹窗 (`NodeEditModal.tsx`)

- 支持所有节点类型的属性编辑
- 动态表单字段显示
- 完整的表单验证

#### 4. 流程编辑弹窗 (`FlowEditModal.tsx`)

- 流程基本信息编辑
- 支持新建和编辑模式

#### 5. 右键菜单组件 (`ContextMenu.tsx`)

- 节点右键菜单显示
- 删除节点功能

#### 6. 流程选择器 (`FlowSelector.tsx`)

- 流程列表显示
- 流程切换功能
- 新建流程入口
- 流程状态显示

#### 7. 图形编辑器 (`GraphEditor.tsx`)

- 基于 @antv/x6 的图形编辑
- 节点拖拽和连线
- 选中状态管理
- 右键菜单触发

#### 8. 流程存储钩子 (`useFlowStorage.ts`)

- localStorage 数据管理
- 流程增删改查操作
- 示例数据初始化

### 🔧 技术改进

#### 代码质量提升

- **类型安全**: 完整的 TypeScript 类型定义
- **模块化**: 每个功能独立，便于维护
- **可复用性**: 组件可在其他项目中复用
- **可扩展性**: 易于添加新功能

#### 开发体验优化

- **清晰的文件结构**: 功能模块化，便于定位
- **统一的导出接口**: 通过 `components/index.ts` 统一导出
- **详细的文档**: README 和 CHANGELOG 文档
- **JSDoc 注释**: 完整的代码注释

#### 性能优化

- **按需加载**: 组件独立，减少不必要的渲染
- **状态管理**: 使用自定义钩子管理状态
- **内存优化**: 组件销毁时清理资源

### 🚀 使用方式

#### 导入主组件

```typescript
import ApprovalFlowEditor from "./approvalFlow";
```

#### 导入子组件

```typescript
import {
  NodeEditModal,
  FlowEditModal,
  ContextMenu,
  FlowSelector,
  GraphEditor,
} from "./approvalFlow/components";
```

#### 导入类型和工具

```typescript
import {
  ApprovalFlow,
  ApprovalNode,
  ApprovalNodeType,
} from "./approvalFlow/components/types";

import { getModuleName, getNodeIcon } from "./approvalFlow/components/utils";
```

### 📋 向后兼容性

- ✅ 保持原有的所有功能
- ✅ 保持原有的API接口
- ✅ 保持原有的样式和交互
- ✅ 保持原有的数据存储方式

### 🔮 未来规划

#### 短期计划

- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 优化移动端体验
- [ ] 添加更多节点类型

#### 长期计划

- [ ] 支持流程模板
- [ ] 支持流程版本管理
- [ ] 支持流程导入导出
- [ ] 支持多人协作编辑

### 🐛 已知问题

- 无已知问题

### 📝 更新日志

#### 2024-03-20

- ✅ 完成模块拆分重构
- ✅ 创建完整的文档
- ✅ 修复所有类型错误
- ✅ 优化代码结构
- ✅ 修复新建流程标题显示问题
- ✅ 简化新建流程逻辑（不再自动创建默认节点）
- ✅ 优化新建流程体验（直接创建，不弹出编辑弹窗）
- ✅ 使用固定流程名称"新审批流程"
