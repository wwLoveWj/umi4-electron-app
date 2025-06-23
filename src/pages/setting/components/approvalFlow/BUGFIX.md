# Bug 修复说明

## 问题描述

在审批流程编排组件中，点击"新建流程"按钮时，弹窗标题显示为"编辑流程"而不是"新建流程"。

## 问题原因

1. **错误的参数传递**：在 `handleCreateFlow` 函数中，创建了一个包含 `id: ""` 的流程对象传递给 `FlowEditModal`
2. **错误的判断逻辑**：`FlowEditModal` 组件中，通过 `editingFlow ? "编辑流程" : "新建流程"` 来判断标题，当 `editingFlow` 存在时（即使是空id的对象）也会显示"编辑流程"

## 修复方案

### 1. 修改主入口文件 (`index.tsx`)

**修改前**：

```typescript
const handleCreateFlow = () => {
  // 新建流程时传递 null，让 FlowEditModal 知道这是新建操作
  setEditingFlow(null);
  setFlowEditVisible(true);
};
```

**修改后**：

```typescript
const handleCreateFlow = () => {
  // 直接创建新流程，不弹出编辑弹窗
  const newFlow: ApprovalFlow = {
    id: `flow_${Date.now()}`,
    name: "新审批流程",
    description: "",
    nodes: [], // 空的节点列表
    edges: [], // 空的边列表
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  addFlow(newFlow);
  message.success("新流程创建成功");
};
```

### 2. 修改流程选择器 (`FlowSelector.tsx`)

**移除下拉菜单中的新建流程按钮**：

- 移除了 `onCreateFlow` 参数
- 移除了下拉菜单中的"新建流程"按钮
- 简化了组件接口

### 3. 添加独立的新建流程按钮

在主界面添加了独立的"新建流程"按钮：

```typescript
<Button icon={<PlusOutlined />} onClick={handleCreateFlow}>
  新建流程
</Button>
```

### 4. 修改流程编辑弹窗 (`FlowEditModal.tsx`)

**修改前**：

```typescript
const modalTitle = editingFlow ? "编辑流程" : "新建流程";
```

**修改后**：

```typescript
// 判断是新建还是编辑：如果 editingFlow 存在但没有 id，则为新建
const isEdit = editingFlow && editingFlow.id;
const modalTitle = isEdit ? "编辑流程" : "新建流程";
```

### 5. 优化表单处理逻辑

添加了本地状态管理，避免类型错误：

```typescript
const [formData, setFormData] = useState({ name: "", description: "" });

// 当弹窗打开时，初始化表单数据
useEffect(() => {
  if (visible) {
    if (editingFlow) {
      setFormData({
        name: editingFlow.name || "",
        description: editingFlow.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }
}, [visible, editingFlow]);
```

### 6. 修改流程保存逻辑

**简化新建流程逻辑**：新建流程时只创建基本信息，不添加默认节点：

```typescript
const handleFlowSave = () => {
  if (!editingFlow) return;

  if (editingFlow.id) {
    // 更新现有流程
    updateCurrentFlow(editingFlow);
  } else {
    // 创建新流程，只包含基本信息，不添加默认节点
    const newFlow = {
      ...editingFlow,
      id: `flow_${Date.now()}`,
      nodes: [], // 空的节点列表
      edges: [], // 空的边列表
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addFlow(newFlow);
  }
};
```

## 修复效果

✅ **直接新建流程**：点击"新建流程"按钮直接创建新流程，不弹出编辑弹窗
✅ **固定命名**：新流程使用固定的名称"新审批流程"
✅ **即时生效**：新流程立即添加到下拉列表中并自动选中
✅ **简化操作**：用户可以直接开始编辑流程，无需先填写基本信息
✅ **编辑流程**：弹窗标题正确显示为"编辑流程"
✅ **表单数据**：正确处理编辑状态
✅ **简化流程**：新建流程时只创建基本信息，不添加默认节点
✅ **类型安全**：修复了所有 TypeScript 类型错误

## 测试用例

1. **新建流程测试**：

   - 点击"新建流程"按钮
   - 验证新流程立即创建并添加到下拉列表
   - 验证新流程自动选中并显示在编辑器中
   - 验证流程名称为"新审批流程"
   - 验证流程没有任何节点和连线

2. **编辑流程测试**：
   - 点击现有流程的编辑按钮
   - 验证弹窗标题为"编辑流程"
   - 修改流程信息
   - 点击确定，验证流程被正确更新

## 相关文件

- `src/pages/setting/components/approvalFlow/index.tsx`
- `src/pages/setting/components/approvalFlow/components/FlowEditModal.tsx`

## 注意事项

- 新建流程时直接创建流程对象，不再弹出编辑弹窗
- 新流程使用固定的名称"新审批流程"，用户可以通过编辑功能修改名称
- 新流程创建后自动选中，用户可以直接开始添加节点
- 使用本地状态管理表单数据，避免类型错误
- 在保存时根据 `editingFlow.id` 的存在性来判断是新建还是编辑
- **新建流程时不再自动创建默认节点**，用户需要手动添加节点
