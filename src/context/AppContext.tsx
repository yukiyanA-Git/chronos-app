import React, { createContext, useContext, useState, useEffect } from 'react';
import LZString from 'lz-string';
import type { AppData, CalendarEvent, Memo, Period, StickyNote, TimetableCell } from '../types';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc, getDocFromServer } from 'firebase/firestore';
import { INITIAL_PRESET_DATA } from '../initialData';

interface AppContextProps {
    data: AppData;
    theme: string;
    bgColor: string;
    loading: boolean;
    currentUser: User | null;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    toggleTheme: () => void;
    setBgColor: (color: string) => void;
    updateTimetableCell: (dayIdx: number, periodIdx: number, cell: TimetableCell | null) => void;
    saveTimetableSettings: (name: string, periods: Period[]) => void;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    updateCalendarEvent: (id: string, event: Omit<CalendarEvent, 'id'>) => void;
    deleteCalendarEvent: (id: string) => void;
    addMemo: (memo: Omit<Memo, 'id' | 'updatedAt'>) => string;
    updateMemo: (id: string, memo: Partial<Omit<Memo, 'id' | 'updatedAt'>>) => void;
    deleteMemo: (id: string) => void;
    // 付箋操作
    addSticky: (content: string, color: string, archived?: boolean, folderId?: string) => void;
    addVoiceSticky: (content: string) => void;
    updateSticky: (id: string, content: string) => void;
    deleteSticky: (id: string) => void;
    pinSticky: (id: string, pinned: boolean) => void;
    archiveSticky: (id: string) => void;
    unarchiveSticky: (id: string) => void;
    attachStickyToDate: (id: string, date: string | undefined) => void;
    // フォルダー操作
    addStickyFolder: (name: string, color: string) => void;
    renameStickyFolder: (id: string, name: string) => void;
    deleteStickyFolder: (id: string) => void;
    moveStickyToFolder: (stickyId: string, folderId: string | null) => void;
    getShareURL: () => string;
    importShareData: (compressed: string) => boolean;
    importFromJSON: (jsonText: string) => boolean;
    restorePresetData: () => void;
    resetAllData: () => void;
    cloudSyncInfo: {
        status: 'idle' | 'syncing' | 'success' | 'error';
        lastSyncedAt: string | null;
        errorMessage: string | null;
        cloudEventCount: number | null;
        cloudStickyCount: number | null;
    };
    forceUploadToCloud: () => Promise<void>;
    forceFetchFromCloud: () => Promise<void>;
    forceSmartMergeCloud: () => Promise<void>;
}

const DEFAULT_TIMETABLE_NAME = '通常出勤';

const DEFAULT_PERIODS: Period[] = [
    { num: 1, start: '09:00', end: '09:30' },
    { num: 2, start: '09:30', end: '11:30' },
    { num: 3, start: '11:30', end: '12:30' },
    { num: 4, start: '12:30', end: '15:00' },
    { num: 5, start: '15:00', end: '18:00' }
];

const EMPTY_DATA: AppData = {
    timetable: {
        name: DEFAULT_TIMETABLE_NAME,
        periods: DEFAULT_PERIODS,
        cells: {}
    },
    events: [],
    memos: [],
    stickies: [],
    stickyFolders: []
};

// どんなデータが入っていてもクラッシュさせない安全ガード関数
const sanitizeData = (raw: any): AppData => {
    if (!raw || typeof raw !== 'object') return EMPTY_DATA;
    return {
        timetable: {
            name: raw.timetable?.name || DEFAULT_TIMETABLE_NAME,
            periods: Array.isArray(raw.timetable?.periods) && raw.timetable.periods.length > 0 ? raw.timetable.periods : DEFAULT_PERIODS,
            cells: raw.timetable?.cells && typeof raw.timetable.cells === 'object' ? raw.timetable.cells : {}
        },
        events: Array.isArray(raw.events) ? raw.events : [],
        memos: Array.isArray(raw.memos) ? raw.memos : [],
        stickies: Array.isArray(raw.stickies) ? raw.stickies : [],
        stickyFolders: Array.isArray(raw.stickyFolders) ? raw.stickyFolders : []
    };
};

