const systemStart = Date.now();

export const fallbackMatches = [
    {
        fixture: { id: 101, venue: { name: 'NRG Stadium', city: 'Houston, TX' }, status: { short: '1H', elapsed: 42 } },
        league: { round: 'Group E · Matchday 1' },
        teams: {
            home: { name: 'Germany', logo: 'https://flagcdn.com/w80/de.png' },
            away: { name: 'Curaçao', logo: 'https://flagcdn.com/w80/cw.png' }
        },
        goals: { home: 1, away: 0 },
        statistics: [
            { type: 'Possession', home: '62%', away: '38%' },
            { type: 'Total Shots', home: '9', away: '2' },
            { type: 'Corner Kicks', home: '4', away: '1' }
        ],
        events: [
            { time: { elapsed: 1 }, type: 'Goal', detail: 'Normal Goal', team: { name: 'Germany' }, player: { name: 'K. Havertz' }, comments: 'Assist by Serge Gnabry' },
            { time: { elapsed: 18 }, type: 'Card', detail: 'Yellow Card', team: { name: 'Curaçao' }, player: { name: 'J. Viera' }, comments: 'Foul' }
        ]
    },
    {
        fixture: { id: 102, venue: { name: 'AT&T Stadium', city: 'Arlington, TX' }, status: { short: 'NS', elapsed: 0 } },
        league: { round: 'Group F · Matchday 1' },
        teams: {
            home: { name: 'Netherlands', logo: 'https://flagcdn.com/w80/nl.png' },
            away: { name: 'Japan', logo: 'https://flagcdn.com/w80/jp.png' }
        },
        goals: { home: null, away: null },
        statistics: [
            { type: 'Possession', home: '50%', away: '50%' },
            { type: 'Total Shots', home: '0', away: '0' },
            { type: 'Corner Kicks', home: '0', away: '0' }
        ],
        events: []
    }
];

export function getInterpolatedState(match) {
    const diffMs = Date.now() - systemStart;
    const elapsedMinutes = Math.floor(diffMs / 60000) + 42;

    if (match.fixture.id !== 101) return match;

    let homeGoals = 1;
    let status = '1H';
    let currentMin = elapsedMinutes;

    if (elapsedMinutes >= 45 && elapsedMinutes <= 60) {
        status = 'HT';
        currentMin = 45;
    } else if (elapsedMinutes > 60 && elapsedMinutes <= 105) {
        status = '2H';
        currentMin = elapsedMinutes - 15;
        if (currentMin >= 59) homeGoals = 2;
        if (currentMin >= 81) homeGoals = 3;
    } else if (elapsedMinutes > 105) {
        status = 'FT';
        currentMin = 90;
        homeGoals = 3;
    }

    const dynamicEvents = [...match.events];
    if (currentMin >= 59 && !dynamicEvents.some(e => e.time.elapsed === 59)) {
        dynamicEvents.push({ time: { elapsed: 59 }, type: 'Goal', detail: 'Normal Goal', team: { name: 'Germany' }, player: { name: 'J. Musiala' }, comments: 'Assisted by Florian Wirtz' });
    }

    return {
        ...match,
        fixture: { ...match.fixture, status: { ...match.fixture.status, short: status, elapsed: currentMin } },
        goals: { home: homeGoals, away: 0 },
        events: dynamicEvents
    };
}