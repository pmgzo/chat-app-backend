/*
  Warnings:

  - You are about to drop the column `friendId` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Friendship` table. All the data in the column will be lost.
  - Added the required column `requesterId` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_userId_fkey";

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "friendId",
DROP COLUMN "userId",
ADD COLUMN     "requesterId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Friend" (
    "id" SERIAL NOT NULL,
    "friendId" INTEGER NOT NULL,
    "friendshipId" INTEGER NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
