export interface Hint {
  order: number;
  text: string;
  penalty: number;
}

export interface Challenge {
  id: string;
  title: string;
  points: number;
  flagHash: string;
  hints: Hint[];
  active: boolean;
}

export interface Attempt {
  userId: string;
  challengeId: string;
  correct: boolean;
  hintsUsed: number;
  pointsEarned: number;
  date: string;
}

export interface Store {
  challenges: Challenge[];
  attempts: Attempt[];
}

export interface SubmissionResult {
  ok: boolean;
  message: string;
  points: number;
}

export interface RankingEntry {
  userId: string;
  total: number;
}
