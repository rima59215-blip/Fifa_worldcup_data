import React from 'react';

export default function LiveEventsFeed({ events, currentMatchName }) {
    return (
        <div className="feed-wrap">
            <div className="feed-hd">
                <h2>Live Event Timeline</h2>
            </div>
            <div className="feed-scroll">
                {events && events.length > 0 ? (
                    [...events].reverse().map((evt, idx) => (
                        <div className="comm-item" key={idx}>
                            <div className="comm-min red">{evt.time.elapsed}'</div>
                            <div className="comm-body">
                                <div className="comm-evt">⚽ <b>{evt.player?.name || 'Player'}</b> — {evt.type}</div>
                                <div className="comm-txt">{evt.detail} {evt.comments ? `(${evt.comments})` : ''}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                        Waiting for match timeline initialization events...
                    </div>
                )}
            </div>
        </div>
    );
}