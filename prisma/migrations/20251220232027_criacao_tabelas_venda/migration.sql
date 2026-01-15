-- CreateTable
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVenda" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "vendaId" TEXT NOT NULL,

    CONSTRAINT "ItemVenda_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemVenda" ADD CONSTRAINT "ItemVenda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
