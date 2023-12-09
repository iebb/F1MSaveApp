/* eslint global-require: off, no-console: off, promise/always-return: off */

import { ipcMain } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';
import glob from 'glob';
import { SaveFile } from '../types/types';

const swapXboxString = (s: Uint8Array) => {
  [s[0], s[3]] = [s[3], s[0]];
  [s[1], s[2]] = [s[2], s[1]];
  [s[4], s[5]] = [s[5], s[4]];
  [s[6], s[7]] = [s[7], s[6]];
  return Array.prototype.map
    .call(s, (n) => n.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

const listXboxFiles = (xboxPath: string) => {
  const fileList: SaveFile[] = [];
  glob
    .sync(
      `${process.env.LOCALAPPDATA}\\Packages\\${xboxPath}\\SystemAppData\\wgs\\*\\containers.index`,
    )
    .forEach((file: string) => {
      let f = fs.readFileSync(file);
      f = f.slice(4);
      const count = f.readInt32LE();
      f = f.slice(4);
      f = f.slice(4);
      const nameLength = f.readInt32LE();
      f = f.slice(4);
      // let containerPackageID = new TextDecoder("UTF-16").decode(f.slice(0, nameLength * 2));
      f = f.slice(nameLength * 2);
      f = f.slice(8 + 4); // unknown2
      const guidLength = f.readInt32LE();
      f = f.slice(4);
      // let indexGUID = new TextDecoder("UTF-16").decode(f.slice(0, guidLength * 2));
      f = f.slice(guidLength * 2);
      f = f.slice(8); // timestamp
      for (let i = 0; i < count; i += 1) {
        const stringLength1 = f.readInt32LE();
        f = f.slice(4);
        const containerStrings1 = new TextDecoder('UTF-16').decode(
          f.slice(0, stringLength1 * 2),
        );
        f = f.slice(stringLength1 * 2);
        const stringLength2 = f.readInt32LE();
        f = f.slice(4);
        // let containerStrings2 = new TextDecoder("UTF-16").decode(f.slice(0, stringLength2 * 2));
        f = f.slice(stringLength2 * 2);
        const stringLength3 = f.readInt32LE();
        f = f.slice(4);
        // let containerStrings3 = new TextDecoder("UTF-16").decode(f.slice(0, stringLength3 * 2));
        f = f.slice(stringLength3 * 2);
        const filename = containerStrings1;
        const containerVersion = f.readUInt8();
        f = f.slice(1 + 4); // containerUnknown1
        const filePath = f.slice(0, 16);
        f = f.slice(16); //

        const timestamp = f.readBigInt64LE();
        f = f.slice(8); //

        f = f.slice(8 + 8); //
        const swappedPath = swapXboxString(filePath);

        try {
          const container = fs.readFileSync(
            file.replaceAll(
              'containers.index',
              `\\${swappedPath}\\container.${containerVersion}`,
            ),
          );

          const headerPos = 8;

          const swappedContainerPath = swapXboxString(
            container.slice(headerPos + 128 + 16, headerPos + 128 + 16 + 16),
          );
          const fileHash = file.replaceAll(
            'containers.index',
            `\\${swappedPath}\\${swappedContainerPath}`,
          );
          const fst = fs.statSync(fileHash);

          if (/^save\d+$/.test(filename) || filename === 'autosave') {
            const unixTimestamp = Number(timestamp / 10000n) - 11644473600000
            fileList.push({
              file: fileHash,
              filename,
              size: fst.size,
              mtime: unixTimestamp,
              version: 3,
              platform: 'Xbox',
            });
          }
        } catch (e) {
          console.error(e);
        }

      }
    });
  return fileList;
};

const listFiles = () => {
  const fileList: SaveFile[] = listXboxFiles(
    'FrontierDevelopmentsPlc.21035A543665E_ft442cafaz8hg',
  );

  glob
    .sync(`${process.env.LOCALAPPDATA}\\F1Manager23\\Saved\\SaveGames\\*.sav`)
    .forEach((file: string) => {
      const fst = fs.statSync(file);
      const basename = path.basename(file);
      if (/^save\d+\.sav$/.test(basename) || basename === 'autosave.sav') {
        fileList.push({
          file,
          filename: basename,
          size: fst.size,
          mtime: fst.mtimeMs,
          version: 3,
          platform: 'Steam',
        });
      }
    });

  glob
    .sync(`${process.env.LOCALAPPDATA}\\F1Manager22\\Saved\\SaveGames\\*.sav`)
    .forEach((file: string) => {
      const fst = fs.statSync(file);
      const basename = path.basename(file);
      if (/^save\d+\.sav$/.test(basename) || basename === 'autosave.sav') {
        fileList.push({
          file,
          filename: basename,
          size: fst.size,
          mtime: fst.mtimeMs,
          version: 2,
          platform: 'Steam',
        });
      }
    });
  return fileList.sort((x: SaveFile, y: SaveFile) => y.mtime - x.mtime);
};
const listFilesLinux = () => {
  const fileList: SaveFile[] = [];
  const steamAppData = `${os.homedir()}/.local/share/Steam/steamapps/compatdata`;
  const compat22 = `${steamAppData}/1708520/pfx/drive_c/users/steamuser/AppData/Local/F1Manager22`;
  const compat23 = `${steamAppData}/2287220/pfx/drive_c/users/steamuser/AppData/Local/F1Manager23`;

  glob.sync(`${compat23}/Saved/SaveGames/*.sav`).forEach((file: string) => {
    const fst = fs.statSync(file);
    const basename = path.basename(file);
    if (/^save\d+\.sav$/.test(basename) || basename === 'autosave.sav') {
      fileList.push({
        file,
        filename: basename,
        size: fst.size,
        mtime: fst.mtimeMs,
        version: 3,
        platform: 'Steam',
      });
    }
  });

  glob.sync(`${compat22}/Saved/SaveGames/*.sav`).forEach((file: string) => {
    const fst = fs.statSync(file);
    const basename = path.basename(file);
    if (/^save\d+\.sav$/.test(basename) || basename === 'autosave.sav') {
      fileList.push({
        file,
        filename: basename,
        size: fst.size,
        mtime: fst.mtimeMs,
        version: 2,
        platform: 'Steam',
      });
    }
  });
  return fileList.sort((x: SaveFile, y: SaveFile) => y.mtime - x.mtime);
};

ipcMain.on('loaded', async (event) => {
  if (process.platform === 'win32') {
    event.reply('file-list', listFiles());
  } else if (process.platform === 'linux') {
    event.reply('file-list', listFilesLinux());
  }
});

ipcMain.on('request-file', async (event, filename) => {
  // console.log("requesting file", filename)
  fs.readFile(filename, (err, buffer) => {
    event.reply('open-file', {
      file: buffer,
      filename: path.basename(filename),
      path: filename,
    });
  });
});
// eslint-disable-next-line @typescript-eslint/no-shadow
ipcMain.on('save-file', async (event, { data, path }) => {
  fs.renameSync(path, `${path}.bak`);
  fs.writeFileSync(path, data);
  event.reply('file-list', listFiles());
});
