/*
  Warnings:

  - Added the required column `complement` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_Complex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "complement" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_id_Complex_fkey" FOREIGN KEY ("id_Complex") REFERENCES "Complex" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "id_Complex", "name", "password", "status", "type", "username") SELECT "id", "id_Complex", "name", "password", "status", "type", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
