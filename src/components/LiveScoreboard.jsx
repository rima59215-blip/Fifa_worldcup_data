import React from 'react';

export default function LiveScoreboard({ activeMatch }) {
    if (!activeMatch) return null;

    return (
        <div className="scoreboard">
            <div className="sb-grp">{activeMatch.league.round} · {activeMatch.fixture.venue.name}</div>
            <div className="sb-teams">
                <div className="sb-team">
                    <img className="sb-flag" src={activeMatch.teams.home.logo} alt="" />
                    <div className="sb-tname">{activeMatch.teams.home.name}</div>
                </div>
                <div className="sb-scores">
                    <div className="sb-num">
                        {activeMatch.goals.home !== null ? `${activeMatch.goals.home} – ${activeMatch.goals.away}` : '0 – 0'}
                    </div>
                    <span className="sb-time">⏱️ Min: {activeMatch.fixture.status.elapsed}'</span>
                </div>
                <div className="sb-team">
                    <img className="sb-flag" src={activeMatch.teams.away.logo} alt="" />
                    <div className="sb-tname">{activeMatch.teams.away.name}</div>
                </div>
            </div>
            <div className="sb-venue">{activeMatch.fixture.venue.city}</div>

            <div className="stat-bar">
                {activeMatch.statistics.map((stat, i) => (
                    <div className="stat-row-item" key={i}>
                        <span className="stat-val" style={{ textAlign: 'left' }}>{stat.home}</span>
                        <span className="stat-label2">{stat.type}</span>
                        <span className="stat-val" style={{ textAlign: 'right' }}>{stat.away}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}