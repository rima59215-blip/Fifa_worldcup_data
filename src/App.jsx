import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
    // ── CONFIGURATION AREA ──
    // Automatically uses a Vercel/environment variable if configured, otherwise uses your fallback key string
    const API_TOKEN = import.meta.env.VITE_API_TOKEN || "f6bffce1b5394337b5aacedb0594d0a4";

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

    // ── API PROCESSING DATA PIPELINE WITH CACHE BUSTING & MULTI-PROXY FALLBACK ──
    const syncFootballDataFeed = async () => {
        try {
            const cacheBuster = `?_cb=${new Date().getTime()}`;
            const targetApiUrl = `https://api.football-data.org/v4/matches${cacheBuster}`;

            // Array of multiple proxies. If one is blocked by your hosting provider, the code tries the next one.
            const alternativePipelines = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(targetApiUrl)}`,
                `https://corsproxy.io/?${targetApiUrl}`
            ];

            let response = null;
            let successPipelineLabel = "Default Path";

            for (const proxyUrl of alternativePipelines) {
                try {
                    response = await fetch(proxyUrl, {
                        method: "GET",
                        headers: {
                            "X-Auth-Token": API_TOKEN
                        }
                    });
                    
                    if (response.ok) {
                        successPipelineLabel = proxyUrl.includes("allorigins") ? "AllOrigins Stream" : "CorsProxyIO Stream";
                        break;
                    }
                } catch (proxyError) {
                    console.warn(`Proxy branch bypassed: ${proxyUrl}`);
                }
            }

            if (!response || !response.ok) {
                throw new Error(`API returned network status: ${response ? response.status : 'No Response'}`);
            }

            const data = await response.json();

            if (data && data.matches && data.matches.length > 0) {
                parseAndDisplayMatches(data.matches, `V4 ${successPipelineLabel} ACTIVE`);
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

    const parseAndDisplayMatches = (apiMatches, modeLabel) => {
        const parsed = apiMatches.map((match, index) => {
            let status = "SCHED";
            if (match.status === "FINISHED") status = "FT";
            if (match.status === "IN_PLAY" || match.status === "PAUSED" || match.status === "LIVE") status = "LIVE";

            let minutesElapsed = 0;
            if (match.minute) minutesElapsed = match.minute;
            else if (status === "LIVE") minutesElapsed = 45;
            else if (status === "FT") minutesElapsed = 90;

            let localizedKickoff = "Date Pending";
            if (match.utcDate) {
                localizedKickoff = new Date(match.utcDate).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }

            return {
                id: index,
                fixtureId: match.id || `fd-${index}`,
                grp: `${match.competition?.name || 'Global Football'}`,
                statusShort: status,
                elapsed: minutesElapsed,
                kickoffTime: localizedKickoff,
                h: match.homeTeam?.name || "Home Side",
                a: match.awayTeam?.name || "Away Side",
                hflag: match.homeTeam?.crest || "",
                aflag: match.awayTeam?.crest || "",
                venue: match.venue || "Stadium Ground Arena",
                goalsHome: String(match.score?.fullTime?.home ?? 0),
                goalsAway: String(match.score?.fullTime?.away ?? 0)
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

    const activeSelectedMatch = matchData.find(m => m.id === curMatchIdx) || matchData[0] || null;
    const liveMatches = matchData.filter(m => m.statusShort === "LIVE");
    const completedMatches = matchData.filter(m => m.statusShort === "FT");
    const upcomingMatches = matchData.filter(m => m.statusShort === "SCHED");

    return (
        <div className="app-container" style={{ color: '#0f172a' }}>
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

            {/* EXPANDED THREE-TAB BAR CONTROLLER */}
            <div className="nav">
                <div className={`ntab ${currentTab === 'live' ? 'on' : ''}`} onClick={() => setCurrentTab('live')}>
                    In-Play Dashboard &nbsp;
                    {liveMatches.length > 0 && <span className="tab-count-badge">{liveMatches.length}</span>}
                </div>
                <div className={`ntab ${currentTab === 'future' ? 'on' : ''}`} onClick={() => setCurrentTab('future')}>
                    Upcoming Fixtures &nbsp;
                    {upcomingMatches.length > 0 && <span className="tab-count-badge style-future">{upcomingMatches.length}</span>}
                </div>
                <div className={`ntab ${currentTab === 'results' ? 'on' : ''}`} onClick={() => setCurrentTab('results')}>Archived Results (FT)</div>
            </div>

            {/* TAB 1: IN-PLAY DASHBOARD VIEWPORT */}
            {currentTab === 'live' && (
                <div className="page on" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 310px', gap: '14px', padding: '14px' }}>
                    {/* LEFT PANEL: FILTERED ACTIVE STREAMS */}
                    <div className="page-left">
                        <div className="panel">
                            <div className="panel-hd"><h2>Real-Time Matches</h2></div>
                            {loading ? (
                                <div style={{ padding: '30px', textAlign: 'center' }}>Syncing telemetry loops...</div>
                            ) : matchData.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No match frames registered on server.</div>
                            ) : (
                                matchData.map((match) => {
                                    const isMatchLive = match.statusShort === "LIVE";
                                    const isMatchFinished = match.statusShort === "FT";

                                    const dynamicCardStyle = isMatchLive ? {
                                        borderLeft: '5px solid #22c55e',
                                        background: '#f0fdf4',
                                        boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.12)'
                                    } : {};

                                    return (
                                        <div
                                            key={match.id}
                                            className={`mcard ${activeSelectedMatch?.id === match.id ? 'sel' : ''} ${isMatchLive ? 'live-m' : ''}`}
                                            style={dynamicCardStyle}
                                            onClick={() => setCurMatchIdx(match.id)}
                                        >
                                            <div className="mcard-top">
                                                <span className="mcard-grp">{match.grp}</span>
                                                <span className={`badge ${isMatchLive ? 'b-live pulsing-badge-glow' : (isMatchFinished ? 'b-ft' : 'b-sched')}`}>
                                                    {isMatchLive ? `🔴 IN PLAY — ${match.elapsed}'` : (isMatchFinished ? 'FINAL (FT)' : 'SCHEDULED')}
                                                </span>
                                            </div>
                                            <div className="mteams" style={{ color: '#0f172a' }}>
                                                {match.hflag && <img className="mflag" src={match.hflag} alt="" onError={(e) => e.target.style.display = 'none'} />}
                                                <span className="mname" style={{ fontWeight: isMatchLive ? '700' : '400', color: '#0f172a' }}>{match.h}</span>
                                                {/* FIX: Forced typography text color to dark charcoal to fix hidden/white score styling glitch */}
                                                <span className={`mscore ${isMatchLive ? 'live-score-highlight' : ''}`} style={{ color: '#0f172a', fontWeight: '800' }}>
                                                    {match.goalsHome} – {match.goalsAway}
                                                </span>
                                                <span className="mname r" style={{ fontWeight: isMatchLive ? '700' : '400', color: '#0f172a' }}>{match.a}</span>
                                                {match.aflag && <img className="mflag" src={match.aflag} alt="" onError={(e) => e.target.style.display = 'none'} />}
                                            </div>
                                            <div className="mvenue">🏟️ {match.venue}</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* INTERMEDIATE DISPLAY COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeSelectedMatch ? (
                            <>
                                <div className="scoreboard" style={{ background: activeSelectedMatch.statusShort === 'LIVE' ? 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' : '#fff' }}>
                                    <div className="sb-grp" style={{ color: '#475569' }}>{activeSelectedMatch.grp.toUpperCase()}</div>
                                    <div className="sb-teams">
                                        <div className="sb-team">
                                            {activeSelectedMatch.hflag && <img className="sb-flag" src={activeSelectedMatch.hflag} alt="" onError={(e) => e.target.style.opacity = 0} />}
                                            <div className="sb-tname" style={{ color: '#0f172a', fontWeight: '700' }}>{activeSelectedMatch.h}</div>
                                        </div>
                                        <div className="sb-scores">
                                            {/* FIX: Added clear dark formatting to main tracking viewport layout scores */}
                                            <div className="sb-num" style={{ color: '#0f172a', fontWeight: '800' }}>
                                                {activeSelectedMatch.goalsHome} &nbsp; – &nbsp; {activeSelectedMatch.goalsAway}
                                            </div>
                                            <div className="sb-time" style={{ color: activeSelectedMatch.statusShort === 'LIVE' ? '#22c55e' : '#64748b', fontWeight: 'bold' }}>
                                                {activeSelectedMatch.statusShort === 'FT' ? '🏁 Concluded Full-Time' : (activeSelectedMatch.statusShort === 'SCHED' ? '📅 Upcoming Fixture' : `⏱️ In-Play: ${activeSelectedMatch.elapsed}'`)}
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
                                    <div className="feed-hd" style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '10px' }}>
                                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Event Commentary Log</h2>
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
                            <div className="panel" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Select an active tracking target row.</div>
                        )}
                    </div>

                    {/* RIGHT COLUMN INFO PANEL */}
                    <div className="right-col">
                        <div className="panel" style={{ padding: '14px', background: '#fff', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>HIGHLIGHT SYSTEMS</h3>
                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                                Matches displaying a green neon border and pulsing icon indicators denote verified active live broadcasts captured in this execution cycle.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: UPCOMING FIXTURES VIEWPORT */}
            {currentTab === 'future' && (
                <div className="page on" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="panel" style={{ background: '#fff', padding: '18px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: '#0f172a' }}>Calendar Grid · Upcoming Matches</h2>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Count: {upcomingMatches.length} Scheduled</span>
                        </div>

                        {upcomingMatches.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
                                📅 No future scheduled matches detected in the current data sync payload.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {upcomingMatches.map((match) => (
                                    <div key={match.fixtureId} className="mcard" style={{ borderLeft: '4px solid #3b82f6', cursor: 'default', background: '#f8fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', fontWeight: '700', color: '#3b82f6' }}>
                                            <span>⏱️ {match.kickoffTime}</span>
                                            <span style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Scheduled</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>{match.grp}</div>
                                        <div className="mteams" style={{ margin: '8px 0', color: '#0f172a' }}>
                                            <span className="mname" style={{ fontSize: '14px', color: '#0f172a' }}>{match.h}</span>
                                            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '800', padding: '0 8px' }}>VS</span>
                                            <span className="mname r" style={{ fontSize: '14px', color: '#0f172a' }}>{match.a}</span>
                                        </div>
                                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                                            📍 Ground Arena: {match.venue}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: ARCHIVED RESULTS TAB */}
            {currentTab === 'results' && (
                <div className="page on" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="panel" style={{ background: '#fff', padding: '16px', borderRadius: '12px' }}>
                        <h2 style={{ marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>Archived Match Databases (FT)</h2>
                        {completedMatches.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No archived final results found inside the uncached data array.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {completedMatches.map((match) => (
                                    <div key={match.id} className="mcard" style={{ borderLeft: '4px solid #94a3b8', cursor: 'default' }}>
                                        <div className="mcard-top"><span style={{ color: '#64748b' }}>{match.grp}</span><span className="badge b-ft">FT</span></div>
                                        <div className="mteams" style={{ color: '#0f172a' }}>
                                            <span className="mname" style={{ color: '#0f172a' }}>{match.h}</span>
                                            <span className="mscore" style={{ color: '#0f172a', fontWeight: '800' }}>{match.goalsHome} – {match.goalsAway}</span>
                                            <span className="mname r" style={{ color: '#0f172a' }}>{match.a}</span>
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
