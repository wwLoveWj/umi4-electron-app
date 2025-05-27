/* eslint-disable react-hooks/rules-of-hooks */
import { configResponsive, useResponsive } from "ahooks";
import type { ColProps } from "antd";
import { isNumber } from "lodash-es";
import { useEffect, useState } from "react";

/** col 响应式默认值 */
export const DEFAULT_COL_CONFIG = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 12,
  xl: 8,
  xxl: 6,
};
configResponsive({
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
});

// 响应columns
const useResponsiveSize = (
  colConfig: number | ColProps = DEFAULT_COL_CONFIG
) => {
  if (isNumber(colConfig)) {
    return colConfig;
  }
  const [columnSize, setColumnSize] = useState(0);
  const responsive = useResponsive();
  const array = Object.keys(colConfig);
  let index = array.findIndex((key) => !responsive[key]);

  if (index === -1) index = array.length;
  const current = array[index - 1] as keyof typeof colConfig;

  useEffect(() => {
    setColumnSize(24 / colConfig[current]);
  }, [current, responsive, colConfig]);

  return columnSize;
};

export default useResponsiveSize;
