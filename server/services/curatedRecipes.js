/**
 * Get static curated recipes (hardcoded for reliability)
 */
function getStaticCuratedRecipes() {
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
      country: 'Italy',
      source_type: 'curated',
      is_approved: true
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
      country: 'Italy',
      source_type: 'curated',
      is_approved: true
    },
    // Mumbai, India: Vada Pav
    {
      name: 'Vada Pav',
      ingredients: 'For the vada: 4 large potatoes (boiled and mashed), 2 green chilies (finely chopped), 1 inch ginger (grated), 2 cloves garlic (minced), 1 tsp mustard seeds, 1 sprig curry leaves, 1/2 tsp turmeric powder, 1 tbsp vegetable oil, Salt to taste\nFor the batter: 1 cup gram flour (besan), 1/4 tsp turmeric powder, 1/2 tsp red chili powder, 1 pinch asafoetida (hing), Salt to taste, Water as needed\nFor serving: 8 pav buns, Green chutney, Tamarind chutney, Dry garlic chutney, Oil for deep frying',
      instructions: '1. Heat oil in a pan, add mustard seeds and let them splutter.\n2. Add curry leaves, green chilies, ginger, and garlic. Sauté for a minute.\n3. Add turmeric powder and mashed potatoes. Mix well and cook for 2-3 minutes.\n4. Season with salt and let the mixture cool. Shape into round patties.\n5. Prepare the batter by mixing gram flour with spices and enough water to make a thick coating batter.\n6. Heat oil for deep frying. Dip each potato patty in the batter and deep fry until golden brown.\n7. Slice pav buns horizontally without separating completely. Spread chutneys inside.\n8. Place the hot vada inside the pav, and serve immediately.',
      location_lat: 19.0760,
      location_lng: 72.8777,
      location_name: 'Mumbai, India',
      city: 'Mumbai',
      country: 'India',
      source_type: 'curated',
      is_approved: true
    },
    // Mumbai, India: Pav Bhaji
    {
      name: 'Pav Bhaji',
      ingredients: '4 medium potatoes (boiled and mashed), 1 cup cauliflower (boiled and chopped), 1/2 cup peas, 2 carrots (boiled and chopped), 2 large onions (finely chopped), 2 tomatoes (finely chopped), 2 bell peppers (finely chopped), 2-3 tbsp pav bhaji masala, 1 tsp red chili powder, 1 tsp turmeric powder, 2 tbsp butter, 1 lemon, Fresh coriander leaves, 8 pav buns, Salt to taste',
      instructions: '1. Heat butter in a large pan. Add half the chopped onions and sauté until golden brown.\n2. Add bell peppers and cook for 2 minutes. Add tomatoes, salt, turmeric powder, red chili powder, and pav bhaji masala.\n3. Cook until tomatoes are soft and oil begins to separate.\n4. Add all the boiled and mashed vegetables and mix well. Add a little water if needed.\n5. Mash the mixture with a potato masher while cooking, until you get a smooth consistency.\n6. Simmer for 15-20 minutes, adjusting salt and spices to taste.\n7. Heat a flat pan, slice the pav buns, and toast them with butter until crispy.\n8. Serve the bhaji hot, topped with remaining raw onions, coriander leaves, and a squeeze of lemon juice, with buttered pav on the side.',
      location_lat: 19.0760,
      location_lng: 72.8777,
      location_name: 'Mumbai, India',
      city: 'Mumbai',
      country: 'India',
      source_type: 'curated',
      is_approved: true
    }
  ];
}

module.exports = { getStaticCuratedRecipes }; 