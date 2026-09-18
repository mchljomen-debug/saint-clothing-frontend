import{defineConfig}from"vite";
import react from"@vitejs/plugin-react";
import{visualizer}from"rollup-plugin-visualizer";

export default defineConfig(({mode})=>({
  plugins:[
    react(),
    mode==="analyze"&&visualizer({
      filename:"stats.html",
      open:true,
      gzipSize:true,
      brotliSize:true
    })
  ].filter(Boolean),
  server:{
    port:5173
  },
  build:{
    sourcemap:false,
    minify:"esbuild",
    cssMinify:true,
    reportCompressedSize:true
  }
}));