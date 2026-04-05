-- Drop old NutritionLog table (data migration not needed for fresh deploy)
DROP TABLE IF EXISTS "NutritionLog";

-- Add new fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "goalWeight" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "goalCalories" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "goalNetCarbs" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "goalProtein" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "darkMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastChatAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "chatCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "chatCountReset" TIMESTAMP(3);

-- CreateTable NutritionDay
CREATE TABLE "NutritionDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skaldemanRatio" DOUBLE PRECISION,
    CONSTRAINT "NutritionDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable MealEntry
CREATE TABLE "MealEntry" (
    "id" TEXT NOT NULL,
    "nutritionDayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT NOT NULL,
    "productName" TEXT,
    "barcode" TEXT,
    "portionGrams" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "netCarbs" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "MealEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable FavoriteProduct
CREATE TABLE "FavoriteProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "image" TEXT,
    "caloriesPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL,
    "fatPer100g" DOUBLE PRECISION NOT NULL,
    "carbsPer100g" DOUBLE PRECISION NOT NULL,
    "fiberPer100g" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "FavoriteProduct_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "NutritionDay_userId_date_key" ON "NutritionDay"("userId", "date");
CREATE INDEX "NutritionDay_userId_date_idx" ON "NutritionDay"("userId", "date");
CREATE INDEX "MealEntry_nutritionDayId_idx" ON "MealEntry"("nutritionDayId");
CREATE UNIQUE INDEX "FavoriteProduct_userId_barcode_key" ON "FavoriteProduct"("userId", "barcode");
CREATE INDEX "FavoriteProduct_userId_idx" ON "FavoriteProduct"("userId");

-- Foreign Keys
ALTER TABLE "NutritionDay" ADD CONSTRAINT "NutritionDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealEntry" ADD CONSTRAINT "MealEntry_nutritionDayId_fkey" FOREIGN KEY ("nutritionDayId") REFERENCES "NutritionDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteProduct" ADD CONSTRAINT "FavoriteProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
