import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Calendar as CalendarIcon, BookOpen, Trash2 } from 'lucide-react';
import type { TimetableCell } from '../types';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'timetable' | 'calendar';
    dayIdx: number | null;
    periodIdx: number | null;
    eventId: string | null;
    initialDateStr: string | null;
}

const DAYS_OF_WEEK = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];

export const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    mode,
    dayIdx,
    periodIdx,
    eventId,
    initialDateStr
}) => {
    const { data, updateTimetableCell, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useApp();

    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [color, setColor] = useState('#3b82f6');

    // カレンダー用
    const todayDateStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    const [date, setDate] = useState(todayDateStr);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    // 時間割用
    const [room, setRoom] = useState('');
    const [teacher, setTeacher] = useState('');

    // モーダルが開いたときだけフォーム値を初期化（data依存配列を外して無限ループ・再セットを回避）
    useEffect(() => {
        if (!isOpen) return;

        if (mode === 'timetable' && dayIdx !== null && periodIdx !== null) {
            const key = `${dayIdx}-${periodIdx}`;
            const classInfo = data.timetable.cells[key];
            if (classInfo) {
                setTitle(classInfo.title || '');
                setRoom(classInfo.room || '');
                setTeacher(classInfo.teacher || '');
                setColor(classInfo.color || '#3b82f6');
                setDesc(classInfo.desc || '');
            } else {
                setTitle('');
                setRoom('');
                setTeacher('');
                setColor('#3b82f6');
                setDesc('');
            }
        } else if (mode === 'calendar') {
            if (eventId) {
                const ev = data.events.find(e => e.id === eventId);
                if (ev) {
                    setTitle(ev.title || '');
                    setDate(ev.date || '');
                    setStartTime(ev.startTime || '');
                    setEndTime(ev.endTime || '');
                    setColor(ev.color || '#3b82f6');
                    setDesc(ev.desc || '');
                }
            } else {
                setTitle('');
                const fallbackDate = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
                setDate(initialDateStr || fallbackDate);
                setStartTime('');
                setEndTime('');
                setColor('#3b82f6');
                setDesc('');
            }
        }
    }, [isOpen]); // isOpen の変化時のみ実行する

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const eventTitle = title.trim();
        if (!eventTitle) return;

        if (mode === 'timetable' && dayIdx !== null && periodIdx !== null) {
            const cellData: TimetableCell = {
                title: eventTitle,
                room: room.trim(),
                teacher: teacher.trim(),
                color,
                desc: desc.trim()
            };
            updateTimetableCell(dayIdx, periodIdx, cellData);
        } else if (mode === 'calendar') {
            const eventData = {
                title: eventTitle,
                date,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                color,
                desc: desc.trim() || undefined
            };

            if (eventId) {
                updateCalendarEvent(eventId, eventData);
            } else {
                addCalendarEvent(eventData);
            }
        }

        onClose();
    };

    const handleDelete = () => {
        if (mode === 'timetable' && dayIdx !== null && periodIdx !== null) {
            if (confirm('この業務データを消去しますか？')) {
                updateTimetableCell(dayIdx, periodIdx, null);
                onClose();
            }
        } else if (mode === 'calendar' && eventId) {
            if (confirm('この予定を削除しますか？')) {
                deleteCalendarEvent(eventId);
                onClose();
            }
        }
    };

    const isEdit = mode === 'timetable' 
        ? (dayIdx !== null && periodIdx !== null && !!data.timetable.cells[`${dayIdx}-${periodIdx}`])
        : !!eventId;

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <h2>
                        {mode === 'timetable' ? <BookOpen size={18} /> : <CalendarIcon size={18} />}
                        {mode === 'timetable' 
                            ? `${dayIdx !== null ? DAYS_OF_WEEK[dayIdx] : ''} スロット${(periodIdx || 0) + 1} の業務編集`
                            : isEdit ? '予定の編集' : '新規予定の追加'}
                    </h2>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body" style={{ gap: '14px' }}>
                    <div className="form-group">
                        <label className="form-label">
                            {mode === 'timetable' ? '業務・講義名' : '予定・業務タイトル'} *
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={mode === 'timetable' ? '例: 定例ミーティング, プログラミング演習' : '例: 〇〇様お打ち合わせ'}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {mode === 'calendar' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">日付 *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">開始時間</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">終了時間</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'timetable' && (
                        <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">場所・会議URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="例: 第1会議室, Zoom"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">担当者・メモ</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="例: 山田太郎"
                                    value={teacher}
                                    onChange={(e) => setTeacher(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">タグカラー</label>
                        <div className="color-selector" style={{ display: 'flex', gap: '8px' }}>
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-chip ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c, width: 24, height: 24, borderRadius: '50%', border: color === c ? '2px solid white' : 'none', cursor: 'pointer' }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">詳細メモ・アジェンダ</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            placeholder="アジェンダや持ち物などを入力..."
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                        {isEdit ? (
                            <button type="button" className="btn btn-secondary danger" onClick={handleDelete}>
                                <Trash2 size={14} /> 削除
                            </button>
                        ) : <div />}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                キャンセル
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {isEdit ? '更新する' : '追加する'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
