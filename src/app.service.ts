import {
  Injectable,
  Inject,
  OnModuleInit,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

async criarVenda(dadosDaVenda: any) {
  const vendaIdFake = `VENDA-${Math.floor(Math.random() * 10000)}`;
  const { metodoPagamento } = dadosDaVenda;

  const valorTotalCalculado = dadosDaVenda.itens.reduce((total, item) => {
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

    this.kafkaClient.emit('venda_realizada', {
      vendaId: vendaIdFake,
      clienteId: dadosDaVenda.clienteId,
      clienteEmail: dadosDaVenda.clienteEmail || "bueno.ederson@gmail.com",
      clienteNome: dadosDaVenda.clienteNome || "Ederson Bueno",
      metodoPagamento: metodoPagamento || 'PIX', // Fallback para PIX caso venha vazio
      itens: dadosDaVenda.itens,
      valorTotal: valorTotalCalculado,
      cep: dadosDaVenda.cep,
      data: new Date(),
    });

    console.log(`✅ Venda ${vendaIdFake} salva no banco e enviada ao Kafka.`);

    return { 
      status: 'Sucesso', 
      vendaId: vendaIdFake, 
      valor: valorTotalCalculado,
      metodo: metodoPagamento || 'PIX',
      detalhes: vendaCriada 
    };

  } catch (error) {
    console.error(`❌ Erro ao criar venda no banco:`, error.message);
    return { 
      status: 'Erro', 
      mensagem: 'Não foi possível salvar a venda.',
      detalhes: error.message 
    };
  }
}
   // BUSCAR TODAS AS VENDAS
async listarVendas() {
  return await this.prisma.venda.findMany({
    include: { itens: true }, // Importante para ver os produtos de cada venda
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

// DELETAR UMA VENDA
async deletarVenda(id: string) {
  try {
    // 1. BUSCAR a venda e seus itens ANTES de deletar
    // Precisamos disso para saber o que devolver ao estoque
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

    // 2. EXCLUIR os itens (Integridade Referencial)
    await this.prisma.itemVenda.deleteMany({
      where: { vendaId: id },
    });

    // 3. EXCLUIR a venda
    await this.prisma.venda.delete({
      where: { id },
    });

    // 4. EMITIR evento de estorno para o Kafka
    // O serviço de estoque/produtos deve ouvir esse tópico para somar as quantidades de volta
    this.kafkaClient.emit('venda_cancelada_estorno', {
      vendaId: id,
      produtos: vendaParaEstorno.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      })),
      timestamp: new Date(),
    });

    console.log(`🗑️ [VENDAS] Registro ${id} removido. Evento de estorno enviado.`);
    return { 
      mensagem: `Venda ${id} removida e estorno de estoque solicitado com sucesso.`,
    };

  } catch (error: unknown) {
    if (
      typeof error === 'object' && 
      error !== null && 
      'code' in error && 
      error.code === 'P2025'
    ) {
      throw new NotFoundException(`Venda ${id} não encontrada para exclusão`);
    }

    if (error instanceof NotFoundException) throw error;

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