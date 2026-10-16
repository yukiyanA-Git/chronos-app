import type { CalendarEvent } from '../types';

// RFC 5545 準拠の文字列エスケープ
const escapeIcsText = (text: string = ''): string => {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
};

// YYYY-MM-DD または YYYY/MM/DD を YYYYMMDD に変換
const formatIcsDate = (dateStr: string): string => {
    return dateStr.replace(/[-/]/g, '').slice(0, 8);
};

// 翌日の YYYYMMDD を取得 (終日予定の DTEND 用)
const getNextDayIcsDate = (dateStr: string): string => {
    const d = new Date(dateStr.replace(/\//g, '-'));
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
};

// 時刻文字列 HH:mm を HHMM00 に変換
const formatIcsTime = (timeStr?: string): string => {
    if (!timeStr) return '000000';
    const parts = timeStr.split(':');
    const h = (parts[0] || '00').padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}${m}00`;
};

// 現在日時スタンプ (UTC: YYYYMMDDTHHMMSSZ)
const getDtStamp = (): string => {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// 単一イベントの VEVENT ブロック生成
export const generateVEvent = (event: CalendarEvent): string => {
    const dtStamp = getDtStamp();
    const uid = `${event.id || 'ev_' + Date.now()}@chronos.app`;
    const summary = escapeIcsText(event.title || '無題の予定');
    const description = escapeIcsText(event.desc || '');

    const lines: string[] = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtStamp}`,
        `SUMMARY:${summary}`
    ];

    if (description) {
        lines.push(`DESCRIPTION:${description}`);
    }

    const startDateStr = formatIcsDate(event.date);

    if (event.startTime) {
        // 時刻指定あり
        const startTimeStr = formatIcsTime(event.startTime);
        lines.push(`DTSTART:${startDateStr}T${startTimeStr}`);

        if (event.endTime) {
            const endDateStr = event.endDate ? formatIcsDate(event.endDate) : startDateStr;
            const endTimeStr = formatIcsTime(event.endTime);
            lines.push(`DTEND:${endDateStr}T${endTimeStr}`);
        } else {
            // 終了時間未指定の場合は1時間後
            const [sh, sm] = (event.startTime || '09:00').split(':').map(Number);
            const eh = String(Math.min(sh + 1, 23)).padStart(2, '0');
            lines.push(`DTEND:${startDateStr}T${eh}${String(sm).padStart(2, '0')}00`);
        }
    } else {
        // 終日予定
        lines.push(`DTSTART;VALUE=DATE:${startDateStr}`);
        const endTarget = event.endDate || event.date;
        lines.push(`DTEND;VALUE=DATE:${getNextDayIcsDate(endTarget)}`);
    }

    lines.push('END:VEVENT');
    return lines.join('\r\n');
};

// 1つの予定を .ics ファイル文字列として生成 (iPhone/Android/Google/Outlook 単体追加用)
export const generateSingleEventIcs = (event: CalendarEvent): string => {
    const vevent = generateVEvent(event);
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Chronos Productivity Platform//JP',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Chronos 予定',
        vevent,
        'END:VCALENDAR'
    ].join('\r\n');
};

// 複数の予定をまとめた .ics ファイル文字列として生成 (一括エクスポート用)
export const generateMultiEventsIcs = (events: CalendarEvent[], calName: string = 'Chronos カレンダー'): string => {
    const vevents = events.map(generateVEvent).join('\r\n');
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Chronos Productivity Platform//JP',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcsText(calName)}`,
        vevents,
        'END:VCALENDAR'
    ].join('\r\n');
};

// .ics ファイルのダウンロード実行 (スマホ・PC対応)
export const downloadIcsFile = (filename: string, icsContent: string): void => {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
};
