import Foundation
import Observation

@Observable
final class TodoStore {
    private static let storageKey = "todos_v1"

    var todos: [TodoItem] = [] {
        didSet { save() }
    }

    var remainingCount: Int {
        todos.filter { !$0.isCompleted }.count
    }

    init() {
        load()
    }

    func add(_ title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        todos.insert(TodoItem(title: trimmed), at: 0)
    }

    func toggle(_ item: TodoItem) {
        guard let index = todos.firstIndex(where: { $0.id == item.id }) else { return }
        todos[index].isCompleted.toggle()
    }

    func delete(at offsets: IndexSet) {
        todos.remove(atOffsets: offsets)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(todos) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: Self.storageKey),
              let decoded = try? JSONDecoder().decode([TodoItem].self, from: data) else { return }
        todos = decoded
    }
}
