import React from 'react';
import { useApp } from '../context/AppContext';
import { Sliders, MapPin, User, Calendar, Clock, Smile } from 'lucide-react';

interface TimetableProps {
    onCellClick: (dayIdx: number, periodIdx: number) => void;
    onSettingsClick: () => void;
}

const DAYS_OF_WEEK = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
const DAY_SHORT = ['日', '月', '火', '水', '木', '金', '土'];

export const Timetable: React.FC<TimetableProps> = ({ onCellClick, onSettingsClick }) => {
    const { data } = useApp();
    const periods = data.timetable.periods;
    const cells = data.timetable.cells;

    // 今日の情報
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=日, 1=月..6=土
    const appDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=月..6=日
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayLabel = `${today.getMonth() + 1}月${today.getDate()}日(${DAY_SHORT[dayOfWeek]})`;

    // 今日のカレンダー予定
    const todayEvents = data.events
        .filter(ev => ev.date === todayStr)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    // 今日の業務
    const todayClasses = periods.map((period, pIdx) => {
        const key = `${appDayIdx}-${pIdx}`;
        const cell = cells[key];
        return cell && cell.title ? { period, cell, pIdx } : null;
    }).filter(Boolean);

    return (
        <section id="view-timetable" className="view-section active">
            <header className="view-header">
                <h1>タイムテーブル</h1>
                <div className="view-actions">
                    <select id="timetable-selector" className="select-control" defaultValue="current">
                        <option value="current">{data.timetable.name || '2026年度 前期'}</option>
                    </select>
                    <button className="btn btn-secondary" onClick={onSettingsClick}>
                        <Sliders size={16} /> タイムテーブル設定
                    </button>
                </div>
            </header>

            <div className="timetable-page-layout">
                {/* 時間割テーブル */}
                <div className="timetable-container glass">
                    <div className="timetable-scroll">
                        <table className="timetable-table">
                            <thead>
                                <tr>
                                    <th>タイムスロット</th>
                                    {DAYS_OF_WEEK.map((day, idx) => (
                                        <th key={idx} className={idx === appDayIdx ? 'today-col' : ''}>
                                            {day}
                                            {idx === appDayIdx && <span className="today-badge">今日</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((period, pIdx) => (
                                    <tr key={pIdx}>
                                        <td>
                                            <div className="timetable-cell period-label-cell">
                                                <span className="period-num">{period.num}</span>
                                                <span className="period-time">
                                                    {period.start}
                                                    <br />
                                                    {period.end}
                                                </span>
                                            </div>
                                        </td>
                                        {DAYS_OF_WEEK.map((_, dIdx) => {
                                            const cellKey = `${dIdx}-${pIdx}`;
                                            const classInfo = cells[cellKey];
                                            const hasClass = classInfo && classInfo.title;
                                            const isToday = dIdx === appDayIdx;

                                            return (
                                                <td key={dIdx} className={isToday ? 'today-col' : ''}>
                                                    <div
                                                        className={`timetable-cell ${hasClass ? 'has-class' : ''} ${isToday ? 'today-cell' : ''}`}
                                                        style={hasClass ? { backgroundColor: classInfo.color || '#3b82f6', borderColor: classInfo.color || '#3b82f6' } : undefined}
                                                        onClick={() => onCellClick(dIdx, pIdx)}
                                                    >
                                                        {hasClass ? (
                                                            <>
                                                                <div className="class-title">{classInfo.title}</div>
                                                                <div className="class-meta">
                                                                    {classInfo.room && (
                                                                        <span>
                                                                            <MapPin size={10} style={{ display: 'inline', marginRight: '2px', verticalAlign: '-1px' }} />
                                                                            {classInfo.room}
                                                                        </span>
                                                                    )}
                                                                    {classInfo.teacher && (
                                                                        <span>
                                                                            <User size={10} style={{ display: 'inline', marginRight: '2px', verticalAlign: '-1px' }} />
                                                                            {classInfo.teacher}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <span style={{ opacity: 0.2, fontSize: '0.8rem', textAlign: 'center', width: '100%', margin: 'auto' }}>
                                                                空き
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 当日の予定パネル */}
                <div className="today-panel glass">
                    <div className="today-panel-header">
                        <Calendar size={18} />
                        <span>当日の予定</span>
                        <span className="today-panel-date">{todayLabel}</span>
                    </div>

                    <div className="today-panel-section">
                        <div className="today-panel-section-title">
                            <Clock size={13} /> 業務
                        </div>
                        {todayClasses.length === 0 ? (
                            <div className="today-panel-empty">
                                <Smile size={20} />
                                <span>今日の業務はありません</span>
                            </div>
                        ) : (
                            todayClasses.map((item) => (
                                <div
                                    key={item!.pIdx}
                                    className="today-panel-item"
                                    style={{ borderLeftColor: item!.cell.color || '#3b82f6' }}
                                    onClick={() => onCellClick(appDayIdx, item!.pIdx)}
                                >
                                    <div className="today-panel-item-title">{item!.cell.title}</div>
                                    <div className="today-panel-item-meta">
                                        {item!.period.num}限 {item!.period.start}〜{item!.period.end}
                                        {item!.cell.room && ` | ${item!.cell.room}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="today-panel-section">
                        <div className="today-panel-section-title">
                            <Calendar size={13} /> 予定
                        </div>
                        {todayEvents.length === 0 ? (
                            <div className="today-panel-empty">
                                <Smile size={20} />
                                <span>今日の予定はありません</span>
                            </div>
                        ) : (
                            todayEvents.map(ev => (
                                <div
                                    key={ev.id}
                                    className="today-panel-item"
                                    style={{ borderLeftColor: ev.color || '#3b82f6' }}
                                >
                                    <div className="today-panel-item-title">{ev.title}</div>
                                    <div className="today-panel-item-meta">
                                        {ev.startTime ? `${ev.startTime}〜${ev.endTime || ''}` : '終日'}
                                        {ev.desc && ` | ${ev.desc}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
