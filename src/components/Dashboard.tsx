import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, BookOpen, Plus, Smile, StickyNote, X, Pin, Archive } from 'lucide-react';
import { ChronosWidgetPanel } from './ChronosWidgetPanel';

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
    const { data, addSticky, updateSticky, deleteSticky, pinSticky, archiveSticky } = useApp();
    const [selectedColor, setSelectedColor] = useState(STICKY_COLORS[0]);
    const [newStickyText, setNewStickyText] = useState('');
    const debounceTimers = useRef<{ [id: string]: ReturnType<typeof setTimeout> }>({});

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
        const text = newStickyText.trim();
        if (!text) return;
        addSticky(text, selectedColor);
        setNewStickyText('');
    };

    const handleStickyChange = (id: string, value: string) => {
        if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
        debounceTimers.current[id] = setTimeout(() => {
            updateSticky(id, value);
        }, 500);
    };

    // ダッシュボードには未保管・未フォルダー・カレンダー未貼付の日常付箋のみ表示
    const stickies = (data.stickies || []).filter(s => !s.archived && !s.folderId && !s.attachedDate);
    const sortedStickies = [...stickies.filter(s => s.pinned), ...stickies.filter(s => !s.pinned)];

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

                {/* 付箋ボード（全幅・2段階ボタン） */}
                <div className="dashboard-card glass sticky-board-card">
                    <div className="card-header">
                        <h2><StickyNote size={20} /> 付箋ボード</h2>
                        <div className="sticky-board-legend">
                            <span className="legend-item"><Pin size={12} /> ピン止め</span>
                            <span className="legend-item"><Archive size={12} /> 長期保存</span>
                        </div>
                    </div>
                    <div className="card-content sticky-board-content">
                        {/* 新規入力エリア */}
                        <div className="sticky-input-area">
                            <div className="sticky-color-picker">
                                {STICKY_COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`sticky-color-btn ${selectedColor === c ? 'active' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setSelectedColor(c)}
                                        title={c}
                                    />
                                ))}
                            </div>
                            <div className="sticky-input-row">
                                <input
                                    type="text"
                                    className="sticky-new-input"
                                    placeholder="付箋に書く内容... (Enterで追加)"
                                    value={newStickyText}
                                    onChange={(e) => setNewStickyText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSticky(); }}
                                    style={{ borderColor: selectedColor }}
                                />
                                <button className="btn btn-sm btn-primary" onClick={handleAddSticky}>
                                    <Plus size={14} /> 追加
                                </button>
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
                                            onClick={() => pinSticky(s.id, !s.pinned)}
                                            title={s.pinned ? 'ピン解除' : 'ボードにピン止め（ダッシュボードに残す）'}
                                        >
                                            <Pin size={11} />
                                        </button>
                                        {/* 長期保存ボタン */}
                                        <button
                                            className="sticky-action-btn archive-btn"
                                            onClick={() => archiveSticky(s.id)}
                                            title="長期保存（付箋ボードページへ移動）"
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
                    </div>
                </div>
            </div>
        </section>
    );
};
