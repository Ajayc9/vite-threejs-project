// vite.config.js / vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default {
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'bin/example.wasm',
          dest: 'wasm-files'
        },
        {
          src: 'assets',
          dest: 'assets'
        },
      ]
    })
  ]
}