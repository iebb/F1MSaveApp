/* eslint global-require: off, no-console: off, promise/always-return: off */

import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { SaveFile } from '../types/types';


const swapXboxString = (s: Uint8Array) => {
  [s[0], s[3]] = [s[3], s[0]];
  [s[1], s[2]] = [s[2], s[1]];
  [s[4], s[5]] = [s[5], s[4]];
  [s[6], s[7]] = [s[7], s[6]];
  return Array.prototype.map.call(
    s,
    n => n.toString(16).padStart(2, "0")
  ).join("").toUpperCase();
}

const listXboxFiles = (path: string) => {
  const fileList: SaveFile[] = [];
  glob.sync(`${process.env.LOCALAPPDATA}\\Packages\\${path}\\SystemAppData\\wgs\\*\\containers.index`).map( (file: string) => {
    let f = fs.readFileSync(file);
    f = f.slice(4);
    let count = f.readInt32LE();
    f = f.slice(4);
    f = f.slice(4);
    let nameLength = f.readInt32LE();
    f = f.slice(4);
    // let containerPackageID = new TextDecoder("UTF-16").decode(f.slice(0, nameLength * 2));
    f = f.slice(nameLength * 2);
    f = f.slice(8 + 4); // unknown2
    let guidLength = f.readInt32LE();
    f = f.slice(4);
    // let indexGUID = new TextDecoder("UTF-16").decode(f.slice(0, guidLength * 2));
    f = f.slice(guidLength * 2);
    f = f.slice(8); // timestamp
    for(let i = 0; i < count; i++) {
      let stringLength1 = f.readInt32LE();
      f = f.slice(4);
      let containerStrings1 = new TextDecoder("UTF-16").decode(f.slice(0, stringLength1 * 2));
      f = f.slice(stringLength1 * 2); // timestamp

      let stringLength2 = f.readInt32LE();
      f = f.slice(4);
      // let containerStrings2 = new TextDecoder("UTF-16").decode(f.slice(0, stringLength2 * 2));
      f = f.slice(stringLength2 * 2); // timestamp
      let stringLength3 = f.readInt32LE();
      f = f.slice(4);
      // let containerStrings3 = new TextDecoder("UTF-16").decode(f.slice(0, stringLength3 * 2));
      f = f.slice(stringLength3 * 2); // timestamp
      let filename = containerStrings1;
      let containerVersion = f.readInt8();
      f = f.slice(1 + 4); // containerUnknown1
      const filePath = f.slice(0, 16)
      f = f.slice(16 + 8 + 8 + 8); //
      const swappedPath = swapXboxString(filePath);

      let container = fs.readFileSync(file.replaceAll("containers.index", `\\${swappedPath}\\container.${containerVersion}`));
      const swappedContainerPath = swapXboxString(container.slice(128 + 8, 128 + 8 + 16));

      const fileHash = file.replaceAll("containers.index", `\\${swappedPath}\\${swappedContainerPath}`);
      const fst = fs.statSync(fileHash);

      if (/^save\d+$/.test(filename) || filename === "autosave") {
        fileList.push({
          file: fileHash,
          filename: filename,
          size: fst.size,
          mtime: fst.mtimeMs,
          version: 3,
          platform: "Xbox"
        })
      }

    }
  })
  return fileList;
}

const listFiles = () => {
  const fileList = listXboxFiles("FrontierDevelopmentsPlc.21035A543665E_ft442cafaz8hg");

  glob.sync(process.env.LOCALAPPDATA + "\\F1Manager23\\Saved\\SaveGames\\*.sav").map( (file: string) => {
    const fst = fs.statSync(file);
    const basename = path.basename(file);
    if (/^save\d+\.sav$/.test(basename) || basename === "autosave.sav") {
      fileList.push({
        file,
        filename: basename,
        size: fst.size,
        mtime: fst.mtimeMs,
        version: 3,
        platform: "Steam"
      })
    }
  })


  glob.sync(process.env.LOCALAPPDATA + "\\F1Manager22\\Saved\\SaveGames\\*.sav").map( (file: string) => {
    const fst = fs.statSync(file);
    const basename = path.basename(file);
    if (/^save\d+\.sav$/.test(basename) || basename === "autosave.sav") {
      fileList.push({
        file,
        filename: basename,
        size: fst.size,
        mtime: fst.mtimeMs,
        version: 2,
        platform: "Steam"
      })
    }
  })
  return fileList.sort((x: SaveFile, y: SaveFile) => y.mtime - x.mtime);
}

ipcMain.on('loaded', async (event, arg) => {
  event.reply('file-list', listFiles());
});

ipcMain.on('request-file', async (event, filename) => {
  // console.log("requesting file", filename)
  fs.readFile(filename, (err, buffer) => {
    event.reply("open-file", {
      file: buffer,
      filename: path.basename(filename),
      path: filename,
    });
  })
});
ipcMain.on('save-file', async (event, { data, path }) => {
  fs.renameSync(path, path + ".bak");
  fs.writeFileSync(path, data);
  event.reply('file-list', listFiles());
});

