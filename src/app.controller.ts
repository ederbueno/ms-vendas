import { Body, Controller, Post, Get, Param, Patch, Delete } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller('vendas')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // --- MÉTODOS HTTP (API REST) ---

  @Post()
  async criarVenda(@Body() dadosVenda: any) {
    return await this.appService.criarVenda(dadosVenda);
  }

  @Get()
  async listarTodas() {
    return await this.appService.listarVendas();
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return await this.appService.buscarPorId(id);
  }

  @Patch(':id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; motivo?: string }
  ) {
    return await this.appService.atualizarStatus(id, dto.status, dto.motivo);
}

  @Delete(':id')
  async deletar(@Param('id') id: string) {
    return await this.appService.deletarVenda(id);
  }

  // --- MÉTODOS DE EVENTO (KAFKA) ---

  @EventPattern('venda_cancelada')
  async handleVendaCancelada(@Payload() data: any) {
    console.log(`🚨 [VENDAS] Cancelando pedido ${data.vendaId} devido a: ${data.motivo}`);
    await this.appService.atualizarStatus(data.vendaId, 'CANCELADO', data.motivo);
  }

  @EventPattern('venda_concluida')
  async handleVendaConcluida(@Payload() data: any) {
    console.log(`✅ [VENDAS] Venda ${data.vendaId} finalizada com sucesso!`);
    await this.appService.atualizarStatus(data.vendaId, 'CONCLUIDO');
  }

  @EventPattern('estoque_insuficiente')
  async tratarErroEstoque(@Payload() data: any) {
    const motivoErro = data.mensagem || 'PRODUTO_NAO_ENCONTRADO_OU_SEM_ESTOQUE';
    await this.appService.atualizarStatus(
      data.vendaId,
      'CANCELADO',
      motivoErro
    );
  }

  @EventPattern('pagamento_confirmado')
  async handlePagamentoConfirmado(@Payload() data: any) {
   console.log(`💰 [VENDAS] Recebida confirmação de pagamento para: ${data.vendaId}`);
   await this.appService.atualizarStatus(data.vendaId, 'CONCLUIDA', 'Pagamento confirmado via Financeiro');
}
}