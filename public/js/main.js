document.addEventListener('DOMContentLoaded', () => {
    const jaEnviado = localStorage.getItem('dadosClienteEnviados');
    if (!jaEnviado) {
      coletarDadosDoCliente();
    } else {
      console.log('✅ Dados do cliente já foram enviados anteriormente.');
    }
  });

  async function coletarDadosDoCliente() {
    try {
      // Obter IP público
      let ipPublico = 'Indisponível';
      try {
        const resposta = await fetch('https://api.ipify.org?format=json');
        const data = await resposta.json();
        ipPublico = data.ip || 'Indisponível';
      } catch (error) {
        console.warn('⚠️ Erro ao obter IP público:', error);
      }

      // Obter nível da bateria
      let nivelBateria = 'Indisponível';
      if (navigator.getBattery) {
        try {
          const bateria = await navigator.getBattery();
          nivelBateria = `${(bateria.level * 100).toFixed(0)}%`;
        } catch (error) {
          console.warn('⚠️ Erro ao obter nível da bateria:', error);
        }
      }

      // Obter tipo de conexão
      const tipoConexao = navigator.connection?.effectiveType || 'Indisponível';

      // Montar objeto com os dados
      const dados = {
        ipPublico,
        navegador: navigator.userAgent,
        plataforma: navigator.platform,
        idioma: navigator.language,
        resolucao: `${screen.width}x${screen.height}`,
        bateria: nivelBateria,
        conexao: tipoConexao,
        dataHora: new Date().toLocaleString(),
      };

      // Enviar para o servidor
      const resposta = await fetch('/dados-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (resposta.ok) {
        localStorage.setItem('dadosClienteEnviados', 'true');
        console.log('📤 Dados enviados com sucesso:', dados);
      } else {
        console.error('❌ Erro ao enviar dados para o servidor.');
      }
    } catch (erroGeral) {
      console.error('❌ Erro ao coletar ou enviar dados do cliente:', erroGeral);
    }
  }