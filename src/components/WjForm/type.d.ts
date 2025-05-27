import { ComponentsType } from "./utils/config";
import type { FormInstance, FormItemProps } from "antd";
/**
 * 表单的配置类型
 */
export type WjFormColumnsPropsType<D = any> = {
  dataIndex?: string;
  title?: string;
  valueType?: keyof ComponentsType | string;
  width?: number | string;
  search?: boolean;
  fieldProps?:
    | Record<string, any>
    | ((form: FormInstance) => Record<string, any>);
  formItemProps?: FormItemProps<D> | ((form: FormInstance) => FormItemProps<D>);
  colProps?: { span?: number; style?: object };
};
