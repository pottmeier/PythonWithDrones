// src/components/PythonConsole.jsx

import React, { useState } from 'react';

export default function PythonConsole() {
    const [code, setCode] = useState('');

    const runCode = () => {
        // Wir rufen jetzt unsere eigene, zuverlässige Brückenfunktion auf.
        if (typeof window.runPython === 'function') {
            try {
                window.runPython(code);
            } catch (e) {
                console.error("Fehler beim Aufruf der Brückenfunktion 'window.runPython':", e);
            }
        } else {
            console.error("Die Python-Brücke 'window.runPython' ist nicht bereit.");
            alert("Die Python-JavaScript-Brücke ist noch nicht bereit. Bitte warten.");
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            runCode();
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            color: 'white',
            fontFamily: 'monospace'
        }}>
            <div>Python Konsole</div>
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="z.B. bewege_rechts()"
                style={{ background: '#333', color: 'white', border: '1px solid grey', marginRight: '5px' }}
            />
            <button onClick={runCode}>Ausführen</button>
        </div>
    );
}