import SwiftUI

struct ContentView: View {
    @State private var store = FoodStore()
    @State private var showingAddSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    dailySummaryCard
                    macroBreakdown
                    mealSections
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Food Tracker")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.green)
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddFoodView(store: store)
            }
        }
    }

    private var dailySummaryCard: some View {
        VStack(spacing: 12) {
            Text("Today's Calories")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text("\(store.totalCaloriesToday)")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)

            Text("of \(store.dailyCalorieGoal) kcal goal")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            ProgressView(value: store.calorieProgress)
                .progressViewStyle(.linear)
                .tint(store.calorieProgress >= 1.0 ? .orange : .green)
                .scaleEffect(y: 2)
                .padding(.horizontal)
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 2)
    }

    private var macroBreakdown: some View {
        HStack(spacing: 12) {
            MacroCard(label: "Protein", value: store.totalProteinToday, unit: "g", color: .blue)
            MacroCard(label: "Carbs", value: store.totalCarbsToday, unit: "g", color: .orange)
            MacroCard(label: "Fat", value: store.totalFatToday, unit: "g", color: .purple)
        }
    }

    @ViewBuilder
    private var mealSections: some View {
        ForEach(MealType.allCases) { mealType in
            let mealItems = store.items(for: mealType)
            if !mealItems.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label(mealType.rawValue, systemImage: mealType.icon)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .padding(.horizontal, 4)

                    List {
                        ForEach(mealItems) { item in
                            FoodRowView(item: item)
                                .listRowInsets(EdgeInsets())
                                .listRowSeparator(.hidden)
                        }
                        .onDelete { offsets in
                            withAnimation {
                                store.delete(at: offsets, from: mealItems)
                            }
                        }
                    }
                    .listStyle(.plain)
                    .frame(minHeight: CGFloat(mealItems.count) * 52)
                    .scrollDisabled(true)
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }

        if store.todayItems.isEmpty {
            ContentUnavailableView(
                "No Food Logged",
                systemImage: "fork.knife",
                description: Text("Tap + to log your first meal.")
            )
            .padding(.top, 40)
        }
    }
}

struct MacroCard: View {
    let label: String
    let value: Double
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(String(format: "%.0f", value))
                .font(.system(size: 22, weight: .bold, design: .rounded))
            Text("\(unit) \(label)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(color.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct FoodRowView: View {
    let item: FoodItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.body)
                HStack(spacing: 8) {
                    Text("P: \(String(format: "%.0f", item.protein))g")
                    Text("C: \(String(format: "%.0f", item.carbs))g")
                    Text("F: \(String(format: "%.0f", item.fat))g")
                }
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(item.calories) kcal")
                .font(.subheadline.bold())
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

struct AddFoodView: View {
    let store: FoodStore
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var calories = ""
    @State private var protein = ""
    @State private var carbs = ""
    @State private var fat = ""
    @State private var mealType: MealType = .lunch

    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        (Int(calories) ?? 0) > 0
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Food") {
                    TextField("Food name", text: $name)
                    Picker("Meal", selection: $mealType) {
                        ForEach(MealType.allCases) { type in
                            Label(type.rawValue, systemImage: type.icon).tag(type)
                        }
                    }
                }

                Section("Nutrition") {
                    HStack {
                        Text("Calories")
                        Spacer()
                        TextField("kcal", text: $calories)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    HStack {
                        Text("Protein")
                        Spacer()
                        TextField("grams", text: $protein)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    HStack {
                        Text("Carbs")
                        Spacer()
                        TextField("grams", text: $carbs)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                    HStack {
                        Text("Fat")
                        Spacer()
                        TextField("grams", text: $fat)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                }
            }
            .navigationTitle("Add Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let item = FoodItem(
                            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                            calories: Int(calories) ?? 0,
                            protein: Double(protein) ?? 0,
                            carbs: Double(carbs) ?? 0,
                            fat: Double(fat) ?? 0,
                            mealType: mealType
                        )
                        withAnimation { store.add(item) }
                        dismiss()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
