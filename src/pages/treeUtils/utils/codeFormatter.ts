/**
 * @file 代码格式化工具
 * @description 用于格式化不同语言的代码
 */
import prettier from "prettier";
import parserBabel from "prettier/parser-babel";
import parserHtml from "prettier/parser-html";
import parserPostcss from "prettier/parser-postcss";
import parserYaml from "prettier/parser-yaml";

/**
 * 格式化代码
 * @param {string} code - 要格式化的代码
 * @param {string} language - 代码语言
 * @returns {Promise<string>} 格式化后的代码
 */
export const formatCode = async (
  code: string,
  language: string
): Promise<string> => {
  try {
    const parser = getParser(language);
    const formattedCode = await prettier.format(code, {
      parser,
      plugins: [parserBabel, parserHtml, parserPostcss, parserYaml],
      semi: true,
      singleQuote: true,
      printWidth: 80,
    });
    return formattedCode;
  } catch (error) {
    console.error("格式化代码失败:", error);
    return code;
  }
};

/**
 * 根据语言获取对应的解析器
 * @param {string} language - 代码语言
 * @returns {string} 解析器名称
 */
const getParser = (language: string): string => {
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "babel";
    case "html":
      return "html";
    case "css":
      return "css";
    case "yaml":
      return "yaml";
    default:
      return "babel";
  }
};
