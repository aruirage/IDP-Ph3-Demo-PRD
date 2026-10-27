const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
let playwright;
try { playwright=require('playwright'); }
catch { playwright=require(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||(fs.existsSync(chrome)?chrome:undefined);
module.exports={chromium:playwright.chromium,browserLaunchOptions:{headless:true,...(executablePath?{executablePath}:{})}};
