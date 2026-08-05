-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'miembro');

-- CreateEnum
CREATE TYPE "Modalidad" AS ENUM ('stand', 'patrocinador');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('pendiente', 'contactada', 'confirmada', 'rechazada');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'miembro',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numeroContacto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modalidad" "Modalidad" NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'pendiente',
    "miembroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaHistorial" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "estadoAnterior" "Estado" NOT NULL,
    "estadoNuevo" "Estado" NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmpresaHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Universidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreContacto" TEXT NOT NULL,
    "numeroContacto" TEXT NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'pendiente',
    "miembroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Universidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoDifusion" (
    "id" TEXT NOT NULL,
    "universidadId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoDifusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nombre_key" ON "Empresa"("nombre");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpresaHistorial" ADD CONSTRAINT "EmpresaHistorial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Universidad" ADD CONSTRAINT "Universidad_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoDifusion" ADD CONSTRAINT "EventoDifusion_universidadId_fkey" FOREIGN KEY ("universidadId") REFERENCES "Universidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
