export async function runJavaScript(code) {
    const logs = [];
    const fakeConsole = {
        log: (...args) => logs.push(args.map(stringify).join(' ')),
        error: (...args) => logs.push('[error] ' + args.map(stringify).join(' ')),
        warn: (...args) => logs.push('[warn] ' + args.map(stringify).join(' ')),
        info: (...args) => logs.push(args.map(stringify).join(' ')),
    };

    function stringify(x) {
        try {
            if (typeof x === 'string') return x;
            return JSON.stringify(x);
        } catch {
            return String(x);
        }
    }

    try {
        const fn = new Function('console', `"use strict";\n${code}`);
        const result = fn(fakeConsole);
        // Handle promises
        if (result && typeof result.then === 'function') {
            const awaited = await result;
            return { output: logs.join('\n'), error: '', returnValue: awaited };
        }
        return { output: logs.join('\n'), error: '' };
    } catch (err) {
        return { output: logs.join('\n'), error: String(err) };
    }
}