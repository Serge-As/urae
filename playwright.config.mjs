import {defineConfig} from '@playwright/test';

export default defineConfig({
  workers:1,
  webServer:{
    command:'node scripts/dev-server.mjs',
    env:{OPEN_BROWSER:'0',PORT:process.env.ECO_BROWSER_PORT||'4173',ECO_DATA_FILE:process.env.ECO_BROWSER_DATA||'.data/browser-qualification.sqlite'},
    url:'http://127.0.0.1:'+(process.env.ECO_BROWSER_PORT||'4173')+'/health',reuseExistingServer:true,timeout:30000
  }
});
