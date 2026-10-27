
export function formatTime(milliseconds = 0) {
    const totalSeconds = Math.floor(
        Math.max(0, Number(milliseconds) || 0) / 1000
    );

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
