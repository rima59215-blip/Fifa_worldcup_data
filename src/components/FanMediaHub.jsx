import React, { useState, useRef } from 'react';
import { Camera, Music, Play, Pause, Trash2, Eye } from 'lucide-react';

export default function FanMediaHub({ onOpenLightbox }) {
    const [tab, setTab] = useState('photo');
    const [photos, setPhotos] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const fileInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const audioRef = useRef(null);

    const handlePhotoUpload = (e) => {
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (el) => setPhotos(p => [...p, { src: el.target.result, name: file.name }]);
            reader.readAsDataURL(file);
        });
    };

    const handleAudioUpload = (e) => {
        Array.from(e.target.files).forEach(file => {
            const url = URL.createObjectURL(file);
            setTracks(t => [...t, { name: file.name.replace(/\.[^.]+$/, ''), url }]);
        });
    };

    const togglePlay = () => {
        if (!audioRef.current || tracks.length === 0) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play().catch(() => { });
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="upload-panel">
            <div className="upload-tabs">
                <div className={`utab ${tab === 'photo' ? 'on' : ''}`} onClick={() => setTab('photo')}>Fan Media</div>
                <div className={`utab ${tab === 'music' ? 'on' : ''}`} onClick={() => setTab('music')}>Fan Zone Audio</div>
            </div>

            {tab === 'photo' ? (
                <div className="upbody">
                    <div className="drop-zone" onClick={() => fileInputRef.current.click()}>
                        <Camera size={24} style={{ marginBottom: '6px', color: '#64748b' }} />
                        <div className="dz-label">Upload Live Stadium Photos</div>
                        <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </div>
                    <div className="photo-grid">
                        {photos.map((p, i) => (
                            <div className="pthumb" key={i}>
                                <img src={p.src} alt="" />
                                <div className="pthumb-over">
                                    <button onClick={() => onOpenLightbox(p.src)}><Eye size={16} /></button>
                                    <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="upbody">
                    <div className="drop-zone" onClick={() => audioInputRef.current.click()}>
                        <Music size={24} style={{ marginBottom: '6px', color: '#64748b' }} />
                        <div className="dz-label">Inject Fan Audio Tracks</div>
                        <input type="file" ref={audioInputRef} accept="audio/*" multiple onChange={handleAudioUpload} style={{ display: 'none' }} />
                    </div>

                    {tracks.length > 0 && (
                        <div className="music-player">
                            <audio ref={audioRef} src={tracks[currentTrackIdx]?.url} onEnded={() => setCurrentTrackIdx((currentTrackIdx + 1) % tracks.length)} />
                            <div className="np-track">{tracks[currentTrackIdx]?.name}</div>
                            <div className="np-progress"><div className="np-bar" style={{ width: isPlaying ? '60%' : '0%' }}></div></div>
                            <div className="np-controls">
                                <button className="np-play" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={14} color="#0b1e3d" /> : <Play size={14} color="#0b1e3d" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}