import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ────────────────────────────────────────────
// ① Chronos アイコン風 アナログ時計 コンポーネント
// ────────────────────────────────────────────
const AnalogClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    // 角度計算
    const secDeg = (seconds / 60) * 360;
    const minDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

    const dateStr = `${time.getFullYear()}.${String(time.getMonth() + 1).padStart(2, '0')}.${String(time.getDate()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayStr = dayNames[time.getDay()];

    return (
        <div className="chronos-clock-card">
            {/* 文字盤 */}
            <div className="clock-dial">
                {/* 12, 3, 6, 9 の目盛り */}
                <div className="clock-mark m-12">12</div>
                <div className="clock-mark m-3">3</div>
                <div className="clock-mark m-6">6</div>
                <div className="clock-mark m-9">9</div>

                {/* 針 */}
                <div className="clock-hand hour-hand" style={{ transform: `rotate(${hourDeg}deg)` }} />
                <div className="clock-hand min-hand" style={{ transform: `rotate(${minDeg}deg)` }} />
                <div className="clock-hand sec-hand" style={{ transform: `rotate(${secDeg}deg)` }} />
                <div className="clock-center-dot" />
            </div>

            {/* 日付表示 */}
            <div className="clock-date-label">
                <span className="clock-date-text">{dateStr}</span>
                <span className={`clock-day-badge day-${dayStr.toLowerCase()}`}>{dayStr}</span>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────
// ④ 直近予定のリアルタイムカウントダウン コンポーネント
// ────────────────────────────────────────────
const NextEventCountdown: React.FC = () => {
    const { data } = useApp();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 本日の時間指定がある予定を取得し、現在時刻より将来の直近予定を探す
    const upcomingEvents = data.events
        .filter(e => e.date === todayStr && e.startTime)
        .map(e => {
            const [h, m] = (e.startTime || '').split(':').map(Number);
            const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
            return { ...e, targetDate };
        })
        .filter(e => e.targetDate.getTime() > now.getTime())
        .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

    const nextEvent = upcomingEvents[0];

    if (!nextEvent) {
        return (
            <div className="countdown-card empty">
                <CalendarIcon size={14} className="countdown-icon opacity-50" />
                <div className="countdown-empty-text">本日の残り時間指定予定なし</div>
            </div>
        );
    }

    const diffMs = nextEvent.targetDate.getTime() - now.getTime();
    const diffSecTotal = Math.floor(diffMs / 1000);
    const hoursLeft = Math.floor(diffSecTotal / 3600);
    const minsLeft = Math.floor((diffSecTotal % 3600) / 60);
    const secsLeft = diffSecTotal % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="countdown-card active">
            <div className="countdown-header">
                <span className="countdown-tag">NEXT</span>
                <span className="countdown-title" title={nextEvent.title}>
                    {nextEvent.startTime} {nextEvent.title}
                </span>
            </div>
            <div className="countdown-timer">
                <span className="timer-unit">{pad(hoursLeft)}<small>時</small></span>
                <span className="timer-sep">:</span>
                <span className="timer-unit">{pad(minsLeft)}<small>分</small></span>
                <span className="timer-sep">:</span>
                <span className="timer-unit sec">{pad(secsLeft)}<small>秒</small></span>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────
// ② 音声ボイスメモ (マイク録音 ➔ 付箋自動生成)
// ────────────────────────────────────────────
const VoiceMemoWidget: React.FC = () => {
    const { addVoiceSticky } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [savedNotice, setSavedNotice] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'ja-JP';

            recog.onresult = (event: any) => {
                let current = '';
                for (let i = 0; i < event.results.length; i++) {
                    current += event.results[i][0].transcript;
                }
                setTranscript(current);
            };

            recog.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recog;
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('お使いのブラウザは音声入力に対応していません。(Chrome/Edge推奨)');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSaveSticky = () => {
        if (!transcript.trim()) return;
        addVoiceSticky(transcript.trim()); // 専用フォルダー「🎙️ 音声メモ」に保存
        setTranscript('');
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    return (
        <div className="voice-memo-card">
            <div className="voice-memo-header">
                <span className="voice-memo-title">
                    <Sparkles size={13} className="sparkle-icon" /> ボイス入力付箋
                </span>
                {savedNotice && (
                    <span className="voice-saved-badge">
                        <Check size={12} /> 📌 「🎙️ ボイス入力付箋」フォルダーへ保存しました！
                    </span>
                )}
            </div>

            {/* 音声入力エリア */}
            <div className="voice-input-row">
                <button
                    className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    title={isListening ? '録音を停止' : 'クリックして喋る'}
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <div className="voice-text-box">
                    {transcript ? (
                        <span className="voice-transcript-text">{transcript}</span>
                    ) : (
                        <span className="voice-placeholder">
                            {isListening ? '🎤 話しかけてください...' : 'ボタンを押して音声メモを入力'}
                        </span>
                    )}
                </div>
            </div>

            {/* テキストがある場合の保存ボタン */}
            {transcript.trim() && (
                <button className="voice-save-btn btn-primary" onClick={handleSaveSticky}>
                    📌 「🎙️ 音声メモ」フォルダーに保存
                </button>
            )}
        </div>
    );
};

// ────────────────────────────────────────────
// メイン統合パネルコンポーネント (① ＋ ④ ＋ ②)
// ────────────────────────────────────────────
export const ChronosWidgetPanel: React.FC = () => {
    return (
        <div className="chronos-widget-panel">
            {/* ① Chronos アイコン風 アナログ時計 */}
            <AnalogClock />

            {/* ④ 直近予定カウントダウン */}
            <NextEventCountdown />

            {/* ② 音声ボイスメモ */}
            <VoiceMemoWidget />
        </div>
    );
};
