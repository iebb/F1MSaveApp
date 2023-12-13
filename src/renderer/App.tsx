import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';
import logo_22 from '../../assets/logos/logo_22.jpg';
import logo_23 from '../../assets/logos/logo_23.jpg';
import Steam from '../../assets/logos/steam.svg';
import Xbox from '../../assets/logos/xbox.svg';
import './App.css';
import { SaveFile } from '../types/types';

const logoMapping: any = {
  3: logo_23,
  2: logo_22,
  Steam: Steam,
  Xbox: Xbox,
}


function MainApp() {
  let ref = useRef<HTMLIFrameElement>(null);
  let [fileList, setFileList] = useState<SaveFile[]>([]);

  const remoteURL = new URLSearchParams(document.location.search).get("backend") || "https://save.f1setup.it/"
  let [remote, setRemote] = useState(remoteURL);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('loaded', ['load']); // request file
    window.electron.ipcRenderer.on('file-list', (arg: any) => {
      setFileList(arg);
    });

    window.document.addEventListener('export-file', (e: Event) => {
      window.electron.ipcRenderer.sendMessage('save-file', {
        data: (e as CustomEvent).detail.data,
        path: (e as CustomEvent).detail.filepath,
      });
      alert("Savefile Updated!")
    }, false)

    window.electron.ipcRenderer.on('open-file', (arg: any) => {
      ref.current?.contentDocument?.dispatchEvent( new CustomEvent('loadFile', {
        detail: {
          file: new File([arg.file], arg.filename),
          path: arg.path
        }
      }))
    });

    window.electron.ipcRenderer.on('connect-to', (url: any) => {
      setRemote(url.toString());
    });

  }, [])

  // @ts-ignore
  return (
    <div className="frameset">
      <div className="leftnav">
        <div className="file-selector">
          <div
            className="file-item"
            onClick={() => {
              window.electron.ipcRenderer.sendMessage('loaded', ['load']);
            }}
          >
            <div className="reload">
              reload filelist
            </div>
          </div>
          {
            fileList.map(f => (
              <div
                className="file-item"
                key={f.file}
                onClick={() => {
                  window.electron.ipcRenderer.sendMessage('request-file', f.file); // request file
                }}
              >
                <div>
                  <img width="18" alt="platform" src={logoMapping[f.platform]} />
                  <img width="18" alt="icon" src={logoMapping[f.version]} />
                  {f.filename}
                </div>
                <div className="dateinfo">
                  {
                    (new Date(f.mtime)).toLocaleTimeString("en-US", { month: 'short', day: 'numeric' })
                  }
                </div>
              </div>
            ))
          }
        </div>
      </div>
      <div className="appframe">
        <iframe
          key={remote}
          src={remote}
          ref={ref}
          style={{ height: "100%", width: "100%" }}
        ></iframe>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}
