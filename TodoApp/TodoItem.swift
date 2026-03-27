import Foundation

enum MealType: String, Codable, CaseIterable, Identifiable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case snack = "Snack"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .breakfast: return "sunrise.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.fill"
        case .snack: return "cup.and.saucer.fill"
        }
    }
}

struct FoodItem: Identifiable, Codable {
    let id: UUID
    var name: String
    var calories: Int
    var protein: Double
    var carbs: Double
    var fat: Double
    var mealType: MealType
    var date: Date

    init(name: String, calories: Int, protein: Double = 0, carbs: Double = 0, fat: Double = 0, mealType: MealType) {
        self.id = UUID()
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
        self.mealType = mealType
        self.date = Date()
    }
}
