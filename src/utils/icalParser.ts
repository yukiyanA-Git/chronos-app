export interface ExternalCalendarEvent {
    id: string;
    title: string;
    date: string;          // YYYY-MM-DD
    endDate?: string;      // YYYY-MM-DD
    startTime?: string;    // HH:mm
    endTime?: string;      // HH:mm
    desc?: string;
    location?: string;
    source?: string;
    color?: string;
}

export interface ExternalCalendarConfig {
    enabled: boolean;
    url: string;
    name: string;
    color: string;
    lastSyncedAt?: string;
    eventsCount?: number;
}

// RFC 5545 文字列アンエスケープ
const unescapeIcsText = (str: string = ''): string => {
    return str
        .replace(/\\n/gi, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
};

// RFC 5545 の折り返し行 (行頭が空白またはタブ) を結合
const unfoldIcsLines = (raw: string): string[] => {
    const unfolded = raw.replace(/\r?\n[ \t]/g, '');
    return unfolded.split(/\r?\n/);
};

// iCal 日時文字列のパース (YYYYMMDD または YYYYMMDDTHHMMSS[Z])
interface ParsedDateTime {
    date: string;         // YYYY-MM-DD
    time?: string;        // HH:mm
    isAllDay: boolean;
    rawDateObj: Date;
}

const parseIcsDateTime = (val: string): ParsedDateTime | null => {
    if (!val) return null;
    const cleanVal = val.trim();

    // 終日: YYYYMMDD (例: 20261016)
    if (/^\d{8}$/.test(cleanVal)) {
        const y = cleanVal.slice(0, 4);
        const m = cleanVal.slice(4, 6);
        const d = cleanVal.slice(6, 8);
        const dateStr = `${y}-${m}-${d}`;
        return {
            date: dateStr,
            isAllDay: true,
            rawDateObj: new Date(Number(y), Number(m) - 1, Number(d))
        };
    }

    // 時刻付き: YYYYMMDDTHHMMSS または YYYYMMDDTHHMMSSZ
    const match = cleanVal.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
    if (match) {
        const [, y, m, d, hh, mm, ss, isUtc] = match;
        let dateObj: Date;
        if (isUtc) {
            dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)));
        } else {
            dateObj = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
        }

        const resY = dateObj.getFullYear();
        const resM = String(dateObj.getMonth() + 1).padStart(2, '0');
        const resD = String(dateObj.getDate()).padStart(2, '0');
        const resH = String(dateObj.getHours()).padStart(2, '0');
        const resMin = String(dateObj.getMinutes()).padStart(2, '0');

        return {
            date: `${resY}-${resM}-${resD}`,
            time: `${resH}:${resMin}`,
            isAllDay: false,
            rawDateObj: dateObj
        };
    }

    return null;
};

// iCal テキスト全体を解析して ExternalCalendarEvent 配列を生成
export const parseIcsContent = (
    icsText: string,
    sourceName: string = '外部カレンダー',
    defaultColor: string = '#4285F4'
): ExternalCalendarEvent[] => {
    const lines = unfoldIcsLines(icsText);
    const events: ExternalCalendarEvent[] = [];

    let inEvent = false;
    let currentEvent: Partial<ExternalCalendarEvent> & { dtStartObj?: ParsedDateTime | null; dtEndObj?: ParsedDateTime | null } = {};

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {
                source: sourceName,
                color: defaultColor
            };
            continue;
        }

        if (line === 'END:VEVENT') {
            if (inEvent && currentEvent.dtStartObj) {
                const start = currentEvent.dtStartObj;
                const end = currentEvent.dtEndObj;

                let date = start.date;
                let endDate: string | undefined = undefined;

                if (end) {
                    if (start.isAllDay) {
                        // iCalの終日DTENDは翌日0時を示すため、終了日は前日換算
                        const endD = new Date(end.rawDateObj);
                        endD.setDate(endD.getDate() - 1);
                        const ey = endD.getFullYear();
                        const em = String(endD.getMonth() + 1).padStart(2, '0');
                        const ed = String(endD.getDate()).padStart(2, '0');
                        const adjustedEndDate = `${ey}-${em}-${ed}`;
                        if (adjustedEndDate > date) {
                            endDate = adjustedEndDate;
                        }
                    } else if (end.date > date) {
                        endDate = end.date;
                    }
                }

                events.push({
                    id: currentEvent.id || `ext_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    title: currentEvent.title || '無題の予定',
                    date,
                    endDate,
                    startTime: start.time,
                    endTime: end?.time,
                    desc: currentEvent.desc,
                    location: currentEvent.location,
                    source: currentEvent.source || sourceName,
                    color: currentEvent.color || defaultColor
                });
            }
            inEvent = false;
            currentEvent = {};
            continue;
        }

        if (!inEvent) continue;

        // 行のプロパティと値を分割 (例: "DTSTART;VALUE=DATE:20261016" or "SUMMARY:会議")
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const propPart = line.slice(0, colonIdx);
        const valuePart = line.slice(colonIdx + 1);
        const propName = propPart.split(';')[0].toUpperCase();

        switch (propName) {
            case 'UID':
                currentEvent.id = `ext_${valuePart.trim()}`;
                break;
            case 'SUMMARY':
                currentEvent.title = unescapeIcsText(valuePart);
                break;
            case 'DESCRIPTION':
                currentEvent.desc = unescapeIcsText(valuePart);
                break;
            case 'LOCATION':
                currentEvent.location = unescapeIcsText(valuePart);
                break;
            case 'DTSTART':
                currentEvent.dtStartObj = parseIcsDateTime(valuePart);
                break;
            case 'DTEND':
                currentEvent.dtEndObj = parseIcsDateTime(valuePart);
                break;
        }
    }

    return events;
};

// 外部カレンダーURLからiCalを取得 (CORSプロキシフォールバック付き)
export const fetchIcsFeed = async (url: string): Promise<string> => {
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('webcal://')) {
        cleanUrl = 'https://' + cleanUrl.slice(9);
    }

    // 1. 直接通信を試行
    try {
        const res = await fetch(cleanUrl, { mode: 'cors' });
        if (res.ok) {
            const text = await res.text();
            if (text.includes('BEGIN:VCALENDAR')) {
                return text;
            }
        }
    } catch {
        // CORS制限等で直接失敗した場合はプロキシを試す
    }

    // 2. CORSプロキシ経由で試行
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
        `https://corsproxy.io/?url=${encodeURIComponent(cleanUrl)}`
    ];

    for (const proxyUrl of proxies) {
        try {
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const text = await res.text();
                if (text.includes('BEGIN:VCALENDAR')) {
                    return text;
                }
            }
        } catch {
            continue;
        }
    }

    throw new Error('カレンダーデータの取得に失敗しました。URLが正しいか、またはブラウザの通信が許可されているかご確認ください。');
};
