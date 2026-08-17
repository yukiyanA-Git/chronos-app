import React from 'react';
import { Sparkles } from 'lucide-react';

interface AcrylicAdBannerProps {
    position?: 'top' | 'bottom';
}

export const AcrylicAdBanner: React.FC<AcrylicAdBannerProps> = ({ position = 'top' }) => {
    return (
        <div className={`acrylic-ad-frame ${position === 'bottom' ? 'bottom-ad' : 'top-ad'}`}>
            <div className="acrylic-ad-inner">
                {/* 広告コンテンツ（後から Google AdSense タグや画像バナーに差し替え可能） */}
                <div className="acrylic-ad-content">
                    <div className="ad-placeholder-text">
                        <Sparkles size={14} className="ad-sparkle-icon" />
                        <span>PREMIUM PARTNER / 広告掲載スペース</span>
                    </div>
                </div>

                {/* かっこよく下部に配置された SPONSORED ラベル */}
                <div className="acrylic-ad-footer">
                    <span className="sponsored-label">S P O N S O R E D</span>
                </div>
            </div>
        </div>
    );
};
