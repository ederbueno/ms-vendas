import { Body, Controller, Post, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller('vendas')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async criarVenda(@Body() dadosVenda: any) {
    return await this.appService.criarVenda(dadosVenda);
  }

  @Get()
  async listarTodas(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.appService.listarVendas(pageNum, limitNum, status, search);
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

  @MessagePattern('estoque_reservado')
  async estoqueReservado(@Payload() message: any) {
    const data = message?.value ?? message;
    return await this.appService.atualizarStatus(data.vendaId, 'CONCLUIDO');
  }

  @MessagePattern('estoque_falhou')
  async estoqueFalhou(@Payload() message: any) {
    const data = message?.value ?? message;
    return await this.appService.atualizarStatus(data.vendaId, 'CANCELADO', data.motivo);
  }
}
