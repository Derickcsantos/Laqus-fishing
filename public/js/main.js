let horarioEntradaSite = new Date().toISOString();

document.addEventListener('DOMContentLoaded', () => {
    const jaEnviado = localStorage.getItem('dadosClienteEnviados');
    if (!jaEnviado) {
        coletarDadosDoCliente(horarioEntradaSite);
    } else {
        console.log('✅ Dados do cliente já foram enviados anteriormente.');
    }
});

async function coletarDadosDoCliente(horarioEntrada) {
    try {
        const ipInfo = await obterInformacoesIP(); // Obtém informações de IP primeiro, é mais rápido

        // Coleta a localização de alta precisão de forma assíncrona
        const localPrecisaPromise = obterLocalizacaoAltaPrecisao();

        // Obter informações rápidas de rede e dispositivo
        const dadosRapidos = obterInformacoesRapidas();

        // Espera pela localização precisa se necessário
        const localPrecisa = await localPrecisaPromise;

        // Atualiza a localização com a geolocalização se disponível
        if (localPrecisa.latitude && localPrecisa.longitude) {
            ipInfo.latitude = localPrecisa.latitude;
            ipInfo.longitude = localPrecisa.longitude;
        }

        // Monta os dados do cliente
        const dados = {
            ipInfo,
            horarioEntrada,
            ...dadosRapidos
        };

        // Envia os dados para o servidor
        enviarDadosParaServidor(dados);
        
    } catch (erroGeral) {
        console.error('❌ Erro ao coletar ou enviar dados do cliente:', erroGeral);
    }
}

function obterInformacoesRapidas() {
    // Obter nível de bateria, tipo de conexão, informações de dispositivo
    let nivelBateria = 'Indisponível';
    if ('getBattery' in navigator) {
        navigator.getBattery().then((bateria) => {
            nivelBateria = `${Math.round(bateria.level * 100)}%`;
            if (bateria.charging) nivelBateria += ' (carregando)';
        }).catch(() => {});
    }

    let tipoConexao = 'Indisponível';
    let downlink = 'Indisponível';
    let rtt = 'Indisponível';
    if ('connection' in navigator) {
        const conexao = navigator.connection;
        tipoConexao = conexao.effectiveType || 'Indisponível';
        downlink = conexao.downlink ? `${conexao.downlink} Mbps` : 'Indisponível';
        rtt = conexao.rtt ? `${conexao.rtt} ms` : 'Indisponível';
    }

    const memoriaDisponivel = 'deviceMemory' in navigator ? `${navigator.deviceMemory} GB` : 'Indisponível';
    const coresCPU = 'hardwareConcurrency' in navigator ? navigator.hardwareConcurrency : 'Indisponível';

    return {
        navegador: navigator.userAgent,
        plataforma: navigator.platform,
        idioma: navigator.language,
        resolucao: `${window.screen.width}x${window.screen.height}`,
        coresCPU,
        memoriaDisponivel,
        bateria: nivelBateria,
        conexao: {
            tipo: tipoConexao,
            velocidade: downlink,
            latencia: rtt
        },
        dataHora: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesHabilitados: navigator.cookieEnabled ? 'Sim' : 'Não',
        tipoDispositivo: detectarTipoDispositivo(),
        touchscreen: 'ontouchstart' in window ? 'Sim' : 'Não'
    };
}

async function obterInformacoesIP() {
    let ipInfo = {
        ip: 'Indisponível',
        pais: 'Indisponível',
        regiao: 'Indisponível',
        cidade: 'Indisponível',
        cep: 'Indisponível',
        latitude: 'Indisponível',
        longitude: 'Indisponível',
        provedor: 'Indisponível'
    };

    try {
        const respostaIp = await fetch('https://api.ipify.org?format=json');
        const dataIp = await respostaIp.json();
        ipInfo.ip = dataIp.ip || 'Indisponível';

        if (ipInfo.ip !== 'Indisponível' && ipInfo.ip !== '127.0.0.1') {
            const respostaGeo = await fetch(`https://ipapi.co/${ipInfo.ip}/json/`);
            const dataGeo = await respostaGeo.json();
            ipInfo = {
                ...ipInfo,
                pais: dataGeo.country_name || 'Indisponível',
                regiao: dataGeo.region || 'Indisponível',
                cidade: dataGeo.city || 'Indisponível',
                cep: dataGeo.postal || 'Indisponível',
                latitude: dataGeo.latitude || 'Indisponível',
                longitude: dataGeo.longitude || 'Indisponível',
                provedor: dataGeo.org || 'Indisponível'
            };
        }
    } catch (error) {
        console.warn('⚠️ Erro ao obter informações do IP:', error);
    }

    return ipInfo;
}

function obterLocalizacaoAltaPrecisao() {
    return new Promise((resolve) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (posicao) => resolve(posicao.coords),
                () => resolve({}),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            resolve({});
        }
    });
}

function detectarTipoDispositivo() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        return 'Tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|phone/i.test(ua)) {
        return 'Celular';
    }
    return 'Desktop';
}

async function enviarDadosParaServidor(dados) {
    try {
        const resposta = await fetch('/dados-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            localStorage.setItem('dadosClienteEnviados', 'true');
            console.log('📤 Dados enviados com sucesso:', dados);
        } else {
            console.error('❌ Erro ao enviar dados para o servidor:', await resposta.text());
        }
    } catch (erroEnvio) {
        console.error('❌ Erro na requisição para o servidor:', erroEnvio);
    }
}
     