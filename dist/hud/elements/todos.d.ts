/**
 * HUD - Todos Element
 *
 * Renders todo progress display.
 */
import type { TodoItem } from "../types.js";
/**
 * Render todo progress (compact).
 * Shows ▸ when in-progress, ✓ when all done.
 *
 * Format: ▸ todos:2/5 | ✓ todos | todos:2/5
 */
export declare function renderTodos(todos: TodoItem[]): string | null;
/**
 * Render current in-progress todo with content (for full/focused mode).
 *
 * Format: ▸ Implementing feature (2/5)
 *         ✓ All todos complete (5/5)
 */
export declare function renderTodosWithCurrent(todos: TodoItem[]): string | null;
//# sourceMappingURL=todos.d.ts.map