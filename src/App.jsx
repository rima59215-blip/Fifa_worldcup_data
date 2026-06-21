import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
    // ── CONFIGURATION AREA ──
    const GAMES_API_URL = "https://worldcup26.ir/get/games";
    const TEAMS_API_URL = "https://worldcup26.ir/get/teams";
    const STADIUMS_API_URL = "https://worldcup26.ir/get/stadiums";

    // States
    const [currentTab, setCurrentTab] = useState('live');
    const [matchData, setMatchData] = useState([]);
    const [curMatchIdx, setCurMatchIdx] = useState(0);
    const [clockTime, setClockTime] = useState('00:00:00 UTC');
    const [loading, setLoading] = useState(true);
    const [engineStatus, setEngineStatus] = useState('Connecting...');

    // ── TIMELINE LOG COMMENTARY GENERATOR ──
    const generateDynamicCommentary = (match, currentStatus) => {
        const homeTeam = match.h;
        const awayTeam = match.a;
        const scoreHome = parseInt(match.goalsHome) || 0;
        const scoreAway = parseInt(match.goalsAway) || 0;
        const totalGoals = scoreHome + scoreAway;

        const baseline = [
            { min: 1, type: 'info', icon: '⏱️', evt: 'MATCH KICKOFF', txt: `The referee blows the whistle! We are officially underway between ${homeTeam} and ${awayTeam}.` },
            { min: 18, type: 'info', icon: '🏃‍♂️', evt: 'POSSESSION DUEL', txt: `Both clubs battle heavily across the midfield line, testing tactical shape.` }
        ];

        let homeAssigned = 0;
        let awayAssigned = 0;

        for (let i = 1; i <= totalGoals; i++) {
            const simulatedMinute = Math.floor(12 + (i * 22));
            if (homeAssigned < scoreHome) {
                baseline.push({
                    min: simulatedMinute,
                    type: 'goal',
                    icon: '⚽',
                    evt: `GOAL — ${homeTeam?.toUpperCase()}`,
                    txt: `Stunning strike! ${homeTeam} finds the back of the net. Tally shifts to ${homeAssigned + 1} - ${awayAssigned}.`
                });
                homeAssigned++;
            } else if (awayAssigned < scoreAway) {
                baseline.push({
                    min: simulatedMinute,
                    type: 'goal',
                    icon: '⚽',
                    evt: `GOAL — ${awayTeam?.toUpperCase()}`,
                    txt: `Absolute rocket! ${awayTeam} breaks through and scores. Score reads ${homeAssigned} - ${awayAssigned + 1}.`
                });
                awayAssigned++;
            }
        }

        if (currentStatus === "FT") {
            baseline.push({ min: 90, type: 'info', icon: '🏁', evt: 'FULL TIME WHISTLE', txt: `The match has ended. Confirmed scoreboard reads ${homeTeam} ${scoreHome} - ${scoreAway} ${awayTeam}.` });
        } else if (currentStatus === "SCHED") {
            return [{ min: 0, type: 'info', icon: '📅', evt: 'FIXTURE SCHEDULED', txt: `This encounter is currently pinned to the upcoming schedule matrix.` }];
        } else {
            baseline.push({ min: match.elapsed, type: 'info', icon: '🔄', evt: 'LIVE SCORES', txt: `Action ticking over. Network capturing real-time field variations.` });
        }

        return baseline.sort((a, b) => a.min - b.min);
    };

    // ── DATA SYNC PIPELINE ──
    const syncFootballDataFeed = async () => {
        setEngineStatus("Syncing...");

        try {
            const [gamesRes, teamsRes, stadiumsRes] = await Promise.all([
                fetch(GAMES_API_URL),
                fetch(TEAMS_API_URL),
                fetch(STADIUMS_API_URL)
            ]);

            if (!gamesRes.ok || !teamsRes.ok || !stadiumsRes.ok) {
                throw new Error(`API responded with status ${gamesRes.status}/${teamsRes.status}/${stadiumsRes.status}`);
            }

            const games = await gamesRes.json();
            const teams = await teamsRes.json();
            const stadiums = await stadiumsRes.json();

            const gamesList = Array.isArray(games) ? games : (games.data || games.games || []);
            const teamsList = Array.isArray(teams) ? teams : (teams.data || teams.teams || []);
            const stadiumsList = Array.isArray(stadiums) ? stadiums : (stadiums.data || stadiums.stadiums || []);

            if (gamesList.length > 0) {
                parseAndDisplayMatches(gamesList, teamsList, stadiumsList, "STREAM ACTIVE");
            } else {
                setEngineStatus("Connected (Empty Set)");
                setMatchData([]);
                setLoading(false);
            }
        } catch (error) {
            console.error("Network sync block:", error);
            setEngineStatus("Connection Interface Failure");
            setLoading(false);
        }
    };

    const parseAndDisplayMatches = (rawMatches, teamsList, stadiumsList, modeLabel) => {
        const teamById = {};
        (teamsList || []).forEach(t => { teamById[String(t.id)] = t; });
        const stadiumById = {};
        (stadiumsList || []).forEach(s => { stadiumById[String(s.id)] = s; });

        const parsed = rawMatches.map((match, index) => {
            const homeTeam = teamById[String(match.home_team_id)];
            const awayTeam = teamById[String(match.away_team_id)];
            const stadium = stadiumById[String(match.stadium_id)];

            const kickoff = match.local_date ? new Date(match.local_date) : null;
            const now = new Date();
            let status = "SCHED";
            if (match.finished) {
                status = "FT";
            } else if (kickoff && kickoff <= now) {
                status = "LIVE";
            }

            let minutesElapsed = 0;
            if (status === "LIVE" && kickoff) {
                const diffMs = now - kickoff;
                const calcMin = Math.floor(diffMs / 60000);
                minutesElapsed = calcMin > 0 ? Math.min(calcMin, 90) : 1;
            } else if (status === "FT") {
                minutesElapsed = 90;
            }

            let localizedKickoff = "Date Pending";
            if (match.local_date) {
                localizedKickoff = new Date(match.local_date).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }

            const roundInfo = match.matchday ? `Matchday ${match.matchday}` :
                (match.type ? match.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Group Stage");

            return {
                id: index,
                fixtureId: match.id || `wc-${index}`,
                grp: `FIFA World Cup 2026 · Group ${match.group || '—'} · ${roundInfo}`,
                statusShort: status,
                elapsed: minutesElapsed,
                kickoffTime: localizedKickoff,
                rawKickoff: kickoff,
                h: homeTeam ? homeTeam.name_en : "Home Side",
                a: awayTeam ? awayTeam.name_en : "Away Side",
                hflag: homeTeam ? homeTeam.flag : "",
                aflag: awayTeam ? awayTeam.flag : "",
                venue: stadium ? `${stadium.name_en} · ${stadium.city_en}` : "Stadium Ground Arena",
                goalsHome: match.home_score !== undefined && match.home_score !== null ? String(match.home_score) : "0",
                goalsAway: match.away_score !== undefined && match.away_score !== null ? String(match.away_score) : "0"
            };
        });

        const finalEnrichedData = parsed.map(m => ({
            ...m,
            fullCommentary: generateDynamicCommentary(m, m.statusShort)
        }));

        setMatchData(finalEnrichedData);
        setEngineStatus(modeLabel);
        setLoading(false);
    };

    useEffect(() => {
        const clockTimer = setInterval(() => {
            const dateObj = new Date();
            setClockTime(dateObj.toUTCString().slice(17, 25) + ' UTC');
        }, 1000);

        syncFootballDataFeed();
        const networkPollingLoop = setInterval(syncFootballDataFeed, 45000);

        return () => {
            clearInterval(clockTimer);
            clearInterval(networkPollingLoop);
        };
    }, []);

    // ── EXPANDED TIME WINDOW FILTERS ──
    const now = new Date();
    const past36Hours = new Date(now.getTime() - 36 * 60 * 60 * 1000);
    const future36Hours = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    // Filtered arrays
    const liveMatches = matchData.filter(m => m.statusShort === "LIVE");

    // Dynamic compilation logic for Dashboard grid (Combines Live, Recently Done, and Immediate Upcoming)
    const visibleDashboardMatches = matchData.filter(m => {
        if (m.statusShort === "LIVE") return true;
        if (m.rawKickoff && m.rawKickoff >= past36Hours && m.rawKickoff <= future36Hours) return true;
        return false;
    }).sort((a, b) => {
        if (a.statusShort === "LIVE" && b.statusShort !== "LIVE") return -1;
        if (b.statusShort === "LIVE" && a.statusShort !== "LIVE") return 1;
        return (a.rawKickoff?.getTime() || 0) - (b.rawKickoff?.getTime() || 0);
    });

    // Filters down exactly the next 3 scheduled matches chronologically
    const upcomingMatchesTop3 = matchData
        .filter(m => m.statusShort === "SCHED")
        .sort((a, b) => (a.rawKickoff?.getTime() || 0) - (b.rawKickoff?.getTime() || 0))
        .slice(0, 3);

    const completedMatchesAll = matchData
        .filter(m => m.statusShort === "FT")
        .sort((a, b) => (b.rawKickoff?.getTime() || 0) - (a.rawKickoff?.getTime() || 0));

    // Handle initial current item assignment safety loop
    const activeSelectedMatch = visibleDashboardMatches.find(m => m.id === curMatchIdx) || visibleDashboardMatches[0] || null;

    return (
        <div className="app-container">
            {/* BRANDING TOP BAR */}
            <div className="hdr">
                <div className="hdr-top">
                    <div className="hdr-logo">
                        <span className="ball">⚽</span>
                        <div>
                            <h1>Football Data Core v4</h1>
                            <p>Real-Time Highlight Tracking Console Engine</p>
                        </div>
                    </div>
                    <div className="hdr-right">
                        <div className="live-pill">
                            <div className="live-dot"></div>
                            {engineStatus}
                        </div>
                        <div className="utc-clock">{clockTime}</div>
                    </div>
                </div>
            </div>

            {/* NAV BAR CONTROLLER */}
            <div className="nav">
                <div className={`ntab ${currentTab === 'live' ? 'on' : ''}`} onClick={() => setCurrentTab('live')}>
                    In-Play Dashboard &nbsp;
                    {/* Visual highlighted red pill alerting user if games are actively live right now */}
                    {liveMatches.length > 0 ? (
                        <span className="tab-count-badge" style={{ backgroundColor: '#ef4444', animation: 'pulse 2s infinite', color: '#fff', fontWeight: 'bold' }}>
                            🔴 {liveMatches.length} LIVE NOW
                        </span>
                    ) : (
                        visibleDashboardMatches.length > 0 && <span className="tab-count-badge">{visibleDashboardMatches.length}</span>
                    )}
                </div>
                <div className={`ntab ${currentTab === 'future' ? 'on' : ''}`} onClick={() => setCurrentTab('future')}>
                    Upcoming Schedule Matrix ({upcomingMatchesTop3.length})
                </div>
                <div className={`ntab ${currentTab === 'results' ? 'on' : ''}`} onClick={() => setCurrentTab('results')}>
                    Archived Results ({completedMatchesAll.length})
                </div>
            </div>

            {/* TAB 1: IN-PLAY DASHBOARD VIEWPORT */}
            {currentTab === 'live' && (
                <div className="page on" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 310px', gap: '14px', padding: '14px' }}>
                    {/* LEFT PANEL */}
                    <div className="page-left">
                        <div className="panel">
                            <div className="panel-hd">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <h2>Live, Latest &amp; Upcoming Matches</h2>
                                    {liveMatches.length > 0 && (
                                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', background: '#fee2e2', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', animation: 'pulse 2s infinite' }}>
                                            ⚡ ACTIVE IN-PLAY MATCHES
                                        </span>
                                    )}
                                </div>
                            </div>
                            {loading ? (
                                <div style={{ padding: '30px', textAlign: 'center' }}>Syncing telemetry loops...</div>
                            ) : visibleDashboardMatches.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No upcoming or live matches found within 36 hours.</div>
                            ) : (
                                visibleDashboardMatches.map((match) => {
                                    const isMatchLive = match.statusShort === "LIVE";
                                    const isMatchFinished = match.statusShort === "FT";

                                    let dynamicCardStyle = {};
                                    if (isMatchLive) {
                                        dynamicCardStyle = {
                                            borderLeft: '5px solid #ef4444', // Highlight color changed to warning red for instant perception
                                            background: '#fff5f5',
                                            boxShadow: '0 4px 12px -1px rgba(239, 68, 68, 0.25)',
                                            outline: '1px solid #fca5a5'
                                        };
                                    } else if (isMatchFinished) {
                                        dynamicCardStyle = { borderLeft: '4px solid #64748b', background: '#f8fafc' };
                                    } else {
                                        dynamicCardStyle = { borderLeft: '4px solid #3b82f6' };
                                    }

                                    return (
                                        <div
                                            key={match.fixtureId}
                                            className={`mcard ${activeSelectedMatch?.id === match.id ? 'sel' : ''} ${isMatchLive ? 'live-m' : ''}`}
                                            style={dynamicCardStyle}
                                            onClick={() => setCurMatchIdx(match.id)}
                                        >
                                            <div className="mcard-top">
                                                <span className="mcard-grp">{match.grp}</span>
                                                <span className={`badge ${isMatchLive ? 'b-live pulsing-badge-glow' : (isMatchFinished ? 'b-ft' : 'b-sched')}`} style={isMatchLive ? { backgroundColor: '#ef4444', color: '#fff' } : {}}>
                                                    {isMatchLive ? `🔴 LIVE — ${match.elapsed}'` : (isMatchFinished ? 'FINAL (FT)' : 'SCHEDULED')}
                                                </span>
                                            </div>
                                            <div className="mteams">
                                                {match.hflag && <img className="mflag" src={match.hflag} alt="" onError={(e) => e.target.style.display = 'none'} />}
                                                <span className="mname" style={{ fontWeight: '700', color: '#0f172a' }}>{match.h}</span>

                                                <span className={`mscore ${isMatchLive ? 'live-score-highlight' : ''}`} style={{ color: isMatchLive ? '#ef4444' : '#0f172a', fontWeight: '800', padding: '0 8px', background: '#f1f5f9', borderRadius: '4px' }}>
                                                    {match.goalsHome} – {match.goalsAway}
                                                </span>

                                                <span className="mname r" style={{ fontWeight: '700', color: '#0f172a' }}>{match.a}</span>
                                                {match.aflag && <img className="mflag" src={match.aflag} alt="" onError={(e) => e.target.style.display = 'none'} />}
                                            </div>
                                            <div className="mvenue" style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#64748b', marginTop: '4px' }}>
                                                <span>🏟️ {match.venue}</span>
                                                <span style={{ fontWeight: '700', color: '#1e293b' }}>🕒 {match.kickoffTime}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* INTERMEDIATE DISPLAY PANEL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeSelectedMatch ? (
                            <>
                                <div className="scoreboard" style={{ background: activeSelectedMatch.statusShort === 'LIVE' ? 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)' : '#fff', border: activeSelectedMatch.statusShort === 'LIVE' ? '1px solid #fca5a5' : '1px solid #e2e8f0' }}>
                                    <div className="sb-grp">{activeSelectedMatch.grp.toUpperCase()}</div>
                                    <div className="sb-teams">
                                        <div className="sb-team">
                                            {activeSelectedMatch.hflag && <img className="sb-flag" src={activeSelectedMatch.hflag} alt="" onError={(e) => e.target.style.opacity = 0} />}
                                            <div className="sb-tname" style={{ color: '#0f172a', fontWeight: '700' }}>{activeSelectedMatch.h}</div>
                                        </div>
                                        <div className="sb-scores">
                                            <div className="sb-num" style={{ color: activeSelectedMatch.statusShort === 'LIVE' ? '#ef4444' : '#0f172a', fontWeight: '800' }}>
                                                {activeSelectedMatch.goalsHome} &nbsp; – &nbsp; {activeSelectedMatch.goalsAway}
                                            </div>
                                            <div className="sb-time" style={{ color: activeSelectedMatch.statusShort === 'LIVE' ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                                                {activeSelectedMatch.statusShort === 'FT' ? '🏁 Concluded Full-Time' : (activeSelectedMatch.statusShort === 'SCHED' ? '📅 Upcoming setup' : `⏱️ In-Play: ${activeSelectedMatch.elapsed}'`)}
                                            </div>
                                        </div>
                                        <div className="sb-team">
                                            {activeSelectedMatch.aflag && <img className="sb-flag" src={activeSelectedMatch.aflag} alt="" onError={(e) => e.target.style.opacity = 0} />}
                                            <div className="sb-tname" style={{ color: '#0f172a', fontWeight: '700' }}>{activeSelectedMatch.a}</div>
                                        </div>
                                    </div>
                                    <div className="sb-venue" style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', marginTop: '6px' }}>📍 Venue: {activeSelectedMatch.venue}</div>
                                </div>

                                <div className="feed-wrap" style={{ flex: 1, background: '#fff', padding: '14px', borderRadius: '12px' }}>
                                    <div className="feed-hd" style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ fontSize: '14px', fontWeight: '700' }}>Event Commentary Log</h2>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>🕒 Date/Time: {activeSelectedMatch.kickoffTime}</span>
                                    </div>
                                    <div className="feed-scroll" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                        {activeSelectedMatch.fullCommentary?.slice().reverse().map((log, i) => {
                                            const isGoalEvent = log.type === 'goal';
                                            return (
                                                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f8fafc' }}>
                                                    <span style={{ fontWeight: '800', color: isGoalEvent ? '#ef4444' : '#94a3b8' }}>{log.min}'</span>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{log.icon} {log.evt}</div>
                                                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{log.txt}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="panel" style={{ padding: '20px', textAlign: 'center' }}>Select an active live compilation row.</div>
                        )}
                    </div>

                    {/* RIGHT PANEL DESCRIPTOR */}
                    <div className="right-col">
                        <div className="panel" style={{ padding: '14px', background: '#fff', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>WINDOW LOGIC STATUS</h3>
                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                                The active processing algorithm evaluates the match grid arrays and ensures historical items up to 36 hours old persist visibly on the interface.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: NEXT 3 UPCOMING FIXTURES */}
            {currentTab === 'future' && (
                <div className="page on" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="panel" style={{ background: '#fff', padding: '18px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: '#0f172a' }}>Calendar Matrix · Next 3 Scheduled Matches</h2>
                            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700' }}>Queue Allocation Verified</span>
                        </div>

                        {upcomingMatchesTop3.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
                                📅 No upcoming scheduled matches found in the payload array.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {upcomingMatchesTop3.map((match) => (
                                    <div key={match.fixtureId} className="mcard" style={{ borderLeft: '4px solid #3b82f6', cursor: 'default', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#3b82f6' }}>
                                            <span>📅 MATCH DATE: {match.kickoffTime}</span>
                                            <span style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>SCHEDULED</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{match.grp}</div>
                                        <div className="mteams" style={{ margin: '8px 0' }}>
                                            <span className="mname" style={{ fontSize: '14px', color: '#0f172a' }}>{match.h}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', padding: '0 8px' }}>VS</span>
                                            <span className="mname r" style={{ fontSize: '14px', color: '#0f172a' }}>{match.a}</span>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                                            🏟️ Arena Grounds: {match.venue}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: COMPLETE ARCHIVED RESULTS */}
            {currentTab === 'results' && (
                <div className="page on" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="panel" style={{ background: '#fff', padding: '16px', borderRadius: '12px' }}>
                        <h2 style={{ marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>Completed Match Databases (FT Archive)</h2>
                        {completedMatchesAll.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No archived match files found in data tracks.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {completedMatchesAll.map((match) => (
                                    <div key={match.fixtureId} className="mcard" style={{ borderLeft: '4px solid #94a3b8', cursor: 'default' }}>
                                        <div className="mcard-top"><span style={{ color: '#64748b' }}>{match.grp}</span><span className="badge b-ft">FT</span></div>
                                        <div className="mteams">
                                            <span className="mname" style={{ color: '#0f172a' }}>{match.h}</span>
                                            <span className="mscore" style={{ color: '#0f172a', fontWeight: '800' }}>{match.goalsHome} – {match.goalsAway}</span>
                                            <span className="mname r" style={{ color: '#0f172a' }}>{match.a}</span>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px', fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🏟️ Venue: {match.venue}</span>
                                            <span style={{ fontWeight: '700', color: '#64748b' }}>📅 Date: {match.kickoffTime}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
