import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon, Trash2, FileSpreadsheet, Pencil } from 'lucide-react';
import { getJapaneseEra, getJapaneseHoliday } from '../utils/japaneseCalendar';
import type { CalendarEvent } from '../types';

interface CalendarProps {
    onDateClick?: (dateStr: string) => void;
    onEventClick: (eventId: string) => void;
    onExportClick?: () => void;
}

const normalizeDateStr = (rawDate: string): string => {
    if (!rawDate) return '';
    const cleaned = rawDate.replace(/\//g, '-');
    const parts = cleaned.split('-');
    if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return rawDate;
};

// 予定が指定日に該当するか（単一日 または 期間指定: 開始日〜終了日）
const isEventOnDate = (ev: CalendarEvent, targetDateStr: string): boolean => {
    if (!ev || !ev.date) return false;
    const start = normalizeDateStr(ev.date);
    const end = ev.endDate ? normalizeDateStr(ev.endDate) : start;
    const target = normalizeDateStr(targetDateStr);
    return target >= start && target <= end;
};

export const Calendar: React.FC<CalendarProps> = ({ onDateClick, onEventClick, onExportClick }) => {
    const { data, addSticky, attachStickyToDate, deleteCalendarEvent, addCalendarEvent } = useApp();
    const [currentDate, setCurrentDate] = useState(() => new Date());

    // 初期状態で今日を選択
    const todayFormatted = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const [selectedDate, setSelectedDate] = useState<string | null>(todayFormatted);

    // 右側パネル内での「新規予定作成」インラインフォーム展開状態
    const [showNewEventForm, setShowNewEventForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');
    const [newDesc, setNewDesc] = useState('');

    // 右側パネル内での「新規付箋作成」展開状態
    const [showAddSticky, setShowAddSticky] = useState(false);
    const [newStickyText, setNewStickyText] = useState('');
    const [newStickyColor, setNewStickyColor] = useState('#fde68a');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const eraLabel = getJapaneseEra(year, month + 1);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // カレンダーグリッドの日付計算
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: { date: Date; isOtherMonth: boolean }[] = [];

    // 前月
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevMonthLastDay - i),
            isOtherMonth: true,
        });
    }
    // 当月
    for (let i = 1; i <= totalDays; i++) {
        days.push({
            date: new Date(year, month, i),
            isOtherMonth: false,
        });
    }
    // 次月
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isOtherMonth: true,
        });
    }

    const stickies = data.stickies || [];
    const availableStickies = stickies.filter(s => !s.attachedDate);

    // 選択中日付のイベント・付箋を取得
    const selectedDateEvents = selectedDate
        ? data.events.filter(ev => isEventOnDate(ev, selectedDate))
        : [];
    const selectedDateStickies = selectedDate
        ? stickies.filter(s => s.attachedDate && normalizeDateStr(s.attachedDate) === normalizeDateStr(selectedDate))
        : [];

    // 日付セルクリック処理
    const handleSelectDateCell = (dateStr: string) => {
        setSelectedDate(dateStr);
        setNewStartDate(dateStr);
        setNewEndDate('');
        setShowNewEventForm(false);
        setShowAddSticky(false);
        if (onDateClick) onDateClick(dateStr);
    };

    // 新規予定追加実行
    const handleSaveNewEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newStartDate) return;

        addCalendarEvent({
            title: newTitle.trim(),
            date: newStartDate,
            endDate: newEndDate ? (newEndDate >= newStartDate ? newEndDate : newStartDate) : undefined,
            startTime: newStartTime || undefined,
            endTime: newEndTime || undefined,
            color: newColor,
            desc: newDesc.trim() || undefined,
        });

        // リセット
        setNewTitle('');
        setNewEndDate('');
        setNewStartTime('');
        setNewEndTime('');
        setNewDesc('');
        setShowNewEventForm(false);
    };

    // 新規付箋作成・貼り付け実行
    const handleCreateAndAttachSticky = () => {
        if (!newStickyText.trim() || !selectedDate) return;
        addSticky(newStickyText.trim(), newStickyColor);
        setTimeout(() => {
            const latest = (data.stickies || []).slice().sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
            )[0];
            if (latest) attachStickyToDate(latest.id, selectedDate);
        }, 100);
        setNewStickyText('');
        setShowAddSticky(false);
    };

    return (
        <section id="view-calendar" className="view-section active">
            <header className="view-header">
                <h1>カレンダー</h1>
                <div className="view-actions">
                    <div className="calendar-nav">
                        <button className="btn btn-icon" onClick={handlePrevMonth}>
                            <ChevronLeft size={16} />
                        </button>
                        <h2>{`${year}年 ${month + 1}月 (${eraLabel})`}</h2>
                        <button className="btn btn-icon" onClick={handleNextMonth}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    {onExportClick && (
                        <button className="btn btn-secondary" onClick={onExportClick} title="Excel・スプレッドシート連携">
                            <FileSpreadsheet size={16} /> エクスポート
                        </button>
                    )}
                </div>
            </header>

            {/* 2カラム統合レイアウト (カレンダー左 + 日付管理右パネル) */}
            <div className="calendar-layout-wrapper">
                {/* 左側: カレンダーメイングリッド */}
                <div className="calendar-container glass">
                    <div className="calendar-grid-header">
                        <div style={{ color: '#ef4444' }}>日</div>
                        <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div>
                        <div style={{ color: '#3b82f6' }}>土</div>
                    </div>
                    <div className="calendar-grid-days">
                        {days.map((dayObj, index) => {
                            const dateObj = dayObj.date;
                            const cellDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

                            const systemToday = new Date();
                            const isToday = dateObj.getFullYear() === systemToday.getFullYear() &&
                                dateObj.getMonth() === systemToday.getMonth() &&
                                dateObj.getDate() === systemToday.getDate();

                            const isSelected = selectedDate === cellDateStr;

                            // 期間予定も含めて該当するイベント
                            const dayEvents = data.events.filter(ev => isEventOnDate(ev, cellDateStr));

                            const dayOfWeek = dateObj.getDay();
                            const appDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                            const holidayName = getJapaneseHoliday(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
                            const isHoliday = !!holidayName;

                            const classTags: React.ReactNode[] = [];
                            data.timetable.periods.forEach((period, pIdx) => {
                                const cellKey = `${appDayIdx}-${pIdx}`;
                                const classInfo = data.timetable.cells[cellKey];
                                if (classInfo && classInfo.title) {
                                    classTags.push(
                                        <div key={`tt-${pIdx}`} className="cal-event-tag timetable-tag"
                                            style={{ backgroundColor: classInfo.color || '#3b82f6', opacity: 0.5, border: '1px dashed white' }}
                                            title={`${classInfo.title} (${period.start}-${period.end}) | ${classInfo.room || ''}`}>
                                            {`[スロット${period.num}] ${classInfo.title}`}
                                        </div>
                                    );
                                }
                            });

                            let dayColor: string | undefined;
                            if (dayOfWeek === 0 || isHoliday) dayColor = '#ef4444';
                            else if (dayOfWeek === 6) dayColor = '#3b82f6';

                            const dateStickies = stickies.filter(s => s.attachedDate === cellDateStr);

                            return (
                                <div
                                    key={index}
                                    className={`calendar-day ${dayObj.isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected-day' : ''}`}
                                    onClick={() => handleSelectDateCell(cellDateStr)}
                                    style={isHoliday ? { backgroundColor: 'rgba(239, 68, 68, 0.03)' } : undefined}
                                >
                                    {/* 日付番号 + 祝日 */}
                                    <div className="day-number-row">
                                        <span className="day-number" style={dayColor ? { color: dayColor } : undefined}>
                                            {dateObj.getDate()}
                                            {holidayName && (
                                                <span className="holiday-label" title={holidayName}>{holidayName}</span>
                                            )}
                                        </span>
                                        {dateStickies.length > 0 && (
                                            <span className="day-sticky-count-badge" title={`付箋: ${dateStickies.length}件`}>
                                                📌 {dateStickies.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* 付箋カラーマーカー */}
                                    {dateStickies.length > 0 && (
                                        <div className="day-sticky-markers">
                                            {dateStickies.map(s => (
                                                <span
                                                    key={s.id}
                                                    className="sticky-marker"
                                                    style={{ backgroundColor: s.color }}
                                                    title={s.content}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* 予定・業務 */}
                                    <div className="day-events">
                                        {dayEvents.map(ev => {
                                            const isPeriod = ev.endDate && ev.endDate > ev.date;
                                            return (
                                                <div key={ev.id} className={`cal-event-tag ${isPeriod ? 'period-event' : ''}`}
                                                    style={{ backgroundColor: ev.color || '#3b82f6' }}
                                                    title={`${ev.title}${isPeriod ? ` (${ev.date}〜${ev.endDate})` : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); onEventClick(ev.id); }}>
                                                    {isPeriod && '🚩 '}{ev.startTime ? `${ev.startTime} ` : ''}{ev.title}
                                                </div>
                                            );
                                        })}
                                        {classTags}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 右側: 日付管理 統合サイドパネル */}
                {selectedDate && (
                    <div className="calendar-side-panel glass">
                        <div className="side-panel-header">
                            <h2>📅 {selectedDate} の管理</h2>
                            <button className="btn btn-icon btn-secondary close-btn" onClick={() => setSelectedDate(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="side-panel-body">
                            {/* 操作アクションボタンバー */}
                            <div className="side-panel-actions">
                                <button
                                    className={`btn ${showNewEventForm ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => {
                                        setNewStartDate(selectedDate);
                                        setShowNewEventForm(v => !v);
                                        setShowAddSticky(false);
                                    }}
                                >
                                    <Plus size={16} /> {showNewEventForm ? 'フォームを閉じる' : '新規予定を追加'}
                                </button>

                                <button
                                    className={`btn ${showAddSticky ? 'btn-secondary' : 'btn-secondary'}`}
                                    onClick={() => {
                                        setShowAddSticky(v => !v);
                                        setShowNewEventForm(false);
                                    }}
                                >
                                    📌 新規付箋を貼る
                                </button>
                            </div>

                            {/* ① 日付管理のすぐ下に直下ポップアップ展開する「新規予定作成フォーム」 */}
                            {showNewEventForm && (
                                <form onSubmit={handleSaveNewEvent} className="side-panel-new-event-box glass">
                                    <h3>✨ 新規予定の作成</h3>

                                    <div className="form-group">
                                        <label className="form-label">予定タイトル *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="例: 出張、研修、ミーティング"
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {/* 開始日 〜 終了日（期間予定対応） */}
                                    <div className="form-row" style={{ display: 'flex', gap: '8px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">開始日 *</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={newStartDate}
                                                onChange={e => setNewStartDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">終了日 (期間指定)</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={newEndDate}
                                                min={newStartDate}
                                                onChange={e => setNewEndDate(e.target.value)}
                                                placeholder="単日の場合は空欄"
                                            />
                                        </div>
                                    </div>

                                    {/* 時間設定 */}
                                    <div className="form-row" style={{ display: 'flex', gap: '8px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">開始時間</label>
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={newStartTime}
                                                onChange={e => setNewStartTime(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">終了時間</label>
                                            <input
                                                type="time"
                                                className="form-input"
                                                value={newEndTime}
                                                onChange={e => setNewEndTime(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* タグカラー選択 */}
                                    <div className="form-group">
                                        <label className="form-label">タグカラー</label>
                                        <div className="color-selector">
                                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`color-chip ${newColor === c ? 'selected' : ''}`}
                                                    style={{ background: c }}
                                                    onClick={() => setNewColor(c)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* メモ */}
                                    <div className="form-group">
                                        <label className="form-label">詳細メモ</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="例: 場所、持参物など"
                                            value={newDesc}
                                            onChange={e => setNewDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-actions-row">
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowNewEventForm(false)}>
                                            キャンセル
                                        </button>
                                        <button type="submit" className="btn btn-sm btn-primary">
                                            保存する
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ② 直下ポップアップ展開する「新規付箋作成フォーム」 */}
                            {showAddSticky && (
                                <div className="side-panel-new-sticky-box glass">
                                    <h3>📌 新規付箋を作成して貼る</h3>
                                    <textarea
                                        className="form-input"
                                        placeholder="付箋のメモ内容を入力..."
                                        value={newStickyText}
                                        onChange={e => setNewStickyText(e.target.value)}
                                        rows={2}
                                    />
                                    <div className="color-selector" style={{ marginTop: '8px' }}>
                                        {['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`color-chip ${newStickyColor === c ? 'selected' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => setNewStickyColor(c)}
                                            />
                                        ))}
                                    </div>
                                    <div className="form-actions-row" style={{ marginTop: '8px' }}>
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAddSticky(false)}>
                                            キャンセル
                                        </button>
                                        <button type="button" className="btn btn-sm btn-primary" onClick={handleCreateAndAttachSticky} disabled={!newStickyText.trim()}>
                                            貼り付ける
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* セクション 1: 予定一覧 */}
                            <div className="side-panel-section">
                                <h3><CalIcon size={16} /> 予定一覧 ({selectedDateEvents.length}件)</h3>
                                {selectedDateEvents.length === 0 ? (
                                    <p className="empty-text">この日の予定はありません</p>
                                ) : (
                                    <div className="side-panel-list">
                                        {selectedDateEvents.map(ev => {
                                            const isPeriod = ev.endDate && ev.endDate > ev.date;
                                            return (
                                                <div key={ev.id} className="side-panel-item" style={{ borderLeftColor: ev.color || '#3b82f6' }}>
                                                    <div className="side-panel-item-info">
                                                        <strong>{isPeriod && '🚩 '}{ev.title}</strong>
                                                        {isPeriod && (
                                                            <div className="period-badge">
                                                                🗓️ {ev.date} 〜 {ev.endDate}
                                                            </div>
                                                        )}
                                                        {ev.startTime && (
                                                            <span className="time-badge">
                                                                ⏰ {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                                                            </span>
                                                        )}
                                                        {ev.desc && <p className="item-desc">{ev.desc}</p>}
                                                    </div>
                                                    <div className="side-panel-item-btns">
                                                        <button className="btn btn-sm btn-secondary" onClick={() => onEventClick(ev.id)} title="編集">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-secondary danger" onClick={() => deleteCalendarEvent(ev.id)} title="削除">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* セクション 2: 貼り付け中の付箋 */}
                            <div className="side-panel-section">
                                <h3>📌 貼り付け中の付箋 ({selectedDateStickies.length}件)</h3>
                                {selectedDateStickies.length === 0 ? (
                                    <p className="empty-text">貼り付けられている付箋はありません</p>
                                ) : (
                                    <div className="side-panel-list">
                                        {selectedDateStickies.map(s => (
                                            <div key={s.id} className="side-panel-item sticky-item" style={{ borderLeftColor: s.color }}>
                                                <div className="side-panel-item-info">
                                                    <p className="sticky-text">{s.content}</p>
                                                </div>
                                                <button className="btn btn-sm btn-secondary" onClick={() => attachStickyToDate(s.id, undefined)}>
                                                    ✕ 解除
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* セクション 3: 未貼付け付箋からのアタッチ */}
                            {availableStickies.length > 0 && (
                                <div className="side-panel-section">
                                    <h3>🗂️ 未貼付けの付箋から選択して貼る</h3>
                                    <div className="side-panel-available-stickies">
                                        {availableStickies.map(s => (
                                            <button
                                                key={s.id}
                                                className="available-sticky-btn"
                                                style={{ borderLeftColor: s.color }}
                                                onClick={() => attachStickyToDate(s.id, selectedDate)}
                                            >
                                                <span>{s.content}</span>
                                                <span className="attach-plus">+ 貼る</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
