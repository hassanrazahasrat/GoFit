-- South Asian (Desi) cuisine preference + food bank.
-- Run once in the Supabase SQL editor after library.sql. Safe to run again.
--
-- meal_library.region: 'intl' (default, all existing meals) or 'sa' (South Asian).
-- user_settings.meal_pref: 'all' | 'sa' | 'intl' — controls which meals a user sees.

alter table public.meal_library add column if not exists region text not null default 'intl';

create table if not exists public.user_settings (
  user_id uuid primary key,
  days text,
  train_goal text,
  session_minutes text,
  equipment text,
  level text,
  calorie_pace text,
  clinician_review text,
  vegetarian boolean not null default false,
  nutrition_day text,
  meal_choices jsonb,
  meal_pref text not null default 'all',
  updated_at timestamptz not null default now()
);

alter table public.user_settings add column if not exists meal_pref text not null default 'all';

-- South Asian staples. Values are per 100 g cooked unless piece_name/piece_grams is set.
insert into public.food_library (id, name, kcal, protein, carbs, fat, piece_name, piece_grams) values
('chth','Chicken thigh (skinless, cooked)',196,26,0,11,null,null),
('pan','Paneer',265,18,3,20,null,null),
('raj','Rajma / kidney beans (cooked)',127,8.7,22.8,0.5,null,null),
('bas','Basmati rice (cooked)',120,3.5,25.6,0.4,null,null),
('rot','Whole-wheat chapati / roti',140,5,24,2.5,'roti',45),
('prh','Whole-wheat paratha',260,7,35,10,'paratha',80),
('nan','Garlic naan',300,8,55,4,'naan',90),
('poh','Poha / flattened rice (cooked)',130,3,27,2,null,null),
('dal','Dalia / broken wheat (cooked)',76,2.8,15,0.4,null,null),
('pn','Roasted peanuts',550,25,14,46,null,null),
('cur','Curd / dahi',60,3.5,4,3.5,null,null),
('cor','Sweet corn (cooked)',96,3.4,21,1.5,null,null),
('smo','Samosa (fried)',300,6,30,17,'samosa',80),
('pak','Vegetable pakora (fried)',280,5,25,16,'pakora',50)
on conflict (id) do nothing;

