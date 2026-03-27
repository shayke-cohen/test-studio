import Foundation
import Observation

@Observable
final class FoodStore {
    private static let storageKey = "food_items_v1"
    private var isLoading = false

    var items: [FoodItem] = [] {
        didSet { if !isLoading { save() } }
    }

    var todayItems: [FoodItem] {
        items.filter { Calendar.current.isDateInToday($0.date) }
    }

    var totalCaloriesToday: Int {
        todayItems.reduce(0) { $0 + $1.calories }
    }

    var totalProteinToday: Double {
        todayItems.reduce(0) { $0 + $1.protein }
    }

    var totalCarbsToday: Double {
        todayItems.reduce(0) { $0 + $1.carbs }
    }

    var totalFatToday: Double {
        todayItems.reduce(0) { $0 + $1.fat }
    }

    let dailyCalorieGoal = 2000

    var calorieProgress: Double {
        min(Double(totalCaloriesToday) / Double(dailyCalorieGoal), 1.0)
    }

    init() {
        load()
    }

    func add(_ item: FoodItem) {
        items.insert(item, at: 0)
    }

    func delete(at offsets: IndexSet, from filtered: [FoodItem]) {
        let idsToDelete = offsets.map { filtered[$0].id }
        items.removeAll { idsToDelete.contains($0.id) }
    }

    func items(for mealType: MealType) -> [FoodItem] {
        todayItems.filter { $0.mealType == mealType }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: Self.storageKey),
              let decoded = try? JSONDecoder().decode([FoodItem].self, from: data) else { return }
        isLoading = true
        items = decoded
        isLoading = false
    }
}
