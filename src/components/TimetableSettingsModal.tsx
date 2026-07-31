import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Period } from '../types';

interface TimetableSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TimetableSettingsModal: React.FC<TimetableSettingsModalProps> = ({ isOpen, onClose }) => {
    const { data, saveTimetableSettings } = useApp();
    const [name, setName] = useState('');
    const [periods, setPeriods] = useState<Period[]>([]);

    useEffect(() => {
        if (isOpen) {
            setName(data.timetable.name || '');
            setPeriods(JSON.parse(JSON.stringify(data.timetable.periods)));
        }
    }, [isOpen, data]);

    if (!isOpen) return null;

    const handleAddPeriod = () => {
        const newNum = periods.length + 1;
        setPeriods(prev => [
            ...prev,
            { num: newNum, start: '09:00', end: '10:30' }
        ]);
    };

    const handleRemovePeriod = (index: number) => {
        setPeriods(prev => {
            const next = prev.filter((_, idx) => idx !== index);
            // 番号を振り直す
            return next.map((p, idx) => ({ ...p, num: idx + 1 }));
        });
    };

    const handleTimeChange = (index: number, field: 'start' | 'end', value: string) => {
        setPeriods(prev => prev.map((p, idx) => {
            if (idx === index) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleSave = () => {
        const trimmedName = name.trim() || '時間割';
        // 入力バリデーション
        const isValid = periods.every(p => p.start && p.end);
        if (!isValid) {
            alert('すべての時限の時間帯を入力してください。');
            return;
        }

        saveTimetableSettings(trimmedName, periods);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>タイムテーブル設定</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="tt-name-input">タイムテーブルの名前</label>
                        <input
                            type="text"
                            id="tt-name-input"
                            placeholder="例: 2026年 前期"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>タイムスロットの時間帯設定</label>
                        <div className="periods-settings-list">
                            {periods.map((period, idx) => (
                                <div key={idx} className="period-setting-row">
                                    <div className="period-setting-num">{period.num}</div>
                                    <input
                                        type="time"
                                        className="tt-period-start"
                                        value={period.start}
                                        onChange={(e) => handleTimeChange(idx, 'start', e.target.value)}
                                        required
                                    />
                                    <input
                                        type="time"
                                        className="tt-period-end"
                                        value={period.end}
                                        onChange={(e) => handleTimeChange(idx, 'end', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn-icon-sm text-danger"
                                        onClick={() => handleRemovePeriod(idx)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleAddPeriod}
                            style={{ marginTop: '10px' }}
                        >
                            <Plus size={14} /> 時限を追加
                        </button>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            キャンセル
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>
                            設定を保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
