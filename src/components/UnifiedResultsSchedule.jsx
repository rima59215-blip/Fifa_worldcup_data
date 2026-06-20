import React from 'react';

export default function UnifiedResultsSchedule({ type }) {
    const data = type === 'results' ? [
        { round: 'Group A', home: 'Mexico', flagH: 'mx', score: '2 – 0', away: 'South Africa', flagA: 'za' },
        { round: 'Group D', home: 'USA', flagH: 'us', score: '4 – 1', away: 'Paraguay', flagA: 'py' }
    ] : [
        { round: 'Group H', home: 'Spain', flagH: 'es', score: 'vs', away: 'Cape Verde', flagA: 'cv' },
        { round: 'Group G', home: 'Belgium', flagH: 'be', score: 'vs', away: 'Egypt', flagA: 'eg' }
    ];

    return (
        <div className="full-page-container">
            <div className="res-day">
                <div className="res-day-hd">{type === 'results' ? 'Historical Match Results Engine' : 'Upcoming Match Schedules'}</div>
                {data.map((row, i) => (
                    <div className="res-row" key={i}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', width: '60px' }}>{row.round}</span>
                        <div className="res-flags">
                            <img style={{ width: '18px', borderRadius: '2px' }} src={`https://flagcdn.com/w20/${row.flagH}.png`} alt="" />
                            <span style={{ fontWeight: '500' }}>{row.home}</span>
                        </div>
                        <span style={{ fontWeight: '600' }}>{row.score}</span>
                        <div className="res-flags">
                            <span style={{ fontWeight: '500' }}>{row.away}</span>
                            <img style={{ width: '18px', borderRadius: '2px' }} src={`https://flagcdn.com/w20/${row.flagA}.png`} alt="" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}