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

export type NotebookType = 'daily' | 'free';

export interface NotebookNote {
    id: string;
    title: string;
    content: string;
    type: NotebookType;       // 'daily': 日付ノート, 'free': 自由ノート
    date: string;             // YYYY-MM-DD (作成・紐付け日)
    color: string;            // 用紙の背景色
    createdAt: string;        // ISO 8601
    updatedAt: string;        // ISO 8601
    isLocked?: boolean;       // 誤消去防止ロック (true: 閲覧中, false: 編集可能)
    images?: string[];        // 添付画像 (DataURL / URL)
    order?: number;           // 自由ノート用の並び順
    bookTitle?: string;       // 自由ノートのノート名 (例: "自由ノート (メイン)", "業務マニュアル")
    pageNumber?: number;      // ノート内でのページ番号
}

export interface AppData {
    timetable: Timetable;
    events: CalendarEvent[];
    memos: Memo[];
    stickies: StickyNote[];
    stickyFolders: StickyFolder[];
    notebookNotes?: NotebookNote[];
    isPremium?: boolean;
}