-- Desi meals. protein_id/carb_id reference food_library ids; extras reference
-- the app's built-in extras (veg, oil, curd, gh, av, alm, bn).
insert into public.meal_library (id, slot, title, emoji, vegetarian, protein_id, carb_id, extras, tip, region) values
-- Breakfast
('sa-b1','b','Egg bhurji & roti','🍳',false,'egg','rot','{veg,gh}','Scramble the eggs with onion, tomato and spices, then serve with warm rotis.','sa'),
('sa-b2','b','Dalia, yogurt & banana','🥣',true,'gy','dal','{bn}','Cook the dalia until soft, then stir through the yogurt and top with banana.','sa'),
('sa-b3','b','Poha, chana & curd','🥘',true,'chp','poh','{curd}','Temper the poha with curry leaves, onion and green chili; serve with curd.','sa'),
('sa-b4','b','Anda paratha & dahi','🥞',false,'egg','prh','{curd}','Stuff or serve the paratha with a fried egg; dahi on the side.','sa'),
('sa-b5','b','Masala omelette & toast','🍳',false,'egg','brd','{veg}','Whisk onion, tomato, green chili and coriander into the eggs.','sa'),
('sa-b6','b','Aloo paratha & dahi','🥔',true,'cur','prh','{gh}','Less-oil version: shallow-fry the paratha and pair with dahi.','sa'),
-- Morning snack
('sa-s1','s1','Roasted chana & fruit','🫘',true,'chp','app','{curd}','Roast the chana until crisp and salt it lightly. Curd on the side.','sa'),
('sa-s2','s1','Dahi & banana','🍌',true,'gy','ban','{}','A simple desi yogurt bowl. Add roasted chana for crunch.','sa'),
('sa-s3','s1','Paneer cubes & apple','🧀',true,'pan','app','{}','Cube the paneer and pan-sear it with a little spice.','sa'),
('sa-s4','s1','Fruit chaat & dahi','🥗',true,'cur','app','{}','Toss seasonal fruit with curd, chaat masala and lemon.','sa'),
('sa-s5','s1','Samosa & dahi','🥟',true,'cur','smo','{}','Bake or air-fry the samosas; serve with dahi and tamarind chutney.','sa'),
('sa-s6','s1','Air-fried pakora & dahi','🌶️',true,'cur','pak','{}','Air-fry the vegetable pakora instead of deep-frying; dahi on the side.','sa'),
-- Lunch
('sa-l1','l','Chicken karahi & rice','🍛',false,'chth','bas','{veg,oil}','Simmer chicken thigh in tomato, ginger, garlic and garam masala; serve over basmati.','sa'),
('sa-l2','l','Rajma & rice & salad','🥘',true,'raj','bas','{veg,oil}','Mash a few rajma for thickness, finish with ginger and garam masala.','sa'),
('sa-l3','l','Palak paneer & roti','🥬',true,'pan','rot','{veg,oil}','Wilt the spinach, crumble in the paneer and finish with a little ghee.','sa'),
('sa-l4','l','Fish curry & rice','🐟',false,'cod','bas','{veg,oil}','Simmer the fish in onion-tomato masala with turmeric and chili.','sa'),
('sa-l5','l','Chicken biryani','🍛',false,'chth','bas','{veg,oil}','Layer basmati with marinated chicken, saffron and fried onions.','sa'),
('sa-l6','l','Chicken pulao','🍚',false,'chk','bas','{veg,oil}','One-pot rice with whole spices — lighter than biryani.','sa'),
('sa-l7','l','Chicken tikka & naan','🍢',false,'chk','nan','{veg,oil}','Char the tikka in a hot pan or grill; naan on the side.','sa'),
('sa-l8','l','Chicken qeema matar & rice','🥩',false,'chk','bas','{veg,oil}','Brown the qeema with onion, tomato, peas and potatoes.','sa'),
('sa-l9','l','Palak chicken & rice','🥬',false,'chk','bas','{veg,oil}','Wilt the spinach into the chicken curry; serve over rice.','sa'),
('sa-l10','l','Beef kofta curry & rice','🍲',false,'bef','bas','{veg,oil}','Simmer the koftas in onion-tomato masala until tender.','sa'),
('sa-l11','l','Beef seekh kebab & roti','🍢',false,'bef','rot','{veg,oil}','Lean beef + spices, grilled or baked; roti and salad.','sa'),
('sa-l12','l','Chicken malai boti & naan','🍗',false,'chk','nan','{veg,gh}','Creamy marinade — lighter version: use hung curd instead of cream.','sa'),
('sa-l13','l','Masala prawns & rice','🦐',false,'shr','bas','{veg,oil}','Sear the prawns in onion-tomato masala with coconut.','sa'),
('sa-l14','l','Fish tikka & naan','🐠',false,'cod','nan','{veg,oil}','Marinate the fish in yogurt and spices; char on a grill pan.','sa'),
('sa-l15','l','Grilled chicken, rice & salad','🍗',false,'chk','bas','{veg}','Skinless grilled breast with measured oil — the lighter option.','sa'),
-- Pre / post-workout snack
('sa-t1','s2','Banana & dahi','🍌',true,'gy','ban','{}','Fast carbs with protein — ideal after training.','sa'),
('sa-t2','s2','Dates & roasted chana','🌴',true,'chp','dat','{}','Quick energy plus plant protein. Keep portions moderate.','sa'),
('sa-t3','s2','Boiled egg & fruit','🥚',false,'egg','app','{}','Boil a batch ahead; pair with any seasonal fruit.','sa'),
('sa-t4','s2','Grilled chicken roll','🌯',false,'chk','wrp','{veg}','Grilled chicken, not fried; light sauce and extra salad.','sa'),
('sa-t5','s2','Chicken sandwich','🥪',false,'chk','brd','{veg}','Whole-grain bread, grilled chicken, light mayo.','sa'),
('sa-t6','s2','Chicken corn soup','🍲',false,'chk','cor','{veg}','Light broth with extra vegetables; skip the cream.','sa'),
-- Dinner
('sa-d1','d','Chicken curry, rice & salad','🍗',false,'chk','bas','{veg,oil}','Home-style chicken curry with onion, tomato and whole spices.','sa'),
('sa-d2','d','Daal chawal & kachumber','🍚',true,'len','bas','{veg,oil}','Temper the dal with garlic, cumin and dried red chili.','sa'),
('sa-d3','d','Chana curry & rice','🥘',true,'chp','bas','{veg,oil}','Simmer chickpeas in onion-tomato masala with amchur or lemon.','sa'),
('sa-d4','d','Egg bhurji, roti & salad','🍳',false,'egg','rot','{veg,gh}','Scramble the eggs with onion, tomato and green chili; serve with rotis.','sa'),
('sa-d5','d','Paneer curry & roti','🧀',true,'pan','rot','{veg,oil}','Brown the paneer cubes, then simmer in onion-tomato masala.','sa'),
('sa-d6','d','Nihari & roti','🍖',false,'bef','rot','{veg,oil}','Slow-cooked stew — skim the fat and serve with lemon.','sa'),
('sa-d7','d','Chicken reshmi kebab & rice','🍢',false,'chk','bas','{veg,oil}','Grilled kebab in a light yogurt marinade; rice on the side.','sa'),
('sa-d8','d','Chapli kebab & roti','🥩',false,'bef','rot','{veg,oil}','Baked or air-fried chapli kebab with roti and salad.','sa'),
('sa-d9','d','Chicken tikka, roti & salad','🍗',false,'chk','rot','{veg}','Less-oil option: tandoori-style tikka with chapati, not naan.','sa'),
('sa-d10','d','Chana masala & rice','🥘',true,'chp','bas','{veg,oil}','Smaller portion + chana — fiber and protein keep you full.','sa')
on conflict (id) do nothing;
