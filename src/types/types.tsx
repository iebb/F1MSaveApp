
export interface SaveFile {
  platform: string;
  file: string;
  filename: string;
  mtime: number;
  version: number;
  size: number;
  careerSaveMetadata?: Metadata;
}

export interface Metadata {
  Day: number;
  TeamID: number;
  Team: string;
  FirstName: string;
  LastName: string;

  WeekendStage?: number;
  CurrentRace?: number;
  RaceWeekendInProgress?: boolean;
}
