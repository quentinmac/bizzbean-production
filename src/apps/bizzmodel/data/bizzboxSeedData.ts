/**
 * BizzBox Seed Directory
 * Sourced from public/bizzbox.xlsx (cleaned & aligned across all 11 categories and 38 BizzModel model-sets).
 * Users can add, edit, or delete entries live via the BizzBox tab; edits persist in localStorage + Firestore.
 */

export interface BizzBoxEntry {
  id: string;
  businessType: string;
  category: string;
  modelSet: string;
  notes?: string;
}

export interface BizzBoxModelMeta {
  modelNumber: number;
  category: string;
  name: string;
  modelSetId?: string;
  description: string;
}

export const BIZZBOX_CATEGORIES: string[] = [
  "trading",
  "manufacturing",
  "services",
  "mobility",
  "hospitality",
  "education",
  "labour broking",
  "property",
  "asset rentals",
  "agriculture",
  "motor"
];

export const BIZZBOX_MODEL_CATALOG: BizzBoxModelMeta[] = [
  {
    "modelNumber": 1,
    "category": "trading",
    "name": "unit sales",
    "modelSetId": "unit-sales",
    "description": "This model considers the dynamics of a trading business where the sale of piece items can be projected. The model allows for the categorization of sales into specific product lines; the projected piece sales of each product line; the projected selling price of each piece within a product line; the projected cost price or margins earned of each piece within a product line."
  },
  {
    "modelNumber": 2,
    "category": "trading",
    "name": "value sales",
    "modelSetId": "value-sales",
    "description": "This model considers the dynamics of a trading business where the sale of piece items cannot be projected. The model allows for the categorization of sales into specific product lines; the projected value sales of each product line; the projected average selling price of each product line; the projected margins earned for each product line."
  },
  {
    "modelNumber": 3,
    "category": "trading",
    "name": "commission",
    "modelSetId": "commission",
    "description": "This model considers the dynamics of a commission earning business where the sale of piece items cannot be projected. The model allows for the categorization of sales into specific product lines; the projected value sales of each product line; the projected commission rate earned for each product line."
  },
  {
    "modelNumber": 4,
    "category": "trading",
    "name": "revenue share",
    "modelSetId": "revenue-share",
    "description": "Models a trading or placement arrangement where revenue is calculated as an agreed percentage share of gross partner or terminal turnover."
  },
  {
    "modelNumber": 5,
    "category": "manufacturing",
    "name": "batch lots",
    "modelSetId": "batch-lots",
    "description": "This business model considers the production dynamics of items produced in specific batch sizes within a defined time. Production output is determined by the number of production cycles per production day. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items produced. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 6,
    "category": "manufacturing",
    "name": "continuous production",
    "modelSetId": "continuous-production",
    "description": "This business model considers the production dynamics of items produced within a defined time without the constraint of batch sizes. Production output is determined by the number of items produced per production day. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items produced. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 7,
    "category": "manufacturing",
    "name": "fabrication",
    "modelSetId": "fabrication",
    "description": "This business model considers the production dynamics of items produced in specific batch sizes with time and productive labour resources defined. Production output is determined by the number of production hours. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items produced. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 8,
    "category": "services",
    "name": "time units",
    "modelSetId": "time-units",
    "description": "This model considers the dynamics of a service business where revenue is determined by the sale of time units. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; variable employees per product line. Revenue is determined by pricing the time units available. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 9,
    "category": "services",
    "name": "installation services",
    "modelSetId": "installation-services",
    "description": "This model considers the dynamics of a service business where revenue is determined by the sale of installed products. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; variable service installation time per product line; and variable installation teams. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the installation process. Revenue is determined by pricing the quantity of the items installed. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs. This business model considers the production dynamics of items produced in specific batch sizes with time and productive labour resources defined. Production output is determined by the number of production hours."
  },
  {
    "modelNumber": 10,
    "category": "services",
    "name": "measured units",
    "modelSetId": "measured-units",
    "description": "This model considers the dynamics of a service business where revenue is determined by the sale of a range of timed services driven by customer demand. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; and variable units associated with the service. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final products. It also allows for the costing of certain variable items, which may be incurred during the service process. Revenue is determined by pricing labour and components used the production of a service. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 11,
    "category": "services",
    "name": "printing",
    "modelSetId": "printing",
    "description": "This business model considers the production dynamics of a printing services business where output is determined in specific batch sizes within a defined time. Production output is determined by the number of production cycles per production day. The model provides a Bill of Material system in order to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items produced. A Pricing Assistant is available to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 12,
    "category": "services",
    "name": "laundry",
    "modelSetId": "laundry",
    "description": "This business model considers the production dynamics of a laundromat services business where output is determined in specific batch sizes within a defined time. Production output is determined by the number of production cycles per production day. The model provides a Bill of Material system to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items laundered. A Unit Price Recovery Report presents item trading contributions, which can be used to set selling prices to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 13,
    "category": "services",
    "name": "drycleaner",
    "modelSetId": "drycleaning",
    "description": "This business model considers the production dynamics of a dry-cleaning services business where output is determined in specific batch sizes within a defined time. The model provides a Bill of Material system to cost the materials or components used in the makeup of the final product. It also allows for the costing of certain variable items, which may be incurred during the production process. Revenue is determined by pricing the quantity of the items dry cleaned. A Unit Price Recovery Report presents item trading contributions, which can be used to set selling prices to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 14,
    "category": "services",
    "name": "time slots",
    "modelSetId": "time-slots",
    "description": "This model considers the dynamics of a service business where revenue is determined by the number of customers served in a specific time slot provided on a daily, weekly or monthly basis. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; variable teams per shift; number of timed slots; variable time slot lengths; and the customers served in a specific time slot. Revenue is determined by pricing the time units sold. A Unit Price Recovery Report presents item trading contributions, which can be used to set selling prices to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 15,
    "category": "services",
    "name": "time slots rentals",
    "modelSetId": "time-slot-rentals",
    "description": "This model considers the dynamics of a service business where revenue is determined by the number of customers served in a specific number of rental units on a daily, weekly or monthly basis. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; rental time slots; rental day per month; and rental stations available. Revenue is determined by pricing the time units sold. A Unit Price Recovery Report presents item trading contributions, which can be used to set selling prices to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 16,
    "category": "services",
    "name": "guarding services",
    "modelSetId": "guarding",
    "description": "This model considers the dynamics of a security guarding service business where revenue is determined by the number of customers served in a specific time slots provided on a daily, weekly or monthly basis. The model allows for the categorization of sales into specific product lines; variable shift hours: variable shifts per day; variable teams per shift; number of timed slots; variable time slot lengths; and the customers served in a specific time slot. Revenue is determined by pricing the time units sold. A Unit Price Recovery Report presents item trading contributions, which can be used to set selling prices in order to recover projected fixed and variable costs."
  },
  {
    "modelNumber": 17,
    "category": "mobility",
    "name": "taxi operator",
    "modelSetId": "taxi-operator",
    "description": "Models passenger transport operations based on fleet size, daily trips, passenger load factors, fare tariffs, and operating fuel/maintenance costs."
  },
  {
    "modelNumber": 18,
    "category": "mobility",
    "name": "tractor operator",
    "modelSetId": "tractor-operator",
    "description": "Models agricultural and earthmoving contracting based on billable machine hours, seasonal utilization, operator shifts, and fuel/maintenance costs."
  },
  {
    "modelNumber": 19,
    "category": "mobility",
    "name": "driving school",
    "modelSetId": "driving-school",
    "description": "Models driver training revenue based on scheduled lesson slots, instructor capacity, vehicle fleet utilization, and test-package pricing."
  },
  {
    "modelNumber": 20,
    "category": "mobility",
    "name": "truck operator",
    "modelSetId": "truck-operator",
    "description": "Models freight and haulage operations based on fleet capacity, route kilometers or loads per day, tariff per load/km, and variable running costs."
  },
  {
    "modelNumber": 21,
    "category": "hospitality",
    "name": "family restaurant",
    "modelSetId": "family-restaurant",
    "description": "Models sit-down, cafe, or quick-service food operations using table seating capacity, meal turns, menu food-cost BOM, and average spend per guest."
  },
  {
    "modelNumber": 22,
    "category": "hospitality",
    "name": "guest house",
    "modelSetId": "guest-house",
    "description": "Models accommodation hospitality based on room inventory, seasonal occupancy rates, average daily room rate (ADR), and per-stay housekeeping/breakfast costs."
  },
  {
    "modelNumber": 23,
    "category": "hospitality",
    "name": "events organiser",
    "modelSetId": "events-organizer",
    "description": "Models project-based event, conference, and tour management using booked events per month, delegate/guest volumes, and pass-through venue/supplier margins."
  },
  {
    "modelNumber": 24,
    "category": "education",
    "name": "education",
    "modelSetId": "education",
    "description": "Models schools, crèches, training centres, and short courses based on classroom capacity, enrolled learners or delegates, fee cycles, and facilitator costs."
  },
  {
    "modelNumber": 25,
    "category": "labour broking",
    "name": "labour broking",
    "modelSetId": "labour-broking",
    "description": "Models staffing and placement agencies based on placed headcount, billable hours/shifts per contractor, client charge-out rate, and contractor wage margin."
  },
  {
    "modelNumber": 26,
    "category": "property",
    "name": "property development",
    "modelSetId": "property-development",
    "description": "Models real estate development, warehousing, and institutional facilities based on developable units/m², phased sales or rental yields, and project capex."
  },
  {
    "modelNumber": 27,
    "category": "asset rentals",
    "name": "Vehicle Rental",
    "modelSetId": "vehicle-rental",
    "description": "Models short- and long-term vehicle hire based on fleet size, daily utilization rate, rental tariff tiers, and mileage/maintenance recovery."
  },
  {
    "modelNumber": 28,
    "category": "asset rentals",
    "name": "equipment rental",
    "modelSetId": "equipment-rental",
    "description": "Models plant, tool, and event equipment hire based on asset inventory, billable hire days per month, daily/weekly hire rates, and refurbishment costs."
  },
  {
    "modelNumber": 29,
    "category": "agriculture",
    "name": "Crop Farming",
    "modelSetId": "crop",
    "description": "Models arable crop production based on planted hectares, seasonal yield per hectare, commodity selling prices, and per-hectare seed/fertilizer/harvest inputs."
  },
  {
    "modelNumber": 30,
    "category": "agriculture",
    "name": "Live-Stock Farming",
    "modelSetId": "animal-breeding",
    "description": "Models livestock and animal breeding operations based on herd/flock dynamics, growth cycles, yield per head, and feed/veterinary variable costs."
  },
  {
    "modelNumber": 31,
    "category": "motor",
    "name": "Motor Dealership (consolidated)",
    "description": "Consolidated multi-department motor dealership combining New Vehicles, Used Vehicles, F&I, Service Workshop, Parts Trading, and Panelshop."
  },
  {
    "modelNumber": 32,
    "category": "motor",
    "name": "New Vehicle",
    "description": "Models new vehicle, truck, caravan, and plant sales based on monthly unit deliveries, OEM retail margin, and floorplan/pre-delivery costs."
  },
  {
    "modelNumber": 33,
    "category": "motor",
    "name": "Used Vehicle Trading",
    "description": "Models pre-owned vehicle and equipment trading based on stock turn, unit reconditioning costs, and gross margin per vehicle sold."
  },
  {
    "modelNumber": 34,
    "category": "motor",
    "name": "F&I",
    "description": "Models dealership Finance & Insurance origination revenue driven by vehicle sales penetration, finance commissions, and value-added product margins."
  },
  {
    "modelNumber": 35,
    "category": "motor",
    "name": "Service Workshop",
    "description": "Models mechanical and technical service bays based on technician count, billable labour hours per bay, labour recovery rate, and workshop consumables."
  },
  {
    "modelNumber": 36,
    "category": "motor",
    "name": "Parts Trading",
    "description": "Models motor spares and aftermarket parts counters based on SKU turnover, workshop internal issues, trade vs. retail margins, and stock holding days."
  },
  {
    "modelNumber": 37,
    "category": "motor",
    "name": "Panelshop",
    "description": "Models automotive body repair and spray-painting facilities based on repair jobs, insurer-approved labour/paint rates, and replacement part markups."
  },
  {
    "modelNumber": 38,
    "category": "motor",
    "name": "Fuel Station",
    "description": "Models forecourt fuel retailing and convenience store operations based on monthly fuel litres, regulated margin per litre, and forecourt shop sales."
  }
];

