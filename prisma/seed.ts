import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de vendas...');

  // Limpar dados existentes
  await prisma.itemVenda.deleteMany({});
  await prisma.venda.deleteMany({});

  // Criar vendas com diferentes status
  const vendas = [
    {
      id: 'VENDA-7189',
      clienteId: 'cliente-001',
      status: 'PAGO',
      valorTotal: 1500.00,
      metodoPagamento: 'CREDITO',
      criadoEm: new Date('2024-01-15'),
    },
    {
      id: 'VENDA-7190',
      clienteId: 'cliente-002',
      status: 'PAGO',
      valorTotal: 2500.50,
      metodoPagamento: 'DEBITO',
      criadoEm: new Date('2024-01-16'),
    },
    {
      id: 'VENDA-7191',
      clienteId: 'cliente-003',
      status: 'PENDENTE',
      valorTotal: 3200.00,
      metodoPagamento: 'PIX',
      criadoEm: new Date('2024-01-17'),
    },
    {
      id: 'VENDA-7192',
      clienteId: 'cliente-004',
      status: 'PAGO',
      valorTotal: 890.00,
      metodoPagamento: 'CREDITO',
      criadoEm: new Date('2024-01-18'),
    },
    {
      id: 'VENDA-7193',
      clienteId: 'cliente-005',
      status: 'CANCELADA',
      valorTotal: 1200.00,
      metodoPagamento: 'PIX',
      criadoEm: new Date('2024-01-19'),
    },
    {
      id: 'VENDA-7194',
      clienteId: 'cliente-001',
      status: 'PAGO',
      valorTotal: 4100.00,
      metodoPagamento: 'CREDITO',
      criadoEm: new Date('2024-01-20'),
    },
    {
      id: 'VENDA-1265',
      clienteId: 'cliente-006',
      status: 'PENDENTE',
      valorTotal: 750.00,
      metodoPagamento: 'PIX',
      criadoEm: new Date('2024-01-21'),
    },
  ];

  for (const venda of vendas) {
    await prisma.venda.create({
      data: venda,
    });
    console.log(`✅ Venda ${venda.id} criada com status ${venda.status}`);
  }

  // Criar itens para cada venda
  const itensVenda = [
    { vendaId: 'VENDA-7189', produtoId: 'prod-001', quantidade: 2, precoUnitario: 750.00 },
    { vendaId: 'VENDA-7190', produtoId: 'prod-002', quantidade: 1, precoUnitario: 2500.50 },
    { vendaId: 'VENDA-7191', produtoId: 'prod-003', quantidade: 4, precoUnitario: 800.00 },
    { vendaId: 'VENDA-7192', produtoId: 'prod-001', quantidade: 1, precoUnitario: 890.00 },
    { vendaId: 'VENDA-7193', produtoId: 'prod-004', quantidade: 3, precoUnitario: 400.00 },
    { vendaId: 'VENDA-7194', produtoId: 'prod-002', quantidade: 2, precoUnitario: 2050.00 },
    { vendaId: 'VENDA-1265', produtoId: 'prod-005', quantidade: 1, precoUnitario: 750.00 },
  ];

  for (const item of itensVenda) {
    await prisma.itemVenda.create({
      data: item,
    });
  }

  console.log('✅ Seed de vendas completado com sucesso!');
  console.log(`📊 Total de vendas criadas: ${vendas.length}`);
  console.log(`📊 Total de itens criados: ${itensVenda.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
