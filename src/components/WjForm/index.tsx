import React from "react";
import { setComponents } from "react-schema-render";
import config from "./utils/config";
setComponents(config);

export { default as WjForm } from "./form";
export type { WjFormColumnsPropsType } from "./type";
