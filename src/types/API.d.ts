declare namespace API {
  import type { Dayjs } from "dayjs";
  /**
   * 全局类型接口编写规则：
   * 1. 首字母大写，并且驼峰命名
   * 2. 尾部以Type结尾，表明属于类型字段
   */
  // ======================================================================
  /**
   * 菜单的配置项，用于动态渲染：
   *  key: 唯一标志
   *  title: 菜单项值（国际化已开启）
   *  path：用于路由跳转
   *  layout： 是否是布局组件，如果不是，则不会渲染菜单
   *  component：组件所在路径，从pages路径下开始
   *  icon：菜单图标
   *  hidden: 是否隐藏该菜单项
   *  routes：子级菜单项
   */
  interface MenuRoutesType extends Record<string, any> {
    title?: string;
    key?: string;
    path: string;
    layout?: boolean;
    icon?: string | FunctionComponent<any> | ComponentClass<any, any>;
    routes?: MenuRoutesType[];
    component?: any;
    exact?: boolean;
    redirect?: string;
    hidden?: boolean;
  }
}
