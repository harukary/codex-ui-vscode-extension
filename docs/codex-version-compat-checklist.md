# Codex Version Compatibility Checklist

This checklist compares `codex` `0.110.0` and `0.116.0` when used through this VS Code extension.

## Purpose

- Verify whether `0.110.0` is still a realistic minimum supported version.
- Verify whether `0.116.0` should be treated as the recommended stable version.
- Separate hard breakage from degraded UX.

## Scope

- Backend: `codex app-server`
- Client: this VS Code extension
- Comparison target: `0.110.0` vs `0.116.0`

## Test Environment

Record the environment before testing:

- Extension version:
- OS:
- VS Code version:
- Workspace path:
- Codex binary path:
- `codex --version` output:
- Custom `codex.backend.args`:
- Relevant `~/.codex/config.toml` differences:

## Test Matrix

Run the same scenarios for both versions.

| Area | Scenario | 0.110.0 | 0.116.0 | Notes |
| --- | --- | --- | --- | --- |
| Startup | Extension can launch `codex app-server` |  |  |  |
| Startup | `initialize` completes successfully |  |  |  |
| Session | New `codex` session can be created |  |  |  |
| Session | First prompt completes without startup stall |  |  |  |
| Resume | `Resume from history` lists threads |  |  |  |
| Resume | Resumed thread restores messages/title/model |  |  |  |
| Resume | Resume while session is open does not corrupt UI |  |  |  |
| Reload | Reload rehydrates thread state correctly |  |  |  |
| Reload | Reload during/after prior turn does not wedge UI |  |  |  |
| Approval | Command approval card appears in UI |  |  |  |
| Approval | `accept` works |  |  |  |
| Approval | `acceptForSession` works |  |  |  |
| Approval | `decline` works |  |  |  |
| Approval | `cancel` works |  |  |  |
| Approval | File-change approval resumes `apply_patch` flow |  |  |  |
| Input | `request_user_input` renders and returns answers |  |  |  |
| Interrupt | `Stop` triggers `turn/interrupt` correctly |  |  |  |
| Interrupt | UI unlocks after interrupt |  |  |  |
| Rewind | Edit/Rewind can target an earlier turn |  |  |  |
| Rewind | Rewind replaces subsequent conversation correctly |  |  |  |
| Plugins | Plugin install flow is visible and usable |  |  |  |
| Plugins | Installed plugin becomes usable in session |  |  |  |
| Account | Login/read/logout flow works from extension UI |  |  |  |
| Events | No major duplicate event rendering in chat UI |  |  |  |
| Events | No critical unhandled-event spam in debug output |  |  |  |
| MCP/Skills | MCP startup issues surface correctly |  |  |  |
| Metadata | Rename via `thread/name/set` works |  |  |  |

## Detailed Procedure

### 1. Startup

1. Set the target `codex` binary version.
2. Start the extension backend.
3. Confirm `codex app-server` launches.
4. Confirm `initialize` finishes without protocol errors.

Pass:

- Backend starts without manual recovery.
- No immediate fatal RPC or process exit.

Fail:

- Backend does not start.
- `initialize` fails or hangs.

### 2. New Session

1. Create a new `codex` session.
2. Send a simple prompt such as `say hello`.
3. Confirm the first turn reaches completion.

Pass:

- Session is created.
- First turn streams and completes.

Fail:

- Session creation fails.
- First turn stalls or never closes.

### 3. Resume

1. Use `Resume from history`.
2. Confirm the thread list loads.
3. Open a known thread with prior history.
4. Verify message list, title, and model-related metadata.

Pass:

- History is listable and reopenable.
- UI state matches stored thread state.

Fail:

- Thread list is missing/broken.
- Reopened thread loses history or metadata.

### 4. Reload

1. Open an existing `codex` session.
2. Trigger `Reload`.
3. Confirm history and latest state are rehydrated.

Pass:

- UI recovers the thread cleanly.
- No stuck sending/reloading state remains.

Fail:

- Session wedges.
- History disappears or active turn state becomes inconsistent.

### 5. Approval Flow

Use a prompt that causes shell/file-change approval.

1. Trigger a command requiring approval.
2. Verify the approval card appears in the chat UI.
3. Test `accept`, `acceptForSession`, `decline`, and `cancel`.
4. Trigger a file-edit flow that reaches `apply_patch`.

Pass:

- Each decision is reflected correctly.
- Approved actions continue and denied actions stop cleanly.

Fail:

- Approval UI does not appear.
- A decision is ignored or mismapped.
- `apply_patch` flow does not resume correctly after approval.

### 6. Request User Input

1. Trigger a flow that uses `request_user_input`.
2. Answer via the extension UI.
3. Repeat once with cancel/close behavior.

Pass:

- Questions render.
- Answers are returned to the backend correctly.

Fail:

- UI does not render questions.
- Cancellation leaves the turn in a broken state.

### 7. Interrupt

1. Start a long-running turn.
2. Press `Stop`.
3. Confirm the turn becomes interrupted.
4. Confirm input becomes usable again.

Pass:

- Interrupt reaches the backend.
- UI exits the busy state.

Fail:

- Interrupt is ignored.
- UI remains locked or desynchronized.

### 8. Rewind/Edit

1. Open a session with multiple turns.
2. Select an earlier turn for edit/rewind.
3. Send replacement text.
4. Confirm later turns are replaced consistently.

Pass:

- Rewind target is applied correctly.
- Subsequent thread state is coherent.

Fail:

- Wrong turn is targeted.
- Old/new content becomes mixed.

### 9. Plugins

1. Run a plugin install flow from a `codex` session.
2. Observe approval/elicitation behavior.
3. Confirm the installed plugin becomes usable.

Pass:

- Install UX is understandable and completes.
- Plugin usage is reflected in later turns.

Fail:

- Install flow is invisible or broken.
- Installed plugin is not usable afterward.

### 10. Account Flow

1. Open account-related UI in the extension.
2. Test read/login/logout.
3. Record differences in onboarding quality between versions.

Pass:

- Account state can be observed and changed as expected.

Fail:

- Login flow cannot be started or completed.
- UI state diverges from backend account state.

### 11. Event Compatibility

1. Run normal prompts, approvals, plugin flows, and reload/resume.
2. Watch chat UI and debug output.
3. Record duplicate rendering or unhandled-event spam.

Pass:

- No critical duplicate blocks.
- No repeated unhandled events that affect core UX.

Fail:

- UI renders duplicate lifecycle/tool output.
- Important behavior depends on unhandled events.

## Decision Rules

### Keep `0.110.0` as minimum

Keep `0.110.0` only if all of these are true:

- Startup is reliable.
- New session and first turn are reliable.
- Resume is usable.
- Approval flow is usable.
- Reload is not operationally risky.

### Raise minimum version

Raise the minimum version if any of these are true on `0.110.0`:

- Startup or first turn is unstable.
- Resume loses state or corrupts UI.
- Approval flow is missing or unreliable.
- Reload leaves the session wedged.

### Recommend `0.116.0`

Treat `0.116.0` as the recommended stable version if it improves one or more of:

- Approval behavior
- Resume/reload reliability
- Plugin install UX
- Account/login UX
- Event noise reduction

## Summary Template

Use this template after running the checklist:

```md
## Result

- Tested versions: `0.110.0`, `0.116.0`
- Minimum supported recommendation:
- Recommended stable version:

## Findings

- Startup:
- Resume:
- Reload:
- Approval:
- Request user input:
- Plugins:
- Account:
- Event compatibility:

## Decision

- Keep or raise minimum version:
- README update required:
- Follow-up work:
```
