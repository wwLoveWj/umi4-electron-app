import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { SchemaRender } from "react-schema-render";
import { Form, notification } from "antd";
import type { FormInstance, FormProps } from "antd";
import { WjFormColumnsPropsType } from "./type";
import { isFunction, max } from "lodash-es";
import useResponsiveSize from "./hooks/useResponsiveSize";

type FieldType = {
  username?: string;
  password?: string;
  remember?: string;
};

/**
 * @description 表单传参示例
 * const formConfigList: WjFormColumnsPropsType[] = [
    {
      valueType: "search",
      dataIndex: "username",
      title: "用户名",
      formItemProps: {
        rules: [{ required: true, message: "用户名必填" }],
      },
      fieldProps: {
        placeholder: "请输入用户名",
        onSearch: (value: string) => {
          console.log("search");
        },
      },
    },
    {
      valueType: "input",
      dataIndex: "username",
      title: "用户名",
      formItemProps: {
        rules: [{ required: true, message: "请输入用户名" }],
      },
    },
    {
      valueType: "number",
      dataIndex: "age",
      title: "年龄",
      formItemProps: {
        rules: [{ required: true, message: "请输入年龄" }],
      },
    },
    {
      valueType: "password",
      dataIndex: "username",
      title: "用户密码",
      formItemProps: {
        rules: [{ required: true, message: "请输入用户密码" }],
      },
    },
    {
      valueType: "select",
      dataIndex: "userType",
      title: "用户类型",
      formItemProps: {
        rules: [{ required: true, message: "请选择用户类型" }],
      },
      fieldProps: {
        options: [
          {
            label: "超级管理员",
            value: "1",
          },
          {
            label: "普通用户",
            value: "2",
          },
        ],
      },
    },
    {
      valueType: "textarea",
      dataIndex: "description",
      title: "描述",
      formItemProps: {
        rules: [{ required: true, message: "请输入描述" }],
      },
      fieldProps: {
        placeholder: "请输入描述",
      },
    },
  ];
 */

export default forwardRef<
  HTMLDivElement,
  {
    formConfigList: WjFormColumnsPropsType[];
    form?: FormInstance;
    successNotify?: boolean;
    successNotifyProps?: any;
    submitter?: {
      submitText?: string;
      resetText?: string;
      resetBtnProps?: any;
      submitBtnProps?: any;
    };
    formType?: "basic" | "search";
    defaultCollapsed?: boolean;
    columnShow?: number; //一行展示几列
    onFinish?: any;
    loading?: boolean;
    onSubmit?: () => void;
    onReset?: () => void;
    [propsname: string]: any;
  }
