const { closeShotScreenWin, openShotScreenWin } = require("./index");
const { app, Tray, Menu, MenuItem, ipcRenderer } = require("electron");
const path = require("path");
function createTray(
  win,
  tray,
  icon = "/coding/20240320ww/my-umi-app/umi-template-wj/src/assets/imgs/flower.png"
) {
  // 创建任务栏图标
  tray = new Tray(path.resolve(__dirname, icon));
  // 菜单定义内容
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "截图",
      type: "radio",
      click: () => {
        if (win) {
          closeShotScreenWin();
          win.hide();
          openShotScreenWin();
        }
      },
    },
    {
      label: "重启",
      click: () => {
        app.relaunch();
        app.quit();
      },
    },
    {
      label: "识图",
      click: () => {
        ipcRenderer.send("ss:identify-img");
      },
    },
    {
      label: "退出",
      click: async function () {
        win.destroy();
        app.quit();
        win = null;
      },
    },
    {
      label: "网页截图",
      click: () => {
        exec("nvm use 18.12.0", (error, stdout, stderr) => {
          if (error) {
            console.error(`执行的错误: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          exec("node demo.js", (error, stdout, stderr) => {
            if (error) {
              console.error(`执行的错误: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
          });
        });
      },
    },
  ]);
  // 右下角托盘内容
  tray.setContextMenu(contextMenu);
  tray.setToolTip("欢迎访问创世纪系统~");
  tray.setTitle("创世纪系统");
  // 点击托盘图标，显示主窗口
  tray.on("click", () => {
    win.show();
  });
}

function createShortcutKeys(mainWindow) {
  // 全局快捷键
  const menu = new Menu();
  menu.append(
    new MenuItem({
      // label: "Electron",
      submenu: [
        {
          role: "截屏",
          accelerator:
            process.platform === "darwin" ? "Alt+Cmd+I" : "Alt+Shift+I",
          click: () => {
            if (mainWindow) {
              closeShotScreenWin();
              mainWindow.hide();
              openShotScreenWin();
            }
          },
        },
      ],
    })
  );
  Menu.setApplicationMenu(menu);
}

module.exports = {
  createTray,
  createShortcutKeys,
};
