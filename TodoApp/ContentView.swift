import SwiftUI

struct ContentView: View {
    @State private var store = TodoStore()
    @State private var newTodoText = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                inputBar
                todoList
            }
            .navigationTitle("Todos")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Text("\(store.remainingCount) remaining")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 12) {
            TextField("What needs to be done?", text: $newTodoText)
                .textFieldStyle(.plain)
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .focused($isInputFocused)
                .onSubmit(addTodo)

            Button(action: addTodo) {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
            }
            .disabled(newTodoText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding()
    }

    private var todoList: some View {
        List {
            ForEach(store.todos) { item in
                TodoRowView(item: item) {
                    withAnimation { store.toggle(item) }
                }
            }
            .onDelete { offsets in
                withAnimation { store.delete(at: offsets) }
            }
        }
        .listStyle(.plain)
        .overlay {
            if store.todos.isEmpty {
                ContentUnavailableView(
                    "No Todos",
                    systemImage: "checklist",
                    description: Text("Add a todo to get started.")
                )
            }
        }
    }

    private func addTodo() {
        let text = newTodoText
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        withAnimation {
            store.add(text)
        }
        newTodoText = ""
        isInputFocused = true
    }
}

struct TodoRowView: View {
    let item: TodoItem
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(item.isCompleted ? .green : .secondary)
            }
            .buttonStyle(.plain)

            Text(item.title)
                .strikethrough(item.isCompleted)
                .foregroundStyle(item.isCompleted ? .secondary : .primary)

            Spacer()
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

#Preview {
    ContentView()
}