// 2つのデータを安全に合体（マージ）するスマート関数
const mergeAppData = (base: AppData, incoming: AppData): AppData => {
    // 付箋の統合 (ID重複排除)
    const stickyMap = new Map<string, StickyNote>();
    (base.stickies || []).forEach(s => stickyMap.set(s.id, s));
    (incoming.stickies || []).forEach(s => stickyMap.set(s.id, s));

    // 付箋フォルダーの統合 (ID重複排除)
    const folderMap = new Map<string, any>();
    (base.stickyFolders || []).forEach(f => folderMap.set(f.id, f));
    (incoming.stickyFolders || []).forEach(f => folderMap.set(f.id, f));

    // カレンダー予定の統合 (ID重複排除)
    const eventMap = new Map<string, CalendarEvent>();
    (base.events || []).forEach(e => eventMap.set(e.id, e));
    (incoming.events || []).forEach(e => eventMap.set(e.id, e));

    // メモの統合 (ID重複排除)
    const memoMap = new Map<string, Memo>();
    (base.memos || []).forEach(m => memoMap.set(m.id, m));
    (incoming.memos || []).forEach(m => memoMap.set(m.id, m));

    // 時間割セルの統合 (両方にあるコマをすべて保持)
    const mergedCells = {
        ...(base.timetable?.cells || {}),
        ...(incoming.timetable?.cells || {})
    };

    return {
        timetable: {
            name: incoming.timetable?.name || base.timetable?.name || DEFAULT_TIMETABLE_NAME,
            periods: (incoming.timetable?.periods && incoming.timetable.periods.length > 0) ? incoming.timetable.periods : base.timetable?.periods || DEFAULT_PERIODS,
            cells: mergedCells
        },
        events: Array.from(eventMap.values()),
        memos: Array.from(memoMap.values()),
        stickies: Array.from(stickyMap.values()),
        stickyFolders: Array.from(folderMap.values())
    };
};

