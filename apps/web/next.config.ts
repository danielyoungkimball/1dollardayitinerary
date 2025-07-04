import type { NextConfig } from "next";

import fs from "fs";

// debugging vercel build
if (!fs.existsSync("node_modules/@types/react")) {
  console.warn("WARNING: @types/react not found in web build!");
}


const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig; 