const mongoose = require("mongoose");
require("dotenv").config();

const MenuItem = require("./models/MenuItem");

async function seedMenu() {
  await mongoose.connect(process.env.MONGO_URI);

  await MenuItem.deleteMany();

  await MenuItem.insertMany([
    {
      name: "Jollof Rice & Chicken",
      price: 3500,
      category: "foods",
      description: "Smoky party jollof with grilled chicken.",
      options: ["Regular", "Large"],
      image: "/images/jollof-rice-chicken.jpeg"
    },
    {
      name: "Fried Rice & Turkey",
      price: 4200,
      category: "foods",
      description: "Vegetable fried rice served with spicy turkey.",
      options: ["Regular", "Large"],
      image: "/images/fried-rice-turkey.jpeg"
    },
    {
      name: "Chicken Burger",
      price: 3000,
      category: "foods",
      description: "Crispy chicken, lettuce, tomato, and house sauce.",
      options: ["Single", "Double"],
      image: "/images/chicken-burger.jpeg"
    },
    {
      name: "Pepperoni Pizza",
      price: 5500,
      category: "foods",
      description: "Cheesy pizza with pepperoni and herbed crust.",
      options: ["Regular", "Family"],
      image: "/images/pepperoni-pizza.jpeg"
    },
    {
      name: "Grilled Chicken Pasta",
      price: 4800,
      category: "foods",
      description: "Creamy pasta finished with grilled chicken strips.",
      options: ["Regular", "Extra chicken"],
      image: "/images/grilled-chicken-pasta.jpeg"
    },
    {
      name: "Chapman",
      price: 1800,
      category: "drinks",
      description: "Classic chilled Chapman with citrus garnish.",
      options: ["Cup", "Bottle"],
      image: "/images/Chapman.jpeg"
    },
    {
      name: "Zobo",
      price: 1200,
      category: "drinks",
      description: "Hibiscus drink with ginger and pineapple notes.",
      options: ["Cup", "Bottle"],
      image: "/images/Zobo.jpeg"
    },
    {
      name: "Bottled Water",
      price: 500,
      category: "drinks",
      description: "Cold table water.",
      options: ["Small", "Large"],
      image: "/images/bottled-water.jpeg"
    },
    {
      name: "Soft Drink",
      price: 1000,
      category: "drinks",
      description: "Chilled soda selection.",
      options: ["Coke", "Fanta", "Sprite"],
      image: "/images/soft-drinks.jpeg"
    },
    {
      name: "Mango Smoothie",
      price: 2800,
      category: "smoothies",
      description: "Fresh mango blended with yogurt and ice.",
      options: ["Regular", "Large"],
      image: "/images/mango-smoothie.jpeg"
    },
    {
      name: "Berry Smoothie",
      price: 3200,
      category: "smoothies",
      description: "Mixed berries, banana, yogurt, and honey.",
      options: ["Regular", "Large"],
      image: "/images/berry-smoothie.jpeg"
    },
    {
      name: "Banana Peanut Smoothie",
      price: 3000,
      category: "smoothies",
      description: "Banana, peanut butter, milk, and a touch of honey.",
      options: ["Regular", "Large"],
      image: "/images/banana-peanut-smoothie.jpeg"
    },
    {
      name: "Classic Fruit Parfait",
      price: 3000,
      category: "parfait",
      description: "Greek yogurt, granola, banana, apple, and grapes.",
      options: ["Regular", "Large"],
      image: "/images/classic-fruit-parfait.jpeg"
    },
    {
      name: "Granola Yogurt Parfait",
      price: 3400,
      category: "parfait",
      description: "Layered yogurt, crunchy granola, honey, and berries.",
      options: ["Regular", "Large"],
      image: "/images/granola-yogurt-parfait.jpeg"
    }
  ]);

  console.log("Menu added successfully");
  process.exit();
}

seedMenu();
