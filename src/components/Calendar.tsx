import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon, Trash2, FileSpreadsheet } from 'lucide-react';
import { getJapaneseEra, getJapaneseHoliday } from '../utils/japaneseCalendar';

interface CalendarProps {
    onDateClick: (dateStr: string) => void;
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

export const Calendar: React.FC<CalendarProps> = ({ onDateClick, onEventClick, onExportClick }) => {
    const { data, addSticky, attachStickyToDate, deleteCalendarEvent } = useApp();
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // 新規付箋即時追加用
    const [newStickyText, setNewStickyText] = useState('');
    const [newStickyColor, setNewStickyColor] = useState('#fde68a');
    const [showAddSticky, setShowAddSticky] = useState(false);

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

    // 前月の日付
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
            date: new Date(year, month - 1, prevMonthLastDay - i),
            isOtherMonth: true,
        });
    }

    // 当月の日付
    for (let i = 1; i <= totalDays; i++) {
        days.push({
            date: new Date(year, month, i),
            isOtherMonth: false,
        });
    }

    // 次月の日付 (合計が7の倍数になるまで)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            date: new Date(year, month + 1, i),
            isOtherMonth: true,
        });
    }

    const stickies = data.stickies || [];
    const availableStickies = stickies.filter(s => !s.attachedDate);

    // 選択中日付のデータ
    const selectedDateEvents = selectedDate ? data.events.filter(ev => normalizeDateStr(ev.date) === normalizeDateStr(selectedDate)) : [];
    const selectedDateStickies = selectedDate ? stickies.filter(s => s.attachedDate && normalizeDateStr(s.attachedDate) === normalizeDateStr(selectedDate)) : [];

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
                    <button className="btn btn-primary" onClick={() => onDateClick(`${year}-${String(month + 1).padStart(2, '0')}-01`)}>
                        <Plus size={16} /> 予定を追加
                    </button>
                </div>
            </header>

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

                        const dayEvents = data.events.filter(ev => normalizeDateStr(ev.date) === cellDateStr);
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
                                    <div key={`tt-${pIdx}`} className="cal-event-tag"
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

                        // この日付に貼り付けられた付箋
                        const dateStickies = stickies.filter(s => s.attachedDate === cellDateStr);

                        return (
                            <div
                                key={index}
                                className={`calendar-day ${dayObj.isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => setSelectedDate(cellDateStr)}
                                style={isHoliday ? { backgroundColor: 'rgba(239, 68, 68, 0.03)' } : undefined}
                            >
                                {/* 日付番号 + 祝日名 */}
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

                                {/* 付箋カラーマーカー（■） */}
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
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} className="cal-event-tag"
                                            style={{ backgroundColor: ev.color || '#3b82f6' }}
                                            title={ev.title}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(ev.id); }}>
                                            {ev.startTime ? `${ev.startTime} ` : ''}{ev.title}
                                        </div>
                                    ))}
                                    {classTags}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 日付管理モーダル */}
            {selectedDate && (
                <div className="modal-backdrop" onClick={() => { setSelectedDate(null); setShowAddSticky(false); }}>
                    <div className="modal-content calendar-date-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📅 {selectedDate} の管理</h2>
                            <button className="btn btn-icon btn-secondary" onClick={() => { setSelectedDate(null); setShowAddSticky(false); }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body calendar-date-modal-body">
                            {/* アクションボタン */}
                            <div className="date-modal-actions">
                                <button className="btn btn-primary" onClick={() => { onDateClick(selectedDate); setSelectedDate(null); }}>
                                    <Plus size={16} /> 予定を追加する
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowAddSticky(v => !v)}>
                                    📌 新規付箋を貼る
                                </button>
                            </div>

                            {/* 新規付箋作成フォーム */}
                            {showAddSticky && (
                                <div className="date-modal-new-sticky-box glass">
                                    <h4>新規付箋を作成して貼り付け</h4>
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
                                                className={`color-chip ${newStickyColor === c ? 'selected' : ''}`}
                                                style={{ background: c }}
                                                onClick={() => setNewStickyColor(c)}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                        <button className="btn btn-sm btn-secondary" onClick={() => setShowAddSticky(false)}>キャンセル</button>
                                        <button className="btn btn-sm btn-primary" onClick={handleCreateAndAttachSticky} disabled={!newStickyText.trim()}>貼り付ける</button>
                                    </div>
                                </div>
                            )}

                            {/* セクション 1: 予定一覧 */}
                            <div className="date-modal-section">
                                <h3><CalIcon size={16} /> 予定一覧 ({selectedDateEvents.length}件)</h3>
                                {selectedDateEvents.length === 0 ? (
                                    <p className="empty-text">予定はありません</p>
                                ) : (
                                    <div className="date-modal-list">
                                        {selectedDateEvents.map(ev => (
                                            <div key={ev.id} className="date-modal-item" style={{ borderLeftColor: ev.color || '#3b82f6' }}>
                                                <div className="date-modal-item-info">
                                                    <strong>{ev.title}</strong>
                                                    {ev.startTime && <span className="time-badge">⏰ {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}</span>}
                                                </div>
                                                <div className="date-modal-item-btn-group">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => { onEventClick(ev.id); setSelectedDate(null); }}>編集</button>
                                                    <button className="btn btn-sm btn-secondary danger" onClick={() => deleteCalendarEvent(ev.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* セクション 2: 貼り付け中の付箋 */}
                            <div className="date-modal-section">
                                <h3>📌 貼り付け中の付箋 ({selectedDateStickies.length}件)</h3>
                                {selectedDateStickies.length === 0 ? (
                                    <p className="empty-text">この日に貼り付けられている付箋はありません</p>
                                ) : (
                                    <div className="date-modal-list">
                                        {selectedDateStickies.map(s => (
                                            <div key={s.id} className="date-modal-item sticky-item" style={{ borderLeftColor: s.color }}>
                                                <div className="date-modal-item-info">
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

                            {/* セクション 3: 既存の付箋から選択して貼り付け */}
                            {availableStickies.length > 0 && (
                                <div className="date-modal-section">
                                    <h3>🗂️ 未貼付けの付箋から選択して貼る</h3>
                                    <div className="date-modal-available-stickies">
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
                </div>
            )}
        </section>
    );
};
