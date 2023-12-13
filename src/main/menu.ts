import { BrowserWindow, Menu, MenuItemConstructorOptions, shell } from 'electron';

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const menu = Menu.buildFromTemplate(this.buildDefaultTemplate());
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDefaultTemplate() {

    const localInstance = process.env.BACKEND?.toLowerCase() === 'local'
      ? 'http://localhost:3000'
      : process.env.BACKEND;

    return [
      {
        label: '&File',
        submenu: [
          {
            label: 'Open Calculator in Browser',
            click() {
              shell.openExternal('https://f1setup.it');
            },
          },
          {
            label: 'Open Setup Viewer in Browser',
            click() {
              shell.openExternal('https://save.f1setup.it');
            },
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
              {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: () => {
                  this.mainWindow.webContents.reload();
                },
              },
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen(),
                  );
                },
              },
              {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click: () => {
                  this.mainWindow.webContents.toggleDevTools();
                },
              },
              {
                label: 'Connect to &Local Instance',
                accelerator: 'Alt+Ctrl+L',
                click: () => {
                  this.mainWindow.webContents.send(
                    'connect-to',
                    localInstance,
                  );
                },
              },
            ]
            : [
              {
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click: () => {
                  this.mainWindow.webContents.reload();
                },
              },
              {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click: () => {
                  this.mainWindow.setFullScreen(
                    !this.mainWindow.isFullScreen(),
                  );
                },
              },
            ],
      },
    ];
  }
}
