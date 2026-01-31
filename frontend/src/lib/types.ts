export type PlayerStatus = "alive" | "eliminated";

export type Question = {
  id: string;
  prompt: string;
  answer: string;
};

export type RoomPlayer = {
  id: string;
  score: number;
  alive: boolean;
};

export type ServerEvent =
  | { type: "question"; payload: Question }
  | {
      type: "result";
      payload: { correct: boolean; scoreDelta: number; totalScore: number };
    }
  | { type: "trigger"; payload: { outcome: "alive" | "dead"; message: string } }
  | { type: "notice"; payload: { message: string } }
  | {
      type: "room";
      payload: {
        roomId: string;
        players: RoomPlayer[];
        aliveCount: number;
        deadCount: number;
        timeLeft: number;
        durationSeconds: number;
        serverNowMs: number;
        startedAtMs: number | null;
      };
    };
  | {
      type: "game_over";
      payload: {
        winnerId: string | null;
        reason: "timeout" | "last_alive" | "ended";
        roomId: string;
        players: RoomPlayer[];
        aliveCount: number;
        deadCount: number;
        timeLeft: number;
        durationSeconds: number;
        serverNowMs: number;
        startedAtMs: number | null;
      };
    };

export type ClientEvent =
  | { type: "submit"; payload: { answer: string; questionId: string } }
  | { type: "join"; payload: { playerId: string } };
