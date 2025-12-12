import React, { useState, useEffect } from 'react';

interface SoundEvent {
    id: string;
    category: string;
    name: string;
    description: string;
    currentSound: string;
}

interface SoundOption {
    key: string;
    displayName: string;
}

const SoundConfigUI: React.FC = () => {
    const [soundCatalog, setSoundCatalog] = useState<any>({});
    const [soundEvents, setSoundEvents] = useState<SoundEvent[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [playingSound, setPlayingSound] = useState<string | null>(null);
    const configFilePath = 'C:\\git\\sht\\MVP\\public\\soundConfig.json';

    useEffect(() => {
        // Load sound catalog
        fetch('/assets/sounds/catalog.json')
            .then(res => res.json())
            .then(data => {
                setSoundCatalog(data);
                console.log('[SoundConfigUI] Loaded', Object.keys(data).length - 1, 'sounds');
            })
            .catch(err => console.error('[SoundConfigUI] Failed to load catalog:', err));

        // Default events
        const defaultEvents: SoundEvent[] = [
            { id: 'weapon.pistol', category: 'Weapons', name: 'Pistol Fire', description: 'Sound when firing a pistol', currentSound: 'combat.gunshot_pistol' },
            { id: 'weapon.rifle', category: 'Weapons', name: 'Rifle Fire', description: 'Sound when firing a rifle', currentSound: 'combat.gunshot_rifle' },
            { id: 'weapon.shotgun', category: 'Weapons', name: 'Shotgun Fire', description: 'Sound when firing a shotgun', currentSound: 'combat.gunshot_shotgun' },
            { id: 'weapon.beam', category: 'Weapons', name: 'Beam Fire', description: 'Sound when firing energy beam', currentSound: 'combat.laser_fire' },
            { id: 'weapon.psychic', category: 'Weapons', name: 'Psychic Attack', description: 'Sound for psychic attacks', currentSound: 'combat.energy_blast' },
            { id: 'weapon.melee', category: 'Weapons', name: 'Melee Swing', description: 'Sound when swinging melee weapon', currentSound: 'melee.sword_slash' },
            { id: 'impact.crit', category: 'Combat', name: 'Critical Hit', description: 'Sound for critical hits', currentSound: 'injuries.critical_hit' },
            { id: 'impact.flesh', category: 'Combat', name: 'Flesh Impact', description: 'Bullet/attack hitting flesh', currentSound: 'impacts.bullet_hit_flesh' },
            { id: 'impact.melee', category: 'Combat', name: 'Melee Impact', description: 'Melee weapon impact', currentSound: 'combat.impact_punch' },
            { id: 'impact.miss', category: 'Combat', name: 'Miss/Whoosh', description: 'Sound when attack misses', currentSound: 'melee.sword_slash' },
            { id: 'status.burning', category: 'Status', name: 'Burning Applied', description: 'When unit catches fire', currentSound: 'elemental.fire_ignite' },
            { id: 'status.frozen', category: 'Status', name: 'Frozen Applied', description: 'When unit is frozen', currentSound: 'elemental.ice_freeze' },
            { id: 'status.stunned', category: 'Status', name: 'Stunned', description: 'When unit is stunned', currentSound: 'injuries.stun_impact' },
            { id: 'status.knockout', category: 'Status', name: 'Knockout', description: 'When unit is knocked out', currentSound: 'injuries.knockout' },
            { id: 'status.shield', category: 'Status', name: 'Shield Block', description: 'Shield activated/blocked', currentSound: 'impacts.shield_block' },
            { id: 'injury.bone_break', category: 'Injuries', name: 'Bone Break', description: 'Broken bone injury', currentSound: 'injuries.bone_break' },
            { id: 'injury.flesh_tear', category: 'Injuries', name: 'Flesh Tear', description: 'Bleeding/flesh wound', currentSound: 'injuries.flesh_tear' },
            { id: 'movement.footstep', category: 'Movement', name: 'Footsteps', description: 'Sound when unit walks', currentSound: 'env_footsteps.step_concrete' },
            { id: 'grapple.success', category: 'Combat', name: 'Grapple Success', description: 'Successful grapple', currentSound: 'combat.impact_punch' },
            { id: 'grapple.fail', category: 'Combat', name: 'Grapple Fail', description: 'Failed grapple attempt', currentSound: 'melee.sword_slash' },
        ];

        // Load from PROJECT FILE (not localStorage)
        fetch('/soundConfig.json')
            .then(res => res.json())
            .then(config => {
                const loadedEvents = defaultEvents.map(event => ({
                    ...event,
                    currentSound: config[event.id] || event.currentSound
                }));
                setSoundEvents(loadedEvents);
                console.log('[SoundConfigUI] ✅ Loaded from /public/soundConfig.json');
            })
            .catch(err => {
                console.error('[SoundConfigUI] Using defaults:', err);
                setSoundEvents(defaultEvents);
            });
    }, []);

    const categories = ['all', 'Weapons', 'Combat', 'Status', 'Injuries', 'Movement'];

    const getAvailableSounds = (): SoundOption[] => {
        return Object.keys(soundCatalog)
            .filter(key => key !== '_metadata')
            .map(key => ({
                key,
                displayName: key.replace(/\./g, ' › ').replace(/_/g, ' ')
            }))
            .sort((a, b) => a.key.localeCompare(b.key));
    };

    const filteredEvents = soundEvents.filter(event => {
        const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const playSound = (soundKey: string) => {
        const entry = soundCatalog[soundKey];
        if (!entry || !entry.files || entry.files.length === 0) {
            console.warn('[SoundConfigUI] Sound not found:', soundKey);
            return;
        }

        const variantIndex = Math.floor(Math.random() * entry.files.length);
        const filePath = `/assets/${entry.files[variantIndex]}`;

        console.log('[SoundConfigUI] 🔊 Playing:', soundKey, '→', filePath);

        const audio = new Audio(filePath);
        audio.volume = 0.7;

        setPlayingSound(soundKey);

        audio.play()
            .then(() => console.log('[SoundConfigUI] ✅ Playing'))
            .catch(err => alert(`Could not play: ${soundKey}\n${err.message}`))
            .finally(() => setTimeout(() => setPlayingSound(null), 1000));
    };

    const updateSound = (eventId: string, newSound: string) => {
        setSoundEvents(prev => prev.map(event =>
            event.id === eventId ? { ...event, currentSound: newSound } : event
        ));
    };

    const saveToFile = () => {
        const config = soundEvents.reduce((acc, event) => {
            acc[event.id] = event.currentSound;
            return acc;
        }, {} as Record<string, string>);

        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soundConfig.json';
        a.click();

        alert(`📥 Downloaded soundConfig.json\n\n⚠️ IMPORTANT: Replace the file at:\n${configFilePath}\n\nThen refresh the game to use new sounds!`);
        console.log('[SoundConfigUI] 💾 Downloaded - Place at:', configFilePath);
    };

    const openConfigFile = () => {
        // Copy path to clipboard
        navigator.clipboard.writeText(configFilePath)
            .then(() => {
                alert(`📋 File path copied to clipboard!\n\n${configFilePath}\n\n✏️ Open this file in VS Code or your editor to edit the sound configuration directly.`);
            })
            .catch(() => {
                alert(`📁 Config File Location:\n\n${configFilePath}\n\n✏️ Open this file in your editor to edit sounds.`);
            });
    };

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            minHeight: '100vh',
            color: '#e0e0e0'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    🔊 Sound Configuration Studio
                </h1>
                <p style={{ color: '#aaa', marginBottom: '20px' }}>
                    Configure game sounds • {Object.keys(soundCatalog).length - 1} sounds available
                </p>

                <div style={{
                    background: 'rgba(255, 152, 0, 0.1)',
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#ff9800'
                }}>
                    ⚠️ <strong>Changes saved to:</strong> {configFilePath}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '30px',
                    flexWrap: 'wrap'
                }}>
                    <input
                        type="text"
                        placeholder="🔍 Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '250px',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#e0e0e0',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat} style={{ background: '#1a1a2e' }}>
                                {cat === 'all' ? '📁 All Categories' : `📂 ${cat}`}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={openConfigFile}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        📁 Open Config File
                    </button>

                    <button
                        onClick={saveToFile}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        💾 Save & Download
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredEvents.map(event => (
                        <div key={event.id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            transition: 'all 0.3s'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                marginBottom: '12px'
                            }}>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#fff'
                                    }}>
                                        {event.name}
                                    </h3>
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(102, 126, 234, 0.2)',
                                        color: '#a0aef0',
                                        marginTop: '6px',
                                        display: 'inline-block'
                                    }}>
                                        {event.category}
                                    </span>
                                </div>
                                <button
                                    onClick={() => playSound(event.currentSound)}
                                    disabled={playingSound === event.currentSound}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: playingSound === event.currentSound
                                            ? 'rgba(255, 152, 0, 0.3)'
                                            : 'rgba(76, 175, 80, 0.2)',
                                        color: playingSound === event.currentSound ? '#ff9800' : '#4caf50',
                                        cursor: playingSound === event.currentSound ? 'wait' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {playingSound === event.currentSound ? '🔊' : '▶️'} Test
                                </button>
                            </div>

                            <p style={{
                                fontSize: '13px',
                                color: '#999',
                                margin: '8px 0 16px 0'
                            }}>
                                {event.description}
                            </p>

                            <select
                                value={event.currentSound}
                                onChange={(e) => updateSound(event.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#e0e0e0',
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    cursor: 'pointer'
                                }}
                            >
                                {getAvailableSounds().map(sound => (
                                    <option key={sound.key} value={sound.key} style={{ background: '#1a1a2e' }}>
                                        {sound.displayName}
                                    </option>
                                ))}
                            </select>

                            <div style={{
                                marginTop: '12px',
                                fontSize: '11px',
                                color: '#666',
                                fontFamily: 'monospace'
                            }}>
                                ID: {event.id} → {event.currentSound}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredEvents.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#666'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <div style={{ fontSize: '18px' }}>No events found</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SoundConfigUI;
