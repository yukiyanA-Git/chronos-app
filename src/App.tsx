import { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { Timetable } from './components/Timetable';
import { Calendar } from './components/Calendar';
import { Memos } from './components/Memos';
import { Settings } from './components/Settings';
import { EventModal } from './components/EventModal';
import { TimetableSettingsModal } from './components/TimetableSettingsModal';
import { ShareImportModal } from './components/ShareImportModal';
import { ExportModal } from './components/ExportModal';
import { GuideModal } from './components/GuideModal';
import { ChronosWidgetPanel } from './components/ChronosWidgetPanel';
import { LayoutDashboard, Grid, Calendar as CalendarIcon, StickyNote, Settings as SettingsIcon, Circle, Clock, AlertCircle, HelpCircle, LogIn, LogOut } from 'lucide-react';

function App() {
    const { data, theme, loading, toggleTheme, importShareData, currentUser, loginWithGoogle, logout } = useApp();
    const [currentView, setCurrentView] = useState('dashboard');

    // モーダル表示状態
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isTtSettingsOpen, setIsTtSettingsOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    // 編集モーダル用パラメータ
    const [modalMode, setModalMode] = useState<'timetable' | 'calendar'>('calendar');
    const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
    const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

    // 一時プレビュー用の状態
    const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
    const [backupData, setBackupData] = useState<string | null>(null);

    // 起動時のハッシュチェック
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#data=')) {
            setIsImportModalOpen(true);
        }
    }, []);

    const handleImportOverwrite = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#data=')) {
            const success = importShareData(hash.substring(6));
            if (success) {
                alert('データをインポートしました！');
                setIsReadOnlyMode(false);
                setBackupData(null);
            } else {
                alert('データのデコードに失敗しました。');
            }
        }
        setIsImportModalOpen(false);
        window.location.hash = '';
    };

    const handleImportViewOnly = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#data=')) {
            // バックアップ退避
            setBackupData(JSON.stringify(data));
            const success = importShareData(hash.substring(6));
            if (success) {
                setIsReadOnlyMode(true);
                alert('一時閲覧モードで表示しています。タブを閉じたりリロードすると、元のデータに戻ります。');
            } else {
                alert('データの読み込みに失敗しました。');
            }
        }
        setIsImportModalOpen(false);
        window.location.hash = '';
    };

    const handleReadOnlySave = () => {
        setIsReadOnlyMode(false);
        setBackupData(null);
        alert('データを自分のブラウザに保存しました！');
    };

    const handleReadOnlyCancel = () => {
        if (backupData) {
            try {
                JSON.parse(backupData);
                // 直接 LocalStorage と State を復元するためにリロード
                localStorage.setItem('chronos_data', backupData);
                window.location.reload();
            } catch (e) {
                console.error(e);
            }
        }
        setIsReadOnlyMode(false);
        setBackupData(null);
    };

    // 時間割のセルクリック
    const handleTimetableCellClick = (dayIdx: number, periodIdx: number) => {
        setModalMode('timetable');
        setSelectedDayIdx(dayIdx);
        setSelectedPeriodIdx(periodIdx);
        setSelectedEventId(null);
        setSelectedDateStr(null);
        setIsEventModalOpen(true);
    };



    // カレンダーのイベントクリック（編集）
    const handleCalendarEventClick = (eventId: string) => {
        setModalMode('calendar');
        setSelectedDayIdx(null);
        setSelectedPeriodIdx(null);
        setSelectedEventId(eventId);
        setSelectedDateStr(null);
        setIsEventModalOpen(true);
    };

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <Clock size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>データを読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* 一時プレビュー警告バー */}
            {isReadOnlyMode && (
                <div
                    className="glass"
                    style={{
                        position: 'fixed',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '12px 24px',
                        zIndex: 2000,
                        border: '1px solid #f59e0b',
                        background: 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        gap: '15px',
                        alignItems: 'center',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <span style={{ color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} /> 共有データを一時表示中
                    </span>
                    <button className="btn btn-sm btn-primary" onClick={handleReadOnlySave}>
                        このデータを保存する
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={handleReadOnlyCancel}>
                        戻す
                    </button>
                </div>
            )}

            {/* サイドバー (PC用) */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <Clock size={24} />
                        <span>Chronos</span>
                    </div>
                </div>

                <nav className="sidebar-menu">
                    <button
                        className={`menu-item ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setCurrentView('dashboard')}
                    >
                        <LayoutDashboard size={18} />
                        <span>ダッシュボード</span>
                    </button>
                    <button
                        className={`menu-item ${currentView === 'timetable' ? 'active' : ''}`}
                        onClick={() => setCurrentView('timetable')}
                    >
                        <Grid size={18} />
                        <span>タイムテーブル</span>
                    </button>
                    <button
                        className={`menu-item ${currentView === 'calendar' ? 'active' : ''}`}
                        onClick={() => setCurrentView('calendar')}
                    >
                        <CalendarIcon size={18} />
                        <span>カレンダー</span>
                    </button>
                    <button
                        className={`menu-item ${currentView === 'memos' ? 'active' : ''}`}
                        onClick={() => setCurrentView('memos')}
                    >
                        <StickyNote size={18} />
                        <span>付箋ボード</span>
                    </button>
                    <button
                        className={`menu-item ${currentView === 'settings' ? 'active' : ''}`}
                        onClick={() => setCurrentView('settings')}
                    >
                        <SettingsIcon size={18} />
                        <span>設定・データ</span>
                    </button>
                    <button
                        className="menu-item"
                        onClick={() => setIsGuideModalOpen(true)}
                        style={{ color: '#f59e0b' }}
                    >
                        <HelpCircle size={18} />
                        <span>使い方ガイド</span>
                    </button>
                </nav>

                {/* Chronos ウィジェットパネル (アナログ時計・直近カウントダウン・音声メモ) */}
                <ChronosWidgetPanel />

                <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Googleアカウントログイン状態 */}
                    {currentUser ? (
                        <div className="user-profile-badge glass" style={{ padding: '8px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                                ) : (
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                        {currentUser.displayName ? currentUser.displayName.slice(0, 1) : 'U'}
                                    </div>
                                )}
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                    {currentUser.displayName || 'ログイン中'}
                                </span>
                            </div>
                            <button className="btn btn-icon btn-secondary" onClick={logout} title="ログアウト" style={{ padding: '4px' }}>
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-secondary btn-sm" onClick={loginWithGoogle} style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', gap: '6px' }}>
                            <LogIn size={14} />
                            <span>Googleでログイン</span>
                        </button>
                    )}

                    <button className="theme-toggle-btn" onClick={toggleTheme} title="文字色切り替え">
                        <Circle size={14} fill={theme === 'dark' ? '#ffffff' : '#1e293b'} color={theme === 'dark' ? '#ffffff' : '#1e293b'} />
                        <span>文字色: {theme === 'dark' ? '白' : '黒'}</span>
                    </button>
                </div>
            </aside>

            {/* スマホ用 固定ボトムナビゲーションバー */}
            <div className="mobile-bottom-bar">
                <button
                    className={`mobile-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setCurrentView('dashboard')}
                >
                    <LayoutDashboard size={20} />
                    <span>ホーム</span>
                </button>
                <button
                    className={`mobile-nav-item ${currentView === 'timetable' ? 'active' : ''}`}
                    onClick={() => setCurrentView('timetable')}
                >
                    <Grid size={20} />
                    <span>タイムテーブル</span>
                </button>
                <button
                    className={`mobile-nav-item ${currentView === 'calendar' ? 'active' : ''}`}
                    onClick={() => setCurrentView('calendar')}
                >
                    <CalendarIcon size={20} />
                    <span>カレンダー</span>
                </button>
                <button
                    className={`mobile-nav-item ${currentView === 'memos' ? 'active' : ''}`}
                    onClick={() => setCurrentView('memos')}
                >
                    <StickyNote size={20} />
                    <span>付箋ボード</span>
                </button>
                <button
                    className={`mobile-nav-item ${currentView === 'settings' ? 'active' : ''}`}
                    onClick={() => setCurrentView('settings')}
                >
                    <SettingsIcon size={20} />
                    <span>設定</span>
                </button>
            </div>

            {/* メインコンテンツ */}
            <main className="main-content">
                {/* クラウド同期案内ステータスバー */}
                <div className="global-sync-bar">
                    {currentUser ? (
                        <div className="sync-bar-item synced">
                            <span className="sync-dot green">●</span>
                            <span>クラウド同期中 ({currentUser.email || currentUser.displayName || 'ログイン済み'})</span>
                        </div>
                    ) : (
                        <div className="sync-bar-item offline" onClick={loginWithGoogle} title="クリックしてログイン">
                            <span className="sync-dot orange">●</span>
                            <span>未ログイン (スマホ・PC連携オフ) ➔ <strong style={{ textDecoration: 'underline' }}>タップしてGoogleログインで同期</strong></span>
                        </div>
                    )}
                </div>

                {currentView === 'dashboard' && (
                    <Dashboard
                        onViewChange={setCurrentView}
                        onAddEventClick={() => {
                            setModalMode('calendar');
                            setSelectedDayIdx(null);
                            setSelectedPeriodIdx(null);
                            setSelectedEventId(null);
                            setSelectedDateStr(new Date().toLocaleDateString('sv-SE'));
                            setIsEventModalOpen(true);
                        }}
                    />
                )}
                {currentView === 'timetable' && (
                    <Timetable
                        onCellClick={handleTimetableCellClick}
                        onSettingsClick={() => setIsTtSettingsOpen(true)}
                    />
                )}
                {currentView === 'calendar' && (
                    <Calendar
                        onEventClick={handleCalendarEventClick}
                        onExportClick={() => setIsExportModalOpen(true)}
                    />
                )}
                {currentView === 'memos' && <Memos onExportClick={() => setIsExportModalOpen(true)} />}
                {currentView === 'settings' && <Settings onExportClick={() => setIsExportModalOpen(true)} />}
            </main>

            {/* 予定/業務編集モーダル */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                mode={modalMode}
                dayIdx={selectedDayIdx}
                periodIdx={selectedPeriodIdx}
                eventId={selectedEventId}
                initialDateStr={selectedDateStr}
            />

            {/* 時間割設定モーダル */}
            <TimetableSettingsModal
                isOpen={isTtSettingsOpen}
                onClose={() => setIsTtSettingsOpen(false)}
            />

            {/* 共有インポートモーダル */}
            <ShareImportModal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    window.location.hash = '';
                }}
                onImportOverwrite={handleImportOverwrite}
                onImportViewOnly={handleImportViewOnly}
            />

            {/* エクスポート・Excel連携モーダル */}
            {isExportModalOpen && (
                <ExportModal onClose={() => setIsExportModalOpen(false)} />
            )}

            {/* 簡易仕様書・使い方ガイドモーダル */}
            {isGuideModalOpen && (
                <GuideModal onClose={() => setIsGuideModalOpen(false)} />
            )}
        </div>
    );
}

export default App;
