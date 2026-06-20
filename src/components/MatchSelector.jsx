import React from 'react';

export default function MatchSelector({ matches, selectedId, onSelect }) {
    return (
        <div className="panel">
            <div className="panel-hd">
                <h2>Live Tournament Fixtures</h2>
            </div>
            {matches.map((m) => {
                const isLive = m.fixture.status.short !== 'NS' && m.fixture.status.short !== 'FT';
                return (
                    <div
                        key={m.fixture.id}
                        className={`mcard ${selectedId === m.fixture.id ? 'sel' : ''}`}
                        onClick={() => onSelect(m.fixture.id)}
                    >
                        <div className="mcard-top">
                            <span>{m.league.round}</span>
                            <span className={`badge ${isLive ? 'b-live' : 'b-sched'}`}>
                                {isLive ? `LIVE ${m.fixture.status.elapsed}'` : m.fixture.status.short}
                            </span>
                        </div>
                        <div className="mteams">
                            <img className="mflag" src={m.teams.home.logo} alt="" />
                            <span className="mname">{m.teams.home.name}</span>
                            <span className="mscore">
                                {m.goals.home !== null ? `${m.goals.home} – ${m.goals.away}` : '– –'}
                            </span>
                            <span className="mname" style={{ textAlign: 'right' }}>{m.teams.away.name}</span>
                            <img className="mflag" src={m.teams.away.logo} alt="" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}