// Compact tuple seed [businessType, category, modelSet] expanded into stable BizzBoxEntry rows
const RAW_BIZZBOX_SEED: ReadonlyArray<readonly [string, string, string]> = [["Agricultural Pumps", "trading", "unit sales"], ["Animal Feed and Grain", "trading", "unit sales"], ["Bicycles", "trading", "unit sales"], ["Blinds", "trading", "unit sales"], ["Bottle Store", "trading", "unit sales"], ["Carpets and Carpeting", "trading", "unit sales"], ["Coffee Machines", "trading", "unit sales"], ["Concrete Roof Tiles", "trading", "unit sales"], ["Doors", "trading", "unit sales"], ["Electric Motors", "trading", "unit sales"], ["Electric Pumps", "trading", "unit sales"], ["Fencing", "trading", "unit sales"], ["Iron, Metals and Steel", "trading", "unit sales"], ["Linen", "trading", "unit sales"], ["Mattress", "trading", "unit sales"], ["Mineral Water", "trading", "unit sales"], ["Motor Batteries", "trading", "unit sales"], ["Motors", "trading", "unit sales"], ["Musical Instruments", "trading", "unit sales"], ["Poultry", "trading", "unit sales"], ["Printing Inks", "trading", "unit sales"], ["Pumps", "trading", "unit sales"], ["Radiators", "trading", "unit sales"], ["Recycling", "trading", "unit sales"], ["Scrap Metal", "trading", "unit sales"], ["Sewing Machines", "trading", "unit sales"], ["Shelving", "trading", "unit sales"], ["Snacks", "trading", "unit sales"], ["Soft Drinks", "trading", "unit sales"], ["Speciality Foods", "trading", "unit sales"], ["Swimming Pools, Saunas and Spas", "trading", "unit sales"], ["Tea and Coffee", "trading", "unit sales"], ["Timber", "trading", "unit sales"], ["Towels and Linen", "trading", "unit sales"], ["Trailers", "trading", "unit sales"], ["Trailers and Truck Bodies", "trading", "unit sales"], ["Trollies", "trading", "unit sales"], ["Valves, Tubes and Fittings", "trading", "unit sales"], ["Water Tanks", "trading", "unit sales"], ["Wooden Doors and Windows", "trading", "unit sales"], ["Adhesives", "trading", "value sales"], ["Agricultural Supplies", "trading", "value sales"], ["Antiques", "trading", "value sales"], ["Appliance Parts", "trading", "value sales"], ["Appliances", "trading", "value sales"], ["Arms and Ammunition", "trading", "value sales"], ["Artificial Flowers", "trading", "value sales"], ["Arts and Crafts", "trading", "value sales"], ["Automotive Parts", "trading", "value sales"], ["Axels, Differentials and Gearboxes", "trading", "value sales"], ["Bathroom Accessories", "trading", "value sales"], ["Batteries", "trading", "value sales"], ["Bearings and Seals", "trading", "value sales"], ["Beauty and Health Products", "trading", "value sales"], ["Belting and Conveyors", "trading", "value sales"], ["Books", "trading", "value sales"], ["Boutique and Bridal Gowns", "trading", "value sales"], ["Brushware", "trading", "value sales"], ["Butchery", "trading", "value sales"], ["Cables", "trading", "value sales"], ["Cartridges and Toners", "trading", "value sales"], ["Castors, Ladders and Trolleys", "trading", "value sales"], ["Catering Equipment", "trading", "value sales"], ["Chain and Rope", "trading", "value sales"], ["Chainsaws and Brushcutters", "trading", "value sales"], ["Chemicals and Detergents", "trading", "value sales"], ["Cigarettes and Tobacco", "trading", "value sales"], ["Clothing", "trading", "value sales"], ["Clothing and Clothing Assessories", "trading", "value sales"], ["Coatings and Paints", "trading", "value sales"], ["Consumables", "trading", "value sales"], ["Corporate Clothing", "trading", "value sales"], ["Cosmetics", "trading", "value sales"], ["Creams and Fine Foods", "trading", "value sales"], ["Crockery and Cutlery", "trading", "value sales"], ["Curtains and Accessories", "trading", "value sales"], ["Dairy Products", "trading", "value sales"], ["Delicatessens", "trading", "value sales"], ["Direct Marketing", "trading", "value sales"], ["Dried Fruit and Nuts, Spices and Herbs", "trading", "value sales"], ["Education Products", "trading", "value sales"], ["Electrical Accessories", "trading", "value sales"], ["Electrical Goods", "trading", "value sales"], ["Electronic Test Equipment", "trading", "value sales"], ["Engine Filters", "trading", "value sales"], ["Engineering Supplies", "trading", "value sales"], ["Engines and Generators", "trading", "value sales"], ["Fabrics", "trading", "value sales"], ["Fasteners for Clothing", "trading", "value sales"], ["Fertilizers", "trading", "value sales"], ["Fibreglass", "trading", "value sales"], ["Filters", "trading", "value sales"], ["Fish", "trading", "value sales"], ["Fishing Equipment", "trading", "value sales"], ["Florist", "trading", "value sales"], ["Foam and Mattresses", "trading", "value sales"], ["Food and Beverage", "trading", "value sales"], ["Food Processing Equipment", "trading", "value sales"], ["Footwear", "trading", "value sales"], ["Fresh and Frozen Foods", "trading", "value sales"], ["Furniture", "trading", "value sales"], ["Furniture and Fitments", "trading", "value sales"], ["Garage Equipment", "trading", "value sales"], ["Garden Furniture", "trading", "value sales"], ["Garden Pots and Ornaments", "trading", "value sales"], ["Gas and Equipment", "trading", "value sales"], ["Gaskets", "trading", "value sales"], ["Gates and Fences", "trading", "value sales"], ["General Parts Dealer", "trading", "value sales"], ["General Trader", "trading", "value sales"], ["Gift Shops", "trading", "value sales"], ["Glues and Sealants", "trading", "value sales"], ["Greenhouse and Horticultural", "trading", "value sales"], ["Hardware", "trading", "value sales"], ["Healthcare Products", "trading", "value sales"], ["Home and Giftware", "trading", "value sales"], ["Home Crafts", "trading", "value sales"], ["Honey and Fine and Special Food Products", "trading", "value sales"], ["Hoses and Clamps", "trading", "value sales"], ["Hosing and Piping", "trading", "value sales"], ["Hydraulics and Pneumatics", "trading", "value sales"], ["Incense and Oils", "trading", "value sales"], ["Industrial Equipment", "trading", "value sales"], ["Industrial Fans", "trading", "value sales"], ["Jewellers", "trading", "value sales"], ["Labelling and Filling and Spares", "trading", "value sales"], ["Lawn Mowers and Grass Cutters", "trading", "value sales"], ["Lenses and Safety Glasses", "trading", "value sales"], ["Linings - Dam and Water Tank", "trading", "value sales"], ["Liquor Distribution", "trading", "value sales"], ["Luggage and Travel Accessories", "trading", "value sales"], ["Medical Consumables", "trading", "value sales"], ["Mops and Brooms", "trading", "value sales"], ["Motor Parts", "trading", "value sales"], ["Nurseries", "trading", "value sales"], ["Nutritional Food", "trading", "value sales"], ["Oils and Fuels", "trading", "value sales"], ["Organic Herbs and Teas", "trading", "value sales"], ["Paint Additives", "trading", "value sales"], ["Paper Products", "trading", "value sales"], ["Periodicals", "trading", "value sales"], ["Pharmacy", "trading", "value sales"], ["Plumbling Supplies", "trading", "value sales"], ["Pool Chemicals", "trading", "value sales"], ["Printer Cartridges and Ribbons", "trading", "value sales"], ["Promotional Clothing and Accessories", "trading", "value sales"], ["Promotional Items", "trading", "value sales"], ["Rivets and Fasteners", "trading", "value sales"], ["Roadside Stalls", "trading", "value sales"], ["Safety Clothing and Accessories", "trading", "value sales"], ["Safety Equipment", "trading", "value sales"], ["School Equipment", "trading", "value sales"], ["Second Hand Goods Dealer", "trading", "value sales"], ["Security Monitoring Equipment", "trading", "value sales"], ["Seeds and Fertilizers", "trading", "value sales"], ["Shoe Stores", "trading", "value sales"], ["Shop Fittings", "trading", "value sales"], ["Skin Care Products", "trading", "value sales"], ["Small Appliances", "trading", "value sales"], ["Snooker and Pool Tables", "trading", "value sales"], ["Spices, Sauces and Herbs", "trading", "value sales"], ["Sports Equipment", "trading", "value sales"], ["Sports Goods", "trading", "value sales"], ["Sports Stores", "trading", "value sales"], ["Spreads", "trading", "value sales"], ["Stainless Steel Tanks", "trading", "value sales"], ["Stationery", "trading", "value sales"], ["Steel Products", "trading", "value sales"], ["Surf Boards", "trading", "value sales"], ["Sweets", "trading", "value sales"], ["Toys, Gifts and Novelties", "trading", "value sales"], ["Tuck Shop", "trading", "value sales"], ["Uniforms", "trading", "value sales"], ["Water Drilling, Purification and Treatment", "trading", "value sales"], ["Advertising", "trading", "commission"], ["Broking Services Commission", "trading", "commission"], ["Business Brokers Commission", "trading", "commission"], ["Estate Agents Commission", "trading", "commission"], ["Fresh Market Agents Commission", "trading", "commission"], ["Insurance Sales", "trading", "commission"], ["Manufacturers' Representative", "trading", "commission"], ["Motor Vehicles", "trading", "commission"], ["Packaging Broker", "trading", "commission"], ["Product Representative", "trading", "commission"], ["Adhesives", "manufacturing", "continuous production"], ["Awnings and Shutters", "manufacturing", "batch lots"], ["Barbaques and Fireplaces", "manufacturing", "batch lots"], ["Blinds", "manufacturing", "batch lots"], ["Boutique and Bridal Gowns", "manufacturing", "batch lots"], ["Burglar Proofing", "manufacturing", "batch lots"], ["Cables", "manufacturing", "batch lots"], ["Cakes and Confectionery", "manufacturing", "batch lots"], ["Candles", "manufacturing", "batch lots"], ["Carpentry and Joinery", "manufacturing", "batch lots"], ["Chocolate Arts and Crafts Gifts", "manufacturing", "batch lots"], ["Clothing", "manufacturing", "batch lots"], ["Coffee Roaster", "manufacturing", "batch lots"], ["Component Parts", "manufacturing", "batch lots"], ["Corporate Clothing", "manufacturing", "batch lots"], ["Doors", "manufacturing", "batch lots"], ["Footwear", "manufacturing", "batch lots"], ["Furniture", "manufacturing", "batch lots"], ["Furniture and Fitments", "manufacturing", "batch lots"], ["Garage Doors", "manufacturing", "batch lots"], ["Gates and Fences", "manufacturing", "batch lots"], ["Home Bake Shops", "manufacturing", "batch lots"], ["Homemade Food Products", "manufacturing", "batch lots"], ["Ice Cream", "manufacturing", "batch lots"], ["Injection Moulders", "manufacturing", "batch lots"], ["Jewellers", "manufacturing", "batch lots"], ["Knitted Garments", "manufacturing", "batch lots"], ["Machined Items", "manufacturing", "batch lots"], ["Meal Packs", "manufacturing", "batch lots"], ["Pamphlets", "manufacturing", "batch lots"], ["Playground Equipment", "manufacturing", "batch lots"], ["Pottery", "manufacturing", "batch lots"], ["Printed Leaflets", "manufacturing", "batch lots"], ["Promotional Clothing and Accessories", "manufacturing", "batch lots"], ["Raw Chemicals", "manufacturing", "batch lots"], ["Sandwiches", "manufacturing", "batch lots"], ["Set Builders", "manufacturing", "batch lots"], ["Spreads - Jams", "manufacturing", "batch lots"], ["Steel Furniture", "manufacturing", "batch lots"], ["Sweets and Chocolates", "manufacturing", "batch lots"], ["Trailers and Truck Bodies", "manufacturing", "batch lots"], ["Umbrellas", "manufacturing", "batch lots"], ["Uniforms", "manufacturing", "batch lots"], ["Upholsterers", "manufacturing", "batch lots"], ["Wendy Houses", "manufacturing", "batch lots"], ["Wood Mouldings", "manufacturing", "batch lots"], ["Wooden Doors and Windows", "manufacturing", "batch lots"], ["Wooden Pallets", "manufacturing", "batch lots"], ["Biscuits", "manufacturing", "continuous production"], ["Bottled Water", "manufacturing", "continuous production"], ["Confectionary", "manufacturing", "continuous production"], ["Food Items", "manufacturing", "continuous production"], ["Motor Components", "manufacturing", "continuous production"], ["Boilers", "manufacturing", "fabrication"], ["Caravans", "manufacturing", "fabrication"], ["Modular Homes", "manufacturing", "fabrication"], ["Trailer", "manufacturing", "fabrication"], ["Accounting", "services", "time units"], ["Advertising", "services", "time units"], ["Architectual", "services", "time units"], ["Attorneys and Advocates", "services", "time units"], ["Breakdown and Towing", "services", "time units"], ["Chemist", "services", "time units"], ["Civil Engineers", "services", "time units"], ["Consulting", "services", "time units"], ["Film Industry", "services", "time units"], ["Financial Advisor", "services", "time units"], ["Health and Safety", "services", "time units"], ["HR Practicioner", "services", "time units"], ["Laboratory", "services", "time units"], ["Land Surveyors", "services", "time units"], ["Legal Practice", "services", "time units"], ["Personnel Consulting", "services", "time units"], ["Photography and Video", "services", "time units"], ["Piano Tuning", "services", "time units"], ["Professional Consulting", "services", "time units"], ["Project Managers", "services", "time units"], ["Sharpening", "services", "time units"], ["Signwriting", "services", "time units"], ["Software Developer", "services", "time units"], ["Sound Engineering", "services", "time units"], ["Tailor", "services", "time units"], ["Translators", "services", "time units"], ["Welding Service", "services", "time units"], ["Awnings and Shutters Installers", "services", "installation services"], ["Blind Installers", "services", "installation services"], ["Curtains and Accessories", "services", "installation services"], ["Garage Doors", "services", "installation services"], ["General Installer", "services", "installation services"], ["Insulated Panels", "services", "installation services"], ["Insulation Materials", "services", "installation services"], ["Locksmiths", "services", "installation services"], ["Optometrists", "services", "installation services"], ["Picture Framing", "services", "installation services"], ["Agricultural Pumps", "services", "installation services"], ["Air Cleaning Equipment", "services", "installation services"], ["Appliances", "services", "installation services"], ["Armature Winders", "services", "installation services"], ["Audio and Security", "services", "installation services"], ["Audio, Sound and Lighting", "services", "installation services"], ["Auto Electrician", "services", "installation services"], ["Automotive Seat Trimmer", "services", "installation services"], ["Axels, Differentials and Gearboxes", "services", "installation services"], ["Bicycles", "services", "installation services"], ["Brakes and Clutches", "services", "installation services"], ["Cobler", "services", "installation services"], ["Compressed Air", "services", "installation services"], ["Diesel Engines", "services", "installation services"], ["Dress Designers", "services", "installation services"], ["Electric Motors", "services", "installation services"], ["Electric Pumps", "services", "installation services"], ["Electronic Goods Repair", "services", "installation services"], ["Electroplating", "services", "installation services"], ["Engines and Generators", "services", "installation services"], ["Engravers", "services", "installation services"], ["Exhausts, Tyres and Shocks", "services", "installation services"], ["Food Machinery", "services", "installation services"], ["Food Processing Machinery", "services", "installation services"], ["General Repair Shop", "services", "installation services"], ["Hi-Fi", "services", "installation services"], ["Hot Water Systems", "services", "installation services"], ["Hydraulics and Pneumatics", "services", "installation services"], ["Industrial Automation", "services", "installation services"], ["Industrial Heating", "services", "installation services"], ["Lawn Mowers and Grass Cutters", "services", "installation services"], ["Motor Refurbisher", "services", "installation services"], ["Motor Repair", "services", "installation services"], ["Motor Trimmers", "services", "installation services"], ["Pumps", "services", "installation services"], ["Radiators", "services", "installation services"], ["Sewing Machine Repair", "services", "installation services"], ["Suspension", "services", "installation services"], ["Transmissions", "services", "installation services"], ["Air Conditioning Equipment", "services", "installation services"], ["Carpet Cleaning Service", "services", "installation services"], ["Carpets and Carpeting", "services", "installation services"], ["Electrician", "services", "installation services"], ["Elevator Service", "services", "installation services"], ["Fencing", "services", "installation services"], ["Foundries", "services", "installation services"], ["Glass and Aluminium", "services", "installation services"], ["Glazier", "services", "installation services"], ["Heating Elements and Controls", "services", "installation services"], ["Heating Systems", "services", "installation services"], ["Home Theatre, Radio, TV, Video, Sound Systems", "services", "installation services"], ["Interior Decorators", "services", "installation services"], ["Lifts and Escalators", "services", "installation services"], ["Plumber", "services", "installation services"], ["Medical Practice", "services", "time slots"], ["Surgery", "services", "time slots"], ["Vetenarian Service", "services", "time slots"], ["Beauty Parlour", "services", "time slots"], ["Hair Dressing Salon", "services", "time slots"], ["Nail Bar", "services", "time slots"], ["Brick Layer", "services", "measured units"], ["Brick Paving", "services", "measured units"], ["Ceiling and Wall Panels", "services", "measured units"], ["Concrete Roof Tiles", "services", "measured units"], ["Flooring", "services", "measured units"], ["Glazier", "services", "measured units"], ["Painter", "services", "measured units"], ["Plasterer", "services", "measured units"], ["Roofing Tiles", "services", "measured units"], ["Roofing and Thatching", "services", "measured units"], ["Tiler", "services", "measured units"], ["Printer", "services", "printing"], ["Laundromat", "services", "laundry"], ["Drycleaner", "services", "drycleaner"], ["Aerobics", "services", "time slots"], ["Cleaning Service", "services", "time slots"], ["Dance Classes", "services", "time slots"], ["Work Out Classes", "services", "time slots"], ["Garden Service", "services", "time slots"], ["Home Cleaning", "services", "time slots"], ["Home Gym", "services", "time slots"], ["Office Cleaning", "services", "time slots"], ["Pest Control", "services", "time slots"], ["Physio Practice", "services", "time slots"], ["Pilates", "services", "time slots"], ["Spinning", "services", "time slots"], ["Swimming Lessons", "services", "time slots"], ["Swimming Pool Service", "services", "time slots"], ["Call Centre", "services", "time slots rentals"], ["Internet Café", "services", "time slots rentals"], ["Security Guarding", "services", "guarding services"], ["Boutique and Bridal Gowns", "asset rentals", "equipment rental"], ["Crane", "asset rentals", "equipment rental"], ["Cranes", "asset rentals", "equipment rental"], ["Earth Moving Equipment", "asset rentals", "equipment rental"], ["Equipment", "asset rentals", "equipment rental"], ["Fork Trucks", "asset rentals", "equipment rental"], ["Garment Rental", "asset rentals", "equipment rental"], ["Indoor Plants", "asset rentals", "equipment rental"], ["Outdoor Advertising", "asset rentals", "equipment rental"], ["Playground Equipment", "asset rentals", "equipment rental"], ["Power Generators", "asset rentals", "equipment rental"], ["School Equipment", "asset rentals", "equipment rental"], ["Services", "asset rentals", "equipment rental"], ["Toilet", "asset rentals", "equipment rental"], ["Trailers", "asset rentals", "equipment rental"], ["Water Tanks", "asset rentals", "equipment rental"], ["Vending Equipment", "trading", "revenue share"], ["Vending Machine", "trading", "revenue share"], ["Labour Brokers", "labour broking", "labour broking"], ["Guest House", "hospitality", "guest house"], ["Hotel", "hospitality", "guest house"], ["Conference Organiser", "hospitality", "events organiser"], ["Events Organiser", "hospitality", "events organiser"], ["Exhibition Organisers", "hospitality", "events organiser"], ["Party Planner", "hospitality", "events organiser"], ["Tour Operator", "hospitality", "events organiser"], ["Coffee Shop", "hospitality", "family restaurant"], ["Mobile Coffee Bar", "hospitality", "family restaurant"], ["Office Coffee Bar", "hospitality", "family restaurant"], ["Fast Foods", "hospitality", "family restaurant"], ["Restaurant", "hospitality", "family restaurant"], ["Sports Bar", "hospitality", "family restaurant"], ["Truck Operator", "mobility", "truck operator"], ["Tractor Operator", "mobility", "tractor operator"], ["Parcel Courier", "mobility", "truck operator"], ["Coach Operator", "mobility", "taxi operator"], ["Taxi Operator", "mobility", "taxi operator"], ["Vehicle Hire", "asset rentals", "Vehicle Rental"], ["Driving School", "mobility", "driving school"], ["Caravans", "motor", "Used Vehicle Trading"], ["Crane", "motor", "New Vehicle"], ["Earth Moving Equipment", "motor", "New Vehicle"], ["Fork Trucks", "motor", "New Vehicle"], ["Motor Cycle", "motor", "New Vehicle"], ["Motor Vehicle", "motor", "New Vehicle"], ["Motorcycle", "motor", "New Vehicle"], ["Truck Sales - New", "motor", "New Vehicle"], ["Caravans Dealer - Used", "motor", "Used Vehicle Trading"], ["Crane Dealer - Used", "motor", "Used Vehicle Trading"], ["Motorcycle Sales - Used", "motor", "Used Vehicle Trading"], ["Truck Sales - Used", "motor", "Used Vehicle Trading"], ["Vehicle Sales - Used", "motor", "Used Vehicle Trading"], ["Diesel Engines Workshop", "motor", "Service Workshop"], ["Motor Cycle Workshop", "motor", "Service Workshop"], ["Motor Vehicle Workshop", "motor", "Service Workshop"], ["Motor Parts Dealer", "motor", "Parts Trading"], ["Paint and Panel", "motor", "Panelshop"], ["Fuel Station", "motor", "Fuel Station"], ["Car Wash", "services", "time slots"], ["Creche", "education", "education"], ["Day Courses", "education", "education"], ["Short Courses", "education", "education"], ["Mentorship", "education", "education"], ["School", "education", "education"], ["Tutorship", "education", "education"], ["Crop Farming", "agriculture", "Crop Farming"], ["Live-Stock Farming", "agriculture", "Live-Stock Farming"], ["Conference Centres", "property", "property development"], ["Hospitals, Old Age Homes and Insitutions", "property", "property development"], ["Hostels", "property", "property development"], ["Old Age Homes", "property", "property development"], ["Property Development", "property", "property development"], ["Retirement Villages", "property", "property development"], ["Warehousing", "property", "property development"]];

export const DEFAULT_BIZZBOX_ENTRIES: BizzBoxEntry[] = RAW_BIZZBOX_SEED.map(
  ([businessType, category, modelSet], index) => ({
    id: `bb-${String(index + 1).padStart(3, "0")}`,
    businessType,
    category,
    modelSet,
  })
);

export const BIZZBOX_MODEL_DESCRIPTION_MAP: Record<string, string> = BIZZBOX_MODEL_CATALOG.reduce(
  (acc, item) => {
    acc[item.name.toLowerCase()] = item.description;
    return acc;
  },
  {} as Record<string, string>
);

export const BIZZBOX_MODEL_ID_MAP: Record<string, string> = BIZZBOX_MODEL_CATALOG.reduce(
  (acc, item) => {
    if (item.modelSetId) {
      acc[item.name.toLowerCase()] = item.modelSetId;
    }
    return acc;
  },
  {} as Record<string, string>
);