// Firestore用に全オブジェクトを100%安全なプレーンJSONへ不可逆変換・クリーン化する関数
const cleanForFirestore = (data: AppData): any => {
    const sanitized = sanitizeData(data);
    return JSON.parse(JSON.stringify(sanitized, (_, value) => {
        if (value === undefined) return null;
        return value;
    }));
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'chronos_data';
const THEME_KEY = 'chronos_theme';
const BG_COLOR_KEY = 'chronos_bg_color';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 起動時: サニタイズ関数を通じて既存ローカルデータを安全ロード (未ログイン時はサンプルを入れず完全空データ)
    const [data, setData] = useState<AppData>(() => {
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
                return sanitizeData(JSON.parse(savedData));
            }
        } catch (e) {
            console.error('Failed to load initial data', e);
        }
        return EMPTY_DATA;
    });

    const [theme, setTheme] = useState<string>('dark');
    const [bgColor, setBgColorState] = useState<string>('');
    const loading = false;
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [cloudSyncInfo, setCloudSyncInfo] = useState<{
        status: 'idle' | 'syncing' | 'success' | 'error';
        lastSyncedAt: string | null;
        errorMessage: string | null;
        cloudEventCount: number | null;
        cloudStickyCount: number | null;
    }>({
        status: 'idle',
        lastSyncedAt: null,
        errorMessage: null,
        cloudEventCount: null,
        cloudStickyCount: null
    });

    // 1. テーマ・背景色初期化
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);

        const savedBgColor = localStorage.getItem(BG_COLOR_KEY) || '';
        setBgColorState(savedBgColor);
        if (savedBgColor) {
            document.body.style.background = savedBgColor;
        } else {
            document.body.style.background = '';
        }
    }, []);

    // 2. Firebase 認証 & バックグラウンドクラウド同期
    useEffect(() => {
        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);

            if (user) {
                const userDocRef = doc(db, 'users', user.uid, 'appData', 'chronosData');

                setCloudSyncInfo(prev => ({ ...prev, status: 'syncing', errorMessage: null }));

                // 🔑 リアルタイム双方向同期 (includeMetadataChanges: true でサーバー通信とローカル更新を完全補足)
                unsubscribeFirestore = onSnapshot(userDocRef, { includeMetadataChanges: true }, (snapshot) => {
                    if (snapshot.exists()) {
                        const cloudData = sanitizeData(snapshot.data());
                        setData(cloudData);
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
                        const isCache = snapshot.metadata.fromCache;
                        setCloudSyncInfo({
                            status: 'success',
                            lastSyncedAt: `${new Date().toLocaleTimeString()} ${isCache ? '(端末保存)' : '(☁️クラウド直結)'}`,
                            errorMessage: null,
                            cloudEventCount: (cloudData.events || []).length,
                            cloudStickyCount: (cloudData.stickies || []).length
                        });
                    } else {
                        setCloudSyncInfo({
                            status: 'success',
                            lastSyncedAt: new Date().toLocaleTimeString(),
                            errorMessage: null,
                            cloudEventCount: 0,
                            cloudStickyCount: 0
                        });
                    }
                }, (err: any) => {
                    console.error('Firestore snapshot listener error:', err);
                    setCloudSyncInfo(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: err?.message || 'クラウドリアルタイム受信に失敗しました'
                    }));
                });

            } else {
                // 未ログイン時は完全に空データをセット（勝手なサンプル生成・汚染の完全遮断）
                setData(EMPTY_DATA);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setCloudSyncInfo({ status: 'idle', lastSyncedAt: null, errorMessage: null, cloudEventCount: null, cloudStickyCount: null });
                if (unsubscribeFirestore) unsubscribeFirestore();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, []);

    // 3. 安全なデータ保存ヘルパー (ローカル ＋ クラウドへの明確な保存送信)
    const saveData = (newData: AppData) => {
        const sanitized = sanitizeData(newData);
        setData(sanitized);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));

        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid, 'appData', 'chronosData');
            const payload = cleanForFirestore(sanitized);
            setDoc(userDocRef, payload).then(() => {
                setCloudSyncInfo({
                    status: 'success',
                    lastSyncedAt: new Date().toLocaleTimeString(),
                    errorMessage: null,
                    cloudEventCount: (sanitized.events || []).length,
                    cloudStickyCount: (sanitized.stickies || []).length
                });
            }).catch((err: any) => {
                console.error('Firestore save error:', err);
                const errMsg = err?.code === 'permission-denied'
                    ? '⚠️ Googleクラウドの書き込み権限が拒否されています。FirebaseコンソールのRules設定をご確認ください。'
                    : (err?.message || 'クラウドへの保存送信に失敗しました');
                setCloudSyncInfo(prev => ({
                    ...prev,
                    status: 'error',
                    errorMessage: errMsg
                }));
            });
        }
    };

    // Googleサインイン
    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error('Google Sign-in error:', error);
            if (error?.code === 'auth/operation-not-allowed') {
                alert('Firebase管理画面で「Googleログイン」が無効になっています。Firebaseコンソールの Authentication > Sign-in method でGoogleを有効化してください。');
            } else if (error?.code !== 'auth/popup-closed-by-user') {
                alert(`ログインエラー: ${error?.message || '再読み込みしてお試しください。'}`);
            }
        }
    };

    // ログアウト
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    };

    // テーマ切り替え
    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem(THEME_KEY, nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
    };

    // 背景色変更
    const setBgColor = (color: string) => {
        setBgColorState(color);
        localStorage.setItem(BG_COLOR_KEY, color);
        if (color) {
            document.body.style.background = color;
        } else {
            document.body.style.background = '';
        }
    };

    // 時間割セル更新
    const updateTimetableCell = (dayIdx: number, periodIdx: number, cell: TimetableCell | null) => {
        const key = `${dayIdx}-${periodIdx}`;
        const newCells = { ...data.timetable.cells };
        if (cell) {
            newCells[key] = cell;
        } else {
            delete newCells[key];
        }
        saveData({
            ...data,
            timetable: {
                ...data.timetable,
                cells: newCells
            }
        });
    };

    // 時間割設定保存
    const saveTimetableSettings = (name: string, periods: Period[]) => {
        saveData({
            ...data,
            timetable: {
                ...data.timetable,
                name,
                periods
            }
        });
    };

    // カレンダーイベント操作
    const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = {
            ...event,
            id: Date.now().toString()
        };
        saveData({
            ...data,
            events: [...data.events, newEvent]
        });
    };

    const updateCalendarEvent = (id: string, event: Omit<CalendarEvent, 'id'>) => {
        saveData({
            ...data,
            events: data.events.map(ev => ev.id === id ? { ...event, id } : ev)
        });
    };

    const deleteCalendarEvent = (id: string) => {
        saveData({
            ...data,
            events: data.events.filter(ev => ev.id !== id)
        });
    };

    // メモ操作
    const addMemo = (memo: Omit<Memo, 'id' | 'updatedAt'>): string => {
        const id = Date.now().toString();
        const newMemo: Memo = {
            ...memo,
            id,
            updatedAt: new Date().toISOString()
        };
        saveData({
            ...data,
            memos: [newMemo, ...data.memos]
        });
        return id;
    };

    const updateMemo = (id: string, memo: Partial<Omit<Memo, 'id' | 'updatedAt'>>) => {
        saveData({
            ...data,
            memos: data.memos.map(m => m.id === id ? {
                ...m,
                ...memo,
                updatedAt: new Date().toISOString()
            } : m)
        });
    };

    const deleteMemo = (id: string) => {
        saveData({
            ...data,
            memos: data.memos.filter(m => m.id !== id)
        });
    };

    // 付箋操作
    const addSticky = (content: string, color: string, archived: boolean = false, folderId?: string) => {
        const newSticky: StickyNote = {
            id: Date.now().toString(),
            content,
            color,
            pinned: false,
            archived,
            folderId,
            createdAt: new Date().toISOString()
        };
        saveData({
            ...data,
            stickies: [newSticky, ...(data.stickies || [])]
        });
    };

    // ボイス入力専用付箋作成 (専用フォルダー「🎙️ ボイス入力付箋」を自動生成・格納)
    const addVoiceSticky = (content: string) => {
        const folders = data.stickyFolders || [];
        let voiceFolder = folders.find(f => f.name.includes('ボイス入力付箋') || f.name.includes('音声メモ'));

        let updatedFolders = folders;
        let targetFolderId = voiceFolder?.id;

        if (!voiceFolder) {
            targetFolderId = `folder-voice-${Date.now()}`;
            voiceFolder = {
                id: targetFolderId,
                name: '🎙️ ボイス入力付箋',
                color: '#a78bfa',
                createdAt: new Date().toISOString()
            };
            updatedFolders = [...folders, voiceFolder];
        }

        const newSticky: StickyNote = {
            id: Date.now().toString(),
            content,
            color: '#fef08a',
            pinned: false,
            archived: true,
            folderId: targetFolderId,
            createdAt: new Date().toISOString()
        };

        saveData({
            ...data,
            stickyFolders: updatedFolders,
            stickies: [newSticky, ...(data.stickies || [])]
        });
    };

    const updateSticky = (id: string, content: string) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).map(s => s.id === id ? { ...s, content } : s)
        });
    };

    const deleteSticky = (id: string) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).filter(s => s.id !== id)
        });
    };

    const pinSticky = (id: string, pinned: boolean) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).map(s => s.id === id ? { ...s, pinned } : s)
        });
    };

    const archiveSticky = (id: string) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).map(s => s.id === id ? { ...s, archived: true } : s)
        });
    };

    const unarchiveSticky = (id: string) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).map(s => s.id === id ? { ...s, archived: false } : s)
        });
    };

    const attachStickyToDate = (id: string, date: string | undefined) => {
        saveData({
            ...data,
            stickies: (data.stickies || []).map(s => s.id === id ? { ...s, attachedDate: date } : s)
        });
    };

    // フォルダー操作
    const addStickyFolder = (name: string, color: string) => {
        const newFolder = {
            id: Date.now().toString(),
            name,
            color,
            createdAt: new Date().toISOString()
        };
        setData(prev => ({
            ...prev,
            stickyFolders: [...(prev.stickyFolders || []), newFolder]
        }));
    };

    const renameStickyFolder = (id: string, name: string) => {
        setData(prev => ({
            ...prev,
            stickyFolders: (prev.stickyFolders || []).map(f => f.id === id ? { ...f, name } : f)
        }));
    };

    const deleteStickyFolder = (id: string) => {
        setData(prev => ({
            ...prev,
            stickyFolders: (prev.stickyFolders || []).filter(f => f.id !== id),
            stickies: (prev.stickies || []).map(s => s.folderId === id ? { ...s, folderId: undefined } : s)
        }));
    };

    const moveStickyToFolder = (stickyId: string, folderId: string | null) => {
        setData(prev => ({
            ...prev,
            stickies: (prev.stickies || []).map(s => s.id === stickyId ? {
                ...s,
                folderId: folderId || undefined,
                archived: true // 付箋ボードで移動操作された付箋は確実に保持
            } : s)
        }));
    };

    // 共有URL生成 (互換性保持)
    const getShareURL = (): string => {
        const json = JSON.stringify(data);
        const compressed = LZString.compressToEncodedURIComponent(json);
        const baseURL = window.location.origin + window.location.pathname;
        return `${baseURL}#data=${compressed}`;
    };

    // URLからのインポート
    const importShareData = (compressed: string): boolean => {
        try {
            const json = LZString.decompressFromEncodedURIComponent(compressed);
            if (!json) return false;
            const parsed = sanitizeData(JSON.parse(json));
            setData(parsed);
            return true;
        } catch (e) {
            console.error('Failed to import data', e);
            return false;
        }
    };

    // JSONテキストからのインポート
    const importFromJSON = (jsonText: string): boolean => {
        try {
            const parsed = sanitizeData(JSON.parse(jsonText));
            setData(parsed);
            return true;
        } catch (e) {
            console.error('Failed to import JSON', e);
            return false;
        }
    };

    // プリセットデータの復元（デモサンプルデータ復元）
    const restorePresetData = () => {
        saveData(INITIAL_PRESET_DATA);
    };

    // 全リセット (ローカルおよびクラウドを完全クリア)
    const resetAllData = () => {
        saveData(EMPTY_DATA);
    };

    // この端末の全データをGoogleクラウドへ明示的ダイレクト送信保存 (SDK通信が阻害された場合はHTTP REST APIで直通強行送信)
    const forceUploadToCloud = async () => {
        if (!currentUser) throw new Error('Googleでログインされていません。ログインをお試しください。');
        const userDocRef = doc(db, 'users', currentUser.uid, 'appData', 'chronosData');
        const payload = cleanForFirestore(data);

        try {
            // まずは通常のSDK通信 (3秒で応答がない場合は直通HTTP通信へシフト)
            const savePromise = setDoc(userDocRef, payload);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SDK_TIMEOUT')), 3000)
            );
            await Promise.race([savePromise, timeoutPromise]);
        } catch (e: any) {
            console.warn('SDK setDoc delayed or failed, switching to Direct REST API:', e);
            // 🔑 SDKの通信がブロックされた場合、普通のHTTPS fetchでGoogleサーバーへ直交ダイレクト送信
            const token = await currentUser.getIdToken();
            const url = `https://firestore.googleapis.com/v1/projects/chronos-app-d149d/databases/(default)/documents/users/${currentUser.uid}/appData/chronosData`;
            const clean = sanitizeData(data);
            
            const body = {
                fields: {
                    timetable: {
                        mapValue: {
                            fields: {
                                name: { stringValue: clean.timetable.name },
                                periods: { arrayValue: { values: clean.timetable.periods.map(p => ({ mapValue: { fields: { num: { integerValue: p.num }, start: { stringValue: p.start }, end: { stringValue: p.end } } } })) } },
                                cells: { mapValue: { fields: Object.fromEntries(Object.entries(clean.timetable.cells || {}).map(([k, v]) => [k, { mapValue: { fields: { title: { stringValue: v.title || '' }, room: { stringValue: v.room || '' }, teacher: { stringValue: v.teacher || '' }, color: { stringValue: v.color || '' } } } }])) } }
                            }
                        }
                    },
                    events: {
                        arrayValue: {
                            values: clean.events.map(ev => ({
                                mapValue: {
                                    fields: {
                                        id: { stringValue: ev.id },
                                        title: { stringValue: ev.title },
                                        date: { stringValue: ev.date },
                                        startTime: { stringValue: ev.startTime || '' },
                                        endTime: { stringValue: ev.endTime || '' },
                                        color: { stringValue: ev.color || '' },
                                        desc: { stringValue: ev.desc || '' }
                                    }
                                }
                            }))
                        }
                    },
                    stickies: {
                        arrayValue: {
                            values: clean.stickies.map(st => ({
                                mapValue: {
                                    fields: {
                                        id: { stringValue: st.id },
                                        content: { stringValue: st.content },
                                        color: { stringValue: st.color || '#fde68a' },
                                        createdAt: { stringValue: st.createdAt || '' },
                                        pinned: { booleanValue: !!st.pinned },
                                        archived: { booleanValue: !!st.archived },
                                        attachedDate: { stringValue: st.attachedDate || '' },
                                        folderId: { stringValue: st.folderId || '' }
                                    }
                                }
                            }))
                        }
                    },
                    memos: {
                        arrayValue: {
                            values: clean.memos.map(m => ({
                                mapValue: {
                                    fields: {
                                        id: { stringValue: m.id },
                                        title: { stringValue: m.title || '' },
                                        content: { stringValue: m.content || '' },
                                        updatedAt: { stringValue: m.updatedAt || '' }
                                    }
                                }
                            }))
                        }
                    },
                    stickyFolders: {
                        arrayValue: {
                            values: (clean.stickyFolders || []).map(f => ({
                                mapValue: {
                                    fields: {
                                        id: { stringValue: f.id },
                                        name: { stringValue: f.name }
                                    }
                                }
                            }))
                        }
                    }
                }
            };

            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errJson = await res.text();
                throw new Error(`直通通信保存エラー (${res.status}): ${errJson}`);
            }
        }

        setCloudSyncInfo({
            status: 'success',
            lastSyncedAt: new Date().toLocaleTimeString(),
            errorMessage: null,
            cloudEventCount: (data.events || []).length,
            cloudStickyCount: (data.stickies || []).length
        });
    };

    // クラウドの全データをこの端末へ強制受信読み込み (キャッシュをバイパスしてGoogleサーバーから直撃取得)
    const forceFetchFromCloud = async () => {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid, 'appData', 'chronosData');
            const snapshot = await getDocFromServer(userDocRef).catch(() => getDoc(userDocRef));
            if (snapshot.exists()) {
                const cloudData = sanitizeData(snapshot.data());
                setData(cloudData);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
            }
        } catch (e) {
            console.warn('forceFetchFromCloud offline fallback:', e);
        }
    };

    // クラウドのデータとこの端末のデータを安全に完全合体（スマートマージ）
    const forceSmartMergeCloud = async () => {
        if (!currentUser) return;
        try {
            const userDocRef = doc(db, 'users', currentUser.uid, 'appData', 'chronosData');
            const snapshot = await getDocFromServer(userDocRef).catch(() => getDoc(userDocRef));
            let merged: AppData;
            if (snapshot.exists()) {
                const cloudData = sanitizeData(snapshot.data());
                merged = mergeAppData(data, cloudData);
            } else {
                merged = data;
            }
            await setDoc(userDocRef, JSON.parse(JSON.stringify(merged)));
            setData(merged);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
            console.warn('forceSmartMergeCloud offline fallback:', e);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        }
    };

    return (
        <AppContext.Provider value={{
            data,
            theme,
            bgColor,
            loading,
            currentUser,
            loginWithGoogle,
            logout,
            toggleTheme,
            setBgColor,
            updateTimetableCell,
            saveTimetableSettings,
            addCalendarEvent,
            updateCalendarEvent,
            deleteCalendarEvent,
            addMemo,
            updateMemo,
            deleteMemo,
            addSticky,
            addVoiceSticky,
            updateSticky,
            deleteSticky,
            pinSticky,
            archiveSticky,
            unarchiveSticky,
            attachStickyToDate,
            addStickyFolder,
            renameStickyFolder,
            deleteStickyFolder,
            moveStickyToFolder,
            getShareURL,
            importShareData,
            importFromJSON,
            restorePresetData,
            resetAllData,
            cloudSyncInfo,
            forceUploadToCloud,
            forceFetchFromCloud,
            forceSmartMergeCloud
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
