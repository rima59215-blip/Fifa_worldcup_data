import React, { useState, useEffect } from 'react';

export default function Header({ isLiveActive }) {
    const [utcTime, setUtcTime] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            const d = new Date();
            setUtcTime(d.toUTCString().slice(17, 25) + ' UTC');
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hdr">
            <div className="hdr-top">
                <div className="hdr-logo">
                    <span style={{ fontSize: '24px' }}>⚽</span>
                    <div>
                        <h1>FIFA World Cup 2026™ (Live Engine)</h1>
                        <p>USA · Canada · Mexico &nbsp;|&nbsp; Synchronized Live Feed REST Architecture</p>
                    </div>
                </div>
                <div className="hdr-right">
                    {isLiveActive && <div className="live-pill"><div className="live-dot"></div>Live Tracking</div>}
                    <div className="utc-clock">{utcTime}</div>
                </div>
            </div>
            <div className="ticker-wrap">
                <div className="ticker-track">
                    <span className="ticker-item">🏆 <b>FIFA World Cup 2026 Dashboard Engine</b></span>
                    <span className="ticker-item">🇩🇪 GER vs 🇨🇼 CUW — Real-Time Live Analytics Data Feed</span>
                    <span className="ticker-item">🇳🇱 NED vs 🇯🇵 JPN — Pre-Match Engine Verification Active</span>
                </div>
            </div>
        </div>
    );
}