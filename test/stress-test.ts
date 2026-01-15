import axios from 'axios';

const API_URL = 'http://localhost:3000/vendas';

const payload = {
  clienteId: "Ederson-Stress-Test",
  cep: "05892110",
    itens: [
    { produtoId: "SSD-500GB", quantidade: 1, precoUnitario: 10050.00 },
    { produtoId: "PROD-MEM-01", quantidade: 1, precoUnitario: 180.50 }
  ]
};

async function runStressTest(totalRequests: number) {
  console.log(`🔥 Disparando ${totalRequests} vendas simultâneas...`);

  const promises = Array.from({ length: totalRequests }).map((_, i) => {
    return axios.post(API_URL, payload)
      .then(res => console.log(`✅ Pedido ${i + 1}: Enviado (ID: ${res.data.id || 'N/A'})`))
      .catch(err => console.error(`❌ Pedido ${i + 1}: Erro -> ${err.message}`));
  });

  await Promise.all(promises);
  console.log('🏁 Todas as requisições foram enviadas ao Kafka!');
}
runStressTest(10);