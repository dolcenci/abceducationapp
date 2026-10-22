import { useEffect, useRef, useState } from 'react';

let pyodidePromise = null;

function loadPyodideOnce() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
        script.onload = async () => {
            try {
                const py = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
                });
                resolve(py);
            } catch (err) {
                reject(err);
            }
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return pyodidePromise;
}

export function usePyodide() {
    const [pyodide, setPyodide] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | ready | error
    const [error, setError] = useState('');
    const hasStarted = useRef(false);

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;
        setStatus('loading');
        loadPyodideOnce()
            .then((py) => {
                setPyodide(py);
                setStatus('ready');
            })
            .catch((e) => {
                setError(String(e));
                setStatus('error');
            });
    }, []);

    return { pyodide, status, error };
}