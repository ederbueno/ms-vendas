import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async criarVenda(dadosDaVenda: any) {
    const vendaIdFake = `VENDA-${Math.floor(Math.random() * 10000)}`;
    const { metodoPagamento } = dadosDaVenda;

    const valorTotalCalculado = dadosDaVenda.itens.reduce((total: number, item: any) => {
      return total + (item.precoUnitario * item.quantidade);
    }, 0);

    try {
      const vendaCriada = await this.prisma.venda.create({
        data: {
          id: vendaIdFake,
          clienteId: dadosDaVenda.clienteId,
          status: 'PENDENTE',
          valorTotal: valorTotalCalculado,
          metodoPagamento: dadosDaVenda.metodoPagamento,
          itens: {
            create: dadosDaVenda.itens.map((item: any) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
          },
        },
        include: { itens: true }
      });

      console.log(`✅ Venda ${vendaIdFake} salva no banco.`);

      return { 
        status: 'Sucesso', 
        vendaId: vendaIdFake, 
        valor: valorTotalCalculado,
        metodo: metodoPagamento || 'PIX',
        detalhes: vendaCriada 
      };

    } catch (error: any) {
      console.error(`❌ Erro ao criar venda no banco:`, error.message);
      return { 
        status: 'Erro', 
        mensagem: 'Não foi possível salvar a venda.',
        detalhes: error.message 
      };
    }
  }

  async listarVendas() {
    return await this.prisma.venda.findMany({
      include: { itens: true },
      orderBy: { criadoEm: 'desc' }
    });
  }

  async buscarPorId(id: string) {
    try {
      const venda = await this.prisma.venda.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!venda) {
        throw new NotFoundException(`Venda com ID ${id} não encontrada`);
      }

      return venda;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao buscar venda: ${mensagem}`);
    }
  }

  async deletarVenda(id: string) {
    try {
      const vendaParaEstorno = await this.prisma.venda.findUnique({
        where: { id },
        include: { itens: true },
      });

      if (!vendaParaEstorno) {
        throw new NotFoundException(`Venda ${id} não encontrada para exclusão`);
      }

      if (vendaParaEstorno.status === 'CONCLUIDO') {
        throw new BadRequestException(
          `Não é permitido deletar a venda ${id} pois ela já está com status CONCLUIDO.`,
        );
      }

      await this.prisma.itemVenda.deleteMany({
        where: { vendaId: id },
      });

      await this.prisma.venda.delete({
        where: { id },
      });

      console.log(`🗑️ [VENDAS] Registro ${id} removido.`);
      return { 
        mensagem: `Venda ${id} removida com sucesso.`,
      };

    } catch (error: unknown) {
      if (
        typeof error === 'object' && 
        error !== null && 
        'code' in error && 
        (error as any).code === 'P2025'
      ) {
        throw new NotFoundException(`Venda ${id} não encontrada para exclusão`);
      }

      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;

      const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro ao deletar venda: ${mensagemErro}`);
      
      throw new InternalServerErrorException({
        message: 'Falha ao deletar venda',
        detail: mensagemErro,
      });
    }
  }

  async atualizarStatus(vendaId: string, status: string, motivo?: string) {
    const venda = await this.prisma.venda.findUnique({
      where: { id: vendaId },
      include: { itens: true },
    });

    if (!venda) {
      throw new NotFoundException(`Venda ${vendaId} não encontrada.`);
    }

    const vendaAtualizada = await this.prisma.venda.update({
      where: { id: vendaId },
      data: {
        status: status,
        motivo: motivo || null,
      },
    });

    console.log(`🔄 Venda ${vendaId}: Status -> ${status} | Motivo: ${motivo || 'N/A'}`);
    return vendaAtualizada;
  }
}
