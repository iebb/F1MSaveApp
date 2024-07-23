import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';
import logo_22 from '../../assets/logos/logo_22.jpg';
import logo_23 from '../../assets/logos/logo_23.jpg';
import logo_24 from '../../assets/logos/logo_24.jpg';
import Steam from '../../assets/logos/steam.svg';
import Xbox from '../../assets/logos/xbox.svg';
import './App.css';
import { SaveFile } from '../types/types';
import { TeamLogos, WeekendStagesAbbrev } from './constants';

const logoMapping: any = {
  4: logo_24,
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

    window.document.addEventListener('load-backup-file', (e: Event) => {
      window.electron.ipcRenderer.sendMessage('load-backup-file', {
        path: (e as CustomEvent).detail.filepath,
      });
      alert("Restored from Backup")
    }, false)

    window.electron.ipcRenderer.on('open-file', (arg: any) => {
      ref.current?.contentDocument?.dispatchEvent( new CustomEvent('loadFile', {
        detail: {
          file: new File([arg.file], arg.filename),
          filename: arg.filename,
          path: arg.path,
          haveBackup: arg.haveBackup,
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
            fileList.map(f => {
              const meta = f.careerSaveMetadata!;
              return (
                (
                  <div
                    className={`file-item ${meta.RaceWeekendInProgress ? 'race-week' : ''}`}
                    key={f.file}
                    onClick={() => {
                      window.electron.ipcRenderer.sendMessage('request-file', f.file); // request file
                    }}
                  >
                    <div className={`${meta.ScenarioType ? 'scenario-text' : ''}`}>
                      <img width='18' alt='icon' src={logoMapping[f.version]} style={{ marginRight: 10 }} />
                      {f.filename}
                      <div style={{ float: 'right', marginRight: -8, display: 'flex', flexDirection: 'row' }}>
                        <img width='18' alt='platform' src={logoMapping[f.platform]} />
                      </div>
                    </div>
                    <div className='team-logo-flex'>
                      <img width='24' alt='platform' src={TeamLogos[meta.TeamID]} />
                      <div className='team-logo-flex-date dateinfo'>
                        <span className={`${meta.RaceWeekendInProgress ? 'race-week-text' : ''} ${meta.ScenarioType ? 'scenario-text' : ''}`}>{
                          (new Date(
                            (meta.Day - 2) * 86400000 - 2208988800000
                          )).toLocaleDateString('en-ZA', { dateStyle: 'short' })
                        }, {
                          meta.ScenarioType ? "Scenario" :
                            meta.RaceWeekendInProgress ? `${meta.WeekendStage ? WeekendStagesAbbrev[meta.WeekendStage!] : 'Weekend'}` : meta.CurrentRace ? `Round ${meta.CurrentRace}` : 'End of Season'
                        }</span>
                        <br />
                        {
                          (new Date(f.mtime)).toLocaleTimeString('en-US', { month: 'short', day: 'numeric' })
                        }
                      </div>
                    </div>
                  </div>
                )
              )
            })
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
