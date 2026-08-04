export interface Period {
    num: number;
    start: string;
    end: string;
}

export interface TimetableCell {
    title: string;
    room?: string;
    teacher?: string;
    color?: string;
    desc?: string;
}

export interface Timetable {
    name: string;
    periods: Period[];
    cells: { [key: string]: TimetableCell }; // キー形式: "dayIdx-periodIdx"
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    endDate?: string;  // 終了日 (YYYY-MM-DD)
    startTime?: string;
    endTime?: string;
    color?: string;
    desc?: string;
}

export interface Memo {
    id: string;
    title: string;
    content: string;
    tags: string[];
    linkId?: string;
    updatedAt: string;
}

export interface StickyFolder {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}

export interface StickyNote {
    id: string;
    content: string;
    color: string;
    createdAt: string;
    pinned: boolean;          // ダッシュボード内でピン止め（ダッシュボードに残る）
    archived: boolean;        // 長期保存 → 付箋ボードページへ移動
    attachedDate?: string;    // カレンダー日付に貼り付け (YYYY-MM-DD)
    folderId?: string;        // 付箋ボード内のフォルダーID
}

export interface AppData {
    timetable: Timetable;
    events: CalendarEvent[];
    memos: Memo[];
    stickies: StickyNote[];
    stickyFolders: StickyFolder[];
}
