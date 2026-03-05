/**
 * HUD - Todos Element
 *
 * Renders todo progress display.
 */
import { RESET } from "../colors.js";
import { truncateToWidth } from "../../utils/string-width.js";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
/**
 * Render todo progress (compact).
 * Shows ▸ when in-progress, ✓ when all done.
 *
 * Format: ▸ todos:2/5 | ✓ todos | todos:2/5
 */
export function renderTodos(todos) {
    if (todos.length === 0) {
        return null;
    }
    const completed = todos.filter((t) => t.status === "completed").length;
    const total = todos.length;
    const hasInProgress = todos.some((t) => t.status === "in_progress");
    const percent = (completed / total) * 100;
    const color = percent >= 80 ? GREEN : percent >= 50 ? YELLOW : CYAN;
    if (completed === total && total > 0) {
        return `${GREEN}✓${RESET} ${DIM}todos${RESET}`;
    }
    if (hasInProgress) {
        return `${YELLOW}▸${RESET} todos:${color}${completed}/${total}${RESET}`;
    }
    return `todos:${color}${completed}/${total}${RESET}`;
}
/**
 * Render current in-progress todo with content (for full/focused mode).
 *
 * Format: ▸ Implementing feature (2/5)
 *         ✓ All todos complete (5/5)
 */
export function renderTodosWithCurrent(todos) {
    if (todos.length === 0) {
        return null;
    }
    const completed = todos.filter((t) => t.status === "completed").length;
    const total = todos.length;
    const inProgress = todos.find((t) => t.status === "in_progress");
    // All done
    if (completed === total && total > 0) {
        return `${GREEN}✓${RESET} ${DIM}All todos complete (${completed}/${total})${RESET}`;
    }
    const percent = (completed / total) * 100;
    const color = percent >= 80 ? GREEN : percent >= 50 ? YELLOW : CYAN;
    if (inProgress) {
        const activeText = inProgress.activeForm || inProgress.content || "...";
        const truncated = truncateToWidth(activeText, 45);
        return `${YELLOW}▸${RESET} ${truncated} ${DIM}(${color}${completed}/${total}${RESET}${DIM})${RESET}`;
    }
    return `todos:${color}${completed}/${total}${RESET}`;
}
//# sourceMappingURL=todos.js.map