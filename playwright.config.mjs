import {defineConfig} from '@playwright/test';

export default defineConfig({
  workers:1,
  webServer:{
    command:'OPEN_BROWSER=0 PORT=4173 ECO_DATA_FILE=.data/browser-qualification.sqlite node scripts/dev-server.mjs',
    url:'http://127.0.0.1:4173/health',reuseExistingServer:true,timeout:30000
  }
});