>(function Index(
  {
    formConfigList,
    form: formInstance,
    successNotifyProps,
    successNotify = true,
    defaultCollapsed = true,
    columnShow = 4,
    onFinish,
    loading,
    submitter,
    onSubmit,
    onReset,
    formType = "search",
    ishideLabel = false, //是否隐藏label
    formRef,
    ...restProps
  },
  ref
) {
  // 常规表单项
  const tableSearchColumns =
    formType === "search"
      ? formConfigList?.filter((column: any) => column.search) || []
      : formConfigList;
  // 响应式列数量
  const columnNumber = useResponsiveSize(columnShow);
  const [form] = Form.useForm(formInstance);
  const btnFormRef = useRef({ collapsed: false });
  const [configFilters, setConfigFilters] = useState(tableSearchColumns);
  /**
   * 表单提交
   */
  const handleFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    console.log("Success:", values);
    await onFinish?.(values);
    if (successNotify) {
      notification.success(successNotifyProps || { message: "提交成功" });
    }
  };
  /**
   * 表单提交失败
   */
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.error("Failed:", errorInfo);
    form?.scrollToField(
      { name: errorInfo?.errorFields?.[0]?.name },
      { block: "center", behavior: "smooth" }
    );
  };
  /**
   * 表单布局props
   */
  const formItemLayout = {
    // layout: "inline",
    colProps: { span: 8, style: {} },
    noCard: false,
    title: "",
    ...restProps,
  };
  // 获取placeholder提示
  const getPlaceholderTips = (column: WjFormColumnsPropsType) => {
    return ["select", "date"]?.includes(column?.valueType || "")
      ? `请选择${column?.title}`
      : `请输入${column?.title}`;
  };
  // 整体的formItem渲染结果
  const fromItemRender = (config: WjFormColumnsPropsType<{ rules: any }>[]) => {
    return config?.map((column) => {
      return {
        component: "col",
        span:
          formType === "basic"
            ? 24
            : column?.colProps?.span || formItemLayout?.colProps?.span || 12,
        style: column?.colProps?.style,
        children: {
          component: "formitem",
          label: ishideLabel ? "" : column?.title,
          name: column?.dataIndex,
          ...column?.formItemProps,
          rules: column?.formItemProps?.rules[0]?.required
            ? [
                Object.assign(
                  {
                    message: getPlaceholderTips(column),
                  },
                  ...column?.formItemProps?.rules
                ),
              ]
            : undefined,
          // 根据type类型来决定渲染的组件
          children: {
            component: column?.valueType || "input",
            placeholder: getPlaceholderTips(column),
            allowClear: true,
            ...column?.fieldProps,
            style: column?.valueType === "switch" ? {} : { width: "100%" },
          },
        },
      };
    });
  };

  const watchConfigFiltersList = (collapsed: boolean) => {
    // 最终展现的收起或展开状态的表单查询配置
    const configFiltersList = tableSearchColumns.map((column, index) => {
      const minColumnNumber = max([columnNumber - 1, 1]) ?? 1;
      if (index >= minColumnNumber && collapsed) {
        return {
          ...column,
          colProps: { style: { display: "none" } },
        };
      }
      return {
        ...column,
        colProps: { span: 24 / columnNumber }, //根据配置的span来计算宽度
      };
    });
    setConfigFilters(configFiltersList);
  };
  // 监听查询项的收起与展开动作
  const onChgCollapsed = (collapsed: boolean) => {
    watchConfigFiltersList(collapsed);
  };
  // 初始化，即第一次时
  useEffect(() => {
    watchConfigFiltersList(btnFormRef?.current?.collapsed);
  }, [btnFormRef?.current?.collapsed]);
  // 组装schema的配置信息
  const schemaConfig = () => ({
    ref,
    component: "wjfrom",
    initialValues: { remember: true },
    onFinishFailed,
    onFinish: handleFinish,
    autoComplete: "off",
    form,
    style: { width: "100%" },
    labelCol: ishideLabel ? { span: 2 } : { span: 6 },
    wrapperCol: ishideLabel ? { span: 22 } : { span: 18 },
    ...formItemLayout,
    children: {
      component: "row",
      // gutter: [0, 20],
      justify: formType === "basic" ? "" : "end",
      children:
        formType === "basic"
          ? [...fromItemRender(configFilters)]
          : [
              ...fromItemRender(configFilters),
              // 查询和重置按钮部分
              {
                component: "col",
                style: { flex: "auto" },
                children: {
                  component: "searchForm",
                  loading,
                  submitter,
                  defaultCollapsed,
                  column: columnShow,
                  tableSearchColumns,
                  onSubmit,
                  onReset,
                  form,
                  btnFormRef,
                  onChgCollapsed,
                },
              },
              // {
              //   component: "space",
              //   children: [
              //     {
              //       component: "button",
              //       span: 12,
              //       children: btnConfig?.submitTxt || "查询",
              //       type: "primary",
              //       htmlType: "submit",
              //     },
              //     {
              //       component: "button",
              //       span: 12,
              //       children: btnConfig?.cancelTxt || "重置",
              //       onClick: () => {
              //         (btnConfig?.onCancel && btnConfig?.onCancel()) ||
              //           form.resetFields();
              //       },
              //     },
              //   ],
              // },
            ],
    },
  });

  // 最终的schema配置信息
  const schema = () => {
    //   是否需要卡片包裹
    return formItemLayout?.noCard
      ? schemaConfig()
      : {
          component: "card",
          title: formItemLayout?.title,
          bordered: false,
          style: { width: "100%" },
          bodyStyle: { padding: "24px 24px 0" },
          children: schemaConfig(),
        };
  };
  useImperativeHandle(formRef, () => {
    return {
      getFieldsValue: form.getFieldsValue,
    };
  });
  return <SchemaRender schema={schema()}></SchemaRender>;
});
