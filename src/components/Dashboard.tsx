import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, BookOpen, Plus, Smile, StickyNote, X, Pin, Archive } from 'lucide-react';
import { ChronosWidgetPanel } from './ChronosWidgetPanel';
import { YukiyanArtPromoBanner } from './YukiyanArtPromoBanner';

interface DashboardProps {
    onViewChange: (view: string) => void;
    onAddEventClick: () => void;
}

const STICKY_COLORS = [
    '#fde68a', // 黄
    '#bbf7d0', // 緑
    '#bfdbfe', // 青
    '#fecaca', // 赤ピンク
    '#e9d5ff', // 紫
    '#fed7aa', // オレンジ
    '#f9a8d4', // ピンク
    '#a7f3d0', // ミント
];

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange, onAddEventClick }) => {
    const {
        data, addSticky, updateSticky, deleteSticky, pinSticky, archiveSticky,
        addNotebookNote, updateNotebookNote,
        draftStickyText, draftStickyColor, setDraftStickyText, setDraftStickyColor, clearDraftSticky
    } = useApp();
    const debounceTimers = useRef<{ [id: string]: ReturnType<typeof setTimeout> }>({});
    const [notice, setNotice] = useState<string | null>(null);
    const [inputTarget, setInputTarget] = useState<'sticky' | 'notebook'>('sticky');

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('ja-JP', { dateStyle: 'full' }).format(today);

    const dayOfWeek = today.getDay();
    const appDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const periods = data.timetable.periods;
    const cells = data.timetable.cells;

    const todayClasses = periods.map((period, pIdx) => {
        const key = `${appDayIdx}-${pIdx}`;
        const cell = cells[key];
        return cell && cell.title ? { period, cell } : null;
    }).filter(Boolean);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todayEvents = data.events
        .filter(ev => ev.date === todayStr)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    const upcomingEvents = data.events
        .filter(ev => ev.date > todayStr)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
        .slice(0, 5);

    const handleAddSticky = () => {
        const text = draftStickyText.trim();
        if (!text) return;

        if (inputTarget === 'notebook') {
            const existingToday = (data.notebookNotes || []).find(n => n.type === 'daily' && n.date === todayStr);
            const nowTime = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            if (existingToday) {
                updateNotebookNote(existingToday.id, {
                    content: (existingToday.content ? existingToday.content + '\n' : '') + `[${nowTime}] ${text}`
                });
            } else {
                addNotebookNote({
                    title: `${todayStr} デイリーログ`,
                    content: `[${nowTime}] ${text}`,
                    type: 'daily',
                    date: todayStr,
                    color: '#ffffff',
                    isLocked: true
                });
            }
            setNotice('📔 今日のノートに記録しました。');
            setTimeout(() => setNotice(null), 6000);
            clearDraftSticky();
            return;
        }

        // ピン留めが10件以上ある場合、新規付箋は即座に付箋ボードの保管ストックに押し出される旨を案内
        if (pinnedStickies.length >= 10) {
            setNotice('ダッシュボードがピン留め（10件）で満杯のため、付箋ボードの保管ストックに保存しました。');
            setTimeout(() => setNotice(null), 6000);
        }

        addSticky(text, draftStickyColor);
        clearDraftSticky();
    };

    const handleTogglePin = (id: string, currentPinned: boolean) => {
        if (!currentPinned && pinnedStickies.length >= 10) {
            setNotice('ピン留めは最大10件までです。他のピン留めを解除してからお試しください。');
            setTimeout(() => setNotice(null), 6000);
            return;
        }
        pinSticky(id, !currentPinned);
    };

    const handleStickyChange = (id: string, value: string) => {
        if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
        debounceTimers.current[id] = setTimeout(() => {
            updateSticky(id, value);
        }, 500);
    };

    // ダッシュボード対象付箋:
    // 1. ピン留めされている付箋（s.pinned === true）
    // 2. カレンダー未貼付かつフォルダー未設定の通常付箋（!s.attachedDate && !s.folderId）
    // ※ ピン留め付箋を最優先。空いた枠に未ピン付箋の最新順を配置（最大10枚の上限・押し出しルール）
    const allCandidateStickies = (data.stickies || []).filter(s => !s.attachedDate && !s.folderId && !s.archived);
    const pinnedStickies = allCandidateStickies.filter(s => s.pinned);
    const unpinnedStickies = allCandidateStickies.filter(s => !s.pinned);

    const maxDashboardLimit = 10;
    const availableSlotsForUnpinned = Math.max(0, maxDashboardLimit - pinnedStickies.length);
    const activeUnpinnedStickies = unpinnedStickies.slice(0, availableSlotsForUnpinned);
    const sortedStickies = [...pinnedStickies, ...activeUnpinnedStickies];
    const overflowCount = Math.max(0, unpinnedStickies.length - availableSlotsForUnpinned);

    return (
        <section id="view-dashboard" className="view-section active">
            <header className="view-header">
                <h1>ダッシュボード</h1>
                <p className="current-date-display">{formattedDate}</p>
            </header>

            {/* スマホ・PC共通の最上部ウィジェットエリア */}
            <div className="dashboard-widget-wrapper mb-4">
                <ChronosWidgetPanel />
            </div>

            <div className="dashboard-grid">
                {/* 今日のスケジュール */}
                <div className="dashboard-card glass timetable-card">
                    <div className="card-header">
                        <h2><BookOpen size={20} /> 今日のスケジュール</h2>
                    </div>
                    <div className="card-content">
                        {todayClasses.length > 0 && (
                            <>
                                <div className="dash-section-label">📚 業務</div>
                                {todayClasses.map((item, idx) => (
                                    <div key={idx} className="dash-item" onClick={() => onViewChange('timetable')}>
                                        <div className="dash-item-color" style={{ backgroundColor: item?.cell.color || '#3b82f6' }}></div>
                                        <div className="dash-item-info">
                                            <div className="dash-item-title">{item?.cell.title}</div>
                                            <div className="dash-item-meta">
                                                スロット{item?.period.num} ({item?.period.start} - {item?.period.end}) | {item?.cell.room || '場所指定なし'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {todayEvents.length > 0 && (
                            <>
                                <div className="dash-section-label">📅 予定</div>
                                {todayEvents.map(ev => (
                                    <div key={ev.id} className="dash-item" onClick={() => onViewChange('calendar')}>
                                        <div className="dash-item-color" style={{ backgroundColor: ev.color || '#3b82f6' }}></div>
                                        <div className="dash-item-info">
                                            <div className="dash-item-title">{ev.title}</div>
                                            <div className="dash-item-meta">
                                                {ev.startTime ? `${ev.startTime}〜${ev.endTime || ''}` : '終日'}
                                                {ev.desc && ` | ${ev.desc}`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {todayClasses.length === 0 && todayEvents.length === 0 && (
                            <div className="empty-state">
                                <Smile size={32} />
                                <p>今日のスケジュールはありません</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 近日の予定 */}
                <div className="dashboard-card glass events-card">
                    <div className="card-header">
                        <h2><Calendar size={20} /> 近日の予定</h2>
                        <button className="btn btn-sm btn-primary" onClick={onAddEventClick}>
                            <Plus size={14} /> 予定追加
                        </button>
                    </div>
                    <div className="card-content">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((ev) => {
                                const evDate = new Date(ev.date + 'T00:00:00');
                                const dateLabel = `${evDate.getMonth() + 1}/${evDate.getDate()} (${['日', '月', '火', '水', '木', '金', '土'][evDate.getDay()]})`;
                                const timeLabel = ev.startTime ? ` ${ev.startTime}〜` : ' 終日';
                                return (
                                    <div key={ev.id} className="dash-item" onClick={() => onViewChange('calendar')}>
                                        <div className="dash-item-color" style={{ backgroundColor: ev.color || '#3b82f6' }}></div>
                                        <div className="dash-item-info">
                                            <div className="dash-item-title">{ev.title}</div>
                                            <div className="dash-item-meta">{dateLabel}{timeLabel} | {ev.desc || ''}</div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state">
                                <Smile size={32} />
                                <p>近日の予定はありません</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 付箋ボード（全幅・上限10枚押し出し式） */}
                <div className="dashboard-card glass sticky-board-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>
                            <StickyNote size={20} /> デスク付箋
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, marginLeft: '8px' }}>
                                ({sortedStickies.length}/10枚)
                            </span>
                        </h2>
                        <div className="sticky-board-legend">
                            <span className="legend-item"><Pin size={12} /> ピン止め優先</span>
                        </div>
                    </div>
                    <div className="card-content sticky-board-content">
                        {/* 案内トースト */}
                        {notice && (
                            <div className="sticky-overflow-toast">
                                <span>{notice}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        className="toast-link-btn"
                                        onClick={() => onViewChange(notice.includes('ノート') ? 'notebook' : 'memos')}
                                    >
                                        {notice.includes('ノート') ? 'ノートを開く ↗' : '付箋ボードを見る ↗'}
                                    </button>
                                    <button className="toast-close-btn" onClick={() => setNotice(null)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 新規入力エリア (付箋 / 今日のノートの切替入力) */}
                        <div className="dashboard-quick-input-container">
                            {/* 切り替えセグメントタブ */}
                            <div className="dash-input-tabs">
                                <button
                                    type="button"
                                    className={`dash-tab-btn ${inputTarget === 'sticky' ? 'active sticky-mode' : ''}`}
                                    onClick={() => setInputTarget('sticky')}
                                >
                                    <span className="dash-tab-title"><StickyNote size={14} /> 付箋を作成</span>
                                    <span className="dash-tab-sub">デスク上に貼る (上限10枚)</span>
                                </button>
                                <button
                                    type="button"
                                    className={`dash-tab-btn ${inputTarget === 'notebook' ? 'active notebook-mode' : ''}`}
                                    onClick={() => setInputTarget('notebook')}
                                >
                                    <span className="dash-tab-title"><BookOpen size={14} /> 今日のノートに記録</span>
                                    <span className="dash-tab-sub">日付ログに追記 (カレンダー連動)</span>
                                </button>
                            </div>

                            {/* 入力フォーム本体 */}
                            <div className={`dash-input-body ${inputTarget}`}>
                                {inputTarget === 'sticky' ? (
                                    <div className="dash-input-subline">
                                        <span className="dash-input-hint">
                                            📌 付箋カラーを選択:
                                        </span>
                                        <div className="sticky-color-picker">
                                            {STICKY_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`sticky-color-btn ${draftStickyColor === c ? 'active' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => setDraftStickyColor(c)}
                                                    title={c}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="dash-input-subline">
                                        <span className="dash-input-hint notebook-hint">
                                            📔 本日（{todayStr}）のデイリーノートにタイムスタンプ付きで記録します
                                        </span>
                                    </div>
                                )}

                                <div className="sticky-input-row">
                                    <input
                                        type="text"
                                        className="sticky-new-input"
                                        placeholder={inputTarget === 'sticky' ? "付箋のメモ内容を入力... (Enterで追加)" : "今日のノートに記録する内容... (Enterで日付ログに追記)"}
                                        value={draftStickyText}
                                        onChange={(e) => setDraftStickyText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSticky(); }}
                                        style={{ borderColor: inputTarget === 'sticky' ? draftStickyColor : '#6366f1' }}
                                    />
                                    <button
                                        className={`btn btn-sm ${inputTarget === 'sticky' ? 'btn-primary' : 'btn-notebook-primary'}`}
                                        onClick={handleAddSticky}
                                    >
                                        <Plus size={14} /> {inputTarget === 'sticky' ? '付箋を追加' : 'ノートへ記録'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 付箋一覧 */}
                        <div className="stickies-grid">
                            {sortedStickies.length === 0 && (
                                <div className="sticky-empty">
                                    <StickyNote size={28} style={{ opacity: 0.3 }} />
                                    <p>付箋がありません</p>
                                </div>
                            )}
                            {sortedStickies.map(s => (
                                <div
                                    key={s.id}
                                    className={`sticky-note ${s.pinned ? 'pinned' : ''}`}
                                    style={{ backgroundColor: s.color }}
                                >
                                    {/* ピン止めインジケーター */}
                                    {s.pinned && (
                                        <div className="sticky-pin-indicator" title="ピン止め中">📌</div>
                                    )}

                                    {/* 操作ボタン群 */}
                                    <div className="sticky-action-row">
                                        {/* ピン止め/解除ボタン */}
                                        <button
                                            className={`sticky-action-btn pin-btn ${s.pinned ? 'active' : ''}`}
                                            onClick={() => handleTogglePin(s.id, s.pinned)}
                                            title={s.pinned ? 'ピン解除' : 'ボードにピン止め（ダッシュボード最優先固定）'}
                                        >
                                            <Pin size={11} />
                                        </button>
                                        {/* 付箋ボードへ移動（長期保存）ボタン */}
                                        <button
                                            className="sticky-action-btn archive-btn"
                                            onClick={() => archiveSticky(s.id)}
                                            title="付箋ボードへ移動（ダッシュボードから外す）"
                                        >
                                            <Archive size={11} />
                                        </button>
                                        {/* 削除ボタン */}
                                        <button
                                            className="sticky-action-btn delete-btn"
                                            onClick={() => deleteSticky(s.id)}
                                            title="削除"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>

                                    <textarea
                                        className="sticky-textarea"
                                        defaultValue={s.content}
                                        style={{ backgroundColor: 'transparent' }}
                                        onChange={(e) => handleStickyChange(s.id, e.target.value)}
                                    />
                                    {/* カレンダー貼り付け状態 */}
                                    {s.attachedDate && (
                                        <div className="sticky-attached-badge">
                                            📅 {s.attachedDate}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 下部案内リンクバー */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '16px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            <div>
                                {overflowCount > 0 ? (
                                    <span>⚠️ 上限10枚を超えたため <strong>{overflowCount}枚</strong> が付箋ボードに保管中</span>
                                ) : (
                                    <span>💡 ピン留め優先で最大10枚までデスクに常駐します</span>
                                )}
                            </div>
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => onViewChange('memos')}
                                style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}
                            >
                                付箋ボードで全付箋（{(data.stickies || []).length}件）を整理 ↗
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🚀 yukiyanArt 公式自社アプリ紹介プロモーションバナー (ダッシュボード最下部) */}
            <YukiyanArtPromoBanner />
        </section>
    );
};
