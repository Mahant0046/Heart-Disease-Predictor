export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
): T & { cancel: () => void; flush: () => void } {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: any[] | null = null;
    let lastThis: any = null;
    let lastCallTime: number | null = null;

    function invokeFunc() {
        const args = lastArgs!;
        const thisArg = lastThis;
        lastArgs = null;
        lastThis = null;
        lastCallTime = null;
        return func.apply(thisArg, args);
    }

    function startTimer(pendingFunc: () => void, wait: number) {
        return setTimeout(pendingFunc, wait);
    }

    function cancelTimer(id: NodeJS.Timeout) {
        clearTimeout(id);
    }

    function trailingEdge(time: number) {
        timeout = null;

        if (lastArgs) {
            return invokeFunc();
        }
    }

    function debounced(this: any, ...args: any[]) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeout === null) {
                return invokeFunc();
            }
            if (timeout) {
                cancelTimer(timeout);
            }
            timeout = startTimer(() => trailingEdge(Date.now()), wait);
        }

        return undefined;
    }

    function shouldInvoke(time: number) {
        const timeSinceLastCall = time - (lastCallTime || 0);
        return timeSinceLastCall >= wait;
    }

    function cancel() {
        if (timeout) {
            cancelTimer(timeout);
        }
        lastArgs = null;
        lastThis = null;
        lastCallTime = null;
    }

    function flush() {
        return timeout === null ? undefined : trailingEdge(Date.now());
    }

    debounced.cancel = cancel;
    debounced.flush = flush;

    return debounced as T & { cancel: () => void; flush: () => void };
} 