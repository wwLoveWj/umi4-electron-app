import React from "react";
import PngToSvg from "./components/pngToSvg";
import UnZipFile from "./components/unzipFile";
export default function Index() {
  return (
    <div>
      <UnZipFile />
      <PngToSvg />
    </div>
  );
}
