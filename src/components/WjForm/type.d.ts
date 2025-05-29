import { ComponentsType } from "./utils/config";
import type { FormInstance, FormItemProps } from "antd";

export type FieldPropsType =
  | Record<string, any>
  | ((form: FormInstance) => Record<string, any>);
export type FieldRenderType =
  | ReactNode
  | ((form: FormInstance<any>) => ReactNode);
/**
 * 表单的配置类型
 */
export type WjFormColumnsPropsType<D = any> = {
  dataIndex?: string;
  title?: string;
  valueType?: keyof ComponentsType | string;
  width?: number | string;
  search?: boolean;
  fieldProps?: FieldPropsType;
  fieldRender?: FieldRenderType;
  formItemProps?: FormItemProps<D> | ((form: FormInstance) => FormItemProps<D>);
  colProps?: { span?: number; style?: object };
};
