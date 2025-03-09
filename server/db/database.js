const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a database connection
const dbPath = path.resolve(__dirname, 'eatWithLocals.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Initialize database schema
function initializeDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create recipes table with enhanced fields
    db.run(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        location_name TEXT,
        city TEXT,
        country TEXT,
        photo_url TEXT,
        source_type TEXT CHECK(source_type IN ('curated', 'api', 'user')) NOT NULL DEFAULT 'user',
        is_approved INTEGER DEFAULT 1,
        approval_date TIMESTAMP,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create favorites table
    db.run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipe_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (recipe_id) REFERENCES recipes (id),
        UNIQUE(user_id, recipe_id)
      )
    `);

    // Create ratings table
    db.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipe_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (recipe_id) REFERENCES recipes (id),
        UNIQUE(user_id, recipe_id)
      )
    `);

    // Create a table for API cache
    db.run(`
      CREATE TABLE IF NOT EXISTS recipe_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_name TEXT NOT NULL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        recipe_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location_name)
      )
    `);

    // Create a moderation queue table for user submissions
    db.run(`
      CREATE TABLE IF NOT EXISTS moderation_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
        reviewer_id INTEGER,
        review_notes TEXT,
        review_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes (id),
        FOREIGN KEY (reviewer_id) REFERENCES users (id)
      )
    `);

    // Add a default admin user and a regular user
    db.get('SELECT * FROM users WHERE id = 1', (err, row) => {
      if (err) {
        console.error(err.message);
      }
      if (!row) {
        db.run('INSERT INTO users (id, username, is_admin) VALUES (?, ?, ?)', [1, 'admin_user', 1]);
        db.run('INSERT INTO users (id, username, is_admin) VALUES (?, ?, ?)', [2, 'default_user', 0]);
      }
    });

    // Add curated recipes for the 13 specified cities
    db.get('SELECT COUNT(*) as count FROM recipes WHERE source_type = "curated"', (err, row) => {
      if (err) {
        console.error(err.message);
      }
      
      if (row && row.count === 0) {
        const curatedRecipes = getCuratedRecipes();
        
        const insertRecipe = db.prepare(
          `INSERT INTO recipes (
            name, ingredients, instructions, 
            location_lat, location_lng, location_name, 
            city, country, source_type, is_approved, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        curatedRecipes.forEach(recipe => {
          insertRecipe.run(
            recipe.name,
            recipe.ingredients,
            recipe.instructions,
            recipe.location_lat,
            recipe.location_lng,
            recipe.location_name,
            recipe.city,
            recipe.country,
            'curated',
            1,
            1
          );
        });

        insertRecipe.finalize();
        console.log('Curated recipes added.');
      }
    });
  });
}

// Function to provide curated recipes for the 13 specified cities
function getCuratedRecipes() {
  return [
    // Naples, Italy: Pizza Margherita
    {
      name: 'Pizza Margherita',
      ingredients: 'For the dough: 500g Italian 00 flour, 325ml water, 10g salt, 7g fresh yeast\nFor the topping: 400g San Marzano tomatoes, 250g fresh mozzarella (preferably buffalo), Fresh basil leaves, Extra virgin olive oil, Salt',
      instructions: '1. Make the dough by mixing flour, water, salt, and yeast. Knead for 10-15 minutes until elastic.\n2. Let the dough rise for 2 hours at room temperature.\n3. Divide into 4 balls and let rise another hour.\n4. Preheat oven to the highest temperature (ideally 450-500°F) with a pizza stone if available.\n5. Stretch each dough ball into a thin circle.\n6. Crush tomatoes by hand and spread on dough, leaving a border for the crust.\n7. Tear the mozzarella into pieces and distribute over the tomatoes.\n8. Bake for 4-5 minutes until the crust is charred in spots.\n9. Garnish with fresh basil and drizzle with olive oil before serving.',
      location_lat: 40.8358,
      location_lng: 14.2488,
      location_name: 'Naples, Italy',
      city: 'Naples',
      country: 'Italy'
    },
    {
      name: 'Pasta alla Genovese',
      ingredients: '1kg beef or veal shoulder, cut into large pieces, 2kg yellow onions, thinly sliced, 100g pancetta, diced, 1 large carrot, diced, 1 celery stalk, diced, 500g pasta (traditionally ziti, but rigatoni works well), 100ml white wine, 3 tbsp extra virgin olive oil, Salt and black pepper, Grated Parmesan cheese',
      instructions: '1. Heat olive oil in a large pot over medium heat. Add pancetta and cook until it renders its fat.\n2. Add the meat and brown on all sides.\n3. Add carrot and celery, cook for 5 minutes.\n4. Add all the onions, stir well, and reduce heat to low.\n5. Cover and cook for at least 2-3 hours, stirring occasionally, until onions break down into a creamy sauce and meat is tender.\n6. Add wine halfway through cooking.\n7. Cook pasta until al dente, reserve some pasta water.\n8. Remove meat from sauce (serve separately or save for another meal).\n9. Toss pasta with the onion sauce, adding pasta water if needed to loosen.\n10. Serve with grated Parmesan cheese.',
      location_lat: 40.8358,
      location_lng: 14.2488,
      location_name: 'Naples, Italy',
      city: 'Naples',
      country: 'Italy'
    },
    {
      name: 'Sfogliatella',
      ingredients: 'For the dough: 500g all-purpose flour, 200ml warm water, 100g lard or butter, 1 tsp salt\nFor the filling: 300g semolina, 500ml milk, 250g ricotta cheese, 150g sugar, 2 eggs, 100g candied citrus peel, diced, 1 tsp cinnamon, Zest of 1 lemon, Powdered sugar for dusting',
      instructions: '1. Mix flour, water, salt to form dough. Knead until smooth.\n2. Roll out very thin, spread with melted lard.\n3. Roll up like a jellyroll, chill for at least 2 hours.\n4. For filling: heat milk, add semolina gradually, stirring constantly until thick.\n5. Cool semolina mixture, then mix with ricotta, sugar, eggs, citrus peel, cinnamon, and lemon zest.\n6. Cut rolled dough into discs, stretch each piece into a thin shell shape.\n7. Fill each shell with filling, fold over to create a shell shape.\n8. Bake at 375°F for 25-30 minutes until golden and flaky.\n9. Dust with powdered sugar while still warm.',
      location_lat: 40.8358,
      location_lng: 14.2488,
      location_name: 'Naples, Italy',
      city: 'Naples',
      country: 'Italy'
    },
    
    // Milan, Italy: Risotto alla Milanese
    {
      name: 'Risotto alla Milanese',
      ingredients: '320g Carnaroli rice, 1 liter beef stock (kept warm), 1 small onion, finely chopped, 50g butter, 30g bone marrow (optional, but traditional), 100ml dry white wine, 0.5g saffron threads, 60g Parmesan cheese, grated, Salt to taste',
      instructions: '1. In a heavy-bottomed pot, melt half the butter with bone marrow (if using) and sauté the onion until translucent.\n2. Add rice and toast for 2-3 minutes, stirring constantly.\n3. Add white wine and cook until evaporated.\n4. Begin adding warm stock one ladle at a time, stirring frequently and waiting until liquid is absorbed before adding more.\n5. After 10 minutes, dissolve saffron in a small amount of stock and add to the rice.\n6. Continue cooking and adding stock until rice is al dente (usually 18-20 minutes total).\n7. Remove from heat, add remaining butter and Parmesan cheese.\n8. Cover and let rest for 2 minutes, then stir vigorously to create a creamy texture.\n9. Serve immediately, with additional Parmesan if desired.',
      location_lat: 45.4642,
      location_lng: 9.1900,
      location_name: 'Milan, Italy',
      city: 'Milan',
      country: 'Italy'
    },
    {
      name: 'Cotoletta alla Milanese',
      ingredients: '4 veal cutlets (from the rib, with bone if traditional), 2 eggs, beaten, 200g breadcrumbs, 100g clarified butter or high-quality butter, 1 lemon, cut into wedges, Salt to taste',
      instructions: '1. Pound the veal cutlets to about 1/4 inch thickness, keeping the bone intact if using bone-in cutlets.\n2. Season cutlets with salt on both sides.\n3. Dip each cutlet into beaten eggs, then coat completely with breadcrumbs, pressing gently to adhere.\n4. In a large skillet, heat clarified butter over medium heat.\n5. Add cutlets and cook for about 4 minutes on each side until golden brown and crispy.\n6. Transfer to paper towels to absorb excess butter.\n7. Serve immediately with lemon wedges.',
      location_lat: 45.4642,
      location_lng: 9.1900,
      location_name: 'Milan, Italy',
      city: 'Milan',
      country: 'Italy'
    },
    {
      name: 'Panettone',
      ingredients: '500g flour (preferably Manitoba flour), 100g sugar, 150g butter (at room temperature), 3 eggs, 100ml warm milk, 15g fresh yeast or 5g dry yeast, 100g raisins, 80g candied orange peel, 50g candied citron, 1 vanilla bean (seeds scraped), Zest of 1 orange, Zest of 1 lemon, Pinch of salt',
      instructions: '1. Soak raisins in warm water for 30 minutes, then drain and pat dry.\n2. Mix yeast with warm milk and a teaspoon of sugar, let stand until foamy.\n3. In a large bowl, combine flour, remaining sugar, salt, vanilla seeds, and citrus zests.\n4. Add yeast mixture, eggs, and butter. Knead until smooth and elastic (about 15 minutes).\n5. Fold in raisins and candied fruits.\n6. Place dough in a buttered panettone mold or tall cake pan.\n7. Let rise in a warm place until doubled in volume (about 3 hours).\n8. Preheat oven to 350°F.\n9. Score an X on top with a sharp knife, place a small piece of butter in the center.\n10. Bake for 40-50 minutes until golden and a skewer comes out clean.\n11. Cool completely upside down to maintain its dome shape.',
      location_lat: 45.4642,
      location_lng: 9.1900,
      location_name: 'Milan, Italy',
      city: 'Milan',
      country: 'Italy'
    },
    
    // Austin, USA: Breakfast Tacos
    {
      name: 'Austin Breakfast Tacos',
      ingredients: '8 fresh corn or flour tortillas, 8 eggs, scrambled, 250g breakfast sausage or bacon, cooked and crumbled, 2 medium potatoes, diced and fried until crispy, 1 cup shredded cheddar or Monterey Jack cheese, 1 avocado, sliced, 1/2 cup salsa (preferably homemade), 1/4 cup chopped cilantro, 1 lime, cut into wedges, Hot sauce to taste',
      instructions: '1. Warm tortillas in a dry skillet or microwave until soft and pliable.\n2. For each taco, layer scrambled eggs, meat, potatoes, and cheese on a tortilla.\n3. Top with avocado slices, salsa, and cilantro.\n4. Serve with lime wedges and hot sauce on the side.\n5. For authentic Austin-style, wrap in foil to keep warm and soft.',
      location_lat: 30.2672,
      location_lng: -97.7431,
      location_name: 'Austin, Texas, USA',
      city: 'Austin',
      country: 'USA'
    },
    
    // London, UK: Fish and Chips
    {
      name: 'Traditional Fish and Chips',
      ingredients: 'For the fish: 4 fillets of cod or haddock (about 200g each), 200g all-purpose flour, 1 tsp baking powder, 300ml cold beer, 1/2 tsp salt, Vegetable oil for deep frying\nFor the chips: 1kg potatoes (Maris Piper or Russet), cut into thick chips, Salt\nTo serve: Malt vinegar, Lemon wedges, Tartar sauce',
      instructions: '1. For the chips: Peel potatoes and cut into 1cm thick chips. Rinse under cold water and pat dry.\n2. Blanch chips in oil at 130°C (265°F) for 5-6 minutes until soft but not colored. Drain and cool.\n3. For the batter: Mix flour, baking powder, and salt. Gradually whisk in cold beer until smooth.\n4. Heat oil to 180°C (350°F).\n5. Pat fish dry, season with salt, then dip in batter, allowing excess to drip off.\n6. Fry fish for 6-7 minutes until golden and crispy. Drain on paper towels.\n7. Increase oil temperature to 190°C (375°F) and fry chips again until golden and crispy (about 4-5 minutes).\n8. Serve immediately with a sprinkle of salt, malt vinegar, lemon wedges, and tartar sauce.',
      location_lat: 51.5074,
      location_lng: -0.1278,
      location_name: 'London, United Kingdom',
      city: 'London',
      country: 'United Kingdom'
    },
    
    // Add more curated recipes for other cities
    // Marrakesh, Morocco: Tagine
    {
      name: 'Chicken Tagine with Preserved Lemons',
      ingredients: '1 whole chicken, cut into pieces, 2 preserved lemons, quartered and seeds removed, 1 large onion, sliced, 3 cloves garlic, minced, 1 tbsp ginger, grated, 1 tsp ground cumin, 1 tsp ground coriander, 1 tsp paprika, 1/2 tsp turmeric, 1/4 tsp saffron threads, soaked in hot water, 1 cinnamon stick, 1 cup green olives, 1/4 cup fresh cilantro, chopped, 1/4 cup fresh parsley, chopped, 3 tbsp olive oil, 1 cup chicken broth, Salt and pepper to taste',
      instructions: '1. In a tagine or heavy-bottomed pot, heat olive oil over medium heat.\n2. Add onions and cook until translucent.\n3. Add garlic, ginger, and all spices, stir for 1 minute until fragrant.\n4. Add chicken pieces and brown on all sides.\n5. Pour in chicken broth, add cinnamon stick, and bring to a simmer.\n6. Cover and cook on low heat for 45 minutes.\n7. Add preserved lemons and olives, continue cooking for 15 minutes.\n8. Garnish with fresh cilantro and parsley before serving.\n9. Traditionally served with couscous or crusty bread.',
      location_lat: 31.6295,
      location_lng: -7.9811,
      location_name: 'Marrakesh, Morocco',
      city: 'Marrakesh',
      country: 'Morocco'
    },
    
    // Georgetown, Malaysia: Char Koay Teow
    {
      name: 'Char Koay Teow',
      ingredients: '400g fresh flat rice noodles, 200g shrimp, peeled and deveined, 100g Chinese lap cheong sausage, sliced, 2 eggs, lightly beaten, 200g bean sprouts, 100g chives, cut into 5cm lengths, 3 cloves garlic, minced, 3 tbsp soy sauce, 1 tbsp dark soy sauce, 2 tbsp chili paste (or to taste), 2 tbsp cooking oil, Dash of white pepper',
      instructions: '1. Heat a wok until smoking hot, then add oil.\n2. Add garlic and stir-fry until fragrant.\n3. Add sausage and shrimp, stir-fry until shrimp turns pink.\n4. Push everything to one side, add beaten eggs and scramble slightly.\n5. Add noodles, soy sauces, and chili paste, stir-fry for 2 minutes.\n6. Add bean sprouts and chives, toss for another minute.\n7. Season with white pepper and serve immediately.',
      location_lat: 5.4141,
      location_lng: 100.3296,
      location_name: 'Georgetown, Penang, Malaysia',
      city: 'Georgetown',
      country: 'Malaysia'
    },
    
    // Florence, Italy: Bistecca alla Fiorentina
    {
      name: 'Bistecca alla Fiorentina',
      ingredients: '1 T-bone or Porterhouse steak (at least 1kg and 5-6cm thick), 2 tbsp olive oil, 2-3 sprigs of rosemary, 3-4 cloves garlic, crushed, Coarse sea salt, Freshly ground black pepper, Lemon wedges for serving',
      instructions: '1. Bring the steak to room temperature (about 1 hour outside the refrigerator).\n2. Prepare a hot grill or heat a cast-iron pan until very hot.\n3. Brush the steak lightly with olive oil.\n4. Place steak on the grill or in the pan and sear for 3-5 minutes on each side.\n5. Stand the steak on its side (the fatty edge) for a minute to render the fat.\n6. For authentic Florentine style (very rare to rare), cook for a total of about 7-8 minutes for a 5cm thick steak.\n7. Remove from heat, place on a warm plate with rosemary and garlic.\n8. Season generously with coarse salt and freshly ground pepper.\n9. Let rest for 5-10 minutes, then slice and serve with lemon wedges.',
      location_lat: 43.7696,
      location_lng: 11.2558,
      location_name: 'Florence, Italy',
      city: 'Florence',
      country: 'Italy'
    },
    
    // New Orleans, USA: Gumbo
    {
      name: 'New Orleans Seafood Gumbo',
      ingredients: '1 cup vegetable oil, 1 cup all-purpose flour, 2 large onions, diced, 2 bell peppers, diced, 4 celery ribs, diced, 8 cloves garlic, minced, 2 liters seafood or chicken stock, 500g okra, sliced, 400g andouille sausage, sliced, 500g shrimp, peeled and deveined, 500g crab meat, 2 bay leaves, 2 tbsp Creole seasoning, 1 tbsp filé powder (optional), 4 green onions, chopped, 1/4 cup fresh parsley, chopped, Hot cooked rice for serving, Hot sauce to taste',
      instructions: '1. Make a dark roux by heating oil in a large heavy pot, adding flour and stirring constantly until the color of chocolate (about 30-45 minutes).\n2. Add onions, bell peppers, and celery to the roux, cook until softened.\n3. Add garlic and cook for another minute.\n4. Slowly add stock while stirring constantly.\n5. Add bay leaves, Creole seasoning, and andouille sausage.\n6. Bring to a boil, then reduce heat and simmer for 1 hour.\n7. Add okra and simmer for 30 minutes more.\n8. Add shrimp and crab meat, cook until shrimp are pink (about 5-7 minutes).\n9. Remove from heat, stir in filé powder (if using), green onions, and parsley.\n10. Serve over rice with hot sauce on the side.',
      location_lat: 29.9511,
      location_lng: -90.0715,
      location_name: 'New Orleans, Louisiana, USA',
      city: 'New Orleans',
      country: 'USA'
    },
    
    // Tokyo, Japan: Sushi
    {
      name: 'Nigiri Sushi',
      ingredients: '3 cups Japanese short-grain rice, 3 1/4 cups water, 1/2 cup rice vinegar, 2 tbsp sugar, 1 tsp salt, Assorted fresh fish (tuna, salmon, yellowtail, etc.), Wasabi paste, Soy sauce for serving, Pickled ginger for serving',
      instructions: '1. Rinse rice until water runs clear, then cook with water in a rice cooker or pot.\n2. Mix rice vinegar, sugar, and salt in a small saucepan and heat until sugar dissolves to make sushi vinegar.\n3. Transfer cooked rice to a large wooden bowl, sprinkle with sushi vinegar, and fold gently with a cutting motion.\n4. Fan the rice while mixing to cool it quickly and create a glossy texture.\n5. Slice fish into thin rectangular pieces about 1cm thick.\n6. Wet hands with water to prevent sticking, then take a small handful of rice (about 20g).\n7. Shape rice into an oval in your palm.\n8. Place a small dab of wasabi on top of the rice.\n9. Place fish on top of the wasabi, pressing gently.\n10. Serve immediately with soy sauce and pickled ginger.',
      location_lat: 35.6762,
      location_lng: 139.6503,
      location_name: 'Tokyo, Japan',
      city: 'Tokyo',
      country: 'Japan'
    },
    
    // Lyon, France: Coq au Vin
    {
      name: 'Coq au Vin',
      ingredients: '1 whole chicken (about 2kg), cut into 8 pieces, 200g bacon or lardons, diced, 24 pearl onions, peeled, 300g mushrooms, quartered, 3 carrots, sliced, 2 cloves garlic, minced, 1 bottle red Burgundy wine, 2 tbsp cognac or brandy, 2 tbsp tomato paste, 1 tbsp flour, 3 sprigs thyme, 2 bay leaves, 3 tbsp butter, 2 tbsp olive oil, Fresh parsley, chopped, for garnish, Salt and pepper to taste',
      instructions: '1. Season chicken with salt and pepper.\n2. In a large Dutch oven, cook bacon until crispy, then remove and set aside.\n3. In the same pot, brown chicken pieces in batches, then set aside.\n4. Add pearl onions and cook until browned, then set aside.\n5. Add mushrooms and cook until golden, then set aside.\n6. Add carrots and garlic to the pot, cook for 2 minutes.\n7. Return chicken to the pot, add cognac, and carefully ignite to burn off alcohol.\n8. Add wine, tomato paste, herbs, and bring to a simmer.\n9. Cover and cook on low heat for about 1 hour until chicken is tender.\n10. In a small bowl, mix butter and flour to form a paste (beurre manié).\n11. Remove chicken, whisk beurre manié into the sauce to thicken.\n12. Return chicken, bacon, onions, and mushrooms to the pot, simmer for 10 more minutes.\n13. Garnish with fresh parsley and serve with crusty bread or potatoes.',
      location_lat: 45.7640,
      location_lng: 4.8357,
      location_name: 'Lyon, France',
      city: 'Lyon',
      country: 'France'
    },
    
    // Lima, Peru: Ceviche
    {
      name: 'Peruvian Ceviche',
      ingredients: '1kg fresh white fish (sea bass or flounder), cut into 2cm cubes, Juice of 12-15 limes (about 1 cup), 1 red onion, thinly sliced, 2-3 aji limo or habanero chilies, seeded and minced, 2 cloves garlic, minced, 1 tbsp fresh ginger, grated, 1/4 cup fresh cilantro, chopped, 1 sweet potato, boiled and sliced, 1 ear of corn, boiled and kernels removed, Salt to taste',
      instructions: '1. In a large glass bowl, combine fish, lime juice, garlic, and ginger, ensuring fish is fully submerged in lime juice.\n2. Let fish "cook" in the acidity of the lime juice for 15-20 minutes, until it turns opaque and firm.\n3. Add red onion, chilies, and half the cilantro, mix gently.\n4. Season with salt to taste.\n5. Serve immediately, garnished with remaining cilantro.\n6. Traditionally accompanied by slices of boiled sweet potato and corn kernels.',
      location_lat: -12.0464,
      location_lng: -77.0428,
      location_name: 'Lima, Peru',
      city: 'Lima',
      country: 'Peru'
    },
    
    // Cape Town, South Africa: Bobotie
    {
      name: 'Bobotie',
      ingredients: '1kg ground beef or lamb, 2 onions, finely chopped, 2 slices bread, 1/2 cup milk, 2 eggs, 2 tbsp curry powder, 1 tsp turmeric, 1 tsp ground coriander, 1 tsp ground cumin, 1/2 tsp ground ginger, 3 cloves garlic, minced, 2 tbsp chutney (preferably apricot), 3 tbsp sultanas or golden raisins, 2 tbsp sliced almonds, 1 tbsp apricot jam, 2 bay leaves, 1 lemon, zested and juiced, 2 tbsp vegetable oil, Salt and pepper to taste',
      instructions: '1. Preheat oven to 350°F (180°C).\n2. Soak bread in half the milk, then mash with a fork.\n3. Heat oil in a large pan, sauté onions until soft.\n4. Add garlic and spices, cook for another minute.\n5. Add ground meat, cook until browned.\n6. Stir in soaked bread, chutney, jam, raisins, almonds, lemon zest and juice.\n7. Season with salt and pepper.\n8. Transfer mixture to a baking dish, smooth the top.\n9. Beat remaining milk with eggs, pour over meat mixture.\n10. Place bay leaves on top, then bake for 35-40 minutes until custard topping is set and golden.\n11. Traditionally served with yellow rice (rice cooked with turmeric) and chutney.',
      location_lat: -33.9249,
      location_lng: 18.4241,
      location_name: 'Cape Town, South Africa',
      city: 'Cape Town',
      country: 'South Africa'
    },
    
    // Sydney, Australia: Meat Pie
    {
      name: 'Aussie Meat Pie',
      ingredients: 'For the filling: 500g ground beef, 1 onion, finely chopped, 2 cloves garlic, minced, 2 tbsp tomato paste, 1 tbsp Worcestershire sauce, 1 cup beef stock, 1 tbsp corn flour mixed with 2 tbsp water, 1 tsp Vegemite (optional, for authentic flavor), Salt and pepper to taste\nFor the pastry: 2 sheets puff pastry, 2 sheets shortcrust pastry, 1 egg, beaten (for egg wash)',
      instructions: '1. Heat oil in a pan, sauté onion until soft, add garlic and cook for 1 minute.\n2. Add ground beef and cook until browned.\n3. Stir in tomato paste, Worcestershire sauce, Vegemite (if using), and beef stock.\n4. Simmer for 15 minutes, then add corn flour mixture to thicken.\n5. Season with salt and pepper, then let cool completely.\n6. Preheat oven to 400°F (200°C).\n7. Line 4 individual pie tins with shortcrust pastry.\n8. Fill with meat mixture.\n9. Top each pie with puff pastry, trim edges, and press to seal.\n10. Brush tops with beaten egg, make a small slit in the center of each pie.\n11. Bake for 25-30 minutes until pastry is golden.\n12. Traditionally served with tomato sauce (ketchup).',
      location_lat: -33.8688,
      location_lng: 151.2093,
      location_name: 'Sydney, Australia',
      city: 'Sydney',
      country: 'Australia'
    }
  ];
}

// Export database for use in other modules
module.exports = db; 