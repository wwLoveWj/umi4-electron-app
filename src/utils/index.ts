/**
 * @desc
 * @param { File } 文件file
 * @return { Boolean } 是图片 true 不是 false
 */
export function isImage(file: any) {
  // 检查文件MIME类型
  return file.type.startsWith("image/");
}
