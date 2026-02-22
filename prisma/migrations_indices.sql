-- CreateIndex
CREATE INDEX "Venda_clienteId_idx" ON "Venda"("clienteId");

-- CreateIndex
CREATE INDEX "ItemVenda_vendaId_idx" ON "ItemVenda"("vendaId");

-- CreateIndex (composto para queries de itens por venda)
CREATE INDEX "ItemVenda_vendaId_id_idx" ON "ItemVenda"("vendaId", "id");

-- CreateIndex para status (usado em filtros)
CREATE INDEX "Venda_status_idx" ON "Venda"("status");

-- CreateIndex para data (usado em ordenação)
CREATE INDEX "Venda_criadoEm_idx" ON "Venda"("criadoEm");
