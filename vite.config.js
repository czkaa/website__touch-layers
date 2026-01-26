import { fileURLToPath, URL } from 'node:url';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
// import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_MODE === 'local' ? '/captive/' : '/',
    plugins: [
      vue(),
      // basicSsl(),
      Components({
        /* options */
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
