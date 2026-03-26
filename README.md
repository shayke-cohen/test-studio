# TodoApp

A minimal SwiftUI todo list app for iOS with persistence.

## Features

- Add todos via a text field (keyboard submit or + button)
- Toggle completion with a tap on the circle icon — completed items show a green checkmark and strikethrough text
- Swipe left to delete any item
- Remaining count displayed in the navigation bar
- Empty state with a prompt when the list is clear
- All todos persist across app launches via `UserDefaults`

## Architecture

| File | Role |
|---|---|
| `TodoItem.swift` | Data model — `Identifiable` + `Codable` struct with UUID, title, completion flag, and creation date |
| `TodoStore.swift` | Persistence layer — `@Observable` class that auto-saves to `UserDefaults` on every mutation |
| `ContentView.swift` | UI — `NavigationStack` with an input bar and a `List` of `TodoRowView` rows |
| `TodoAppApp.swift` | App entry point |

## Requirements

- iOS 17+ (uses `@Observable` and `ContentUnavailableView`)
- Xcode 15+

## Running

Open `TodoApp.xcodeproj` in Xcode, select an iPhone simulator, and press **Run** (⌘R).

## Data Storage

Todos are stored under the key `todos_v1` in `UserDefaults.standard` as JSON. Clearing app data (e.g. uninstall) resets the list.
